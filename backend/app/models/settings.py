from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, validator


class ShippingTierItem(BaseModel):
    maxAmount: Optional[float] = None
    fee: float = Field(..., ge=0)


class BusinessAssumptionsBase(BaseModel):
    cogs_percent: float = Field(60.0, ge=0.0, le=100.0)
    platform_fee_percent: float = Field(10.0, ge=0.0, le=100.0)
    gst_low_rate: float = Field(5.0, ge=0.0, le=100.0)
    gst_low_threshold: float = Field(2500.0, gt=0.0)
    gst_high_rate: float = Field(18.0, ge=0.0, le=100.0)
    shipping_tiers: List[Dict[str, Any]] = Field(
        default_factory=lambda: [
            {"maxAmount": 500, "fee": 40},
            {"maxAmount": 1000, "fee": 70},
            {"fee": 100},
        ]
    )
    return_loss_amount: float = Field(140.0, ge=0.0)
    risk_tier_high: float = Field(0.5, ge=0.0, le=1.0)
    risk_tier_medium: float = Field(0.2, ge=0.0, le=1.0)

    @validator("risk_tier_high")
    def validate_risk_high(cls, v, values):
        if "risk_tier_medium" in values and v <= values["risk_tier_medium"]:
            raise ValueError("risk_tier_high must be strictly greater than risk_tier_medium")
        return v


class BusinessAssumptionsUpdate(BusinessAssumptionsBase):
    pass


from uuid import UUID

class BusinessAssumptionsResponse(BusinessAssumptionsBase):
    user_id: Any
    updated_at: Optional[datetime] = None

    @validator("user_id", pre=True)
    def convert_uuid_to_str(cls, v):
        if v is not None:
            return str(v)
        return v

    class Config:
        from_attributes = True
        orm_mode = True
