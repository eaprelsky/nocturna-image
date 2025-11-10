# Nocturna Chart Service - API Documentation

## Base URL

```
http://localhost:3000/api/v1
```

## Authentication

All chart rendering endpoints require authentication using an API key:

```
Authorization: Bearer YOUR_API_KEY
```

## Endpoints

### 1. Render Natal Chart

Generate a natal chart image.

**Endpoint:** `POST /api/v1/chart/render`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY
```

**Request Body:**
```json
{
  "planets": {
    "sun": { "lon": 85.83, "lat": 0.0 },
    "moon": { "lon": 133.21, "lat": 5.12 },
    "mercury": { "lon": 95.45, "lat": -2.3 },
    "venus": { "lon": 110.20, "lat": 1.5 },
    "mars": { "lon": 45.30, "lat": -0.8 },
    "jupiter": { "lon": 200.15, "lat": 0.5 },
    "saturn": { "lon": 290.45, "lat": 2.1 },
    "uranus": { "lon": 15.60, "lat": -0.3 },
    "neptune": { "lon": 325.80, "lat": 1.2 },
    "pluto": { "lon": 270.25, "lat": 15.0 }
  },
  "houses": [
    { "lon": 300.32 },
    { "lon": 330.15 },
    { "lon": 355.24 },
    { "lon": 20.32 },
    { "lon": 45.15 },
    { "lon": 75.24 },
    { "lon": 120.32 },
    { "lon": 150.15 },
    { "lon": 175.24 },
    { "lon": 200.32 },
    { "lon": 225.15 },
    { "lon": 255.24 }
  ],
  "aspectSettings": {
    "enabled": true,
    "orb": 6,
    "types": {
      "conjunction": { "enabled": true },
      "opposition": { "enabled": true },
      "trine": { "enabled": true },
      "square": { "enabled": true },
      "sextile": { "enabled": true }
    }
  },
  "renderOptions": {
    "format": "png",
    "width": 800,
    "height": 800,
    "quality": 90,
    "theme": "light"
  }
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "image": "base64_encoded_image_data",
    "format": "png",
    "size": 245678,
    "dimensions": {
      "width": 800,
      "height": 800
    },
    "generatedAt": "2025-11-09T12:34:56Z"
  },
  "meta": {
    "renderTime": 1250,
    "version": "1.0.0"
  }
}
```

**Error Response (400/401/429/500):**
```json
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid planet longitude",
    "details": {
      "errors": [
        {
          "field": "planets.sun.lon",
          "message": "Number must be less than or equal to 360"
        }
      ]
    }
  }
}
```

### 2. Render Transit Chart

Generate a transit chart with natal and current transit positions.

**Endpoint:** `POST /api/v1/chart/render/transit`

**Request Body:**
```json
{
  "natal": {
    "planets": { /* ... */ },
    "houses": [ /* ... */ ]
  },
  "transit": {
    "planets": { /* ... */ },
    "datetime": "2025-11-09T12:00:00Z"
  },
  "aspectSettings": {
    "natal": {
      "enabled": true,
      "orb": 6
    },
    "transit": {
      "enabled": false,
      "orb": 6
    },
    "natalToTransit": {
      "enabled": true,
      "orb": 3
    }
  },
  "renderOptions": {
    "format": "png",
    "width": 1000,
    "height": 1000
  }
}
```

**Response:** Similar to natal chart with additional `chartInfo`:
```json
{
  "status": "success",
  "data": {
    "image": "...",
    "chartInfo": {
      "type": "transit",
      "transitDatetime": "2025-11-09T12:00:00Z",
      "aspectsFound": {
        "natalToTransit": 8,
        "natal": 12,
        "transit": 0
      }
    }
  }
}
```

### 3. Render Synastry Chart

Generate a synastry chart comparing two people's natal charts.

**Endpoint:** `POST /api/v1/chart/render/synastry`

**Request Body:**
```json
{
  "person1": {
    "name": "John",
    "planets": { /* ... */ },
    "houses": [ /* ... */ ]
  },
  "person2": {
    "name": "Jane",
    "planets": { /* ... */ },
    "houses": [ /* ... */ ]
  },
  "synastrySettings": {
    "useHousesFrom": "person1",
    "aspectSettings": {
      "person1": { "enabled": true, "orb": 6 },
      "person2": { "enabled": false, "orb": 6 },
      "interaspects": { "enabled": true, "orb": 6 }
    }
  },
  "renderOptions": {
    "format": "png",
    "width": 1000,
    "height": 1000
  }
}
```

### 4. Health Check

Check service health status.

**Endpoint:** `GET /health`

**Response (200 OK):**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 3600,
  "timestamp": "2025-11-09T12:34:56Z",
  "checks": {
    "browser": "ok",
    "memory": {
      "usage": 123456789,
      "limit": 536870912
    }
  }
}
```

### 5. Metrics

Prometheus-compatible metrics endpoint.

**Endpoint:** `GET /metrics`

**Response (200 OK):**
```
# HELP chart_renders_total Total number of chart renders
# TYPE chart_renders_total counter
chart_renders_total{type="natal",status="success"} 1234

# HELP chart_render_duration_seconds Chart rendering duration
# TYPE chart_render_duration_seconds histogram
chart_render_duration_seconds_bucket{type="natal",le="1"} 850
chart_render_duration_seconds_bucket{type="natal",le="3"} 1200
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `AUTHENTICATION_ERROR` | 401 | Missing or invalid API key |
| `NOT_FOUND` | 404 | Endpoint not found |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `RENDER_ERROR` | 500 | Chart rendering failed |
| `TIMEOUT_ERROR` | 504 | Rendering timed out |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

## Rate Limiting

- **Window:** 60 seconds
- **Max Requests:** 100 per window per API key
- **Headers:** 
  - `X-RateLimit-Limit`: Max requests per window
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Window reset time
  - `Retry-After`: Seconds until retry (on 429)

## Request Validation

### Planet Coordinates
- `lon` (longitude): 0.0 - 360.0 (required)
- `lat` (latitude): -90.0 - 90.0 (optional, default: 0.0)

### Houses
- Must provide exactly 12 house cusps
- Each with `lon` value between 0.0 - 360.0

### Render Options
- `format`: `png`, `svg`, or `jpeg`
- `width`: 400 - 2000 pixels
- `height`: 400 - 2000 pixels
- `quality`: 1 - 100 (for PNG/JPEG)
- `theme`: `light` or `dark`

## cURL Examples

### Natal Chart
```bash
curl -X POST http://localhost:3000/api/v1/chart/render \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d @natal-chart-request.json
```

### Transit Chart
```bash
curl -X POST http://localhost:3000/api/v1/chart/render/transit \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d @transit-chart-request.json
```

### Synastry Chart
```bash
curl -X POST http://localhost:3000/api/v1/chart/render/synastry \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d @synastry-chart-request.json
```

## Integration

For Python integration examples, see the client implementation in the requirements document (`nocturna-image-req.md`).

