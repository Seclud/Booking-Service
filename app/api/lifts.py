from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import select

from app.api.deps import CurrentUser, SessionDep, get_current_active_superuser
from app.models import Lift, LiftCreate, LiftUpdate, Message, Booking, BookingServices

router = APIRouter()


@router.get("/{carservice_id}")
def read_lifts(session: SessionDep, carservice_id: int, current_user: CurrentUser):
    statement = select(Lift).where(Lift.carservice_id == carservice_id)
    lifts = session.exec(statement).all()
    return lifts


@router.post("/")
def create_lift(session: SessionDep, lift: LiftCreate, current_user: CurrentUser):
    db_lift = Lift(**lift.dict())
    session.add(db_lift)
    session.commit()
    session.refresh(db_lift)
    return db_lift


@router.put("/{id}", dependencies=[Depends(get_current_active_superuser)])
def update_lift(session: SessionDep, id: int, lift: LiftUpdate, current_user: CurrentUser):
    db_lift = session.get(Lift, id)
    for key, value in lift.dict().items():
        setattr(db_lift, key, value)
    session.commit()
    session.refresh(db_lift)
    return db_lift

@router.delete("/{id}")
def delete_lift(session: SessionDep, id: int, current_user: CurrentUser):
    lift = session.get(Lift, id)
    if not lift:
        raise HTTPException(status_code=404, detail="Пост не найден")
    if not current_user.is_superuser and (lift.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    bookings = session.exec(select(Booking).where(Booking.lift_id == id)).all()
    for booking in bookings:
        booking_services = session.exec(select(BookingServices).where(BookingServices.booking_id == booking.id)).all()
        for booking_service in booking_services:
            session.delete(booking_service)

        session.delete(booking)

    session.delete(lift)
    session.commit()
    return Message(message="Lift removed")