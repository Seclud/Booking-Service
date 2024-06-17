#!/bin/bash
echo "PYTHONPATH: $PYTHONPATH"
# Run initial data script
python /app/app/initial_data.py
# Start the application
exec uvicorn app.main:app --proxy-headers --host 0.0.0.0 --port 8000