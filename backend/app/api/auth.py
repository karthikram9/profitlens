from fastapi import APIRouter, Depends, HTTPException, Response, Request
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import UserCreate, UserLogin, TokenPair, ForgotPasswordRequest, ResetPasswordRequest, UserPublic
from app.services.auth_service import auth_service
from app.services.password_reset_service import password_reset_service
from app.core.security import decode_token, create_access_token
from app.core.rate_limit import rate_limit
from app.db.models import User

router = APIRouter()

def set_refresh_cookie(response: Response, refresh_token: str):
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=7 * 24 * 60 * 60  # 7 days
    )

@router.post("/signup", response_model=TokenPair)
def signup(user_in: UserCreate, response: Response, db: Session = Depends(get_db)):
    user, access_token, refresh_token = auth_service.signup(db, user_in)
    set_refresh_cookie(response, refresh_token)
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=TokenPair, dependencies=[Depends(rate_limit())])
def login(user_in: UserLogin, response: Response, db: Session = Depends(get_db)):
    user, access_token, refresh_token = auth_service.login(db, user_in)
    set_refresh_cookie(response, refresh_token)
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/refresh", response_model=TokenPair)
def refresh(request: Request, response: Response, db: Session = Depends(get_db)):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Missing refresh token")
        
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
        
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
        
    new_access_token = create_access_token(user_id=str(user.id))
    return {"access_token": new_access_token, "token_type": "bearer"}

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(
        key="refresh_token",
        httponly=True,
        secure=True,
        samesite="strict"
    )
    return {"status": "ok"}

@router.post("/forgot-password", dependencies=[Depends(rate_limit())])
def forgot_password(request_data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    password_reset_service.request_reset(db, request_data.email)
    return {"message": "If that email exists, a reset link was sent."}

@router.post("/reset-password")
def reset_password(request_data: ResetPasswordRequest, db: Session = Depends(get_db)):
    password_reset_service.reset_password(db, request_data.token, request_data.new_password)
    return {"status": "ok"}

@router.get("/me", response_model=UserPublic)
def get_me(request: Request, db: Session = Depends(get_db)):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
        
    token = auth_header.split(" ")[1]
    payload = decode_token(token)
    if not payload or payload.get("type") == "refresh":
        raise HTTPException(status_code=401, detail="Invalid token")
        
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
        
    return user
