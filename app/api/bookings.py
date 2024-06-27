from datetime import datetime
from typing import List
from zoneinfo import ZoneInfo

from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import select, and_, delete

from app.api.deps import CurrentUser, SessionDep, get_current_active_superuser
from app.core.celery_utils import send_booking_reminder
from app.crud.booking import get_bookings
from app.crud.lift import get_lift
from app.models import Booking, BookingCreate, BookingUpdate, Message, Services, BookingServices
from app.utils.booking_utils import convert_to_timezone, check_existing_bookings

router = APIRouter()


@router.get("/admin/all", dependencies=[Depends(get_current_active_superuser)])
def read_all_bookings(session: SessionDep, current_user: CurrentUser):
    return get_bookings(session, current_user)


@router.get("/admin/{user_id}", dependencies=[Depends(get_current_active_superuser)])
def read_bookings(session: SessionDep, user_id: int, current_user: CurrentUser):
    statement = select(Booking).where(Booking.owner_id == user_id)
    bookings = session.exec(statement).all()
    return bookings


@router.get("/my/all")
def read_my_bookings(session: SessionDep, current_user: CurrentUser):
    return get_bookings(session, current_user, user_id=current_user.id)


@router.post("/")
def create_booking(session: SessionDep, booking: BookingCreate, current_user: CurrentUser, service_ids: List[int]):
    if not service_ids:
        raise HTTPException(status_code=400, detail="Услуги не выбраны, выберите хотя бы одну услугу")

    time_from_aware = convert_to_timezone(booking.time_from, 'Asia/Yekaterinburg')
    time_to_aware = convert_to_timezone(booking.time_to, 'Asia/Yekaterinburg')

    if time_from_aware > time_to_aware:
        raise HTTPException(status_code=400, detail="Время конца должно быть больше времени начала")
    if time_from_aware < datetime.now(ZoneInfo('Asia/Yekaterinburg')):
        raise HTTPException(status_code=400, detail="Время начала не может быть в прошлом")

    lift = get_lift(session, booking.lift_id)
    if not lift:
        raise HTTPException(status_code=404, detail="Пост не найден")

    statement = select(Booking).where(
        and_(
            Booking.lift_id == booking.lift_id,
            Booking.time_from < booking.time_to,
            Booking.time_to > booking.time_from,
            Booking.status != "canceled"
        )
    )
    existing_bookings = session.exec(statement).all()

    check_existing_bookings(existing_bookings)

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


@router.put("/{id}")
def update_booking(session: SessionDep, id: int, booking: BookingUpdate, current_user: CurrentUser,
                   service_ids: List[int]):
    if not service_ids:
        raise HTTPException(status_code=400, detail="Услуги не выбраны, выберите хотя бы одну услугу")

    db_booking = session.get(Booking, id)
    if not db_booking:
        raise HTTPException(status_code=404, detail="Запись не найдена")

    if current_user.id != db_booking.owner_id and not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Вы не можете редактировать чужие записи")

    time_from_aware = convert_to_timezone(booking.time_from, 'Asia/Yekaterinburg')
    time_to_aware = convert_to_timezone(booking.time_to, 'Asia/Yekaterinburg')

    if time_from_aware > time_to_aware:
        raise HTTPException(status_code=400, detail="Время конца должно быть больше времени начала")
    if time_from_aware < datetime.now(ZoneInfo('Asia/Yekaterinburg')) and not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Время начала не может быть в прошлом")

    update_data = booking.model_dump(exclude_unset=True)
    db_booking.sqlmodel_update(update_data, update={"time_from": time_from_aware, "time_to": time_to_aware})
    session.add(db_booking)

    statement = select(Booking).where(
        and_(
            Booking.id != id,
            Booking.lift_id == db_booking.lift_id,
            Booking.time_from < booking.time_to,
            Booking.time_to > booking.time_from,
            Booking.status != "canceled"
        )
    )
    existing_bookings = session.exec(statement).all()

    check_existing_bookings(existing_bookings)

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
        raise HTTPException(status_code=404, detail="Запись не найдена")
    if not current_user.is_superuser and (booking.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="Недостаточно прав")

    session.execute(delete(BookingServices).where(BookingServices.booking_id == id))

    session.delete(booking)
    session.commit()
    return Message(message="Запись отменена")


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
