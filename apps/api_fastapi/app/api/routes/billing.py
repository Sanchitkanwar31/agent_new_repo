from __future__ import annotations

import httpx

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from apps.api_fastapi.app.db.session import get_db
from apps.api_fastapi.app.model.models import RazorpayPaymentOrder
from apps.api_fastapi.app.schemas.user_schema import RazorpayOrderRequest
from apps.api_fastapi.app.services.credit_transfer_service import CreditService
from apps.api_fastapi.app.services.payment_service import PaymentService
from apps.api_fastapi.app.utils.config import settings
from apps.api_fastapi.app.utils.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/v1", tags=["billing"])


async def _fetch_reseller_organizations() -> list[dict]:
    if not settings.transfer_api_key:
        logger.error("Billing org lookup failed: missing reseller API key")
        raise HTTPException(
            status_code=500,
            detail="Missing reseller organization API configuration",
        )

    try:
        organizations_url = settings.validated_reseller_organizations_url()
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    headers = {"Authorization": f"Bearer {settings.transfer_api_key}"}

    async with httpx.AsyncClient(timeout=10.0) as client:
        logger.info(
            "Billing org lookup: requesting organizations | url=%s",
            organizations_url,
        )
        response = await client.get(organizations_url, headers=headers)

    if response.status_code != 200:
        logger.error(
            "Billing org lookup failed | status_code=%s | response=%s",
            response.status_code,
            response.text[:500],
        )
        raise HTTPException(status_code=500, detail="Unable to fetch organizations")

    organizations = response.json().get("organizations", [])
    logger.info(
        "Billing org lookup: parsed organizations | count=%s",
        len(organizations),
    )
    return organizations


def _normalize_email(value: object) -> str | None:
    if not isinstance(value, str):
        return None

    email = value.strip().lower()
    if "@" not in email:
        return None
    return email


def _find_organization_by_email(organizations: list[dict], email: str) -> dict | None:
    target_email = email.strip().lower()
    if not target_email:
        return None

    for organization in organizations:
        organization_email = organization.get("email")
        if isinstance(organization_email, str) and organization_email.strip().lower() == target_email:
            return organization

        for user in organization.get("users", []):
            user_email = user.get("email")
            if isinstance(user_email, str) and user_email.strip().lower() == target_email:
                return organization

    return None


@router.get("/billing/plans")
async def get_billing_plans():
    return {"plans": settings.billing_plans}


@router.get("/list-all-orgs")
async def get_organizations():
    try:
        organizations = await _fetch_reseller_organizations()
        return {"organizations": organizations}
    except httpx.TimeoutException:
        raise HTTPException(status_code=500, detail="Request timeout while fetching organizations")
    except httpx.RequestError as exc:
        raise HTTPException(status_code=500, detail=f"Network error: {exc}") from exc


@router.get("/organization/{organization_id}")
async def get_organization_details(organization_id: int):
    try:
        organizations = await _fetch_reseller_organizations()
        organization = next((org for org in organizations if org["id"] == organization_id), None)

        if not organization:
            raise HTTPException(status_code=404, detail="Organization not found")

        return {"success": True, "organization": organization}
    except httpx.TimeoutException:
        raise HTTPException(status_code=500, detail="Request timeout")
    except httpx.RequestError as exc:
        raise HTTPException(status_code=500, detail=f"Network error: {exc}") from exc


@router.post("/billing/razorpay/orders")
async def create_razorpay_order(
    payload: RazorpayOrderRequest,
    db: Session = Depends(get_db),
):
    logger.info(
        "Billing order request started | email=%s | plan_code=%s",
        payload.email,
        payload.plan_code,
    )

    plan = PaymentService.get_plan(payload.plan_code)
    if not plan:
        raise HTTPException(status_code=400, detail="Invalid billing plan")

    try:
        organizations = await _fetch_reseller_organizations()
        organization = _find_organization_by_email(organizations=organizations, email=payload.email)
        if not organization:
            raise HTTPException(
                status_code=404,
                detail="Create an account on voiceai.signo.in to activate your plan.",
            )
        order = await PaymentService.create_order(db=db, email=payload.email, plan=plan)
    except ValueError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except httpx.TimeoutException:
        raise HTTPException(status_code=500, detail="Request timeout while fetching organizations")
    except httpx.RequestError as exc:
        raise HTTPException(status_code=500, detail=f"Network error: {exc}") from exc

    logger.info(
        "Billing order request completed | email=%s | plan_code=%s | razorpay_order_id=%s | local_order_id=%s",
        order.email,
        order.plan_code,
        order.razorpay_order_id,
        order.id,
    )

    return {
        "order_id": order.razorpay_order_id,
        "key_id": settings.RAZORPAY_KEY_ID,
        "amount": order.amount,
        "currency": order.currency,
        "name": "SignoTech",
        "prefill": {"email": order.email},
        "notes": {
            "email": order.email,
            "plan_code": order.plan_code,
            "minutes": str(order.minutes),
        },
    }


@router.post("/billing/razorpay/webhook")
async def razorpay_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    logger.info(
        "Razorpay webhook received | method=%s | path=%s | content_type=%s | signature_present=%s | event_id=%s",
        request.method,
        request.url.path,
        request.headers.get("content-type"),
        bool(request.headers.get("x-razorpay-signature")),
        request.headers.get("x-razorpay-event-id"),
    )
    body = await request.body()
    signature = request.headers.get("x-razorpay-signature")

    try:
        is_valid = PaymentService.verify_webhook_signature(
            body=body,
            received_signature=signature,
        )
    except ValueError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid Razorpay webhook signature")

    event = await request.json()
    event_id = request.headers.get("x-razorpay-event-id")

    if event.get("event") not in ["payment.captured", "order.paid"]:
        return {"success": True, "status": "event_ignored"}

    payment = event.get("payload", {}).get("payment", {}).get("entity", {})
    payment_status = payment.get("status")
    payment_id = payment.get("id")
    order_id = payment.get("order_id")
    notes = payment.get("notes") or {}

    if payment_status != "captured" or not payment_id or not order_id:
        return {"success": True, "status": "payment_not_captured"}

    payment_order = (
        db.query(RazorpayPaymentOrder)
        .filter(RazorpayPaymentOrder.razorpay_order_id == order_id)
        .with_for_update()
        .first()
    )
    if not payment_order:
        raise HTTPException(status_code=404, detail="Payment order not found")

    if payment_order.transfer_status in ["PENDING", "PROCESSING", "SUCCESS"]:
        return {"success": True, "status": "already_processed"}

    if (
        int(payment.get("amount", 0)) != payment_order.amount * 100
        or payment.get("currency") != payment_order.currency
    ):
        payment_order.status = "FAILED"
        payment_order.failure_reason = "Payment amount or currency mismatch"
        db.commit()
        raise HTTPException(status_code=400, detail="Payment amount or currency mismatch")

    email = _normalize_email(notes.get("email")) or payment_order.email
    try:
        organizations = await _fetch_reseller_organizations()
        organization = _find_organization_by_email(organizations=organizations, email=email)
    except httpx.TimeoutException:
        raise HTTPException(status_code=500, detail="Request timeout while fetching organizations")
    except httpx.RequestError as exc:
        raise HTTPException(status_code=500, detail=f"Network error: {exc}") from exc

    if not organization or not organization.get("id"):
        payment_order.status = "CAPTURED"
        payment_order.razorpay_payment_id = payment_id
        payment_order.webhook_event_id = event_id
        payment_order.transfer_status = "FAILED"
        payment_order.failure_reason = "No organization found for payment email"
        db.commit()
        raise HTTPException(status_code=404, detail="No organization found for payment email")

    payment_order.status = "CAPTURED"
    payment_order.razorpay_payment_id = payment_id
    payment_order.webhook_event_id = event_id
    payment_order.email = email
    payment_order.to_organization_id = int(organization["id"])
    payment_order.transfer_status = "PENDING"
    db.commit()
    db.refresh(payment_order)

    transfer_result = await CreditService.paid_plan_transfer(
        db=db,
        payment_order=payment_order,
    )

    return {
        "success": bool(transfer_result.get("success")),
        "payment_id": payment_id,
        "email": payment_order.email,
        "to_organization_id": payment_order.to_organization_id,
        "transfer_result": transfer_result,
    }
