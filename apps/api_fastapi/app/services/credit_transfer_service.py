
from sqlalchemy.orm import Session

from apps.api_fastapi.app.model.models import CreditTransaction, RazorpayPaymentOrder
from apps.api_fastapi.app.services.transfer_service import TransferService
from apps.api_fastapi.app.utils.logging import get_logger

logger = get_logger(__name__)


class CreditService:

  
  
    @staticmethod
    async def paid_plan_transfer(
        db: Session,
        payment_order: RazorpayPaymentOrder
    ):
        logger.info(
    f"ENTER paid_plan_transfer | order_id={payment_order.id} | "
    f"payment_id={payment_order.razorpay_payment_id}"
    )
        try:
            locked_order = (
                db.query(RazorpayPaymentOrder)
                .filter(RazorpayPaymentOrder.id == payment_order.id)
                .with_for_update()
                .first()
            )

            if not locked_order:
                return {
                    "success": False,
                    "reason": "payment_order_not_found"
                }

            if locked_order.transfer_status == "SUCCESS":
                return {
                    "success": True,
                    "reason": "already_transferred"
                }

            locked_order.transfer_status = "PENDING"
            db.commit()
            transaction_ref = f"rzp:{locked_order.razorpay_payment_id}"
            transaction = (
                db.query(CreditTransaction)
                .filter(CreditTransaction.transaction_id == transaction_ref)
                .first()
            )

            if not transaction:
                transaction = CreditTransaction(
                    transaction_id=transaction_ref,
                    to_organization_id=locked_order.to_organization_id,
                    amount=locked_order.minutes,
                    cost_per_min=locked_order.cost_per_min,
                    total_cost=(
                        locked_order.minutes * locked_order.cost_per_min
                    ),
                    status="PENDING"
                )
                db.add(transaction)
                db.flush()

            transfer_result = await TransferService.transfer_credits(
                to_organization_id=locked_order.to_organization_id,
                minutes=locked_order.minutes,
                cost_per_min=locked_order.cost_per_min
            )

            if transfer_result["success"]:
                transaction.status = "SUCCESS"
                transaction.failure_reason = None
                locked_order.transfer_status = "SUCCESS"
                locked_order.failure_reason = None
            else:
                transaction.status = "FAILED"
                transaction.failure_reason = str(
                    transfer_result.get("response")
                )[:1000]
                locked_order.transfer_status = "FAILED"
                locked_order.failure_reason = transaction.failure_reason

            db.commit()
            return transfer_result

        except Exception as e:
            db.rollback()
            logger.exception(
                f"Paid plan transfer failed | "
                f"order_id={payment_order.razorpay_order_id}"
            )
            return {
                "success": False,
                "reason": str(e)
            }
