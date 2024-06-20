from datetime import timezone, datetime
from zoneinfo import ZoneInfo

from fastapi import HTTPException


def convert_to_timezone(time, target_timezone='Europe/Moscow'):
    target_tz = ZoneInfo(target_timezone)
    return time.replace(tzinfo=timezone.utc).astimezone(target_tz)


def validate_booking_times(time_from, time_to, target_timezone='Europe/Moscow'):
    if time_from > time_to:
        raise HTTPException(status_code=400, detail="Время конца должно быть больше времени начала")
    if time_from < datetime.now(ZoneInfo(target_timezone)):
        raise HTTPException(status_code=400, detail="Время начала не может быть в прошлом")


def check_existing_bookings(existing_bookings):
    booked_times = [
        (booking.time_from.strftime("%H:%M"), booking.time_to.strftime("%H:%M"))
        for booking in existing_bookings
    ]
    if booked_times:
        formatted_time = ";".join(f"С {time[0]} до {time[1]}" for time in booked_times)
        raise HTTPException(status_code=400, detail=f"Пост уже занят в это число в это время {formatted_time}")