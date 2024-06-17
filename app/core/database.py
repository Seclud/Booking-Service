from sqlmodel import Session, create_engine, select

from app.crud.user import create_user
from app.models import User, UserCreate
from .config import settings

engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))


# SQLModel.metadata.create_all(engine)

# from sqlmodel.ext.asyncio.session import AsyncSession, AsyncEngine
# engine = AsyncEngine(create_engine(DATABASE_URL, echo=True, future=True))

def init_db(session: Session) -> None:
    user = session.exec(
        select(User).where(User.email == settings.FIRST_SUPERUSER)
    ).first()
    if not user:
        user_in = UserCreate(
            email=settings.FIRST_SUPERUSER,
            password=settings.FIRST_SUPERUSER_PASSWORD,
            is_superuser=True,
            is_active=True,
        )
        user = create_user(session=session, user_create=user_in)
