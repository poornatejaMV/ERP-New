#!/bin/bash

# ERP System Docker Quick Start Script

echo "🚀 Starting ERP System with Docker..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Start services
echo "📦 Starting containers..."
docker-compose up -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Check if database needs initialization
echo "🔍 Checking database..."
if ! docker-compose exec -T postgres psql -U erp_user -d erp_db -c "SELECT 1" > /dev/null 2>&1; then
    echo "📊 Initializing database..."
    docker-compose exec backend python create_demo_data.py
else
    echo "✅ Database already initialized"
fi

echo ""
echo "✅ ERP System is running!"
echo ""
echo "📍 Access points:"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:8000"
echo "   API Docs:  http://localhost:8000/docs"
echo ""
echo "👤 Default credentials:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "To stop the system, run: docker-compose down"





