from fastapi import APIRouter
from sqlmodel import select

from app.api.deps import SessionDep
from app.models import Services

router = APIRouter()


@router.get("/services")
def get_services(session: SessionDep):
    statement = select(Services)
    services = session.exec(statement).all()
    return services
