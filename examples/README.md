# Nocturna Chart Service - Examples

This directory contains example scripts demonstrating how to use the Nocturna Chart Service API.

## Prerequisites

- Running Nocturna Chart Service instance
- Valid API key
- For Python examples: `requests` library (`pip install requests`)
- For shell examples: `curl` and `jq` (optional, for JSON formatting)

## Configuration

Set environment variables:

```bash
export API_URL="http://localhost:3000"
export API_KEY="your-api-key-here"
```

## Examples

### House Display Toggle

The service supports toggling the visibility of house divisions and numbering through the `showHouses` option.

**Test script:**
```bash
chmod +x test-show-houses.sh
./test-show-houses.sh
```

This generates three comparison images:
- `chart-with-houses.png` - WITH house lines and numbers (default)
- `chart-without-houses.png` - WITHOUT house lines and numbers
- `biwheel-without-houses.png` - Biwheel WITHOUT house lines

**Example JSON files:**
- `chart-without-houses.json` - Natal chart with `showHouses: false`
- `biwheel-without-houses.json` - Biwheel chart with `showHouses: false`

**Usage:**
```json
{
  "planets": { ... },
  "houses": [ ... ],  // still required!
  "renderOptions": {
    "showHouses": false
  }
}
```

**Note:** The `houses` array is always required, even when `showHouses` is `false`, as it's needed for chart rotation and calculations. The option only controls visual display.

### Biwheel Chart (Bash)

Render a biwheel chart (Natal + Progressed) using curl:

```bash
chmod +x biwheel-chart-example.sh
./biwheel-chart-example.sh
```

To save the image:

```bash
./biwheel-chart-example.sh | jq -r '.data.image' | base64 -d > biwheel-chart.png
```

### Biwheel Chart (Python)

Render a biwheel chart using Python:

```bash
python3 biwheel_chart_example.py
```

This will:
1. Send a biwheel chart request to the API
2. Save the resulting image as `biwheel-chart.png`
3. Print chart information and statistics

## Use Cases

### 1. Secondary Progressions

Compare natal chart with progressed positions:

```python
inner_chart = natal_chart_data  # Your natal chart
outer_chart = progressed_chart_data  # Progressed positions
```

### 2. Solar Return

Overlay solar return chart on natal:

```python
inner_chart = natal_chart_data
outer_chart = solar_return_chart_data
```

### 3. Lunar Return

Overlay lunar return chart on natal:

```python
inner_chart = natal_chart_data
outer_chart = lunar_return_chart_data
```

## Customization

### Aspect Settings

Control which aspects are displayed:

```python
biwheel_settings = {
    'aspectSettings': {
        'inner': {'enabled': True, 'orb': 6},      # Natal-to-natal aspects
        'outer': {'enabled': True, 'orb': 6},      # Progressed-to-progressed aspects
        'crossAspects': {'enabled': True, 'orb': 3}  # Natal-to-progressed aspects
    }
}
```

### Render Options

Customize the output:

```python
render_options = {
    'format': 'png',      # png, svg, or jpeg
    'width': 1000,        # 400-2000 pixels
    'height': 1000,       # 400-2000 pixels
    'quality': 90,        # 1-100 (for PNG/JPEG)
    'theme': 'light',     # light or dark
    'showHouses': True    # True (default) or False - toggle house display
}
```

### House Selection

Choose which chart's houses to use:

```python
biwheel_settings = {
    'useHousesFrom': 'inner'  # or 'outer'
}
```

## API Documentation

For complete API documentation, see:
- [API.md](../docs/API.md) - Full API reference
- [BIWHEEL_CHARTS.md](../docs/BIWHEEL_CHARTS.md) - Biwheel chart documentation

## Troubleshooting

### Authentication Error (401)

Make sure your API key is correct:

```bash
export API_KEY="your-correct-api-key"
```

### Connection Error

Check that the service is running:

```bash
curl http://localhost:3000/health
```

### Rate Limit Error (429)

Wait a moment and try again. The default rate limit is 100 requests per minute.

### Validation Error (400)

Check that:
- All required planets are provided (sun, moon, mercury, venus, mars, jupiter, saturn, uranus, neptune, pluto)
- Planet longitudes are between 0-360
- Exactly 12 house cusps are provided for inner chart
- House cusps longitudes are between 0-360

## Support

For issues or questions:
- Check the [API documentation](../docs/API.md)
- Review the [integration guide](../docs/INTEGRATION.md)
- Open an issue on GitHub

