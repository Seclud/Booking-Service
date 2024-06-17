from typing import Any
from sqlmodel import Session, select
from app.core.security import get_password_hash, verify_password
from app.models import CarServiceCreate, CarServiceUpdate, CarService

def create_CarService(*, session: Session, carservice_in: CarServiceCreate, owner_id: int) -> CarService:
    db_item = CarService.model_validate(carservice_in, update={"owner_id": owner_id})
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return db_item