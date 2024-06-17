from sqlmodel import Session, create_engine, select

from app import crud
from app.core.config import settings
from app.models import User, UserCreate, CarService, Booking
from app.crud.user import create_user

from sqlmodel import SQLModel

engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))


# SQLModel.metadata.create_all(engine)

# from sqlmodel.ext.asyncio.session import AsyncSession, AsyncEngine
# engine = AsyncEngine(create_engine(DATABASE_URL, echo=True, future=True))

def init_db(session: Session) -> None:
    user = session.exec(
        select(User).where(User.email == "admin@example.com")
    ).first()
    if not user:
        user_in = UserCreate(
            email="admin@example.com",
            password="admin",
            is_superuser=True,
        )
        user = create_user(session=session, user_create=user_in)
