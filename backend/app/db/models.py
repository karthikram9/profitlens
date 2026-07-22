import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Float, Integer, Boolean, Date
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.orm import relationship
from app.db.session import Base

def utcnow():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"
    
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    email_verified_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    reset_tokens = relationship("PasswordResetToken", back_populates="user", cascade="all, delete-orphan")
    uploads = relationship("Upload", back_populates="user", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="user", cascade="all, delete-orphan")
    business_assumptions = relationship("BusinessAssumptions", back_populates="user", uselist=False, cascade="all, delete-orphan")

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token_hash = Column(String, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    user = relationship("User", back_populates="reset_tokens")

class Upload(Base):
    __tablename__ = "uploads"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    original_filename = Column(String, nullable=False)
    marketplace_detected = Column(String, nullable=True)
    detection_confidence = Column(Float, nullable=True)
    status = Column(String, nullable=False)  # 'uploaded' | 'mapping_required' | 'processing' | 'ready' | 'failed'
    row_count_raw = Column(Integer, nullable=True)
    row_count_processed = Column(Integer, nullable=True)
    row_count_excluded = Column(Integer, nullable=True)
    error_message = Column(String, nullable=True)
    uploaded_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    processed_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="uploads")
    orders = relationship("Order", back_populates="upload", cascade="all, delete-orphan")

class Order(Base):
    __tablename__ = "orders"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    upload_id = Column(PG_UUID(as_uuid=True), ForeignKey("uploads.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    order_id = Column(String)
    date = Column(Date)
    status = Column(String)
    fulfilment = Column(String)
    ship_service_level = Column(String)
    category = Column(String)
    sku = Column(String)
    qty = Column(Integer)
    amount = Column(Float)
    ship_state = Column(String)
    ship_city = Column(String)
    b2b = Column(Boolean)
    
    estimated_cogs = Column(Float)
    platform_fee = Column(Float)
    shipping_cost = Column(Float)
    gst = Column(Float)
    return_loss = Column(Float)
    estimated_profit = Column(Float)
    
    return_flag = Column(Integer, nullable=True)
    risk_probability = Column(Float, nullable=True)
    used_fallback = Column(Boolean, nullable=True)

    upload = relationship("Upload", back_populates="orders")
    user = relationship("User", back_populates="orders")

class BusinessAssumptions(Base):
    __tablename__ = "business_assumptions"

    user_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    cogs_percent = Column(Float, default=60.0, nullable=False)
    platform_fee_percent = Column(Float, default=10.0, nullable=False)
    gst_low_rate = Column(Float, default=5.0, nullable=False)
    gst_low_threshold = Column(Float, default=2500.0, nullable=False)
    gst_high_rate = Column(Float, default=18.0, nullable=False)
    shipping_tiers = Column(JSONB, default=[{"maxAmount": 500, "fee": 40}, {"maxAmount": 1000, "fee": 70}, {"fee": 100}], nullable=False)
    return_loss_amount = Column(Float, default=140.0, nullable=False)
    risk_tier_high = Column(Float, default=0.5, nullable=False)
    risk_tier_medium = Column(Float, default=0.2, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    user = relationship("User", back_populates="business_assumptions")
