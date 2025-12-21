# Deployment Guide for Nocturna Chart Service

This directory contains deployment configurations and scripts for staging and production environments.

## Structure

```
deploy/
├── stage/                  # Staging environment
│   ├── docker-compose.stage.yml
│   └── deploy.sh
├── prod/                   # Production environment (Blue-Green)
│   ├── docker-compose.blue.yml
│   ├── docker-compose.green.yml
│   ├── docker-compose.nginx.yml
│   ├── nginx.conf
│   ├── deploy.sh
│   ├── switch.sh
│   ├── rollback.sh
│   └── status.sh
├── README.md               # This file
└── NETWORK.md              # Docker network configuration guide
```

## Prerequisites

- Docker and Docker Compose installed
- Git repository access
- `.env` file in project root (based on `.env.example`)
- Bash shell (Linux/macOS) or Git Bash (Windows)
- Shared Docker network `nocturna-network` (created automatically)

**Note:** If you have other Nocturna services, they can share the same `nocturna-network`. See [NETWORK.md](NETWORK.md) for details.

## Environment Setup

Create `.env` file in the project root:

```bash
# Required
API_KEY=your-secure-production-api-key

# Optional (with defaults)
NODE_ENV=production
PORT=3011
HOST=0.0.0.0
MAX_CONCURRENT_RENDERS=5
RENDER_TIMEOUT=10000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
CORS_ORIGIN=*
```

**Important:** Both staging and production use the same `.env` file from the project root.

## Staging Deployment

Staging uses a simple single-instance deployment for testing.

### Deploy to Staging

```bash
cd deploy/stage
./deploy.sh
```

The service will be available at: `http://localhost:3013`

### Staging Commands

```bash
# View logs
docker-compose -f docker-compose.stage.yml logs -f

# Restart service
docker-compose -f docker-compose.stage.yml restart

# Stop service
docker-compose -f docker-compose.stage.yml down

# Rebuild and restart
./deploy.sh
```

## Production Deployment (Blue-Green)

Production uses Blue-Green deployment strategy for zero-downtime updates.

### Architecture

- **Blue Slot**: Port 3011
- **Green Slot**: Port 3012
- **Nginx**: Routes traffic to active slot
- **Shared .env**: Both slots use the same configuration

### Initial Setup

1. **Create shared network (if not exists):**
   ```bash
   docker network create nocturna-network
   # Note: This network is shared across all Nocturna services
   # If it already exists from another service, you'll get a harmless error
   ```

2. **Deploy first version to blue:**
   ```bash
   cd deploy/prod
   ./deploy.sh v1.0.0
   ```

3. **Start nginx:**
   ```bash
   docker-compose -f docker-compose.nginx.yml up -d
   ```

4. **Switch traffic to blue:**
   ```bash
   ./switch.sh
   ```

### Deployment Workflow

#### 1. Deploy New Version

Deploy to the inactive slot (automatically detected):

```bash
cd deploy/prod
./deploy.sh v1.1.0
```

This will:
- Pull latest code
- Build Docker image with version tag
- Deploy to inactive slot (blue or green)
- Verify health checks
- Leave traffic on current active slot

#### 2. Test New Deployment

Test the new deployment directly:

```bash
# If deployed to green (port 3012)
curl http://localhost:3012/health

# Test with actual chart
curl -X POST http://localhost:3012/api/chart \
  -H 'Content-Type: application/json' \
  -H 'X-API-Key: YOUR_KEY' \
  -d @../../examples/chart-without-houses.json \
  --output test-chart.png

# Or use nginx direct access
curl http://localhost/green/health
```

#### 3. Switch Traffic

Once satisfied with testing:

```bash
./switch.sh
```

This will:
- Verify new slot is healthy
- Update nginx configuration
- Reload nginx (zero downtime)
- Switch active slot marker

#### 4. Monitor and Verify

```bash
# Check deployment status
./status.sh

# Watch logs of new active slot
docker-compose -f docker-compose.green.yml logs -f  # or blue

# Monitor metrics
curl http://localhost/metrics
```

#### 5. Clean Up Old Slot

After confirming new version is stable:

```bash
# Stop the old (inactive) slot
docker-compose -f docker-compose.blue.yml down  # or green
```

### Rollback

If issues are discovered after switching:

```bash
./rollback.sh
```

This will:
- Verify old slot is still healthy
- Switch traffic back to previous slot
- Update active slot marker

**Note:** Rollback only works if you haven't stopped the old slot yet.

### Status Monitoring

Check current deployment status:

```bash
./status.sh
```

Output shows:
- Active slot
- Health status of both slots
- Version information
- Container status
- Resource usage

## Docker Image Optimization

The `Dockerfile` uses multi-stage build for optimal caching:

### Build Stages

1. **Base**: System dependencies (Chromium, fonts, libraries)
2. **Dependencies**: npm packages installation
3. **Production**: Final image with application code

### Benefits

- **Fast rebuilds**: Code changes don't trigger npm reinstall
- **Layer caching**: System dependencies cached separately
- **Smaller images**: Only production dependencies included
- **Security**: Runs as non-root user

### Build Arguments

```bash
# Build with specific version
docker build -t nocturna-chart-service:v1.2.0 .

# Build with cache-from for faster builds
docker build --cache-from nocturna-chart-service:latest -t nocturna-chart-service:v1.2.0 .
```

## Common Operations

### Check Running Containers

```bash
docker ps --filter "name=nocturna"
```

### View Logs

```bash
# All nocturna containers
docker logs -f nocturna-chart-blue
docker logs -f nocturna-chart-green
docker logs -f nocturna-nginx

# Using compose
docker-compose -f docker-compose.blue.yml logs -f
```

### Restart Specific Slot

```bash
docker-compose -f docker-compose.blue.yml restart
```

### Update Nginx Configuration

After modifying `nginx.conf`:

```bash
docker exec nocturna-nginx nginx -t  # Test config
docker exec nocturna-nginx nginx -s reload  # Reload
```

### Force Rebuild

```bash
./deploy.sh v1.2.0
# Builds fresh image, deploys to inactive slot
```

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose -f docker-compose.blue.yml logs

# Check system resources
docker stats

# Verify .env file
cat ../../.env
```

### Health Check Fails

```bash
# Direct health check
curl http://localhost:3011/health
curl http://localhost:3012/health

# Check container status
docker ps -a --filter "name=nocturna"

# Enter container
docker exec -it nocturna-chart-blue sh
```

### Nginx Issues

```bash
# Check nginx config
docker exec nocturna-nginx nginx -t

# View nginx logs
docker logs nocturna-nginx

# Restart nginx
docker-compose -f docker-compose.nginx.yml restart
```

### Both Slots Down

```bash
# Check if containers are running
./status.sh

# Restart active slot quickly
docker-compose -f docker-compose.blue.yml up -d

# Or redeploy
./deploy.sh
```

## Security Considerations

1. **API Key**: Set strong API_KEY in `.env`
2. **Network**: Use Docker network isolation
3. **User**: Containers run as non-root user
4. **Updates**: Keep base images updated
5. **Secrets**: Never commit `.env` to git
6. **HTTPS**: Configure SSL in nginx for production
7. **Firewall**: Restrict access to deployment ports

## Best Practices

1. **Version Tags**: Always use semantic versioning for deployments
2. **Testing**: Thoroughly test new slot before switching
3. **Monitoring**: Watch logs and metrics after switch
4. **Keep Old Slot**: Don't remove old slot immediately after switch
5. **Backups**: Keep previous image tags for quick rollback
6. **Health Checks**: Verify health before and after switch
7. **Documentation**: Update CHANGELOG.md with each deployment

## CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: Deploy to Production

on:
  push:
    tags:
      - 'v*'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to production
        run: |
          cd deploy/prod
          ./deploy.sh ${{ github.ref_name }}
          
      - name: Run smoke tests
        run: |
          # Add your tests here
          
      - name: Switch traffic
        run: |
          cd deploy/prod
          ./switch.sh
```

## Monitoring and Alerts

### Prometheus Metrics

Available at: `http://localhost/metrics`

Key metrics:
- `chart_renders_total` - Total number of chart renders
- `chart_render_errors_total` - Total render errors
- `chart_render_duration_seconds` - Render duration histogram
- `browser_instances_active` - Active browser instances

### Log Aggregation

Logs location:
- Blue slot: `docker logs nocturna-chart-blue`
- Green slot: `docker logs nocturna-chart-green`
- Nginx: Volume `nocturna-nginx-logs`

## Multi-Service Setup

This service is part of the Nocturna platform and shares the Docker network `nocturna-network` with other services.

### Service Communication

Services can communicate using container names:

```bash
# From another Nocturna service
curl http://nocturna-chart-blue:3011/health
```

### Port Allocation

Ensure each Nocturna service uses unique external ports:

| Service | Blue Port | Green Port |
|---------|-----------|------------|
| Chart   | 3011      | 3012       |
| (Add your other services here) |

**For detailed network configuration, see [NETWORK.md](NETWORK.md)**

## Support

For issues or questions:
1. Check logs: `./status.sh` and container logs
2. Review CHANGELOG.md for known issues
3. Consult network guide: [NETWORK.md](NETWORK.md)
4. Consult main documentation in `docs/`
