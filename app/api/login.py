from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, Cookie
from fastapi.responses import HTMLResponse
from fastapi.security import OAuth2PasswordRequestForm

from app.core import security
from app.models import NewPassword, Token, UsersPublic, Message, UserPublic
from app.core.security import get_password_hash, confirm_token, create_access_token, decode_refresh_token
from app.api.deps import CurrentUser, SessionDep, get_current_active_superuser
from app import crud

router = APIRouter()


@router.post('/login/access-token')
def login_access_token(response: Response, session: SessionDep,
                       form_data: Annotated[OAuth2PasswordRequestForm, Depends()]) -> Token:
    user = crud.user.authenticate(session=session, email=form_data.username, password=form_data.password)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    access_token_expires = timedelta(days=1)
    refresh_token_expires = timedelta(days=30)
    access_token = security.create_access_token(user.id, expires_delta=access_token_expires)
    refresh_token = security.create_refresh_token(user.id, expires_delta=refresh_token_expires)
    response.set_cookie(key="access_token", value=f"Bearer {access_token}", httponly=True)
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/login/test-token", response_model=UserPublic)
def test_token(current_user: CurrentUser):
    return current_user


@router.post('/token/refresh', response_model=Token, response_model_exclude_none=True)
def refresh_token(refresh_token: str):
    user_id = decode_refresh_token(refresh_token)
    if user_id is None:
        raise HTTPException(status_code=400, detail="Invalid refresh token")
    access_token_expires = timedelta(minutes=480)
    return Token(
        access_token=create_access_token(
            user_id, expires_delta=access_token_expires
        )
    )
