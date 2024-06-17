from typing import Any
from sqlmodel import Session, select
from app.models import Booking, BookingCreate, BookingUpdate
from datetime import date, timedelta

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