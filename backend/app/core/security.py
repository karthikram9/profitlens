import os
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError

# ---------------------------------------------------------------------------
# Passlib + bcrypt compatibility shim
# ---------------------------------------------------------------------------
# passlib 1.7.x imports bcrypt as `_bcrypt` inside passlib.handlers.bcrypt
# and calls `_bcrypt.hashpw()` directly. Newer bcrypt (≥ 4.x) enforces a
# strict 72-byte password limit there. We must patch it on the module where
# passlib actually holds the reference — not the top-level bcrypt module.

# Step 1: ensure passlib.handlers.bcrypt is loaded so _bcrypt is resolved
import passlib.handlers.bcrypt as _passlib_bcrypt_handler

# Step 2: grab the _bcrypt reference passlib is using
_bcrypt_ref = getattr(_passlib_bcrypt_handler, "_bcrypt", None)

if _bcrypt_ref is not None:
    _orig_hashpw = _bcrypt_ref.hashpw

    def _safe_hashpw(password: bytes, salt: bytes) -> bytes:
        if isinstance(password, bytes) and len(password) > 72:
            password = password[:72]
        return _orig_hashpw(password, salt)

    _bcrypt_ref.hashpw = _safe_hashpw

# Step 3: also ensure __about__ is present (passlib version-sniffing guard)
import bcrypt as _top_bcrypt
if not hasattr(_top_bcrypt, "__about__"):
    class _About:
        __version__ = _top_bcrypt.__version__
    _top_bcrypt.__about__ = _About()

from passlib.context import CryptContext

# ---------------------------------------------------------------------------
# Password hashing context
# ---------------------------------------------------------------------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ---------------------------------------------------------------------------
# JWT configuration
# ---------------------------------------------------------------------------
JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "super-secret-key-for-dev")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7


def hash_password(password: str) -> str:
    """Hash a plain-text password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain-text password against a stored bcrypt hash."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(user_id: str, expires_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES) -> str:
    to_encode = {"sub": str(user_id)}
    expire = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str, expires_days: int = REFRESH_TOKEN_EXPIRE_DAYS) -> str:
    to_encode = {"sub": str(user_id), "type": "refresh"}
    expire = datetime.now(timezone.utc) + timedelta(days=expires_days)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        return None
