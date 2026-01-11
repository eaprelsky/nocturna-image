# Production Blue-Green Deployment - Quick Start

## First Time Setup

### 1. Prerequisites

```bash
# Ensure Docker is installed
docker --version

# Ensure .env file exists
ls ../../.env

# Make scripts executable (Linux/Mac)
chmod +x ../../scripts/*.sh *.sh
```

### 2. Setup Nginx Upstream

```bash
# Create nginx upstreams directory
sudo mkdir -p /etc/nginx/upstreams

# Copy upstream configuration
sudo cp nginx-upstream.conf.example /etc/nginx/upstreams/nocturna-img-production.conf

# Set proper permissions
sudo chown root:root /etc/nginx/upstreams/nocturna-img-production.conf
sudo chmod 644 /etc/nginx/upstreams/nocturna-img-production.conf
```

### 3. Update Main Nginx Configuration

Add to your nginx server block:

```nginx
# Include upstream
include /etc/nginx/upstreams/nocturna-img-production.conf;

location / {
    proxy_pass http://nocturna-img-production;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_read_timeout 30s;
}
```

Test and reload nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Initial Deployment

```bash
# From project root
cd ../..

# Deploy to blue slot
./scripts/deploy.sh production --slot=blue

# Verify blue slot is healthy
curl http://localhost:3014/health

# Activate blue slot
./scripts/switch.sh blue
```

## Regular Deployment Workflow

### 1. Check Current Status

```bash
./scripts/status.sh
```

Output shows:
- Currently active slot
- Health status of both slots
- Container status
- Resource usage

### 2. Deploy to Inactive Slot

```bash
# Auto-detects inactive slot
./scripts/deploy.sh production
```

This will:
- Determine which slot is inactive
- Pull latest code (if in git repo)
- Build Docker image
- Start container in inactive slot
- Wait for health check
- Show deployment logs

### 3. Test New Deployment

```bash
# Check health
curl http://localhost:3014/health  # blue slot
curl http://localhost:3012/health  # green slot

# Test actual rendering (optional)
curl -X POST http://localhost:3014/api/chart \
  -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d @examples/chart-without-houses.json \
  --output test-chart.png
```

### 4. Switch Traffic

```bash
# Switch to newly deployed slot
./scripts/switch.sh
```

This will:
- Verify new slot is healthy
- Update nginx upstream configuration
- Reload nginx (no downtime)
- Update active slot metadata
- Verify switch was successful

### 5. Monitor

```bash
# Check status
./scripts/status.sh

# View logs of active slot
# If blue is active:
docker-compose -f deploy/prod/docker-compose.blue.yml logs -f

# If green is active:
docker-compose -f deploy/prod/docker-compose.green.yml logs -f
```

### 6. Rollback (If Issues Detected)

```bash
# Instant rollback to previous slot
./scripts/rollback.sh
```

This switches traffic back to the old slot immediately.

## Common Scenarios

### Scenario 1: Emergency Hotfix

```bash
# 1. Check which slot is currently active
./scripts/status.sh

# 2. Make code changes

# 3. Deploy to inactive slot
./scripts/deploy.sh production

# 4. Immediately switch (if urgent)
./scripts/switch.sh

# 5. If problems occur, rollback
./scripts/rollback.sh
```

**Time to deploy**: ~2-3 minutes
**Time to rollback**: ~5 seconds

### Scenario 2: Scheduled Maintenance Window

```bash
# 1. Deploy during low-traffic period
./scripts/deploy.sh production

# 2. Extensive testing on inactive slot
curl http://localhost:3012/health  # or 3014

# Run integration tests
# Monitor logs
# Check metrics

# 3. When confident, switch
./scripts/switch.sh

# 4. Monitor for 30 minutes
watch -n 5 ./scripts/status.sh

# 5. Stop old slot to free resources
# If blue is now active, stop green:
docker-compose -f deploy/prod/docker-compose.green.yml down
```

### Scenario 3: A/B Testing

```bash
# Deploy new version to inactive slot
./scripts/deploy.sh production

# Both slots are now running
# Blue (old): http://localhost:3014
# Green (new): http://localhost:3012

# Send test traffic to both:
# - 90% to blue (production)
# - 10% to green (test)

# When green proves stable, switch all traffic
./scripts/switch.sh
```

## Troubleshooting

### Health Check Fails

```bash
# Check logs
docker-compose -f deploy/prod/docker-compose.blue.yml logs --tail=100

# Common issues:
# - Port already in use
# - Memory limits exceeded
# - Environment variables missing
# - Docker network issues
```

### Cannot Switch Traffic

```bash
# Verify target slot is healthy
curl -v http://localhost:3014/health

# Check nginx configuration
sudo nginx -t

# Manual nginx reload if needed
sudo systemctl reload nginx
```

### Both Slots Down

```bash
# Check Docker
docker ps -a | grep nocturna-chart

# Restart specific slot
docker-compose -f deploy/prod/docker-compose.blue.yml up -d

# Check network
docker network inspect nocturna-network
```

### Need Complete Rebuild

```bash
# Stop both slots
docker-compose -f deploy/prod/docker-compose.blue.yml down
docker-compose -f deploy/prod/docker-compose.green.yml down

# Clean rebuild
./scripts/deploy.sh production --no-cache --slot=blue

# Activate
./scripts/switch.sh blue
```

## Advanced Operations

### Manual Slot Management

```bash
# Start specific slot
docker-compose -f deploy/prod/docker-compose.blue.yml up -d

# Stop specific slot
docker-compose -f deploy/prod/docker-compose.green.yml down

# Restart without rebuild
docker-compose -f deploy/prod/docker-compose.blue.yml restart

# View logs
docker-compose -f deploy/prod/docker-compose.green.yml logs -f
```

### Check Active Slot

```bash
# View metadata file
cat .active_slot

# Or use status script
../../scripts/status.sh
```

### Force Specific Slot Active

```bash
# Manually edit metadata (not recommended)
echo "blue" > .active_slot

# Better: use switch script
../../scripts/switch.sh blue
```

## Monitoring & Metrics

### Health Checks

```bash
# Blue slot
curl http://localhost:3014/health

# Green slot
curl http://localhost:3012/health

# Expected response:
# {
#   "status": "healthy",
#   "version": "1.0.0",
#   "uptime": 3600,
#   "checks": { "browser": "ok" }
# }
```

### Prometheus Metrics

```bash
# Blue slot metrics
curl http://localhost:3014/metrics

# Green slot metrics
curl http://localhost:3012/metrics
```

### Resource Usage

```bash
# All containers
docker stats

# Specific slot
docker stats nocturna-chart-blue
docker stats nocturna-chart-green

# Via status script
./scripts/status.sh
```

## Best Practices

1. **Always test before switching**
   - Run health checks
   - Test actual API calls
   - Check logs for errors

2. **Use staging first**
   - Test on staging environment
   - Only deploy to production after validation

3. **Monitor after switch**
   - Watch logs for 15-30 minutes
   - Monitor error rates
   - Check response times

4. **Keep one slot running**
   - Don't stop old slot immediately
   - Wait 24 hours before stopping
   - Allows quick rollback if issues appear

5. **Automate monitoring**
   - Set up alerts for health checks
   - Monitor both slots
   - Alert on deployment failures

## Quick Reference

| Command | Purpose |
|---------|---------|
| `./scripts/deploy.sh production` | Deploy to inactive slot |
| `./scripts/switch.sh` | Switch traffic to other slot |
| `./scripts/rollback.sh` | Rollback to previous slot |
| `./scripts/status.sh` | Check all environments |
| `curl localhost:3014/health` | Check blue slot |
| `curl localhost:3012/health` | Check green slot |

## Getting Help

- [Full Deployment Documentation](../../docs/DEPLOYMENT.md)
- [Script Documentation](../../scripts/README.md)
- [Troubleshooting Guide](../../docs/DEPLOYMENT.md#troubleshooting)
