#!/bin/bash

# Test transit chart rendering
# This should show natal on inner circle, transit on outer circle

curl -X POST http://localhost:3011/api/v1/chart/render/transit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-api-key" \
  -d '{
    "natal": {
      "planets": {
        "sun": {"lon": 85.83, "lat": 0.0, "retrograde": false},
        "moon": {"lon": 133.21, "lat": 5.12, "retrograde": false},
        "mercury": {"lon": 95.45, "lat": -2.3, "retrograde": true},
        "venus": {"lon": 110.20, "lat": 1.5, "retrograde": false}
      },
      "houses": [
        {"lon": 300.32}, {"lon": 330.15}, {"lon": 355.24},
        {"lon": 20.32}, {"lon": 45.15}, {"lon": 75.24},
        {"lon": 120.32}, {"lon": 150.15}, {"lon": 175.24},
        {"lon": 200.32}, {"lon": 225.15}, {"lon": 255.24}
      ]
    },
    "transit": {
      "planets": {
        "sun": {"lon": 115.20, "lat": 0.0, "retrograde": false},
        "moon": {"lon": 200.45, "lat": 4.8, "retrograde": false},
        "mercury": {"lon": 125.30, "lat": -1.5, "retrograde": false},
        "venus": {"lon": 140.50, "lat": 2.0, "retrograde": false}
      },
      "datetime": "2026-01-18T12:00:00Z"
    },
    "aspectSettings": {
      "natalToTransit": {
        "enabled": true,
        "orb": 3
      }
    },
    "renderOptions": {
      "width": 800,
      "height": 800,
      "format": "png"
    }
  }' \
  -o transit-test.json

# Check if request was successful
if [ $? -eq 0 ]; then
  echo "Request successful! Response saved to transit-test.json"

  # Extract and decode the image if jq is available
  if command -v jq &> /dev/null; then
    jq -r '.data.image' transit-test.json | base64 -d > transit-chart.png
    echo "Image saved to transit-chart.png"
  else
    echo "Install jq to automatically extract the image"
  fi
else
  echo "Request failed!"
fi
