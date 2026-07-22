import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.db.models import User
from app.db.session import get_db
from app.models.settings import (
    BusinessAssumptionsResponse,
    BusinessAssumptionsUpdate,
)
from app.services.settings_service import (
    get_or_create_assumptions,
    update_assumptions,
)

logger = logging.getLogger(__name__)

router = APIRouter()


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = auth_header.split(" ", 1)[1]
    payload = decode_token(token)
    if not payload or payload.get("type") == "refresh":
        raise HTTPException(status_code=401, detail="Invalid token")
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


@router.get("/business-assumptions", response_model=BusinessAssumptionsResponse)
def get_business_assumptions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assumptions = get_or_create_assumptions(db, str(current_user.id))
    return assumptions


@router.put("/business-assumptions", response_model=BusinessAssumptionsResponse)
def update_business_assumptions(
    body: BusinessAssumptionsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updates = body.dict(exclude_unset=True)
    assumptions = update_assumptions(db, str(current_user.id), updates)
    return assumptions



