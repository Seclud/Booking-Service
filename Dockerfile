FROM python:3.12

# Set the working directory in the container to /app
WORKDIR /app/

COPY ./requirements.txt /app/requirements.txt

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Add the current directory contents into the container at /app
COPY ./app /app/app
COPY prestart.sh /app/prestart.sh

# Make the entrypoint script executable
RUN chmod +x /app/prestart.sh

# Run app.py when the container launches
CMD ["uvicorn", "app.main:app", "--proxy-headers", "--host", "0.0.0.0", "--port", "8000"]

# Set the entrypoint script
ENTRYPOINT ["/app/prestart.sh"]