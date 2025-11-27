# Biwheel Charts - Quick Start Guide

## What are Biwheel Charts?

Biwheel charts display two sets of planetary positions on the same chart:
- **Inner circle**: Typically your natal chart
- **Outer circle**: Progressions, solar returns, lunar returns, or any comparison chart

## Quick Example

### Using curl

```bash
curl -X POST http://localhost:3000/api/v1/chart/render/biwheel \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "inner": {
      "name": "Natal",
      "planets": {
        "sun": {"lon": 85.83},
        "moon": {"lon": 133.21},
        "mercury": {"lon": 95.45},
        "venus": {"lon": 110.20},
        "mars": {"lon": 45.30},
        "jupiter": {"lon": 200.15},
        "saturn": {"lon": 290.45},
        "uranus": {"lon": 15.60},
        "neptune": {"lon": 325.80},
        "pluto": {"lon": 270.25}
      },
      "houses": [
        {"lon": 300.32}, {"lon": 330.15}, {"lon": 355.24},
        {"lon": 20.32}, {"lon": 45.15}, {"lon": 75.24},
        {"lon": 120.32}, {"lon": 150.15}, {"lon": 175.24},
        {"lon": 200.32}, {"lon": 225.15}, {"lon": 255.24}
      ]
    },
    "outer": {
      "name": "Progressed",
      "planets": {
        "sun": {"lon": 115.20},
        "moon": {"lon": 200.45},
        "mercury": {"lon": 125.30},
        "venus": {"lon": 140.50},
        "mars": {"lon": 75.80},
        "jupiter": {"lon": 210.30},
        "saturn": {"lon": 295.60},
        "uranus": {"lon": 18.40},
        "neptune": {"lon": 327.90},
        "pluto": {"lon": 272.10}
      }
    }
  }'
```

### Using Python

```python
import requests
import base64

response = requests.post(
    'http://localhost:3000/api/v1/chart/render/biwheel',
    headers={'Authorization': 'Bearer YOUR_API_KEY'},
    json={
        'inner': {
            'name': 'Natal',
            'planets': {
                'sun': {'lon': 85.83},
                'moon': {'lon': 133.21},
                # ... other planets
            },
            'houses': [
                {'lon': 300.32},
                # ... 12 houses total
            ]
        },
        'outer': {
            'name': 'Progressed',
            'planets': {
                'sun': {'lon': 115.20},
                # ... other planets
            }
        }
    }
)

# Save image
image_data = response.json()['data']['image']
with open('chart.png', 'wb') as f:
    f.write(base64.b64decode(image_data))
```

## Common Use Cases

### 1. Secondary Progressions

```json
{
  "inner": { "name": "Natal", "planets": {...}, "houses": [...] },
  "outer": { "name": "Progressed", "planets": {...} }
}
```

### 2. Solar Return

```json
{
  "inner": { "name": "Natal", "planets": {...}, "houses": [...] },
  "outer": { "name": "Solar Return 2025", "planets": {...} }
}
```

### 3. Lunar Return

```json
{
  "inner": { "name": "Natal", "planets": {...}, "houses": [...] },
  "outer": { "name": "Lunar Return", "planets": {...} }
}
```

## Customization

### Control Aspects

```json
{
  "biwheelSettings": {
    "aspectSettings": {
      "inner": {"enabled": true, "orb": 6},
      "outer": {"enabled": true, "orb": 6},
      "crossAspects": {"enabled": true, "orb": 3}
    }
  }
}
```

### Change Size and Format

```json
{
  "renderOptions": {
    "format": "png",
    "width": 1200,
    "height": 1200,
    "theme": "dark"
  }
}
```

## Key Points

✅ **Inner chart** requires planets + houses  
✅ **Outer chart** requires only planets (houses optional)  
✅ **Three aspect systems**: inner, outer, and cross-aspects  
✅ **Flexible**: Use for any dual chart comparison  

## More Information

- Full API docs: [docs/API.md](docs/API.md)
- Detailed guide: [docs/BIWHEEL_CHARTS.md](docs/BIWHEEL_CHARTS.md)
- Examples: [examples/](examples/)

## Need Help?

1. Check [docs/BIWHEEL_CHARTS.md](docs/BIWHEEL_CHARTS.md) for detailed documentation
2. Review [examples/](examples/) for working code samples
3. See [docs/API.md](docs/API.md) for complete API reference

