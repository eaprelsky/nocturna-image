# Deployment Guide

## Overview

Nocturna Chart Service supports multiple deployment strategies:
- **Staging**: Single container for testing
- **Production**: Blue-green deployment for zero-downtime updates

All deployments use a unified script interface in the `scripts/` directory.

## Prerequisites

- Docker and Docker Compose installed
- Node.js 20 LTS (for local development)
- Linux server with at least 1GB RAM
- Bash shell (for deployment scripts)

## Environment Variables

Create a `.env` file in the project root:

```bash
# Required
API_KEY=your-secure-api-key-here

# Optional (with defaults)
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
MAX_CONCURRENT_RENDERS=5
RENDER_TIMEOUT=10000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
CORS_ORIGIN=*
```

## Quick Start

### Deploy to Staging
```bash
./scripts/deploy.sh staging
```

### Deploy to Production
```bash
# First time setup - deploy to blue slot
./scripts/deploy.sh production --slot=blue
./scripts/switch.sh blue

# Regular deployments - auto-select inactive slot
./scripts/deploy.sh production
./scripts/switch.sh

# If issues occur
./scripts/rollback.sh
```

### Check Status
```bash
./scripts/status.sh
```

## Deployment Strategies

### Strategy 1: Staging Deployment

**Purpose**: Testing and validation before production

**Ports**: 3013

**Usage**:
```bash
# Deploy to staging
./scripts/deploy.sh staging

# Check health
curl http://localhost:3013/health

# View logs
docker-compose -f deploy/stage/docker-compose.stage.yml logs -f
```

**Features**:
- Single container
- Quick deployment
- Automatically pulls latest code
- Health check validation
- Simple rollback (just redeploy)

### Strategy 2: Production Blue-Green Deployment

**Purpose**: Zero-downtime production deployments

**Ports**: 
- Blue slot: 3014
- Green slot: 3012

**Architecture**:
```
                    ┌─────────────┐
                    │   Nginx     │
                    │ (Port 3011) │
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              │                         │
      ┌───────▼────────┐       ┌───────▼────────┐
      │   Blue Slot    │       │  Green Slot    │
      │  (Port 3014)   │       │  (Port 3012)   │
      │    [ACTIVE]    │       │   [STANDBY]    │
      └────────────────┘       └────────────────┘
```

**Workflow**:

1. **Check current status**:
   ```bash
   ./scripts/status.sh
   ```

2. **Deploy to inactive slot** (automatically detected):
   ```bash
   ./scripts/deploy.sh production
   ```

3. **Test new deployment**:
   ```bash
   # Blue slot
   curl http://localhost:3014/health
   curl -X POST http://localhost:3014/api/chart \
     -H "X-API-Key: YOUR_KEY" \
     -H "Content-Type: application/json" \
     -d @examples/chart-without-houses.json

   # Green slot
   curl http://localhost:3012/health
   ```

4. **Switch traffic**:
   ```bash
   # Auto-switch to newly deployed slot
   ./scripts/switch.sh

   # Or explicitly specify slot
   ./scripts/switch.sh blue
   ./scripts/switch.sh green
   ```

5. **Monitor new deployment**:
   ```bash
   ./scripts/status.sh
   docker-compose -f deploy/prod/docker-compose.blue.yml logs -f
   ```

6. **Rollback if needed**:
   ```bash
   ./scripts/rollback.sh
   ```

**Benefits**:
- Zero downtime deployments
- Instant rollback capability
- Test new version before going live
- Both slots available for A/B testing
- Safe production updates

### Strategy 3: Manual Docker Deployment

**Build image**:
```bash
# Standard build (uses cache)
docker build -t nocturna-chart-service:latest .

# Full rebuild (no cache)
docker build --no-cache -t nocturna-chart-service:latest .

# With BuildKit optimizations (recommended)
DOCKER_BUILDKIT=1 docker build -t nocturna-chart-service:latest .
```

**Run container**:
```bash
docker run -d \
  --name nocturna-chart-service \
  -p 3000:3011 \
  -e API_KEY=your-api-key \
  -e NODE_ENV=production \
  --restart unless-stopped \
  --memory=1G \
  --cpus=0.9 \
  nocturna-chart-service:latest
```

**View logs**:
```bash
docker logs -f nocturna-chart-service
```

### Strategy 4: Direct Node.js (Development Only)

1. **Install dependencies:**
   ```bash
   npm ci --only=production
   ```

2. **Set environment variables:**
   ```bash
   export API_KEY=your-api-key
   export NODE_ENV=production
   ```

3. **Start service:**
   ```bash
   npm start
   ```

4. **Use PM2 for production:**
   ```bash
   npm install -g pm2
   pm2 start src/app.js --name nocturna-chart-service
   pm2 save
   pm2 startup
   ```

## Docker Optimization

The Dockerfile uses multi-stage builds for optimal caching and minimal image size:

### Stage 1: Base Image
- Node.js 20 slim
- System dependencies (Chromium, fonts, libraries)
- Cached unless system packages change

### Stage 2: Dependencies
- npm dependencies installed
- Cached unless package.json/package-lock.json changes
- Uses BuildKit cache mounts for faster rebuilds

### Stage 3: Production
- Application code copied
- Non-root user for security
- Health checks configured
- Minimal final image size

### BuildKit Features

The Dockerfile uses BuildKit cache mounts for:
- **APT cache**: Speeds up system package installation
- **npm cache**: Speeds up dependency installation

**Enable BuildKit**:
```bash
export DOCKER_BUILDKIT=1
docker build -t nocturna-chart-service:latest .
```

### Layer Caching Strategy

Changes to these files trigger rebuild of different layers:

1. **Dockerfile changes** → Full rebuild
2. **package*.json changes** → Rebuild from dependencies stage
3. **Source code changes** → Only copy application files (fast)

This means most code changes result in very fast rebuilds (< 30 seconds).

## Deployment Scripts Reference

### scripts/deploy.sh

Main deployment entry point.

**Staging**:
```bash
./scripts/deploy.sh staging
```

**Production**:
```bash
# Auto-select inactive slot
./scripts/deploy.sh production

# Deploy to specific slot
./scripts/deploy.sh production --slot=blue
./scripts/deploy.sh production --slot=green

# Force rebuild without cache
./scripts/deploy.sh production --no-cache
```

### scripts/switch.sh

Switch production traffic between slots.

```bash
# Auto-switch to inactive slot
./scripts/switch.sh

# Explicit slot
./scripts/switch.sh blue
./scripts/switch.sh green
```

**What it does**:
1. Checks target slot health
2. Updates nginx configuration
3. Reloads nginx
4. Verifies switch success
5. Updates .active_slot metadata

### scripts/rollback.sh

Emergency rollback to previous slot.

```bash
./scripts/rollback.sh
```

**What it does**:
1. Identifies current active slot
2. Checks standby slot health
3. Switches traffic back
4. Verifies rollback success

**Use when**:
- New deployment has critical bugs
- Performance degradation detected
- Failed health checks
- Emergency situations

### scripts/status.sh

View status of all environments.

```bash
./scripts/status.sh
```

**Shows**:
- Staging environment status
- Production blue/green status
- Active/standby indicators
- Health checks
- Container status
- Resource usage
- Quick command reference

## Reverse Proxy (Nginx)

### Basic Nginx Configuration

For production deployment with HTTPS:

```nginx
server {
    listen 80;
    server_name chart.nocturna.ru;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name chart.nocturna.ru;

    ssl_certificate /etc/letsencrypt/live/chart.nocturna.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/chart.nocturna.ru/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Include upstream configuration
    include /etc/nginx/upstreams/nocturna-img-production.conf;

    location / {
        proxy_pass http://nocturna-img-production;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeout for chart rendering
        proxy_read_timeout 30s;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
    }

    # Health check endpoint (can be accessed without auth)
    location /health {
        proxy_pass http://nocturna-img-production/health;
        access_log off;
    }
}
```

### Blue-Green Nginx Upstream

Create `/etc/nginx/upstreams/nocturna-img-production.conf`:

```nginx
# Nocturna Chart Service - Blue-Green Upstream
# Managed by scripts/switch.sh
# Active slot is automatically updated during deployment

upstream nocturna-img-production {
    # Active instance (automatically switched)
    server localhost:3014;  # ACTIVE: blue
    
    # Standby instance (commented out)
    # server localhost:3012;  # STANDBY: green
}
```

**How it works**:
- `switch.sh` automatically updates the active server line
- Nginx reloads configuration without downtime
- Only one slot serves traffic at a time
- Other slot remains ready for instant failover

### Direct Access Ports

For testing and debugging, both slots are accessible directly:

```nginx
# Blue slot health check
location /health/blue {
    proxy_pass http://localhost:3014/health;
    access_log off;
}

# Green slot health check
location /health/green {
    proxy_pass http://localhost:3012/health;
    access_log off;
}
```

## Monitoring

### Prometheus Configuration

Add to `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'nocturna-chart-service'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
    scrape_interval: 15s
```

### Grafana Dashboard

Import dashboard with queries:

1. **Request Rate:**
   ```promql
   rate(chart_renders_total[5m])
   ```

2. **Error Rate:**
   ```promql
   rate(chart_render_errors_total[5m])
   ```

3. **Response Time (p95):**
   ```promql
   histogram_quantile(0.95, rate(chart_render_duration_seconds_bucket[5m]))
   ```

4. **Active Renders:**
   ```promql
   browser_instances_active
   ```

## Health Checks

### Endpoint
```bash
curl http://localhost:3000/health
```

### Expected Response
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 3600,
  "checks": {
    "browser": "ok"
  }
}
```

### Kubernetes Liveness Probe
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3
```

## Scaling

### Horizontal Scaling

Deploy multiple instances behind a load balancer:

```yaml
# docker-compose.scale.yml
version: '3.8'

services:
  chart-service:
    build: .
    environment:
      - API_KEY=${CHART_SERVICE_API_KEY}
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 1G
          cpus: '1.0'

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - chart-service
```

### Nginx Load Balancer

```nginx
upstream chart_service {
    least_conn;
    server chart-service-1:3000;
    server chart-service-2:3000;
    server chart-service-3:3000;
}

server {
    listen 80;
    
    location / {
        proxy_pass http://chart_service;
        proxy_next_upstream error timeout http_503;
    }
}
```

## Backup and Recovery

### Configuration Backup
```bash
# Backup environment variables
cp .env .env.backup

# Backup configuration
tar -czf config-backup.tar.gz .env docker-compose.yml
```

### Container Backup
```bash
# Export container
docker export nocturna-chart-service > chart-service-backup.tar

# Import container
docker import chart-service-backup.tar nocturna-chart-service:backup
```

## Troubleshooting

### Deployment Issues

**Health check fails after deployment**:
```bash
# Check logs for specific slot
docker-compose -f deploy/prod/docker-compose.blue.yml logs --tail=100
docker-compose -f deploy/prod/docker-compose.green.yml logs --tail=100

# Check container status
docker ps -a | grep nocturna-chart

# Restart unhealthy slot
docker-compose -f deploy/prod/docker-compose.blue.yml restart
```

**Both slots are unhealthy**:
```bash
# Check Docker network
docker network inspect nocturna-network

# Recreate network
docker network rm nocturna-network
docker network create nocturna-network

# Redeploy
./scripts/deploy.sh production --no-cache
```

**Deployment script fails**:
```bash
# Check script permissions
ls -la scripts/*.sh

# Make scripts executable (Linux/Mac)
chmod +x scripts/*.sh deploy/prod/*.sh deploy/stage/*.sh

# Check .env file exists
ls -la .env

# Verify Docker is running
docker ps
```

### Runtime Issues

**Browser not starting**:
```bash
# Check logs
docker logs nocturna-chart-blue
docker logs nocturna-chart-green

# Verify Chrome installation
docker exec nocturna-chart-blue chromium --version

# Check permissions
docker exec nocturna-chart-blue ls -la /usr/bin/chromium
```

**Memory issues**:
```bash
# Check container memory
docker stats

# Increase memory limit in docker-compose files
# Edit deploy/prod/docker-compose.blue.yml:
#   resources:
#     limits:
#       memory: 2G
```

**Slow rendering**:
- Reduce `MAX_CONCURRENT_RENDERS` in .env
- Increase server resources
- Check both slots are not running simultaneously
- Monitor resource usage: `./scripts/status.sh`

### Blue-Green Specific Issues

**Wrong slot is active**:
```bash
# Check current active slot
cat deploy/prod/.active_slot

# Manually switch if needed
./scripts/switch.sh blue   # or green
```

**Cannot switch traffic**:
```bash
# Ensure target slot is healthy
curl http://localhost:3014/health  # blue
curl http://localhost:3012/health  # green

# Check nginx is running
docker ps | grep nginx

# Restart nginx if needed
docker restart nocturna-nginx
```

**Rollback not working**:
```bash
# Check standby slot is healthy
./scripts/status.sh

# If standby slot is down, start it
docker-compose -f deploy/prod/docker-compose.green.yml up -d

# Wait for health check
sleep 10

# Try rollback again
./scripts/rollback.sh
```

**Network issues between slots**:
```bash
# Verify network exists
docker network inspect nocturna-network

# Check all containers are on the network
docker network inspect nocturna-network | grep Name

# Reconnect container to network if needed
docker network connect nocturna-network nocturna-chart-blue
```

## Security Checklist

- [ ] Set strong API_KEY
- [ ] Enable HTTPS in production
- [ ] Configure CORS appropriately
- [ ] Run container as non-root user
- [ ] Keep dependencies updated
- [ ] Monitor logs for suspicious activity
- [ ] Set up rate limiting
- [ ] Configure firewall rules

## Production Checklist

### Initial Setup
- [ ] Environment variables configured in `.env`
- [ ] API key set and secure
- [ ] Docker and Docker Compose installed
- [ ] Scripts made executable (`chmod +x scripts/*.sh`)
- [ ] Docker network created (`nocturna-network`)
- [ ] HTTPS/SSL certificates configured

### Blue-Green Deployment Setup
- [ ] Both blue and green slots deployed
- [ ] Both slots pass health checks
- [ ] Nginx upstream configured (`/etc/nginx/upstreams/nocturna-img-production.conf`)
- [ ] Active slot metadata file exists (`deploy/prod/.active_slot`)
- [ ] Traffic routing tested
- [ ] Switch script tested
- [ ] Rollback script tested

### Security
- [ ] Run containers as non-root user (configured in Dockerfile)
- [ ] Set resource limits (memory, CPU)
- [ ] Configure CORS appropriately
- [ ] Keep dependencies updated
- [ ] Monitor logs for suspicious activity
- [ ] Set up rate limiting
- [ ] Configure firewall rules
- [ ] Enable security headers in Nginx

### Monitoring & Observability
- [ ] Health checks working on both slots
- [ ] Metrics endpoint accessible (`/metrics`)
- [ ] Prometheus scraping configured
- [ ] Grafana dashboards created
- [ ] Log aggregation configured
- [ ] Alerts set up for critical issues
- [ ] Status script tested (`./scripts/status.sh`)

### Testing
- [ ] Staging deployment tested
- [ ] Production deployment tested
- [ ] Traffic switching tested
- [ ] Rollback tested
- [ ] Load testing completed
- [ ] Blue-green workflow documented
- [ ] Emergency procedures tested

### Operational
- [ ] Deployment runbook created
- [ ] On-call rotation established
- [ ] Backup procedures documented
- [ ] Disaster recovery plan ready
- [ ] Team trained on deployment scripts
- [ ] Documentation updated

### Regular Maintenance
- [ ] Schedule regular deployments
- [ ] Monitor resource usage trends
- [ ] Review and update dependencies monthly
- [ ] Test disaster recovery quarterly
- [ ] Review security settings quarterly
- [ ] Update documentation as needed

## Additional Resources

- [Script Documentation](../scripts/README.md) - Detailed script usage
- [API Documentation](API.md) - API endpoints and usage
- [Project Structure](PROJECT_STRUCTURE.md) - Codebase organization
- [Integration Guide](INTEGRATION.md) - Integration examples
- [Network Configuration](../deploy/NETWORK.md) - Network setup details

