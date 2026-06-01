# from sqlalchemy import Column, Integer, Boolean, DateTime, String
# from sqlalchemy.sql import func

# from app.db.base import Base

# #to maintain a record of users who have received the first time bonus.
# class UserBonus(Base):
#     __tablename__ = "user_bonus"

#     id = Column(Integer, primary_key=True, index=True)

#     user_id = Column(Integer, unique=True, nullable=False, index=True)

#     platform_user_id = Column(
#         Integer,
#         nullable=False,
#         index=True
#     )

#     first_bonus = Column(Boolean, default=False)

#     bonus_given_at = Column(DateTime, nullable=True)

#     created_at = Column(
#         DateTime(timezone=True),
#         server_default=func.now()
#     )


# # to maintain a record of how many credits have been transferred between users.
# class CreditTransaction(Base):
#     __tablename__ = "credit_transactions"

#     id = Column(Integer, primary_key=True, index=True)

#     transaction_id = Column(
#         String,
#         unique=True,
#         nullable=False,
#         index=True
#     )

#     # from_user_id = Column(Integer, nullable=False)
#     to_user_id = Column(Integer, nullable=False)

#     amount = Column(Integer, nullable=False)

#     status = Column(String, nullable=False)

#     created_at = Column(
#         DateTime(timezone=True),
#         server_default=func.now()
#     )



from sqlalchemy import (
    Column,
    Integer,
    Boolean,
    DateTime,
    String,
    Float,
    ForeignKey
)

from sqlalchemy.sql import func

from apps.api_fastapi.app.db.base import Base


# ---------------------------------------------------
# USER BONUS TABLE
# maintains onboarding bonus state per platform user
# ---------------------------------------------------

# class UserBonus(Base):

#     __tablename__ = "user_bonus"

#     id = Column(Integer, primary_key=True, index=True)

#     # platform user id from white-label system
#     user_id = Column(
#         Integer,
#         unique=True,
#         nullable=False,
#         index=True
#     )

#     # organization wallet owner
#     to_organization_id = Column(
#         Integer,
#         nullable=False,
#         index=True
#     )

#     # first-time signup bonus status
#     first_bonus = Column(
#         Boolean,
#         default=False,
#         nullable=False
#     )

#     # when bonus was successfully given
#     bonus_given_at = Column(
#         DateTime,
#         nullable=True
#     )

#     created_at = Column(
#         DateTime(timezone=True),
#         server_default=func.now()
#     )


# ---------------------------------------------------
# CREDIT TRANSACTION TABLE
# stores all wallet transfer operations
# ---------------------------------------------------

class CreditTransaction(Base):

    __tablename__ = "credit_transactions"

    id = Column(Integer, primary_key=True, index=True)

    # external/internal transaction reference
    transaction_id = Column(
        String,
        unique=True,
        nullable=False,
        index=True
    )

    # target organization wallet
    to_organization_id = Column(
        Integer,
        nullable=False,
        index=True
    )

    # transferred minutes/credits
    amount = Column(
        Integer,
        nullable=False
    )

    # organization pricing snapshot
    cost_per_min = Column(
        Float,
        nullable=False
    )

    # total transfer cost
    total_cost = Column(
        Float,
        nullable=False
    )

    # transaction states:
    # PENDING / SUCCESS / FAILED
    status = Column(
        String,
        nullable=False,
        index=True
    )

    # optional failure reason
    failure_reason = Column(
        String,
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )


class RazorpayPaymentOrder(Base):

    __tablename__ = "razorpay_payment_orders"

    id = Column(Integer, primary_key=True, index=True)

    razorpay_order_id = Column(
        String,
        unique=True,
        nullable=False,
        index=True
    )

    razorpay_payment_id = Column(
        String,
        unique=True,
        nullable=True,
        index=True
    )

    webhook_event_id = Column(
        String,
        unique=True,
        nullable=True,
        index=True
    )

    user_id = Column(
        Integer,
        nullable=True,
        index=True
    )

    email = Column(
        String,
        nullable=False,
        index=True
    )

    to_organization_id = Column(
        Integer,
        nullable=True,
        index=True
    )

    plan_code = Column(
        String,
        nullable=False,
        index=True
    )

    plan_name = Column(
        String,
        nullable=False
    )

    minutes = Column(
        Integer,
        nullable=False
    )

    cost_per_min = Column(
        Float,
        nullable=False
    )

    amount = Column(
        Integer,
        nullable=False
    )

    currency = Column(
        String,
        nullable=False
    )

    status = Column(
        String,
        nullable=False,
        index=True
    )

    transfer_status = Column(
        String,
        nullable=False,
        default="INIT",
        index=True
    )

    failure_reason = Column(
        String,
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )


class WebhookEvent(Base):
    __tablename__ = "webhook_events"

    id = Column(Integer, primary_key=True)
    event_id = Column(String, unique=True, index=True, nullable=False)
    event_type = Column(String, nullable=False)
    payload_hash = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
