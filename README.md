# Nocturna Chart Service

Microservice for rendering astrological natal charts as images using the [nocturna-wheel](https://github.com/eaprelsky/nocturna-wheel) library.

## Features

- 🎯 **Natal Chart Rendering**: Generate natal charts as PNG/SVG/JPEG images
- 🌍 **Transit Charts**: Overlay current transits on natal chart
- 💑 **Synastry Charts**: Compare two people's natal charts
- 🔒 **API Key Authentication**: Secure access control
- ⚡ **Rate Limiting**: Protect against abuse
- 📊 **Prometheus Metrics**: Built-in monitoring
- 🐳 **Docker Ready**: Easy deployment with containers
- 📝 **OpenAPI Documentation**: Complete API specification

## Quick Start

### Prerequisites

- Node.js 20 LTS or higher
- Chrome/Chromium browser (automatically installed with Puppeteer)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd nocturna-chart-service

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
# Set API_KEY to a secure random string

# Start development server
npm run dev
```

The service will start on `http://localhost:3000`

## API Endpoints

### 1. Render Natal Chart

```bash
POST /api/v1/chart/render
Content-Type: application/json
Authorization: Bearer your-api-key

{
  "planets": {
    "sun": { "lon": 85.83, "lat": 0.0 },
    "moon": { "lon": 133.21, "lat": 5.12 }
    // ... other planets
  },
  "houses": [
    { "lon": 300.32 },
    // ... 12 houses total
  ],
  "renderOptions": {
    "format": "png",
    "width": 800,
    "height": 800
  }
}
```

### 2. Render Transit Chart

```bash
POST /api/v1/chart/render/transit
```

### 3. Render Synastry Chart

```bash
POST /api/v1/chart/render/synastry
```

### 4. Health Check

```bash
GET /health
```

### 5. Metrics

```bash
GET /metrics
```

## Configuration

See `.env.example` for all available configuration options:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `API_KEY` | - | API authentication key (required) |
| `MAX_CONCURRENT_RENDERS` | `5` | Max parallel browser instances |
| `RENDER_TIMEOUT` | `10000` | Render timeout in milliseconds |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Max requests per window |
| `LOG_LEVEL` | `info` | Logging level (debug, info, warn, error) |

## Development

```bash
# Run in development mode with auto-reload
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Format code
npm run format
```

## Docker

### Build and Run

```bash
# Build image
docker build -t nocturna-chart-service .

# Run container
docker run -p 3000:3000 \
  -e API_KEY=your-secret-key \
  nocturna-chart-service
```

### Docker Compose

```bash
# Start service
docker-compose up -d

# View logs
docker-compose logs -f

# Stop service
docker-compose down
```

## Integration with Telegram Bot

See `docs/INTEGRATION.md` for Python client implementation and usage examples.

## Performance

| Metric | Target | Critical |
|--------|--------|----------|
| Response Time (p95) | < 3 sec | < 5 sec |
| Throughput | 10 req/min | 5 req/min |
| Error Rate | < 1% | < 5% |

## Monitoring

Prometheus metrics available at `/metrics`:

- `chart_renders_total` - Total render count
- `chart_render_duration_seconds` - Render duration histogram
- `chart_render_errors_total` - Error count by type
- `browser_instances_active` - Active browser count

## License

MIT

## Links

- [nocturna-wheel Library](https://github.com/eaprelsky/nocturna-wheel)
- [Nocturna Calculations API](https://calculations.nocturna.ru/docs)
- [API Documentation](docs/API.md)

