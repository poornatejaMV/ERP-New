#!/bin/bash

# Activate virtual environment and run tests
cd "$(dirname "$0")"

if [ -d "venv" ]; then
    source venv/bin/activate
    echo "Running API tests..."
    python test_api.py
else
    echo "Error: Virtual environment not found. Please run setup first."
    exit 1
fi

