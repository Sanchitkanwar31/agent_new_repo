# from __future__ import annotations

# from functools import lru_cache

# from pydantic import Field
# from pydantic_settings import BaseSettings, SettingsConfigDict


# class Settings(BaseSettings):
#     model_config = SettingsConfigDict(
#         env_file=".env",
#         env_file_encoding="utf-8",
#         case_sensitive=False,
#         extra="ignore",
#     )

#     port: int = Field(default=5000, alias="PORT")
#     app_env: str = Field(default="development", alias="NODE_ENV")
#     log_level: str = Field(default="info", alias="LOG_LEVEL")
#     http_user_agent: str | None = Field(default=None, alias="HTTP_USER_AGENT")
#     DATABASE_URL: str | None = Field(default=None, alias="DATABASE_URL")

#     @property
#     def is_production(self) -> bool:
#         return self.app_env.lower() == "production"


# @lru_cache(maxsize=1)
# def get_settings() -> Settings:
#     return Settings()

# ----------------------------------------------------------
from __future__ import annotations

import json
import os
from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


DEFAULT_BILLING_PLANS = {
    "test_10": {
        "name": "Starter",
        "amount": 199.00,
        "minutes": 10,
        "cost_per_min": 19.99,
    },
    "test_50": {
        "name": "Explorer",
        "amount": 749.00,
        "minutes": 50,
        "cost_per_min": 14.99,
    },
    "test_100": {
        "name": "Pro",
        "amount": 1399.00,
        "minutes": 100,
        "cost_per_min": 13.99,
    },
}


class Settings(BaseSettings):
    # ======================
    # CORE APP SETTINGS
    # ======================
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    port: int = Field(default=5000, alias="PORT")
    app_env: str = Field(default="development", alias="NODE_ENV")
    log_level: str = Field(default="info", alias="LOG_LEVEL")
    http_user_agent: str | None = Field(default=None, alias="HTTP_USER_AGENT")

    DATABASE_URL: str | None = Field(default=None, alias="DATABASE_URL")

    # ======================
    # BILLING / PAYMENTS
    # ======================
    bonus_amount: int = Field(default=50, alias="BONUS_AMOUNT")
    signup_bonus_minutes: int = Field(default=10, alias="SIGNUP_BONUS_MINUTES")
    signup_bonus_cost_per_min: float = Field(
        default=4.0,
        alias="SIGNUP_BONUS_COST_PER_MIN",
    )

    RAZORPAY_KEY_ID: str | None = Field(default=None, alias="RAZORPAY_KEY_ID")
    RAZORPAY_KEY_SECRET: str | None = Field(default=None, alias="RAZORPAY_KEY_SECRET")
    RAZORPAY_WEBHOOK_SECRET: str | None = Field(default=None, alias="RAZORPAY_WEBHOOK_SECRET")
    RAZORPAY_CURRENCY: str = Field(default="INR", alias="RAZORPAY_CURRENCY")
    RAZORPAY_API_URL: str = Field(
        default="https://api.razorpay.com/v1",
        alias="RAZORPAY_API_URL",
    )

    # ======================
    # TRANSFER / RESELLER
    # ======================
    transfer_api_url: str | None = Field(default=None, alias="TRANSFER_API_URL")
    transfer_api_key: str | None = Field(default=None, alias="TRANSFER_API_KEY")

    reseller_organizations_url: str | None = Field(
        default=None,
        alias="RESELLER_ORGANIZATIONS_URL",
    )

    # ======================
    # COMPUTED PROPERTIES
    # ======================
    @property
    def is_production(self) -> bool:
        return self.app_env.lower() == "production"

    @property
    def billing_plans(self) -> dict:
        raw_plans = os.getenv("BILLING_PLANS_JSON")

        if not raw_plans:
            return DEFAULT_BILLING_PLANS

        try:
            plans = json.loads(raw_plans)
            return plans if isinstance(plans, dict) else DEFAULT_BILLING_PLANS
        except json.JSONDecodeError:
            return DEFAULT_BILLING_PLANS

    def validated_database_url(self) -> str:
        value = self.DATABASE_URL.strip() if isinstance(self.DATABASE_URL, str) else ""
        if not value:
            raise RuntimeError("DATABASE_URL must be set before creating the engine.")
        return value

    def validated_transfer_api_url(self) -> str:
        value = self.transfer_api_url.strip() if isinstance(self.transfer_api_url, str) else ""
        if not value:
            raise RuntimeError("TRANSFER_API_URL must be set before calling the transfer API.")
        return value.rstrip("/")

    def validated_razorpay_api_url(self) -> str:
        value = self.RAZORPAY_API_URL.strip() if isinstance(self.RAZORPAY_API_URL, str) else ""
        if not value:
            raise RuntimeError("RAZORPAY_API_URL must be set before calling Razorpay.")
        return value.rstrip("/")

    def validated_reseller_organizations_url(self) -> str:
        value = self.normalized_reseller_organizations_url
        if not value:
            raise RuntimeError(
                "RESELLER_ORGANIZATIONS_URL or TRANSFER_API_URL must be set before fetching organizations."
            )
        return value

    @property
    def normalized_reseller_organizations_url(self) -> str | None:
        value = self.reseller_organizations_url or self.transfer_api_url

        if not value:
            return None

        base_url = value.strip().rstrip("/")

        while "/reseller/reseller/" in base_url:
            base_url = base_url.replace("/reseller/reseller/", "/reseller/")

        if base_url.endswith("/reseller/organizations"):
            return base_url

        if base_url.endswith("/reseller"):
            return f"{base_url}/organizations"

        return f"{base_url}/reseller/organizations"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
