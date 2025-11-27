# Biwheel Charts

## Overview

Biwheel charts are dual-wheel astrological charts that display two sets of planetary positions on the same chart. The inner circle typically represents a natal chart, while the outer circle can represent:

- **Progressed charts** - Secondary progressions
- **Solar returns** - Annual solar return charts
- **Lunar returns** - Monthly lunar return charts
- **Transits** - Current planetary positions (use `/render/transit` endpoint for this)
- **Synastry** - Partner comparison (use `/render/synastry` endpoint for this)
- **Any other dual chart comparison**

## Endpoint

```
POST /api/v1/chart/render/biwheel
```

## Request Structure

### Basic Request

```json
{
  "inner": {
    "name": "Natal Chart",
    "planets": { /* 10 planets */ },
    "houses": [ /* 12 house cusps */ ]
  },
  "outer": {
    "name": "Progressed Chart",
    "planets": { /* 10 planets */ }
  }
}
```

### Full Request with All Options

```json
{
  "inner": {
    "name": "Natal Chart",
    "planets": {
      "sun": { "lon": 85.83, "lat": 0.0, "retrograde": false },
      "moon": { "lon": 133.21, "lat": 5.12, "retrograde": false },
      "mercury": { "lon": 95.45, "lat": -2.3, "retrograde": true },
      "venus": { "lon": 110.20, "lat": 1.5, "retrograde": false },
      "mars": { "lon": 45.30, "lat": -0.8, "retrograde": true },
      "jupiter": { "lon": 200.15, "lat": 0.5, "retrograde": false },
      "saturn": { "lon": 290.45, "lat": 2.1, "retrograde": false },
      "uranus": { "lon": 15.60, "lat": -0.3, "retrograde": false },
      "neptune": { "lon": 325.80, "lat": 1.2, "retrograde": false },
      "pluto": { "lon": 270.25, "lat": 15.0, "retrograde": false }
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
    ]
  },
  "outer": {
    "name": "Progressed Chart",
    "planets": {
      "sun": { "lon": 115.20, "lat": 0.0, "retrograde": false },
      "moon": { "lon": 200.45, "lat": 4.8, "retrograde": false },
      "mercury": { "lon": 125.30, "lat": -1.5, "retrograde": false },
      "venus": { "lon": 140.50, "lat": 2.0, "retrograde": false },
      "mars": { "lon": 75.80, "lat": -1.2, "retrograde": false },
      "jupiter": { "lon": 210.30, "lat": 0.8, "retrograde": false },
      "saturn": { "lon": 295.60, "lat": 2.3, "retrograde": false },
      "uranus": { "lon": 18.40, "lat": -0.5, "retrograde": false },
      "neptune": { "lon": 327.90, "lat": 1.4, "retrograde": false },
      "pluto": { "lon": 272.10, "lat": 14.8, "retrograde": false }
    }
  },
  "biwheelSettings": {
    "useHousesFrom": "inner",
    "aspectSettings": {
      "inner": {
        "enabled": true,
        "orb": 6,
        "types": {
          "conjunction": { "enabled": true, "orb": 8 },
          "opposition": { "enabled": true, "orb": 6 },
          "trine": { "enabled": true, "orb": 6 },
          "square": { "enabled": true, "orb": 6 },
          "sextile": { "enabled": true, "orb": 4 }
        }
      },
      "outer": {
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
      "crossAspects": {
        "enabled": true,
        "orb": 3,
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
    "theme": "light"
  }
}
```

## Configuration Options

### Inner Chart (Required)

- `name` (optional): Label for the inner chart
- `planets` (required): Object with 10 planets (sun, moon, mercury, venus, mars, jupiter, saturn, uranus, neptune, pluto)
- `houses` (required): Array of 12 house cusps

### Outer Chart (Required)

- `name` (optional): Label for the outer chart
- `planets` (required): Object with 10 planets
- `houses` (optional): Array of 12 house cusps - if not provided, inner chart houses will be used

### Biwheel Settings (Optional)

#### useHousesFrom

- `"inner"` (default): Use houses from inner chart
- `"outer"`: Use houses from outer chart (requires outer.houses to be provided)

#### aspectSettings

Three independent aspect configurations:

1. **inner**: Aspects within the inner circle (natal-to-natal)
2. **outer**: Aspects within the outer circle (progressed-to-progressed)
3. **crossAspects**: Aspects between inner and outer circles (natal-to-progressed)

Each aspect setting supports:
- `enabled`: Enable/disable this aspect group
- `orb`: Default orb for all aspects in this group
- `types`: Configuration for specific aspect types (conjunction, opposition, trine, square, sextile)

### Render Options (Optional)

- `format`: "png" (default), "svg", or "jpeg"
- `width`: 400-2000 pixels (default: 800)
- `height`: 400-2000 pixels (default: 800)
- `quality`: 1-100 (default: 90, for PNG/JPEG)
- `theme`: "light" (default) or "dark"

## Response

```json
{
  "status": "success",
  "data": {
    "image": "base64_encoded_image_data",
    "format": "png",
    "size": 345678,
    "dimensions": {
      "width": 1000,
      "height": 1000
    },
    "generatedAt": "2025-11-24T12:34:56Z",
    "chartInfo": {
      "type": "biwheel",
      "innerName": "Natal Chart",
      "outerName": "Progressed Chart",
      "aspectsFound": {
        "crossAspects": 12,
        "inner": 8,
        "outer": 10
      }
    }
  },
  "meta": {
    "renderTime": 1450,
    "version": "1.0.0"
  }
}
```

## Examples

### Example 1: Progressed Chart

```bash
curl -X POST http://localhost:3000/api/v1/chart/render/biwheel \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d @progressed-chart-request.json
```

### Example 2: Solar Return Chart

```bash
curl -X POST http://localhost:3000/api/v1/chart/render/biwheel \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "inner": {
      "name": "Natal",
      "planets": { ... },
      "houses": [ ... ]
    },
    "outer": {
      "name": "Solar Return 2025",
      "planets": { ... }
    },
    "biwheelSettings": {
      "aspectSettings": {
        "inner": { "enabled": false },
        "outer": { "enabled": false },
        "crossAspects": { "enabled": true, "orb": 3 }
      }
    }
  }'
```

## Differences from Transit and Synastry Endpoints

| Feature | Biwheel | Transit | Synastry |
|---------|---------|---------|----------|
| Purpose | Generic dual chart | Natal + current transits | Partner comparison |
| Inner chart | Any chart | Natal chart | Person 1 |
| Outer chart | Any chart | Transit positions | Person 2 |
| Houses | Flexible (inner/outer) | From natal | From person 1/2 |
| Use case | Progressions, returns, etc. | Current transits | Relationship analysis |

## Use Cases

1. **Secondary Progressions**: Compare natal chart with progressed positions
2. **Solar Returns**: Overlay solar return chart on natal
3. **Lunar Returns**: Overlay lunar return chart on natal
4. **Tertiary Progressions**: Compare natal with tertiary progressions
5. **Composite Charts**: Display composite chart with one partner's natal
6. **Custom Comparisons**: Any dual chart scenario not covered by transit/synastry

## Notes

- The biwheel endpoint is more flexible than transit/synastry endpoints
- For standard transits, use `/render/transit` endpoint instead
- For standard synastry, use `/render/synastry` endpoint instead
- Outer chart houses are optional - if not provided, inner chart houses will be used
- Three independent aspect systems allow fine control over what aspects are displayed
- Cross-aspects are rendered with projection dots on the inner circle for clearer visualization

## Library Support

The biwheel functionality is powered by the [nocturna-wheel](https://github.com/eaprelsky/nocturna-wheel) library, which provides:

- Independent inner and outer circles for planets
- Three separate aspect systems (primary, secondary, synastry)
- Automatic wheel rotation based on Ascendant
- Customizable colors, line styles, and orbs for each aspect type

