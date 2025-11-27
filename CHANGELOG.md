# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Biwheel chart support** - new generic dual chart endpoint (`POST /api/v1/chart/render/biwheel`)
  - Flexible dual-wheel charts for progressions, solar returns, lunar returns, and more
  - Independent aspect settings for inner circle, outer circle, and cross-aspects
  - Optional outer chart houses (defaults to inner chart houses if not provided)
  - Configurable house source (`useHousesFrom`: "inner" or "outer")
  - Comprehensive documentation in `docs/BIWHEEL_CHARTS.md`
- Support for retrograde planets - new optional `retrograde` boolean field in planet data
  - When set to `true`, a small 'R' symbol appears next to the planet icon on the chart
  - Defaults to `false` for backward compatibility
  - Works with natal, transit, synastry, and biwheel charts
- Updated to nocturna-wheel v3.1.0 with retrograde planet support

### Planned
- Caching layer for identical chart requests
- Additional celestial bodies (Lilith, Chiron, North Node)
- Async rendering queue system
- Composite chart calculations

## [1.0.0] - 2025-11-10

### Added
- Initial release of Nocturna Chart Service
- Natal chart rendering endpoint (`POST /api/v1/chart/render`)
- Transit chart rendering endpoint (`POST /api/v1/chart/render/transit`)
- Synastry chart rendering endpoint (`POST /api/v1/chart/render/synastry`)
- Health check endpoint (`GET /health`)
- Prometheus metrics endpoint (`GET /metrics`)
- API key authentication
- Rate limiting (100 requests per minute)
- Request validation with Zod schemas
- Browser management service with Puppeteer
- Chart rendering service with nocturna-wheel integration
- Structured JSON logging with Winston
- Docker containerization with health checks
- Comprehensive API documentation
- Integration guide with Python client example
- OpenAPI 3.0 specification
- Unit and integration tests with Jest
- GitHub Actions workflows for CI/CD

### Features
- Support for all 10 classical planets (Sun through Pluto)
- Placidus house system support
- Major aspects: conjunction, opposition, trine, square, sextile
- Configurable aspect orbs
- PNG output format (800x800 default)
- Light theme
- Concurrent render limiting (5 max by default)
- Graceful shutdown handling
- Browser auto-recovery on crash
- Request logging with correlation IDs
- Error handling with detailed error codes
- CORS support

### Dependencies
- Node.js 20 LTS
- Express.js 4.18
- Puppeteer 21.5
- Zod 3.22
- Winston 3.11
- prom-client 15.1
- nocturna-wheel 2.0

### Documentation
- README.md with quick start guide
- API.md with detailed endpoint documentation
- DEPLOYMENT.md with deployment instructions
- INTEGRATION.md with client examples
- CONTRIBUTING.md for contributors
- OpenAPI specification (openapi.yaml)

### Testing
- Unit tests for validators and services
- Integration tests for API endpoints
- Sample chart fixtures for testing
- Jest configuration with coverage reporting

### DevOps
- Dockerfile for containerization
- docker-compose.yml for easy deployment
- GitHub Actions for automated testing
- GitHub Actions for Docker image publishing
- Health checks for container orchestration

[Unreleased]: https://github.com/eaprelsky/nocturna-image/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/eaprelsky/nocturna-image/releases/tag/v1.0.0

