import hashlib
import hmac
import uuid

import httpx
from sqlalchemy.orm import Session

from apps.api_fastapi.app.model.models import RazorpayPaymentOrder
from apps.api_fastapi.app.utils.config import settings


class PaymentService:

    @staticmethod
    def get_plan(plan_code: str) -> dict | None:
        plan = settings.billing_plans.get(plan_code)
        if not isinstance(plan, dict):
            return None

        required_fields = ("name", "amount", "minutes", "cost_per_min")
        if any(field not in plan for field in required_fields):
            return None

        return {
            "code": plan_code,
            "name": str(plan["name"]),
            "amount": int(plan["amount"]),
            "minutes": int(plan["minutes"]),
            "cost_per_min": float(plan["cost_per_min"])
        }

    @staticmethod
    def ensure_razorpay_configured() -> None:
        missing = [
            key for key, value in {
                "RAZORPAY_KEY_ID": settings.RAZORPAY_KEY_ID,
                "RAZORPAY_KEY_SECRET": settings.RAZORPAY_KEY_SECRET
            }.items()
            if not value
        ]
        if missing:
            raise ValueError(f"Missing Razorpay config: {', '.join(missing)}")

    @staticmethod
    def ensure_webhook_configured() -> None:
        if not settings.RAZORPAY_WEBHOOK_SECRET:
            raise ValueError("Missing Razorpay config: RAZORPAY_WEBHOOK_SECRET")

    @staticmethod
    async def create_order(
        db: Session,
        email: str,
        plan: dict
    ) -> RazorpayPaymentOrder:
        PaymentService.ensure_razorpay_configured()

        receipt = f"bill_{uuid.uuid4().hex[:24]}"
        notes = {
            "email": email,
            "plan_code": plan["code"],
            "plan_name": plan["name"],
            "minutes": str(plan["minutes"])
        }
        payload = {
            "amount": plan["amount"]*100,  # Convert to paise
            "currency": settings.RAZORPAY_CURRENCY,
            "receipt": receipt,
            "notes": notes
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{settings.RAZORPAY_API_URL.rstrip('/')}/orders",
                json=payload,
                auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
            )

        if response.status_code not in (200, 201):
            raise ValueError(f"Razorpay order creation failed: {response.text}")

        order_data = response.json()
        payment_order = RazorpayPaymentOrder(
            razorpay_order_id=order_data["id"],
            user_id=0,
            email=email,
            to_organization_id=0,
            plan_code=plan["code"],
            plan_name=plan["name"],
            minutes=plan["minutes"],
            cost_per_min=plan["cost_per_min"],
            amount=plan["amount"],
            currency=settings.RAZORPAY_CURRENCY,
            status=order_data.get("status", "created"),
            transfer_status="NOT_STARTED"
        )

        db.add(payment_order)
        db.commit()
        db.refresh(payment_order)

        return payment_order

    @staticmethod
    def verify_webhook_signature(
        body: bytes,
        received_signature: str | None
    ) -> bool:
        PaymentService.ensure_webhook_configured()

        if not received_signature:
            return False

        expected_signature = hmac.new(
            settings.RAZORPAY_WEBHOOK_SECRET.encode("utf-8"),
            body,
            hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(expected_signature, received_signature)
