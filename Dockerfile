FROM python:3.12


WORKDIR /app/

COPY ./requirements.txt /app/requirements.txt


RUN pip install --no-cache-dir -r requirements.txt

ENV PYTHONPATH=/app

COPY ./app /app/app
COPY start.sh /app/

RUN chmod +x /app/start.sh
#CMD ["uvicorn", "app.main:app", "--proxy-headers", "--host", "0.0.0.0", "--port", "8000"]
CMD ["/app/start.sh"]
