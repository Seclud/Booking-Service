from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep, get_current_active_superuser
from app.models import CarService, CarServiceCreate, CarServicePublic, CarServicesPublic, CarServiceUpdate, Message, \
    Lift, Booking, BookingServices

router = APIRouter()


@router.get("/", response_model=CarServicesPublic)
def read_services(session: SessionDep, skip: int = 0, limit: int = 100):
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
        raise HTTPException(status_code=404, detail="Автосервис не найден")
    return service


@router.post("/", response_model=CarServicePublic, dependencies=[Depends(get_current_active_superuser)])
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
        raise HTTPException(status_code=404, detail="Автосервис не найден")
    if not current_user.is_superuser and (service.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Недостаточно прав")

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
        raise HTTPException(status_code=404, detail="Автосервис не найден")
    if not current_user.is_superuser and (service.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Недостаточно прав")

    lifts = session.query(Lift).filter(Lift.carservice_id == id).all()
    for lift in lifts:

        bookings = session.query(Booking).filter(Booking.lift_id == lift.id).all()
        for booking in bookings:
            session.query(BookingServices).filter(BookingServices.booking_id == booking.id).delete()

        session.query(Booking).filter(Booking.lift_id == lift.id).delete()

        session.delete(lift)

    session.delete(service)
    session.commit()
    return Message(message="Автосервис удалён успешно")
