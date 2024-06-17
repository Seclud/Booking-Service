from typing import Any
from sqlmodel import select
from app.api.deps import CurrentUser, SessionDep
from app.models import Lift

def get_lift(session: SessionDep, lift_id: int) -> Lift:
    statement = select(Lift).where(Lift.id == lift_id)
    lift = session.exec(statement).first()
    return lift