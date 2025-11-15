# Nocturna Chart Rendering Service - Requirements

## Overview

Microservice for rendering astrological natal charts as images, designed to integrate with Nocturna Telegram Bot.

**Repository:** TBD (separate project: `nocturna-chart-service`)  
**Base Library:** [nocturna-wheel](https://github.com/eaprelsky/nocturna-wheel)  
**Architecture:** Stateless microservice with REST API  
**Technology:** Node.js + Puppeteer/Playwright + Express.js

---

## 1. API Contract

### 1.1 Render Chart Endpoint

**Endpoint:** `POST /api/v1/chart/render`

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
    { "lon": 300.32 },  // 1st house cusp (Ascendant)
    { "lon": 330.15 },  // 2nd house cusp
    { "lon": 355.24 },  // 3rd house cusp
    { "lon": 20.32 },   // 4th house cusp (IC)
    { "lon": 45.15 },   // 5th house cusp
    { "lon": 75.24 },   // 6th house cusp
    { "lon": 120.32 },  // 7th house cusp (Descendant)
    { "lon": 150.15 },  // 8th house cusp
    { "lon": 175.24 },  // 9th house cusp
    { "lon": 200.32 },  // 10th house cusp (MC)
    { "lon": 225.15 },  // 11th house cusp
    { "lon": 255.24 }   // 12th house cusp
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
    "format": "png",        // "png", "svg", "jpeg"
    "width": 800,
    "height": 800,
    "quality": 90,          // 1-100 for JPEG/PNG
    "theme": "light"        // "light" or "dark"
  }
}
```

**Response (Success - 200 OK):**
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

**Response (Error - 4xx/5xx):**
```json
{
  "status": "error",
  "error": {
    "code": "INVALID_DATA",
    "message": "Invalid planet longitude",
    "details": {
      "field": "planets.sun.lon",
      "value": 400,
      "expected": "0-360"
    }
  }
}
```

### 1.2 Render Transit Chart Endpoint

**Endpoint:** `POST /api/v1/chart/render/transit`

**Description:** Renders a natal chart with current transits overlaid. Shows natal planets in the inner circle and transit planets in the outer circle, with aspects between them.

**Request Body:**
```json
{
  "natal": {
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
      { "lon": 300.32 }, { "lon": 330.15 }, { "lon": 355.24 },
      { "lon": 20.32 }, { "lon": 45.15 }, { "lon": 75.24 },
      { "lon": 120.32 }, { "lon": 150.15 }, { "lon": 175.24 },
      { "lon": 200.32 }, { "lon": 225.15 }, { "lon": 255.24 }
    ]
  },
  "transit": {
    "planets": {
      "sun": { "lon": 290.15, "lat": 0.0 },
      "moon": { "lon": 45.67, "lat": 4.8 },
      "mercury": { "lon": 275.30, "lat": -1.5 },
      "venus": { "lon": 310.45, "lat": 2.1 },
      "mars": { "lon": 180.20, "lat": -1.2 },
      "jupiter": { "lon": 65.80, "lat": 0.8 },
      "saturn": { "lon": 350.90, "lat": 2.5 },
      "uranus": { "lon": 25.40, "lat": -0.5 },
      "neptune": { "lon": 330.10, "lat": 1.0 },
      "pluto": { "lon": 275.60, "lat": 16.2 }
    },
    "datetime": "2025-11-09T12:00:00Z"  // Optional: for display
  },
  "aspectSettings": {
    "natal": {
      "enabled": true,  // Aspects between natal planets
      "orb": 6
    },
    "transit": {
      "enabled": true,  // Aspects between transit planets
      "orb": 6
    },
    "natalToTransit": {
      "enabled": true,  // Aspects between natal and transit (main focus)
      "orb": 3,         // Tighter orb for transit aspects
      "types": {
        "conjunction": { "enabled": true },
        "opposition": { "enabled": true },
        "trine": { "enabled": true },
        "square": { "enabled": true },
        "sextile": { "enabled": true }
      }
    }
  },
  "renderOptions": {
    "format": "png",
    "width": 1000,      // Larger for double chart
    "height": 1000,
    "quality": 90,
    "theme": "light",
    "showLabels": {
      "natal": true,
      "transit": true,
      "datetime": true  // Show transit date/time
    }
  }
}
```

**Response (Success - 200 OK):**
```json
{
  "status": "success",
  "data": {
    "image": "base64_encoded_image_data",
    "format": "png",
    "size": 389456,
    "dimensions": {
      "width": 1000,
      "height": 1000
    },
    "generatedAt": "2025-11-09T12:34:56Z",
    "chartInfo": {
      "type": "transit",
      "transitDatetime": "2025-11-09T12:00:00Z",
      "aspectsFound": {
        "natalToTransit": 8,
        "natal": 12,
        "transit": 10
      }
    }
  },
  "meta": {
    "renderTime": 1850,
    "version": "1.0.0"
  }
}
```

**Key Features:**
- Natal chart in inner circle (fixed houses)
- Transit planets in outer circle
- Different visual styles for natal vs transit planets
- Emphasis on natal-to-transit aspects
- Optional date/time label for transit moment

---

### 1.3 Render Synastry Chart Endpoint

**Endpoint:** `POST /api/v1/chart/render/synastry`

**Description:** Renders a synastry (relationship) chart showing two people's natal charts overlaid. Person 1's chart in the inner circle, Person 2's chart in the outer circle, with aspects between them.

**Request Body:**
```json
{
  "person1": {
    "name": "Иван",  // Optional: for display
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
      { "lon": 300.32 }, { "lon": 330.15 }, { "lon": 355.24 },
      { "lon": 20.32 }, { "lon": 45.15 }, { "lon": 75.24 },
      { "lon": 120.32 }, { "lon": 150.15 }, { "lon": 175.24 },
      { "lon": 200.32 }, { "lon": 225.15 }, { "lon": 255.24 }
    ]
  },
  "person2": {
    "name": "Мария",  // Optional: for display
    "planets": {
      "sun": { "lon": 290.15, "lat": 0.0 },
      "moon": { "lon": 45.67, "lat": 4.8 },
      "mercury": { "lon": 275.30, "lat": -1.5 },
      "venus": { "lon": 310.45, "lat": 2.1 },
      "mars": { "lon": 180.20, "lat": -1.2 },
      "jupiter": { "lon": 65.80, "lat": 0.8 },
      "saturn": { "lon": 350.90, "lat": 2.5 },
      "uranus": { "lon": 25.40, "lat": -0.5 },
      "neptune": { "lon": 330.10, "lat": 1.0 },
      "pluto": { "lon": 275.60, "lat": 16.2 }
    },
    "houses": [
      { "lon": 15.45 }, { "lon": 42.30 }, { "lon": 68.20 },
      { "lon": 95.10 }, { "lon": 125.50 }, { "lon": 155.80 },
      { "lon": 195.45 }, { "lon": 222.30 }, { "lon": 248.20 },
      { "lon": 275.10 }, { "lon": 305.50 }, { "lon": 335.80 }
    ]
  },
  "synastrySettings": {
    "useHousesFrom": "person1",  // "person1", "person2", or "both"
    "aspectSettings": {
      "person1": {
        "enabled": true,  // Aspects within person1's chart
        "orb": 6
      },
      "person2": {
        "enabled": false,  // Usually disabled in synastry
        "orb": 6
      },
      "interaspects": {
        "enabled": true,  // Aspects between person1 and person2 (main focus)
        "orb": 6,
        "types": {
          "conjunction": { "enabled": true },
          "opposition": { "enabled": true },
          "trine": { "enabled": true },
          "square": { "enabled": true },
          "sextile": { "enabled": true }
        }
      }
    }
  },
  "renderOptions": {
    "format": "png",
    "width": 1000,
    "height": 1000,
    "quality": 90,
    "theme": "light",
    "showLabels": {
      "person1Name": true,
      "person2Name": true,
      "legend": true  // Show color legend for each person
    }
  }
}
```

**Response (Success - 200 OK):**
```json
{
  "status": "success",
  "data": {
    "image": "base64_encoded_image_data",
    "format": "png",
    "size": 412890,
    "dimensions": {
      "width": 1000,
      "height": 1000
    },
    "generatedAt": "2025-11-09T12:34:56Z",
    "chartInfo": {
      "type": "synastry",
      "person1Name": "Иван",
      "person2Name": "Мария",
      "aspectsFound": {
        "interaspects": 15,
        "person1": 12,
        "person2": 0
      }
    }
  },
  "meta": {
    "renderTime": 2100,
    "version": "1.0.0"
  }
}
```

**Key Features:**
- Person 1's chart in inner circle (with their houses)
- Person 2's planets in outer circle
- Different colors for each person's planets
- Emphasis on interaspects (Person 1 ↔ Person 2)
- Optional names in legend
- Configurable house system display

**Use Cases:**
- Romantic relationships
- Business partnerships
- Parent-child relationships
- Friendship compatibility

---

### 1.4 Health Check Endpoint

**Endpoint:** `GET /health`

**Response (200 OK):**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 3600,
  "timestamp": "2025-11-09T12:34:56Z"
}
```

### 1.5 Metrics Endpoint

**Endpoint:** `GET /metrics`

**Response:** Prometheus format metrics
```
# HELP chart_renders_total Total number of chart renders
# TYPE chart_renders_total counter
chart_renders_total 1234

# HELP chart_render_duration_seconds Chart rendering duration
# TYPE chart_render_duration_seconds histogram
chart_render_duration_seconds_bucket{le="1.0"} 850
chart_render_duration_seconds_bucket{le="3.0"} 1200
```

---

## 2. Functional Requirements

### 2.1 MVP (Phase 1) - Must Have

- ✅ **Natal Chart Rendering**: Generate natal charts as PNG images
- ✅ **Planet Support**: All 10 classical planets (Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto)
- ✅ **House System**: Support Placidus house system (12 houses)
- ✅ **Aspect Calculation**: Display major aspects:
  - Conjunction (0°)
  - Opposition (180°)
  - Trine (120°)
  - Square (90°)
  - Sextile (60°)
- ✅ **Data Validation**: Strict validation of input parameters
- ✅ **Error Handling**: Clear error messages with details
- ✅ **Authentication**: API key-based authentication
- ✅ **Logging**: Structured JSON logs

### 2.2 Phase 1.5 - Early Priority (API Contract Defined)

- 🎯 **Transit Charts**: Overlay transits on natal chart (API defined in 1.2)
- 🎯 **Synastry Charts**: Two-person chart comparison (API defined in 1.3)
- 🎯 **Multiple Formats**: Support SVG, JPEG output
- 🎯 **Caching**: Cache identical chart requests (1 hour TTL)

### 2.3 Phase 2 - Nice to Have

- 🎯 **Async Rendering**: Queue system for complex charts
- 🎯 **Themes**: Light, dark, classic color schemes
- 🎯 **Custom Styling**: Configurable colors, fonts, sizes
- 🎯 **Additional Bodies**: Lilith, Chiron, North Node, Part of Fortune
- 🎯 **Progressive Charts**: Secondary progressions
- 🎯 **Composite Charts**: Midpoint method relationship charts

### 2.4 Data Validation Rules

**Planets:**
- `lon` (longitude): 0.0 - 360.0 (required)
- `lat` (latitude): -90.0 - 90.0 (optional, default: 0.0)

**Houses:**
- Array of 12 objects
- Each object: `{ "lon": 0.0-360.0 }`
- Houses must be in order (1-12)

**Aspect Settings:**
- `enabled`: boolean
- `orb`: 0-10 (degrees)
- `types`: object with aspect configurations

**Render Options:**
- `format`: enum ["png", "svg", "jpeg"]
- `width`: 400-2000 pixels
- `height`: 400-2000 pixels
- `quality`: 1-100 (for lossy formats)
- `theme`: enum ["light", "dark"]

---

## 3. Non-Functional Requirements

### 3.1 Performance

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| Response Time (p95) | < 3 sec | < 5 sec |
| Response Time (p99) | < 5 sec | < 10 sec |
| Throughput | 10 req/min | 5 req/min |
| Browser Init Time | < 1 sec | < 2 sec |
| Render Timeout | 10 sec | 15 sec |

### 3.2 Reliability

- **Availability**: 99% uptime (allows 7h downtime/month)
- **Error Rate**: < 1% of requests
- **Graceful Degradation**: Return 503 with Retry-After header when overloaded
- **Auto-Recovery**: Restart browser instance on crash
- **Circuit Breaker**: Fail fast after 5 consecutive errors

### 3.3 Scalability

- **Stateless Design**: No shared state between instances
- **Horizontal Scaling**: Support multiple service instances
- **Resource Limits**: 
  - Max 5 concurrent browser instances per container
  - Max 512MB RAM per browser instance
  - Request queue size: 100 requests

### 3.4 Security

- **Authentication**: Bearer token (API key or JWT)
- **Rate Limiting**: 
  - 100 requests/min per API key
  - 1000 requests/hour per API key
  - 429 Too Many Requests response
- **Input Validation**: Strict schema validation with rejection of unknown fields
- **CORS**: Configurable allowed origins
- **No Data Storage**: Don't persist any chart data or images
- **Secrets Management**: Environment variables for sensitive data

### 3.5 Monitoring & Observability

- **Health Checks**: `/health` endpoint with detailed status
- **Metrics**: Prometheus-compatible metrics endpoint
- **Structured Logging**: JSON format with severity levels
- **Log Correlation**: Request ID tracing
- **Key Metrics**:
  - Request count by status code
  - Render duration histogram
  - Active browser instances
  - Memory usage
  - Error rate by type

---

## 4. Technology Stack

### 4.1 Recommended Stack

```yaml
Runtime: Node.js 20 LTS
Framework: Express.js or Fastify
Rendering Engine: Puppeteer (headless Chrome)
Alternative: Playwright (if need cross-browser)
Image Processing: Sharp (optional, for format conversion)
Validation: Zod or Joi
Rate Limiting: express-rate-limit
Logging: Winston or Pino
Monitoring: Prometheus client
API Documentation: Swagger/OpenAPI 3.0
Testing: Jest + Supertest
Containerization: Docker
```

### 4.2 Key Dependencies

```json
{
  "dependencies": {
    "express": "^4.18.0",
    "puppeteer": "^21.0.0",
    "zod": "^3.22.0",
    "winston": "^3.11.0",
    "prom-client": "^15.0.0",
    "express-rate-limit": "^7.0.0",
    "dotenv": "^16.3.0"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "supertest": "^6.3.0",
    "eslint": "^8.55.0",
    "prettier": "^3.1.0"
  }
}
```

---

## 5. Project Structure

```
nocturna-chart-service/
├── src/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── chart.routes.js
│   │   │   ├── health.routes.js
│   │   │   └── index.js
│   │   ├── controllers/
│   │   │   ├── chart.controller.js
│   │   │   └── health.controller.js
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js
│   │   │   ├── validation.middleware.js
│   │   │   ├── rateLimit.middleware.js
│   │   │   ├── errorHandler.middleware.js
│   │   │   └── requestLogger.middleware.js
│   │   └── validators/
│   │       └── chart.validator.js
│   ├── services/
│   │   ├── chartRenderer.service.js
│   │   ├── browser.service.js
│   │   ├── cache.service.js (phase 2)
│   │   └── imageProcessor.service.js (phase 2)
│   ├── templates/
│   │   ├── chart.html
│   │   └── chart-dark.html (phase 2)
│   ├── config/
│   │   ├── index.js
│   │   ├── puppeteer.config.js
│   │   └── logger.config.js
│   ├── utils/
│   │   ├── logger.js
│   │   ├── errors.js
│   │   └── metrics.js
│   └── app.js
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   └── validators/
│   ├── integration/
│   │   └── api/
│   └── fixtures/
│       └── sample-charts.js
├── assets/
│   └── nocturna-wheel/  (library files)
├── docs/
│   ├── API.md
│   └── DEPLOYMENT.md
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── .env.example
├── package.json
├── package-lock.json
├── .eslintrc.js
├── .prettierrc
├── jest.config.js
├── openapi.yaml
├── README.md
└── LICENSE
```

---

## 6. Integration with Nocturna Telegram Bot

### 6.1 Python Client Implementation

Create new file: `src/api/chart_service_client.py`

```python
"""Client for Chart Rendering Service"""

import requests
import base64
import logging
from typing import Dict, List, Optional, Literal
from io import BytesIO

logger = logging.getLogger(__name__)


class ChartServiceError(Exception):
    """Base exception for Chart Service errors"""
    
    def __init__(self, message: str, code: str = None, details: dict = None):
        self.message = message
        self.code = code
        self.details = details
        super().__init__(self.message)


class ChartServiceClient:
    """Client for Chart Rendering Service"""
    
    def __init__(
        self, 
        base_url: str, 
        api_key: str,
        timeout: int = 15,
        max_retries: int = 3
    ):
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.timeout = timeout
        self.max_retries = max_retries
        
    def render_chart(
        self,
        planets: Dict[str, Dict[str, float]],
        houses: List[Dict[str, float]],
        format: Literal["png", "svg", "jpeg"] = "png",
        width: int = 800,
        height: int = 800,
        theme: Literal["light", "dark"] = "light",
        aspect_orb: int = 6
    ) -> bytes:
        """
        Render natal chart and return image data.
        
        Args:
            planets: Dictionary with planet data
            houses: List of 12 house cusps
            format: Output format (png, svg, jpeg)
            width: Image width in pixels
            height: Image height in pixels
            theme: Color theme
            aspect_orb: Orb for aspect calculation
            
        Returns:
            bytes: Image data in specified format
            
        Raises:
            ChartServiceError: If rendering fails
        """
        url = f"{self.base_url}/api/v1/chart/render"
        
        payload = {
            "planets": planets,
            "houses": houses,
            "aspectSettings": {
                "enabled": True,
                "orb": aspect_orb,
                "types": {
                    "conjunction": {"enabled": True},
                    "opposition": {"enabled": True},
                    "trine": {"enabled": True},
                    "square": {"enabled": True},
                    "sextile": {"enabled": True}
                }
            },
            "renderOptions": {
                "format": format,
                "width": width,
                "height": height,
                "quality": 90,
                "theme": theme
            }
        }
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        for attempt in range(self.max_retries):
            try:
                logger.info(f"Requesting chart render (attempt {attempt + 1}/{self.max_retries})")
                
                response = requests.post(
                    url, 
                    json=payload, 
                    headers=headers,
                    timeout=self.timeout
                )
                
                if response.status_code == 200:
                    data = response.json()
                    image_base64 = data['data']['image']
                    image_bytes = base64.b64decode(image_base64)
                    
                    logger.info(
                        f"Chart rendered successfully: "
                        f"{data['data']['size']} bytes, "
                        f"{data['meta']['renderTime']}ms"
                    )
                    
                    return image_bytes
                    
                elif response.status_code == 429:
                    # Rate limit exceeded
                    retry_after = response.headers.get('Retry-After', 60)
                    logger.warning(f"Rate limit exceeded, retry after {retry_after}s")
                    raise ChartServiceError(
                        "Rate limit exceeded",
                        code="RATE_LIMIT_EXCEEDED",
                        details={"retry_after": retry_after}
                    )
                    
                elif response.status_code >= 400:
                    error_data = response.json()
                    error_info = error_data.get('error', {})
                    raise ChartServiceError(
                        error_info.get('message', 'Unknown error'),
                        code=error_info.get('code'),
                        details=error_info.get('details')
                    )
                    
            except requests.exceptions.Timeout:
                logger.warning(f"Request timeout (attempt {attempt + 1})")
                if attempt == self.max_retries - 1:
                    raise ChartServiceError("Service timeout", code="TIMEOUT")
                    
            except requests.exceptions.ConnectionError as e:
                logger.error(f"Connection error: {e}")
                if attempt == self.max_retries - 1:
                    raise ChartServiceError("Service unavailable", code="CONNECTION_ERROR")
        
        raise ChartServiceError("Max retries exceeded", code="MAX_RETRIES")
    
    def render_transit_chart(
        self,
        natal_planets: Dict[str, Dict[str, float]],
        natal_houses: List[Dict[str, float]],
        transit_planets: Dict[str, Dict[str, float]],
        transit_datetime: Optional[str] = None,
        format: Literal["png", "svg", "jpeg"] = "png",
        width: int = 1000,
        height: int = 1000,
        theme: Literal["light", "dark"] = "light",
        natal_orb: int = 6,
        transit_orb: int = 3
    ) -> bytes:
        """
        Render transit chart with natal and current transits.
        
        Args:
            natal_planets: Dictionary with natal planet data
            natal_houses: List of 12 natal house cusps
            transit_planets: Dictionary with transit planet data
            transit_datetime: ISO datetime string for transits (optional)
            format: Output format (png, svg, jpeg)
            width: Image width in pixels
            height: Image height in pixels
            theme: Color theme
            natal_orb: Orb for natal aspects
            transit_orb: Orb for natal-to-transit aspects
            
        Returns:
            bytes: Image data in specified format
            
        Raises:
            ChartServiceError: If rendering fails
        """
        url = f"{self.base_url}/api/v1/chart/render/transit"
        
        payload = {
            "natal": {
                "planets": natal_planets,
                "houses": natal_houses
            },
            "transit": {
                "planets": transit_planets
            },
            "aspectSettings": {
                "natal": {
                    "enabled": True,
                    "orb": natal_orb
                },
                "transit": {
                    "enabled": False,  # Usually not needed
                    "orb": natal_orb
                },
                "natalToTransit": {
                    "enabled": True,
                    "orb": transit_orb,
                    "types": {
                        "conjunction": {"enabled": True},
                        "opposition": {"enabled": True},
                        "trine": {"enabled": True},
                        "square": {"enabled": True},
                        "sextile": {"enabled": True}
                    }
                }
            },
            "renderOptions": {
                "format": format,
                "width": width,
                "height": height,
                "quality": 90,
                "theme": theme,
                "showLabels": {
                    "natal": True,
                    "transit": True,
                    "datetime": transit_datetime is not None
                }
            }
        }
        
        if transit_datetime:
            payload["transit"]["datetime"] = transit_datetime
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        for attempt in range(self.max_retries):
            try:
                logger.info(f"Requesting transit chart render (attempt {attempt + 1}/{self.max_retries})")
                
                response = requests.post(
                    url, 
                    json=payload, 
                    headers=headers,
                    timeout=self.timeout
                )
                
                if response.status_code == 200:
                    data = response.json()
                    image_base64 = data['data']['image']
                    image_bytes = base64.b64decode(image_base64)
                    
                    chart_info = data['data'].get('chartInfo', {})
                    aspects_found = chart_info.get('aspectsFound', {})
                    
                    logger.info(
                        f"Transit chart rendered successfully: "
                        f"{data['data']['size']} bytes, "
                        f"{aspects_found.get('natalToTransit', 0)} transit aspects found, "
                        f"{data['meta']['renderTime']}ms"
                    )
                    
                    return image_bytes
                    
                elif response.status_code == 429:
                    retry_after = response.headers.get('Retry-After', 60)
                    logger.warning(f"Rate limit exceeded, retry after {retry_after}s")
                    raise ChartServiceError(
                        "Rate limit exceeded",
                        code="RATE_LIMIT_EXCEEDED",
                        details={"retry_after": retry_after}
                    )
                    
                elif response.status_code >= 400:
                    error_data = response.json()
                    error_info = error_data.get('error', {})
                    raise ChartServiceError(
                        error_info.get('message', 'Unknown error'),
                        code=error_info.get('code'),
                        details=error_info.get('details')
                    )
                    
            except requests.exceptions.Timeout:
                logger.warning(f"Request timeout (attempt {attempt + 1})")
                if attempt == self.max_retries - 1:
                    raise ChartServiceError("Service timeout", code="TIMEOUT")
                    
            except requests.exceptions.ConnectionError as e:
                logger.error(f"Connection error: {e}")
                if attempt == self.max_retries - 1:
                    raise ChartServiceError("Service unavailable", code="CONNECTION_ERROR")
        
        raise ChartServiceError("Max retries exceeded", code="MAX_RETRIES")
    
    def render_synastry_chart(
        self,
        person1_planets: Dict[str, Dict[str, float]],
        person1_houses: List[Dict[str, float]],
        person2_planets: Dict[str, Dict[str, float]],
        person2_houses: List[Dict[str, float]],
        person1_name: Optional[str] = None,
        person2_name: Optional[str] = None,
        format: Literal["png", "svg", "jpeg"] = "png",
        width: int = 1000,
        height: int = 1000,
        theme: Literal["light", "dark"] = "light",
        use_houses_from: Literal["person1", "person2", "both"] = "person1",
        show_person1_aspects: bool = True,
        show_person2_aspects: bool = False,
        interaspect_orb: int = 6
    ) -> bytes:
        """
        Render synastry chart comparing two people's natal charts.
        
        Args:
            person1_planets: Dictionary with person 1's planet data
            person1_houses: List of 12 house cusps for person 1
            person2_planets: Dictionary with person 2's planet data
            person2_houses: List of 12 house cusps for person 2
            person1_name: Name for person 1 (optional)
            person2_name: Name for person 2 (optional)
            format: Output format (png, svg, jpeg)
            width: Image width in pixels
            height: Image height in pixels
            theme: Color theme
            use_houses_from: Which houses to display
            show_person1_aspects: Show aspects within person 1's chart
            show_person2_aspects: Show aspects within person 2's chart
            interaspect_orb: Orb for inter-person aspects
            
        Returns:
            bytes: Image data in specified format
            
        Raises:
            ChartServiceError: If rendering fails
        """
        url = f"{self.base_url}/api/v1/chart/render/synastry"
        
        payload = {
            "person1": {
                "planets": person1_planets,
                "houses": person1_houses
            },
            "person2": {
                "planets": person2_planets,
                "houses": person2_houses
            },
            "synastrySettings": {
                "useHousesFrom": use_houses_from,
                "aspectSettings": {
                    "person1": {
                        "enabled": show_person1_aspects,
                        "orb": 6
                    },
                    "person2": {
                        "enabled": show_person2_aspects,
                        "orb": 6
                    },
                    "interaspects": {
                        "enabled": True,
                        "orb": interaspect_orb,
                        "types": {
                            "conjunction": {"enabled": True},
                            "opposition": {"enabled": True},
                            "trine": {"enabled": True},
                            "square": {"enabled": True},
                            "sextile": {"enabled": True}
                        }
                    }
                }
            },
            "renderOptions": {
                "format": format,
                "width": width,
                "height": height,
                "quality": 90,
                "theme": theme,
                "showLabels": {
                    "person1Name": person1_name is not None,
                    "person2Name": person2_name is not None,
                    "legend": True
                }
            }
        }
        
        if person1_name:
            payload["person1"]["name"] = person1_name
        if person2_name:
            payload["person2"]["name"] = person2_name
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        for attempt in range(self.max_retries):
            try:
                logger.info(f"Requesting synastry chart render (attempt {attempt + 1}/{self.max_retries})")
                
                response = requests.post(
                    url, 
                    json=payload, 
                    headers=headers,
                    timeout=self.timeout
                )
                
                if response.status_code == 200:
                    data = response.json()
                    image_base64 = data['data']['image']
                    image_bytes = base64.b64decode(image_base64)
                    
                    chart_info = data['data'].get('chartInfo', {})
                    aspects_found = chart_info.get('aspectsFound', {})
                    
                    logger.info(
                        f"Synastry chart rendered successfully: "
                        f"{data['data']['size']} bytes, "
                        f"{aspects_found.get('interaspects', 0)} interaspects found, "
                        f"{data['meta']['renderTime']}ms"
                    )
                    
                    return image_bytes
                    
                elif response.status_code == 429:
                    retry_after = response.headers.get('Retry-After', 60)
                    logger.warning(f"Rate limit exceeded, retry after {retry_after}s")
                    raise ChartServiceError(
                        "Rate limit exceeded",
                        code="RATE_LIMIT_EXCEEDED",
                        details={"retry_after": retry_after}
                    )
                    
                elif response.status_code >= 400:
                    error_data = response.json()
                    error_info = error_data.get('error', {})
                    raise ChartServiceError(
                        error_info.get('message', 'Unknown error'),
                        code=error_info.get('code'),
                        details=error_info.get('details')
                    )
                    
            except requests.exceptions.Timeout:
                logger.warning(f"Request timeout (attempt {attempt + 1})")
                if attempt == self.max_retries - 1:
                    raise ChartServiceError("Service timeout", code="TIMEOUT")
                    
            except requests.exceptions.ConnectionError as e:
                logger.error(f"Connection error: {e}")
                if attempt == self.max_retries - 1:
                    raise ChartServiceError("Service unavailable", code="CONNECTION_ERROR")
        
        raise ChartServiceError("Max retries exceeded", code="MAX_RETRIES")
    
    def health_check(self) -> bool:
        """Check if service is healthy"""
        try:
            url = f"{self.base_url}/health"
            response = requests.get(url, timeout=5)
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False
```

### 6.2 Configuration

Add to `src/config.py`:

```python
class Settings(BaseSettings):
    # ... existing settings ...
    
    # Chart Service Settings
    chart_service_url: str = Field(
        default="http://localhost:3000",
        description="Chart rendering service URL"
    )
    chart_service_api_key: str = Field(
        ...,
        description="API key for chart service"
    )
    chart_service_timeout: int = Field(
        default=15,
        description="Request timeout in seconds"
    )
```

Add to `.env`:

```bash
# Chart Rendering Service
CHART_SERVICE_URL=http://localhost:3000
CHART_SERVICE_API_KEY=your-secret-api-key-here
CHART_SERVICE_TIMEOUT=15
```

### 6.3 Usage in Bot Handlers

```python
# In bot handlers
async def natal_chart_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /natal command"""
    try:
        # Get natal data from nocturna-calculations API
        natal_data = await nocturna_client.get_natal_chart(
            birth_date="1990-01-15",
            birth_time="14:30:00",
            latitude=55.7558,
            longitude=37.6173
        )
        
        # Render chart image
        image_bytes = chart_service_client.render_chart(
            planets=natal_data['planets'],
            houses=natal_data['houses'],
            format="png",
            width=800,
            height=800
        )
        
        # Send to Telegram
        await update.message.reply_photo(
            photo=BytesIO(image_bytes),
            caption="Ваш натальный чарт"
        )
        
    except ChartServiceError as e:
        logger.error(f"Chart rendering error: {e}")
        await update.message.reply_text(
            "Извините, не удалось сгенерировать изображение чарта. "
            "Попробуйте позже."
        )

async def transit_chart_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /transit command - show current transits"""
    try:
        # Get user's natal data (from DB or parameter)
        natal_data = await get_user_natal_data(update.effective_user.id)
        
        # Get current transit data from nocturna-calculations API
        transit_data = await nocturna_client.get_current_transits()
        
        # Render transit chart image
        image_bytes = chart_service_client.render_transit_chart(
            natal_planets=natal_data['planets'],
            natal_houses=natal_data['houses'],
            transit_planets=transit_data['planets'],
            transit_datetime=transit_data['datetime'],
            format="png",
            width=1000,
            height=1000,
            transit_orb=3  # Tighter orb for transits
        )
        
        # Send to Telegram
        await update.message.reply_photo(
            photo=BytesIO(image_bytes),
            caption=(
                f"🌟 Ваши текущие транзиты\n"
                f"Дата: {transit_data['datetime'][:10]}"
            )
        )
        
    except ChartServiceError as e:
        logger.error(f"Transit chart rendering error: {e}")
        await update.message.reply_text(
            "Извините, не удалось сгенерировать транзитный чарт. "
            "Попробуйте позже."
        )

async def synastry_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /synastry command - compare compatibility with another person"""
    try:
        # Parse command: /synastry @username or /synastry user_id
        if not context.args:
            await update.message.reply_text(
                "Использование: /synastry @username\n"
                "Пример: /synastry @maria"
            )
            return
        
        # Get first person's natal data (requester)
        person1_data = await get_user_natal_data(update.effective_user.id)
        person1_name = update.effective_user.first_name
        
        # Get second person's natal data (from username or ID)
        target_username = context.args[0].lstrip('@')
        person2_data = await get_user_natal_data_by_username(target_username)
        person2_name = person2_data.get('name', target_username)
        
        if not person2_data:
            await update.message.reply_text(
                f"Пользователь {target_username} не найден или не имеет натальных данных."
            )
            return
        
        # Render synastry chart image
        image_bytes = chart_service_client.render_synastry_chart(
            person1_planets=person1_data['planets'],
            person1_houses=person1_data['houses'],
            person2_planets=person2_data['planets'],
            person2_houses=person2_data['houses'],
            person1_name=person1_name,
            person2_name=person2_name,
            format="png",
            width=1000,
            height=1000,
            use_houses_from="person1",
            show_person1_aspects=True,
            show_person2_aspects=False
        )
        
        # Send to Telegram
        await update.message.reply_photo(
            photo=BytesIO(image_bytes),
            caption=(
                f"💑 Синастрия\n"
                f"{person1_name} ❤️ {person2_name}"
            )
        )
        
    except ChartServiceError as e:
        logger.error(f"Synastry chart rendering error: {e}")
        await update.message.reply_text(
            "Извините, не удалось сгенерировать синастрию. "
            "Попробуйте позже."
        )
```

**Integration Summary:**

The Chart Service Client provides three main methods:
- `render_chart()` - Single natal chart
- `render_transit_chart()` - Natal + transits overlay
- `render_synastry_chart()` - Two people comparison

All methods return `bytes` for direct use with Telegram's `reply_photo()`.

---

## 7. Deployment

### 7.1 Docker Configuration

**Dockerfile:**
```dockerfile
FROM node:20-slim

# Install Chrome dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libnss3 \
    libatk-bridge2.0-0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV NODE_ENV=production

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "src/app.js"]
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  chart-service:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - API_KEY=${CHART_SERVICE_API_KEY}
      - LOG_LEVEL=info
      - MAX_CONCURRENT_RENDERS=5
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 5s
      retries: 3
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '1.0'
        reservations:
          memory: 512M
          cpus: '0.5'
```

### 7.2 Environment Variables

```bash
# Server Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Security
API_KEY=your-secret-api-key-here

# Puppeteer Configuration
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
MAX_CONCURRENT_RENDERS=5
RENDER_TIMEOUT=10000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Monitoring
ENABLE_METRICS=true
```

### 7.3 Production Deployment Options

**Option A: Same Server (Docker Compose)**
- Deploy alongside Telegram bot
- Use internal Docker network
- Minimal latency

**Option B: Separate VPS**
- Independent scaling
- Isolated resources
- HTTPS with reverse proxy (Nginx)

**Option C: Serverless (Future)**
- AWS Lambda + API Gateway
- Pay per use
- Auto-scaling
- Cold start penalty (~2-3s)

---

## 8. Development Roadmap

### Phase 1: MVP (Week 1-2)
- [ ] Project setup (Node.js, Express, Puppeteer)
- [ ] Basic chart rendering endpoint
- [ ] Input validation
- [ ] Authentication middleware
- [ ] Error handling
- [ ] Docker configuration
- [ ] Basic tests
- [ ] Documentation

### Phase 2: Production Ready (Week 3-4)
- [ ] Rate limiting
- [ ] Monitoring & metrics
- [ ] Structured logging
- [ ] Health checks
- [ ] Caching layer
- [ ] Performance optimization
- [ ] Integration tests
- [ ] Deployment automation

### Phase 3: Enhancements (Future)
- [ ] Multiple output formats
- [ ] Theme system
- [ ] Transit charts
- [ ] Async rendering with queue
- [ ] Synastry charts
- [ ] Advanced caching
- [ ] Load testing

---

## 9. Success Criteria

### MVP Launch Criteria
- ✅ All Phase 1 requirements implemented
- ✅ Response time < 5 sec (p95)
- ✅ Error rate < 5%
- ✅ Documentation complete
- ✅ Basic tests passing (>80% coverage)
- ✅ Successfully integrates with Telegram bot

### Production Readiness Criteria
- ✅ All Phase 2 requirements implemented
- ✅ Response time < 3 sec (p95)
- ✅ Error rate < 1%
- ✅ Uptime > 99%
- ✅ Monitoring dashboards configured
- ✅ Load tested (100 req/min sustained)
- ✅ Security audit passed

---

## 10. Open Questions

1. **Caching Strategy**: Should we cache rendered charts? What's the cache key format?
2. **Image Storage**: Should service store images temporarily or always generate on-demand?
3. **Async Processing**: When should we switch to async/queue-based rendering?
4. **Multiple Instances**: Load balancer configuration for horizontal scaling?
5. **Localization**: Should chart labels be localized (Russian/English)?

---

## Appendix A: Sample Request/Response

### A.1 Natal Chart

**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/chart/render \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "planets": {
      "sun": {"lon": 85.83, "lat": 0.0},
      "moon": {"lon": 133.21, "lat": 5.12},
      "mercury": {"lon": 95.45, "lat": -2.3},
      "venus": {"lon": 110.20, "lat": 1.5},
      "mars": {"lon": 45.30, "lat": -0.8},
      "jupiter": {"lon": 200.15, "lat": 0.5},
      "saturn": {"lon": 290.45, "lat": 2.1},
      "uranus": {"lon": 15.60, "lat": -0.3},
      "neptune": {"lon": 325.80, "lat": 1.2},
      "pluto": {"lon": 270.25, "lat": 15.0}
    },
    "houses": [
      {"lon": 300.32}, {"lon": 330.15}, {"lon": 355.24},
      {"lon": 20.32}, {"lon": 45.15}, {"lon": 75.24},
      {"lon": 120.32}, {"lon": 150.15}, {"lon": 175.24},
      {"lon": 200.32}, {"lon": 225.15}, {"lon": 255.24}
    ],
    "renderOptions": {
      "format": "png",
      "width": 800,
      "height": 800
    }
  }'
```

### A.2 Transit Chart

**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/chart/render/transit \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "natal": {
      "planets": {
        "sun": {"lon": 85.83, "lat": 0.0},
        "moon": {"lon": 133.21, "lat": 5.12},
        "mercury": {"lon": 95.45, "lat": -2.3},
        "venus": {"lon": 110.20, "lat": 1.5},
        "mars": {"lon": 45.30, "lat": -0.8},
        "jupiter": {"lon": 200.15, "lat": 0.5},
        "saturn": {"lon": 290.45, "lat": 2.1},
        "uranus": {"lon": 15.60, "lat": -0.3},
        "neptune": {"lon": 325.80, "lat": 1.2},
        "pluto": {"lon": 270.25, "lat": 15.0}
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
        "sun": {"lon": 290.15, "lat": 0.0},
        "moon": {"lon": 45.67, "lat": 4.8},
        "mercury": {"lon": 275.30, "lat": -1.5},
        "venus": {"lon": 310.45, "lat": 2.1},
        "mars": {"lon": 180.20, "lat": -1.2},
        "jupiter": {"lon": 65.80, "lat": 0.8},
        "saturn": {"lon": 350.90, "lat": 2.5},
        "uranus": {"lon": 25.40, "lat": -0.5},
        "neptune": {"lon": 330.10, "lat": 1.0},
        "pluto": {"lon": 275.60, "lat": 16.2}
      },
      "datetime": "2025-11-09T12:00:00Z"
    },
    "aspectSettings": {
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
  }'
```

### A.3 Synastry Chart

**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/chart/render/synastry \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "person1": {
      "name": "Иван",
      "planets": {
        "sun": {"lon": 85.83, "lat": 0.0},
        "moon": {"lon": 133.21, "lat": 5.12},
        "mercury": {"lon": 95.45, "lat": -2.3},
        "venus": {"lon": 110.20, "lat": 1.5},
        "mars": {"lon": 45.30, "lat": -0.8},
        "jupiter": {"lon": 200.15, "lat": 0.5},
        "saturn": {"lon": 290.45, "lat": 2.1},
        "uranus": {"lon": 15.60, "lat": -0.3},
        "neptune": {"lon": 325.80, "lat": 1.2},
        "pluto": {"lon": 270.25, "lat": 15.0}
      },
      "houses": [
        {"lon": 300.32}, {"lon": 330.15}, {"lon": 355.24},
        {"lon": 20.32}, {"lon": 45.15}, {"lon": 75.24},
        {"lon": 120.32}, {"lon": 150.15}, {"lon": 175.24},
        {"lon": 200.32}, {"lon": 225.15}, {"lon": 255.24}
      ]
    },
    "person2": {
      "name": "Мария",
      "planets": {
        "sun": {"lon": 290.15, "lat": 0.0},
        "moon": {"lon": 45.67, "lat": 4.8},
        "mercury": {"lon": 275.30, "lat": -1.5},
        "venus": {"lon": 310.45, "lat": 2.1},
        "mars": {"lon": 180.20, "lat": -1.2},
        "jupiter": {"lon": 65.80, "lat": 0.8},
        "saturn": {"lon": 350.90, "lat": 2.5},
        "uranus": {"lon": 25.40, "lat": -0.5},
        "neptune": {"lon": 330.10, "lat": 1.0},
        "pluto": {"lon": 275.60, "lat": 16.2}
      },
      "houses": [
        {"lon": 15.45}, {"lon": 42.30}, {"lon": 68.20},
        {"lon": 95.10}, {"lon": 125.50}, {"lon": 155.80},
        {"lon": 195.45}, {"lon": 222.30}, {"lon": 248.20},
        {"lon": 275.10}, {"lon": 305.50}, {"lon": 335.80}
      ]
    },
    "synastrySettings": {
      "useHousesFrom": "person1",
      "aspectSettings": {
        "interaspects": {
          "enabled": true,
          "orb": 6
        }
      }
    },
    "renderOptions": {
      "format": "png",
      "width": 1000,
      "height": 1000
    }
  }'
```

---

## Appendix B: Changelog

### Version 1.1 (2025-11-09)
- ✅ Added Transit Chart API endpoint (`POST /api/v1/chart/render/transit`)
- ✅ Added Synastry Chart API endpoint (`POST /api/v1/chart/render/synastry`)
- ✅ Extended Python client with `render_transit_chart()` method
- ✅ Extended Python client with `render_synastry_chart()` method
- ✅ Added bot handler examples for transit and synastry commands
- ✅ Added curl examples for all chart types
- ✅ Updated functional requirements with Phase 1.5 priorities

### Version 1.0 (2025-11-09)
- Initial requirements document
- Basic natal chart rendering endpoint
- Python client implementation
- Docker configuration
- Deployment guidelines

---

**Document Version:** 1.1  
**Last Updated:** 2025-11-09  
**Status:** Draft - Extended with Transit & Synastry APIs

