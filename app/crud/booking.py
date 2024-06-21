from datetime import date, timedelta

from sqlmodel import Session, select

from app.api.deps import SessionDep, CurrentUser
from app.models import Booking, BookingCreate, Services, CarService, Lift, BookingServices


def create_booking(*, session: Session, booking_create: BookingCreate):
    db_booking = Booking(**booking_create.dict())
    session.add(db_booking)
    session.commit()
    session.refresh(db_booking)
    return db_booking

def get_booking_time(*, session: Session, booking_id: int):
    current_date = date.today()

    tomorrow = current_date + timedelta(days=1)

    statement = select(Booking).where(Booking.time_from.date() == tomorrow)
    bookings = session.exec(statement).all()
    return bookings

def get_bookings(session: SessionDep, current_user: CurrentUser, user_id: int = None):
    statement = (
        select(Booking, Services, CarService, Lift)
        .join(BookingServices, BookingServices.booking_id == Booking.id)
        .join(Services, Services.id == BookingServices.service_id)
        .join(Lift, Lift.id == Booking.lift_id)
        .join(CarService, CarService.id == Lift.carservice_id)
    )
    if user_id is not None:
        statement = statement.where(Booking.owner_id == user_id)
    results = session.exec(statement).all()

    bookings_with_services = {}
    for booking, service, carservice, lift in results:
        if booking.id not in bookings_with_services:
            bookings_with_services[booking.id] = {
                "booking": booking,
                "services": [],
                "carServiceName": carservice.name,
                "liftName": lift.name
            }
        bookings_with_services[booking.id]["services"].append(service)

    bookings_list = list(bookings_with_services.values())

    return bookings_list