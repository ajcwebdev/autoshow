#!/bin/bash
# test-local.sh

set -e

echo "Starting comprehensive local tests..."

# Ensure development environment is loaded
export ENV_FILE=.env.development

# Start development server in background
npm run dev &
SERVER_PID=$!
sleep 5

# Run database tests
echo "Testing database operations..."
npm run db:shell -- --query "SELECT COUNT(*) FROM show_notes" | grep -q "1"
if [ $? -eq 0 ]; then
  echo "✓ Database seed data verified"
else
  echo "✗ Database seed data missing"
  kill $SERVER_PID
  exit 1
fi

# Test API endpoints
echo "Testing API endpoints..."
if curl -s http://localhost:4321/api/show-notes | grep -q "Test Show Note"; then
  echo "✓ GET /api/show-notes working"
else
  echo "✗ GET /api/show-notes failed"
  kill $SERVER_PID
  exit 1
fi

# Test specific show note
if curl -s http://localhost:4321/api/show-notes/1 | grep -q "Test Show Note"; then
  echo "✓ GET /api/show-notes/:id working"
else
  echo "✗ GET /api/show-notes/:id failed"
  kill $SERVER_PID
  exit 1
fi

# Test error handling
if curl -s http://localhost:4321/api/show-notes/999 | grep -q "not found"; then
  echo "✓ Error handling for non-existent records working"
else
  echo "✗ Error handling for non-existent records failed"
  kill $SERVER_PID
  exit 1
fi

# Cleanup
kill $SERVER_PID
echo "All tests completed successfully!"