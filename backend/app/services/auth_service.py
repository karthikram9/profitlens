from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.db.models import User
from app.models.user import UserCreate, UserLogin
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token

class AuthService:
    def signup(self, db: Session, user_in: UserCreate):
        user = db.query(User).filter(User.email == user_in.email).first()
        if user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        user = User(
            email=user_in.email,
            password_hash=hash_password(user_in.password)
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        access_token = create_access_token(user_id=str(user.id))
        refresh_token = create_refresh_token(user_id=str(user.id))
        return user, access_token, refresh_token

    def login(self, db: Session, user_in: UserLogin):
        user = db.query(User).filter(User.email == user_in.email).first()
        if not user or not verify_password(user_in.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid email or password")
            
        from datetime import datetime, timezone
        user.last_login_at = datetime.now(timezone.utc)
        db.commit()
        
        access_token = create_access_token(user_id=str(user.id))
        refresh_token = create_refresh_token(user_id=str(user.id))
        return user, access_token, refresh_token

auth_service = AuthService()
