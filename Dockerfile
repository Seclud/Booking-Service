FROM python:3.12

WORKDIR /app/

# Copy requirements and install dependencies
COPY ./requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

ENV PYTHONPATH=/app

# Copy application code
COPY ./app /app/app

# Copy and setup start script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Use exec form for CMD to ensure proper signal handling
CMD ["/bin/bash", "/app/start.sh"]
