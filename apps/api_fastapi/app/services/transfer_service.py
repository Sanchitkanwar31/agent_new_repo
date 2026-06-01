# import uuid
# import httpx

# from app.utils.config import settings


# class TransferService:

#     @staticmethod
#     async def transfer_credits(
#         to_organization_id: int,
#         minutes: int,
#         cost_per_min: float
#     ):
#         transaction_id = str(uuid.uuid4())

#         payload = {
#             "to_organization_id": to_organization_id,
#             "minutes": minutes,
#             "cost_per_min": cost_per_min
#         }

#         headers = {
#             "Authorization": f"Bearer {settings.TRANSFER_API_KEY}",
#             "Content-Type": "application/json"
#         }

#         transfer_url = f"{settings.TRANSFER_API_URL.rstrip('/')}/credits/transfer"
#         try:
#             async with httpx.AsyncClient(timeout=10.0) as client:
#                 response = await client.post(
#                      transfer_url,
#                     json=payload,
#                     headers=headers
#                 )

#             if response.status_code == 200:
#                 return {
#                     "success": True,
#                     "transaction_id": transaction_id,
#                     "response": response.json()
#                 }

#             return {
#                 "success": False,
#                 "transaction_id": transaction_id,
#                 "response": response.text
#             }

#         except Exception as e:
#             return {
#                 "success": False,
#                 "transaction_id": transaction_id,
#                 "response": str(e)
#             }



import uuid
import httpx
import logging

from apps.api_fastapi.app.utils.config import settings

logger = logging.getLogger(__name__)


class TransferService:

    @staticmethod
    def ensure_transfer_configured() -> None:
        if not settings.transfer_api_key:
            raise ValueError("Missing transfer config: TRANSFER_API_KEY")
        if not settings.transfer_api_url:
            raise ValueError("Missing transfer config: TRANSFER_API_URL")

    @staticmethod
    async def transfer_credits(
        to_organization_id: int,
        minutes: int,
        cost_per_min: float,
        idempotency_key: str | None = None
    ):
        TransferService.ensure_transfer_configured()
        transaction_id = idempotency_key or str(uuid.uuid4())

        payload = {
            "to_organization_id": to_organization_id,
            "minutes": minutes,
            "cost_per_min": cost_per_min,
            "transaction_id": transaction_id
        }

        headers = {
            "Authorization": f"Bearer {settings.transfer_api_key}",
            "Content-Type": "application/json"
        }

        transfer_url = f"{settings.validated_transfer_api_url()}/reseller/credits/transfer"

        logger.info(
            f"Initiating transfer | "
            f"org_id={to_organization_id} | "
            f"minutes={minutes} | "
            f"transaction_id={transaction_id}"
        )

        try:

            async with httpx.AsyncClient(timeout=10.0) as client:

                response = await client.post(
                    transfer_url,
                    json=payload,
                    headers=headers
                )

            response_data = response.json()

            if (
                response.status_code == 200 and
                response_data.get("success") is True
            ):

                logger.info(
                    f"Transfer success | "
                    f"transaction_id={transaction_id}"
                )

                return {
                    "success": True,
                    "transaction_id": transaction_id,
                    "response": response_data
                }

            logger.error(
                f"Transfer failed | "
                f"transaction_id={transaction_id} | "
                f"response={response.text}"
            )

            return {
                "success": False,
                "transaction_id": transaction_id,
                "response": response_data
            }

        except httpx.TimeoutException:

            logger.error(
                f"Transfer timeout | "
                f"transaction_id={transaction_id}"
            )

            return {
                "success": False,
                "transaction_id": transaction_id,
                "response": "Transfer API timeout"
            }

        except httpx.RequestError as e:

            logger.error(
                f"Transfer request error | "
                f"transaction_id={transaction_id} | "
                f"error={str(e)}"
            )

            return {
                "success": False,
                "transaction_id": transaction_id,
                "response": str(e)
            }

        except Exception as e:

            logger.exception(
                f"Unexpected transfer error | "
                f"transaction_id={transaction_id}"
            )

            return {
                "success": False,
                "transaction_id": transaction_id,
                "response": str(e)
            }
