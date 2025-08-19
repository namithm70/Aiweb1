#!/bin/bash

# Start script for Render deployment
cd /app
python -m uvicorn gemini_main:app --host 0.0.0.0 --port 8000
