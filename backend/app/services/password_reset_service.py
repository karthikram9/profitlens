import uuid
import hashlib
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.db.models import User, PasswordResetToken
from app.core.security import hash_password
from app.services.email_service import email_service

def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()

class PasswordResetService:
    def request_reset(self, db: Session, email: str):
        user = db.query(User).filter(User.email == email).first()
        if user:
            raw_token = str(uuid.uuid4())
            token_hash = hash_token(raw_token)
            
            reset_token = PasswordResetToken(
                user_id=user.id,
                token_hash=token_hash,
                expires_at=datetime.now(timezone.utc) + timedelta(minutes=30)
            )
            db.add(reset_token)
            db.commit()
            
            reset_link = f"http://localhost:5173/auth/reset-password?token={raw_token}"
            email_service.send_password_reset_email(user.email, reset_link)

    def reset_password(self, db: Session, raw_token: str, new_password: str):
        token_hash = hash_token(raw_token)
        reset_token = db.query(PasswordResetToken).filter(
            PasswordResetToken.token_hash == token_hash,
            PasswordResetToken.used_at == None,
            PasswordResetToken.expires_at > datetime.now(timezone.utc)
        ).first()
        
        if not reset_token:
            raise HTTPException(status_code=400, detail="Invalid, expired, or used reset token.")
            
        user = reset_token.user
        user.password_hash = hash_password(new_password)
        reset_token.used_at = datetime.now(timezone.utc)
        db.commit()

password_reset_service = PasswordResetService()
