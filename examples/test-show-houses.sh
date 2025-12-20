#!/bin/bash

# Test script for showHouses feature
# This script tests the house display toggle functionality

API_URL="${API_URL:-http://localhost:3000}"
API_KEY="${API_KEY:-dev-test-key}"

echo "Testing showHouses feature..."
echo "API URL: $API_URL"
echo ""

# Test 1: Natal chart WITH houses (default)
echo "========================================="
echo "Test 1: Natal chart WITH houses (showHouses: true)"
echo "========================================="
curl -X POST "$API_URL/api/v1/chart/render" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d @examples/chart-without-houses.json \
  -o /tmp/chart-with-houses.png \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

if [ -f /tmp/chart-with-houses.png ]; then
  FILE_SIZE=$(wc -c < /tmp/chart-with-houses.png)
  echo "Chart saved to /tmp/chart-with-houses.png (${FILE_SIZE} bytes)"
else
  echo "ERROR: Chart file was not created"
fi

echo ""

# Test 2: Natal chart WITHOUT houses (showHouses: false)
echo "========================================="
echo "Test 2: Natal chart WITHOUT houses (showHouses: false)"
echo "========================================="
curl -X POST "$API_URL/api/v1/chart/render" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "planets": {
      "sun": { "lon": 85.83, "lat": 0.0, "retrograde": false },
      "moon": { "lon": 133.21, "lat": 5.12, "retrograde": false },
      "mercury": { "lon": 95.45, "lat": -2.3, "retrograde": true },
      "venus": { "lon": 110.20, "lat": 1.5, "retrograde": false },
      "mars": { "lon": 45.30, "lat": -0.8, "retrograde": false },
      "jupiter": { "lon": 200.15, "lat": 0.5, "retrograde": false },
      "saturn": { "lon": 290.45, "lat": 2.1, "retrograde": false },
      "uranus": { "lon": 15.60, "lat": -0.3, "retrograde": false },
      "neptune": { "lon": 325.80, "lat": 1.2, "retrograde": false },
      "pluto": { "lon": 270.25, "lat": 15.0, "retrograde": false }
    },
    "houses": [
      { "lon": 300.32 }, { "lon": 330.15 }, { "lon": 355.24 },
      { "lon": 20.32 }, { "lon": 45.15 }, { "lon": 75.24 },
      { "lon": 120.32 }, { "lon": 150.15 }, { "lon": 175.24 },
      { "lon": 200.32 }, { "lon": 225.15 }, { "lon": 255.24 }
    ],
    "renderOptions": {
      "format": "png",
      "width": 800,
      "height": 800,
      "showHouses": false
    }
  }' \
  -o /tmp/chart-without-houses.png \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

if [ -f /tmp/chart-without-houses.png ]; then
  FILE_SIZE=$(wc -c < /tmp/chart-without-houses.png)
  echo "Chart saved to /tmp/chart-without-houses.png (${FILE_SIZE} bytes)"
else
  echo "ERROR: Chart file was not created"
fi

echo ""

# Test 3: Biwheel chart WITHOUT houses
echo "========================================="
echo "Test 3: Biwheel chart WITHOUT houses (showHouses: false)"
echo "========================================="
curl -X POST "$API_URL/api/v1/chart/render/biwheel" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d @examples/biwheel-without-houses.json \
  -o /tmp/biwheel-without-houses.png \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

if [ -f /tmp/biwheel-without-houses.png ]; then
  FILE_SIZE=$(wc -c < /tmp/biwheel-without-houses.png)
  echo "Chart saved to /tmp/biwheel-without-houses.png (${FILE_SIZE} bytes)"
else
  echo "ERROR: Chart file was not created"
fi

echo ""
echo "========================================="
echo "All tests completed!"
echo "========================================="
echo "Check the following files:"
echo "  - /tmp/chart-with-houses.png (WITH house lines)"
echo "  - /tmp/chart-without-houses.png (WITHOUT house lines)"
echo "  - /tmp/biwheel-without-houses.png (Biwheel WITHOUT house lines)"
echo ""

