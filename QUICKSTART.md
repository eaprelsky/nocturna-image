# Quick Start Guide

Get Nocturna Chart Service up and running in 5 minutes.

## Prerequisites

- Node.js 20+ OR Docker
- Chrome/Chromium (auto-installed with Puppeteer)

## Option 1: Docker (Recommended)

1. **Clone and configure:**
   ```bash
   git clone <repository-url>
   cd nocturna-image
   echo "CHART_SERVICE_API_KEY=my-secret-key" > .env
   ```

2. **Start service:**
   ```bash
   docker-compose up -d
   ```

3. **Test it:**
   ```bash
   curl http://localhost:3000/health
   ```

## Option 2: Node.js

1. **Install:**
   ```bash
   npm install
   cp .env.example .env
   # Edit .env and set API_KEY
   ```

2. **Run:**
   ```bash
   npm start
   ```

## Make Your First Request

Create `test-chart.json`:

```json
{
  "planets": {
    "sun": { "lon": 85.83 },
    "moon": { "lon": 133.21 },
    "mercury": { "lon": 95.45 },
    "venus": { "lon": 110.20 },
    "mars": { "lon": 45.30 },
    "jupiter": { "lon": 200.15 },
    "saturn": { "lon": 290.45 },
    "uranus": { "lon": 15.60 },
    "neptune": { "lon": 325.80 },
    "pluto": { "lon": 270.25 }
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
    "height": 800
  }
}
```

Render chart:

```bash
curl -X POST http://localhost:3000/api/v1/chart/render \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d @test-chart.json \
  | jq -r '.data.image' \
  | base64 -d > chart.png
```

Open `chart.png` to see your chart!

## Next Steps

- Read [API Documentation](docs/API.md) for all endpoints
- See [Integration Guide](docs/INTEGRATION.md) for client examples
- Check [Deployment Guide](docs/DEPLOYMENT.md) for production setup

## Troubleshooting

**Service won't start:**
- Check if port 3000 is available
- Verify Chrome/Chromium is installed
- Check logs: `docker-compose logs -f`

**Browser errors:**
- Increase memory limit in docker-compose.yml
- Reduce MAX_CONCURRENT_RENDERS in .env

**Authentication errors:**
- Verify API_KEY is set in .env
- Check Authorization header format: `Bearer YOUR_KEY`

## Get Help

- Check [README.md](README.md)
- Open an issue on GitHub
- See requirements doc: `nocturna-image-req.md`

