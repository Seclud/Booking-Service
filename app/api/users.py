from fastapi import APIRouter, HTTPException, Depends
from app import models
from app.api.deps import SessionDep, get_current_active_superuser, CurrentUser
from app.crud.user import (get_user_by_email, create_user as create_user_crud)
from sqlmodel import select, col, delete, func
from app.models import (
    CarService,
    Message,
    UpdatePassword,
    User,
    UserCreate,
    UserPublic,
    UserRegister,
    UsersPublic,
    UserUpdate,
    UserUpdateMe,
)
from app.core.celery_utils import send_email
from app.core.security import get_password_hash, verify_password, create_confirmation_token, confirm_token
from fastapi_cache.decorator import cache
from app.core.config import settings


router = APIRouter()


@router.post("/", response_model=User, dependencies=[Depends(get_current_active_superuser)])
def create_user(*, user: UserCreate, session: SessionDep):
    db_user = get_user_by_email(session=session, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Пользователь с такой почтой уже зарегистрирован")

    email = user.email
    password = user.password

    if not password or not email:
        raise HTTPException(
            status_code=400,
            detail="Почта или пароль не должны быть пустыми",
        )

    created_user = create_user_crud(session=session, user_create=user)
    confirmation_token = create_confirmation_token(created_user.id)
    email_data = {
        "subject": "Подтвердите свою почту",
        "body": f"Перейдите по ссылке, чтобы подтвердить: http://{settings.FRONTEND_HOST}:{settings.FRONTEND_PORT}/email-confirmation/{confirmation_token}",
        "to": created_user.email,
    }
    send_email.delay(email_data)
    return created_user


@router.get("/", response_model=UsersPublic, dependencies=[Depends(get_current_active_superuser)])
@cache(expire=120)
def read_users(session: SessionDep, skip: int = 0, limit: int = 100):
    count_statement = select(func.count()).select_from(User)
    count = session.exec(count_statement).one()

    statement = select(User).offset(skip).limit(limit)
    users = session.exec(statement).all()

    return UsersPublic(data=users, count=count)


@router.patch("/me", response_model=UserPublic)
def update_user_me(*, user_in: UserUpdateMe, session: SessionDep, current_user: CurrentUser):
    if user_in.email:
        existing_user = get_user_by_email(session=session, email=user_in.email)
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(status_code=409, detail="Email already registered")
    user_data = user_in.model_dump(exclude_unset=True)
    current_user.sqlmodel_update(user_data)
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return current_user


@router.patch("/me/password", response_model=Message)
def update_password_me(*, session: SessionDep, body: UpdatePassword, current_user: CurrentUser):
    if not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect password")
    if body.current_password == body.new_password:
        raise HTTPException(
            status_code=400, detail="New password cannot be the same as the current one"
        )
    hashed_password = get_password_hash(body.new_password)
    current_user.hashed_password = hashed_password
    session.add(current_user)
    session.commit()
    return Message(message="Password updated successfully")


@router.get("/me", response_model=UserPublic)
@cache(expire=120)
def read_user_me(current_user: CurrentUser):
    return current_user


@router.post("/signup", response_model=UserPublic)
def register_user(session: SessionDep, user_in: UserRegister):
    user = get_user_by_email(session=session, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="Пользователь с такой почтой уже существует",
        )
    user_create = UserCreate.model_validate(user_in)
    user = create_user(session=session, user=user_create)
    return user

@router.patch("/{user_id}", dependencies=[Depends(get_current_active_superuser)], response_model=UserPublic, )
def update_user(*, session: SessionDep, user_id: int, user_in: UserUpdate, ):
    db_user = session.get(User, user_id)
    if not db_user:
        raise HTTPException(
            status_code=404,
            detail="The user with this id does not exist in the system",
        )
    if user_in.email:
        existing_user = get_user_by_email(session=session, email=user_in.email)
        if existing_user and existing_user.id != user_id:
            raise HTTPException(
                status_code=409, detail="User with this email already exists"
            )

    db_user = update_user(session=session, db_user=db_user, user_in=user_in)
    return db_user


@router.delete("/{user_id}", dependencies=[Depends(get_current_active_superuser)])
def delete_user(
        session: SessionDep, current_user: CurrentUser, user_id: int
) -> Message:
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user == current_user:
        raise HTTPException(
            status_code=403, detail="Super users are not allowed to delete themselves"
        )
    statement = delete(CarService).where(col(CarService.owner_id) == user_id)
    session.exec(statement)
    session.delete(user)
    session.commit()
    return Message(message="User deleted successfully")


@router.get("/confirm/{token}")
def confirm_email(token: str, session: SessionDep):
    user_id = confirm_token(token)
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = True
    session.commit()

    return Message(message="Email confirmed successfully")
