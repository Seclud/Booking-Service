from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import CarService, CarServiceCreate, CarServicePublic, CarServicesPublic, CarServiceUpdate, Message, \
    Lift, Booking

router = APIRouter()


@router.get("/", response_model=CarServicesPublic)
def read_services(current_user: CurrentUser, session: SessionDep, skip: int = 0, limit: int = 100):
    count_statement = (
        select(func.count())
        .select_from(CarService)
    )
    count = session.exec(count_statement).one()
    statement = (
        select(CarService)
        .offset(skip)
        .limit(limit)
    )
    services = session.exec(statement).all()

    return CarServicesPublic(data=services, count=count)


@router.get("/{id}", response_model=CarServicePublic)
def read_service(session: SessionDep, current_user: CurrentUser, id: int):
    service = session.get(CarService, id)
    if not service:
        raise HTTPException(status_code=404, detail="CarService not found")
    if not current_user.is_superuser and (service.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    return service


@router.post("/", response_model=CarServicePublic)
def create_service(*, session: SessionDep, current_user: CurrentUser, service_in: CarServiceCreate):
    service = CarService.model_validate(service_in, update={"owner_id": current_user.id})
    session.add(service)
    session.commit()
    session.refresh(service)
    return service


@router.put("/{id}", response_model=CarServicePublic)
def update_service(*, session: SessionDep, current_user: CurrentUser, id: int, service_in: CarServiceUpdate):
    service = session.get(CarService, id)
    if not service:
        raise HTTPException(status_code=404, detail="CarService not found")
    if not current_user.is_superuser and (service.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    update_dict = service_in.model_dump(exclude_unset=True)
    service.sqlmodel_update(update_dict)
    session.add(service)
    session.commit()
    session.refresh(service)
    return service


@router.delete("/{id}")
def delete_service(session: SessionDep, current_user: CurrentUser, id: int) -> Message:
    service = session.get(CarService, id)
    if not service:
        raise HTTPException(status_code=404, detail="CarService not found")
    if not current_user.is_superuser and (service.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")

    lifts = session.query(Lift).filter(Lift.carservice_id == id).all()
    for lift in lifts:
        session.query(Booking).filter(Booking.lift_id == lift.id).delete()
        session.delete(lift)

    session.delete(service)
    session.commit()
    return Message(message="Service deleted successfully")
