from celery import Celery
import smtplib
from email.mime.text import MIMEText
from sqlmodel import select, Session, func
from app.api.deps import SessionDep
from datetime import timedelta, date
from celery.schedules import crontab
from app.models import Booking, CarService, Lift
from .database import engine
from .config import settings

app = Celery('tasks', broker=f'pyamqp://{settings.RABBIT_USER}:{settings.RABBIT_PASSWORD}@{settings.RABBIT_HOST}:{settings.RABBIT_PORT}//')


@app.task
def send_email(email_data):
    from_name = "Booking Service" 
    from_email = settings.SMTP_USER 
    msg = MIMEText(email_data["body"])
    msg["Subject"] = email_data["subject"]
    msg["From"] = f"{from_name} <{from_email}>"
    msg["To"] = email_data["to"]

    try:
        s = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT)
        s.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        s.sendmail(from_email, msg["To"], msg.as_string())
        s.quit()
        return "Email sent successfully"
    except Exception as e:
        return f"failed to send email: {str(e)}"


@app.task(name="send_booking_reminder")
def send_booking_reminder():
    with Session(engine) as session:
        current_date = date.today()
        tomorrow = current_date + timedelta(days=1)

        statement = (
            select(Booking, CarService)
            .join(Lift, Lift.id == Booking.lift_id)
            .join(CarService, CarService.id == Lift.carservice_id)
            .where(func.date(Booking.time_from) == tomorrow)
        )
        results = session.exec(statement).all()

        for booking, car_service in results:
            formatted_time = booking.time_from.strftime("%H:%M")
            email_data = {
                "subject": "Напоминание о записи",
                "body": f"У вас запланирована запись на завтра в {formatted_time} в сервисе {car_service.name}",
                "to": booking.owner.email
                #"to": "tihegr@rambler.ru"
            }
            send_email.delay(email_data)

app.conf.beat_schedule = {
    'send-booking-reminder-every-day': {
        'task': 'send_booking_reminder',
        'schedule': crontab(hour="12"),
    },
}
app.conf.timezone = 'Europe/Moscow'
