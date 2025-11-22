#!/bin/bash

# reset_db_and_seed.sh
# Kills backend, removes DB, recreates tables, and seeds demo data.

echo "🛑 Stopping running uvicorn processes..."
pkill -f uvicorn || true

echo "🗑️  Dropping existing tables..."
# rm -f sql_app.db # No longer just deleting file, supporting Postgres
source venv/bin/activate
python drop_tables.py

echo "🏗️  Creating Test Users..."
python create_test_users.py

echo "🌱 Seeding Demo Data (Company, Items, Customers)..."
python create_demo_data.py

echo "✅ Database reset and seeded successfully!"
echo "🚀 You can now start the server with: ./start_with_venv.sh"

