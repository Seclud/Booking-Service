from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import select, and_

from app.api.deps import CurrentUser, SessionDep, get_current_active_superuser
from app.models import Booking, BookingCreate, BookingUpdate, Message
from app.crud.lift import get_lift
from app.core.celery_utils import send_booking_reminder

from fastapi_cache.decorator import cache

router = APIRouter()


@router.get("/admin/all", dependencies=[Depends(get_current_active_superuser)])
@cache(expire=60)
def read_all_bookings(session: SessionDep, current_user: CurrentUser):
    statement = select(Booking)
    bookings = session.exec(statement).all()
    return bookings


@router.get("/admin/{user_id}", dependencies=[Depends(get_current_active_superuser)])
@cache(expire=60)
def read_bookings(session: SessionDep, user_id: int, current_user: CurrentUser):
    statement = select(Booking).where(Booking.owner_id == user_id)
    bookings = session.exec(statement).all()
    return bookings

@router.get("/my/all")
@cache(expire=60)
def read_my_bookings(session: SessionDep, current_user: CurrentUser):
    statement = select(Booking).where(Booking.owner_id == current_user.id)
    bookings = session.exec(statement).all()
    return bookings


@router.post("/")
def create_booking(session: SessionDep, booking: BookingCreate, current_user: CurrentUser):
    lift = get_lift(session, booking.lift_id)
    if not lift:
        raise HTTPException(status_code=404, detail="Lift not found")

    statement = select(Booking).where(
        and_(
            Booking.lift_id == booking.lift_id,
            Booking.time_from < booking.time_to,
            Booking.time_to > booking.time_from
        )
    )

    existing_bookings = session.exec(statement).all()
    if existing_bookings:
        raise HTTPException(status_code=400, detail="The lift is already booked for the requested time")

    db_booking = Booking.model_validate(booking.model_dump(), update={"owner_id": current_user.id})
    session.add(db_booking)
    session.commit()
    session.refresh(db_booking)
    send_booking_reminder.delay()
    return db_booking

#Нужно добавить модель сервисов и у них время длительности duration:int
# def create_booking(session: SessionDep, booking: BookingCreate, current_user: CurrentUser, service_ids: List[int]):
#     # Calculate the total duration of the selected services
#     services = session.exec(select(CarService).where(CarService.id.in_(service_ids))).all()
#     total_duration = sum(service.duration for service in services)
#
#     # Assuming booking.time_from is provided by the user
#     time_from = booking.time_from
#     time_to = time_from + timedelta(minutes=total_duration)
#
#     # Check for existing bookings in the calculated time slot
#     statement = select(Booking).where(
#         and_(
#             Booking.lift_id == booking.lift_id,
#             Booking.time_from < time_to,
#             Booking.time_to > time_from
#         )
#     )
#     existing_bookings = session.exec(statement).all()
#     if existing_bookings:
#         raise HTTPException(status_code=400, detail="The lift is already booked for the requested time")
#
#     # Create the booking with calculated time_to
#     db_booking = Booking.model_validate(booking.model_dump(), update={"owner_id": current_user.id, "time_to": time_to})
#     session.add(db_booking)
#     session.commit()
#     session.refresh(db_booking)
#     send_booking_reminder.delay()
#     return db_booking


@router.put("/{id}", dependencies=[Depends(get_current_active_superuser)])
def update_booking(session: SessionDep, id: int, booking: BookingUpdate, current_user: CurrentUser):
    db_booking = session.get(Booking, id)
    for key, value in booking.dict().items():
        setattr(db_booking, key, value)
    session.commit()
    session.refresh(db_booking)
    return db_booking


@router.delete("/{id}")
def cancel_booking(session: SessionDep, id: int, current_user: CurrentUser):
    booking = session.get(Booking, id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if not current_user.is_superuser and (booking.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    session.delete(booking)
    session.commit()
    return Message(message="Booking canceled")
