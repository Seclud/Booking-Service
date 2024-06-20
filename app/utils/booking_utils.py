from datetime import timezone, datetime
from zoneinfo import ZoneInfo

from fastapi import HTTPException

target_timezone = 'Europe/Moscow'


def convert_to_timezone(time, target_timezone):
    target_tz = ZoneInfo(target_timezone)
    return time.replace(tzinfo=timezone.utc).astimezone(target_tz)


def check_existing_bookings(existing_bookings):
    booked_times = [
        (booking.time_from.strftime("%H:%M"), booking.time_to.strftime("%H:%M"))
        for booking in existing_bookings
    ]
    if booked_times:
        formatted_time = ";".join(f"С {time[0]} до {time[1]}" for time in booked_times)
        raise HTTPException(status_code=400, detail=f"Пост уже занят в это число в это время {formatted_time}")
