from typing import List

import redis.asyncio as redis
from fastapi import APIRouter, HTTPException, Depends
from fastapi_cache import FastAPICache
from sqlmodel import select, and_, delete

from app.api.deps import CurrentUser, SessionDep, get_current_active_superuser
from app.core.config import settings
from app.models import Booking, BookingCreate, BookingUpdate, Message, Services, BookingServices
from app.crud.lift import get_lift
from app.core.celery_utils import send_booking_reminder

from fastapi_cache.decorator import cache

router = APIRouter()


@router.get("/admin/all", dependencies=[Depends(get_current_active_superuser)])
def read_all_bookings(session: SessionDep, current_user: CurrentUser):
    statement = (
        select(Booking, Services)
        .join(BookingServices, BookingServices.booking_id == Booking.id)
        .join(Services, Services.id == BookingServices.service_id)
    )
    results = session.exec(statement).all()

    bookings_with_services = {}
    for booking, service in results:
        if booking.id not in bookings_with_services:
            bookings_with_services[booking.id] = {
                "booking": booking,
                "services": []
            }
        bookings_with_services[booking.id]["services"].append(service)

    bookings_list = list(bookings_with_services.values())

    return bookings_list


@router.get("/admin/{user_id}", dependencies=[Depends(get_current_active_superuser)])
def read_bookings(session: SessionDep, user_id: int, current_user: CurrentUser):
    statement = select(Booking).where(Booking.owner_id == user_id)
    bookings = session.exec(statement).all()
    return bookings


@router.get("/my/all")
def read_my_bookings(session: SessionDep, current_user: CurrentUser):
    statement = (
        select(Booking, Services)
        .join(BookingServices, BookingServices.booking_id == Booking.id)
        .join(Services, Services.id == BookingServices.service_id)
        .where(Booking.owner_id == current_user.id)
    )
    results = session.exec(statement).all()

    bookings_with_services = {}
    for booking, service in results:
        if booking.id not in bookings_with_services:
            bookings_with_services[booking.id] = {
                "booking": booking,
                "services": []
            }
        bookings_with_services[booking.id]["services"].append(service)

    bookings_list = list(bookings_with_services.values())

    return bookings_list


@router.post("/")
def create_booking(session: SessionDep, booking: BookingCreate, current_user: CurrentUser, service_ids: List[int]):
    if not service_ids:
        raise HTTPException(status_code=400, detail="Услуги не выбраны, выберите хотя бы одну услугу")

    if booking.time_from > booking.time_to:
        raise HTTPException(status_code=400, detail="Время конца должно быть больше времени начала")

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
    booked_times = []

    for existing_booking in existing_bookings:
        formatted_time_from = existing_booking.time_from.strftime("%H:%M")
        formatted_time_to = existing_booking.time_to.strftime("%H:%M")
        booked_times.append((formatted_time_from, formatted_time_to))
    formatted_time = ";".join(f"С {time[0]} до {time[1]}" for time in booked_times)

    if existing_bookings:
        raise HTTPException(status_code=400, detail=f"Подъемник уже занят в это число в это время {formatted_time}")

    db_booking = Booking.model_validate(booking.model_dump(), update={"owner_id": current_user.id})
    session.add(db_booking)
    session.commit()
    session.refresh(db_booking)

    for service_id in service_ids:
        booking_service = BookingServices(booking_id=db_booking.id, service_id=service_id)
        session.add(booking_service)
    session.commit()

    send_booking_reminder.delay()

    return db_booking


@router.put("/{id}", dependencies=[Depends(get_current_active_superuser)])
def update_booking(session: SessionDep, id: int, booking: BookingUpdate, current_user: CurrentUser,
                   service_ids: List[int]):
    db_booking = session.get(Booking, id)
    for key, value in booking.dict().items():
        setattr(db_booking, key, value)
    session.add(db_booking)

    statement = select(Booking).where(
        and_(
            Booking.id != id,
            Booking.lift_id == db_booking.lift_id,
            Booking.time_from < booking.time_to,
            Booking.time_to > booking.time_from
        )
    )
    existing_bookings = session.exec(statement).all()
    booked_times = []

    for existing_booking in existing_bookings:
        formatted_time_from = existing_booking.time_from.strftime("%H:%M")
        formatted_time_to = existing_booking.time_to.strftime("%H:%M")
        booked_times.append((formatted_time_from, formatted_time_to))
    formatted_time = ";".join(f"С {time[0]} до {time[1]}" for time in booked_times)

    if existing_bookings:
        raise HTTPException(status_code=400, detail=f"Подъемник уже занят в этот день {formatted_time}")

    current_service_ids = set(
        session.exec(select(BookingServices.service_id).where(BookingServices.booking_id == id)).all())

    new_service_ids = set(service_ids)
    services_to_add = new_service_ids - current_service_ids
    services_to_remove = current_service_ids - new_service_ids

    for service_id in services_to_remove:
        session.execute(
            delete(BookingServices).where(BookingServices.booking_id == id, BookingServices.service_id == service_id))

    for service_id in services_to_add:
        new_booking_service = BookingServices(booking_id=id, service_id=service_id)
        session.add(new_booking_service)

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

    session.execute(delete(BookingServices).where(BookingServices.booking_id == id))

    session.delete(booking)
    session.commit()
    return Message(message="Booking canceled")


@router.get("/{id}")
def get_booking_by_id(session: SessionDep, current_user: CurrentUser, id: int, ):
    statement = (
        select(Booking, Services)
        .join(BookingServices, BookingServices.booking_id == Booking.id)
        .join(Services, Services.id == BookingServices.service_id)
        .where(Booking.id == id)
    )

    results = session.exec(statement).all()

    bookings_with_services = {}
    for booking, service in results:
        if booking.id not in bookings_with_services:
            bookings_with_services[booking.id] = {
                "booking": booking,
                "services": []
            }
        bookings_with_services[booking.id]["services"].append(service)

    bookings_list = list(bookings_with_services.values())

    return bookings_list
