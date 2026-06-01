import httpx

from apps.api_fastapi.app.utils.config import settings
from apps.api_fastapi.app.utils.logging import get_logger

logger = get_logger(__name__)


class UserService:
    @staticmethod
    async def seed_organizations_from_api() -> int:
        """Legacy seeding helper kept as a no-op after bonus-path removal."""
        if not settings.transfer_api_key or not settings.reseller_organizations_url:
            logger.warning("Organization seeding skipped; reseller API config is missing.")
            return 0

        headers = {
            "Authorization": f"Bearer {settings.transfer_api_key}"
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    settings.reseller_organizations_url,
                    headers=headers
                )

            if response.status_code != 200:
                logger.warning(
                    "Organization seeding is disabled; reseller lookup returned %s",
                    response.status_code,
                )
                return 0

            logger.warning("Organization seeding is disabled; paid billing path remains active.")
            return 0
        except Exception as exc:
            logger.exception("Organization seeding check failed: %s", str(exc))
            return 0
