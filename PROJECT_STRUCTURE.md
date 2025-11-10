# Project Structure

```
nocturna-image/
├── .github/
│   └── workflows/
│       ├── docker-publish.yml    # Docker image publishing workflow
│       └── test.yml               # CI/CD tests workflow
│
├── docs/
│   ├── API.md                     # Complete API documentation
│   ├── DEPLOYMENT.md              # Deployment guide
│   └── INTEGRATION.md             # Integration guide with client examples
│
├── src/
│   ├── api/
│   │   ├── controllers/
│   │   │   ├── chart.controller.js       # Chart rendering endpoints
│   │   │   └── health.controller.js      # Health and metrics endpoints
│   │   │
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js        # API key authentication
│   │   │   ├── errorHandler.middleware.js # Error handling
│   │   │   ├── rateLimit.middleware.js   # Rate limiting
│   │   │   ├── requestLogger.middleware.js # Request logging
│   │   │   └── validation.middleware.js  # Request validation
│   │   │
│   │   ├── routes/
│   │   │   ├── chart.routes.js           # Chart API routes
│   │   │   ├── health.routes.js          # Health/metrics routes
│   │   │   └── index.js                  # Route aggregator
│   │   │
│   │   └── validators/
│   │       └── chart.validator.js        # Zod schemas for validation
│   │
│   ├── config/
│   │   ├── index.js                      # Main configuration
│   │   ├── logger.config.js              # Winston logger config
│   │   └── puppeteer.config.js           # Puppeteer browser config
│   │
│   ├── services/
│   │   ├── browser.service.js            # Browser lifecycle management
│   │   └── chartRenderer.service.js      # Chart rendering logic
│   │
│   ├── templates/
│   │   └── chart.html                    # HTML template for chart rendering
│   │
│   ├── utils/
│   │   ├── errors.js                     # Custom error classes
│   │   ├── logger.js                     # Logger instance
│   │   └── metrics.js                    # Prometheus metrics
│   │
│   └── app.js                            # Express application entry point
│
├── tests/
│   ├── fixtures/
│   │   └── sample-charts.js              # Sample data for testing
│   │
│   ├── integration/
│   │   └── api/
│   │       └── chart.routes.test.js      # API integration tests
│   │
│   └── unit/
│       ├── services/
│       │   └── chartRenderer.service.test.js
│       └── validators/
│           └── chart.validator.test.js
│
├── .dockerignore                         # Docker ignore patterns
├── .eslintrc.js                          # ESLint configuration
├── .gitignore                            # Git ignore patterns
├── .prettierrc                           # Prettier configuration
├── CHANGELOG.md                          # Version history
├── CONTRIBUTING.md                       # Contribution guidelines
├── docker-compose.yml                    # Docker Compose configuration
├── Dockerfile                            # Docker image definition
├── jest.config.js                        # Jest test configuration
├── LICENSE                               # MIT License
├── nocturna-image-req.md                 # Original requirements document
├── openapi.yaml                          # OpenAPI 3.0 specification
├── package.json                          # NPM dependencies and scripts
├── PROJECT_STRUCTURE.md                  # This file
├── QUICKSTART.md                         # Quick start guide
└── README.md                             # Main documentation
```

## Key Files Description

### Configuration Files

- **`.env`**: Environment variables (create from `.env.example`)
- **`package.json`**: NPM package configuration with dependencies and scripts
- **`jest.config.js`**: Jest testing framework configuration
- **`.eslintrc.js`**: ESLint code quality rules
- **`.prettierrc`**: Prettier code formatting rules

### Application Files

- **`src/app.js`**: Main Express application with middleware setup
- **`src/config/`**: Configuration management and environment variables
- **`src/services/`**: Business logic services (browser, rendering)
- **`src/api/`**: HTTP API layer (routes, controllers, middleware)
- **`src/templates/`**: HTML templates for chart rendering
- **`src/utils/`**: Utility functions (logging, metrics, errors)

### Docker Files

- **`Dockerfile`**: Container image definition with Chrome installation
- **`docker-compose.yml`**: Multi-container orchestration
- **`.dockerignore`**: Files excluded from Docker build

### Documentation

- **`README.md`**: Project overview and getting started
- **`QUICKSTART.md`**: 5-minute quick start guide
- **`docs/API.md`**: Complete API endpoint documentation
- **`docs/DEPLOYMENT.md`**: Production deployment guide
- **`docs/INTEGRATION.md`**: Client integration examples
- **`openapi.yaml`**: OpenAPI specification for API

### Testing

- **`tests/unit/`**: Unit tests for individual components
- **`tests/integration/`**: Integration tests for API endpoints
- **`tests/fixtures/`**: Sample test data

### CI/CD

- **`.github/workflows/test.yml`**: Automated testing workflow
- **`.github/workflows/docker-publish.yml`**: Docker image publishing

## NPM Scripts

```json
{
  "start": "node src/app.js",           // Start production server
  "dev": "nodemon src/app.js",          // Start development server with auto-reload
  "test": "jest --coverage",            // Run tests with coverage
  "test:watch": "jest --watch",         // Run tests in watch mode
  "lint": "eslint src/**/*.js",         // Check code quality
  "lint:fix": "eslint src/**/*.js --fix", // Fix code quality issues
  "format": "prettier --write \"src/**/*.js\"" // Format code
}
```

## API Endpoints

### Chart Rendering
- `POST /api/v1/chart/render` - Render natal chart
- `POST /api/v1/chart/render/transit` - Render transit chart
- `POST /api/v1/chart/render/synastry` - Render synastry chart

### System
- `GET /` - API information
- `GET /health` - Health check
- `GET /metrics` - Prometheus metrics

## Environment Variables

See `.env.example` for full list:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Environment mode |
| `PORT` | No | `3000` | Server port |
| `API_KEY` | Yes* | - | Authentication key |
| `MAX_CONCURRENT_RENDERS` | No | `5` | Max parallel renders |
| `RENDER_TIMEOUT` | No | `10000` | Render timeout (ms) |
| `LOG_LEVEL` | No | `info` | Logging level |

*Required in production

## Dependencies

### Production
- `express` - Web framework
- `puppeteer` - Headless browser
- `zod` - Schema validation
- `winston` - Logging
- `prom-client` - Metrics
- `express-rate-limit` - Rate limiting
- `nocturna-wheel` - Chart rendering library

### Development
- `jest` - Testing framework
- `supertest` - HTTP testing
- `eslint` - Code linting
- `prettier` - Code formatting
- `nodemon` - Development server

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env and set API_KEY
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Run tests:**
   ```bash
   npm test
   ```

5. **Build Docker image:**
   ```bash
   docker-compose up -d
   ```

## Architecture Overview

```
┌─────────────────┐
│  Telegram Bot   │
│   (Python)      │
└────────┬────────┘
         │ HTTP POST
         ▼
┌─────────────────────────────────────────┐
│      Nocturna Chart Service             │
│  ┌───────────────────────────────────┐  │
│  │  Express.js API Server            │  │
│  │  - Authentication                 │  │
│  │  - Rate Limiting                  │  │
│  │  - Validation                     │  │
│  └────────────┬──────────────────────┘  │
│               ▼                          │
│  ┌───────────────────────────────────┐  │
│  │  Chart Renderer Service           │  │
│  │  - Load HTML template             │  │
│  │  - Inject chart data              │  │
│  │  - Control browser rendering      │  │
│  └────────────┬──────────────────────┘  │
│               ▼                          │
│  ┌───────────────────────────────────┐  │
│  │  Browser Service (Puppeteer)      │  │
│  │  - Headless Chrome                │  │
│  │  - Page lifecycle management      │  │
│  └────────────┬──────────────────────┘  │
│               ▼                          │
│  ┌───────────────────────────────────┐  │
│  │  nocturna-wheel Library           │  │
│  │  - SVG chart generation           │  │
│  │  - Aspect calculation             │  │
│  └────────────┬──────────────────────┘  │
│               ▼                          │
│         PNG/SVG/JPEG                     │
└─────────────────────────────────────────┘
         │ base64 encoded
         ▼
┌─────────────────┐
│  Telegram Bot   │
│  (sends to user)│
└─────────────────┘
```

## Development Workflow

1. Create feature branch
2. Write tests
3. Implement feature
4. Run tests and linting
5. Update documentation
6. Create pull request
7. CI/CD runs tests
8. Merge to main
9. Docker image published

See `CONTRIBUTING.md` for detailed guidelines.

