#!/bin/bash
# test-local.sh

echo "Starting comprehensive local tests..."

# Start development server in background
npm run dev &
SERVER_PID=$!

# Wait for server to start
sleep 5

# Test database connectivity by executing a query
echo "Testing database connectivity..."
npx astro db shell --query "SELECT * FROM show_notes LIMIT 1;"

# Run API tests
echo "Testing API endpoints..."
curl http://localhost:4321/api/show-notes
curl http://localhost:4321/api/show-notes/1

# Test inserting data via API
echo "Testing POST endpoints..."
curl -X POST http://localhost:4321/api/download-audio \
  -H "Content-Type: application/json" \
  -d '{"type":"file","filePath":"test.wav"}'

# Execute a test script against the database
echo "Testing database operations..."
npx astro db execute test/db-operations.ts

# Stop development server
kill $SERVER_PID

echo "All tests completed"