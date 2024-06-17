from datetime import datetime, timedelta
from typing import Any

import jwt
from fastapi import HTTPException
from passlib.context import CryptContext

from app.models import TokenPayload

from .config import settings


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"


def create_access_token(subject: str | Any, expires_delta: timedelta) -> str:
    expire = datetime.now() + expires_delta
    to_encode = {"exp": expire, "sub": str(subject), "type": "access"}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(subject: str | Any, expires_delta: timedelta) -> str:
    expire = datetime.now() + expires_delta
    to_encode = {"exp": expire, "sub": str(subject), "type": "refresh"}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_refresh_token(token: str) -> int:
    payload = jwt.decode(
        token, settings.SECRET_KEY, algorithms=[ALGORITHM]
    )
    if payload["type"] != "refresh":
        raise HTTPException(status_code=400, detail="Invalid token type")
    return TokenPayload(**payload).sub


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_confirmation_token(user_id: int) -> str:
    expires_delta = timedelta(days=1)
    return create_access_token(subject=user_id, expires_delta=expires_delta)


def confirm_token(token: str) -> int:
    try:
        decoded_jwt = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        return int(decoded_jwt["sub"])
    except jwt.PyJWTError:
        return None
