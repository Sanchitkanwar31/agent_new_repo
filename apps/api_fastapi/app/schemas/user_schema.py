import re

from pydantic import BaseModel, conint, confloat, field_validator

class RazorpayOrderRequest(BaseModel):
    email: str
    plan_code: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        email = value.strip().lower()
        if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
            raise ValueError("Invalid email address")
        return email

    @field_validator("plan_code")
    @classmethod
    def validate_plan_code(cls, value: str) -> str:
        plan_code = value.strip()
        if not plan_code:
            raise ValueError("Plan code is required")
        return plan_code
