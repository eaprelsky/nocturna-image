# Deployment Scripts

Unified deployment scripts for Nocturna Chart Service.

## Overview

This directory contains scripts for deploying and managing the Nocturna Chart Service across different environments using a standardized interface.

## Scripts

### deploy.sh

Main deployment script with unified interface.

```bash
# Deploy to staging
./scripts/deploy.sh staging

# Deploy to production (auto-select inactive slot)
./scripts/deploy.sh production

# Deploy to specific production slot
./scripts/deploy.sh production --slot=blue
./scripts/deploy.sh production --slot=green

# Deploy with full rebuild (no cache)
./scripts/deploy.sh production --no-cache
```

**Options:**
- `staging` - Deploy to staging environment (port 3013)
- `production` - Deploy to production with blue-green strategy
- `--slot=SLOT` - Specify blue, green, or auto (production only)
- `--no-cache` / `--rebuild` - Build without Docker cache

### switch.sh

Switch traffic between blue and green production slots.

```bash
# Auto-switch to inactive slot
./scripts/switch.sh

# Switch to specific slot
./scripts/switch.sh blue
./scripts/switch.sh green
```

### rollback.sh

Rollback to the previous (standby) slot.

```bash
./scripts/rollback.sh
```

This will:
1. Check that standby slot is healthy
2. Switch traffic back to standby slot
3. Update active slot metadata

### status.sh

Check status of all environments and slots.

```bash
./scripts/status.sh
```

Shows:
- Staging environment status
- Production blue/green slot status
- Active/standby indicators
- Health checks
- Docker containers
- Quick commands

## Blue-Green Deployment Workflow

### Initial Setup

1. Deploy to first slot (blue):
```bash
./scripts/deploy.sh production --slot=blue
```

2. Test the deployment:
```bash
curl http://localhost:3014/health
```

3. Switch traffic to blue:
```bash
./scripts/switch.sh blue
```

### Regular Deployment

1. Check current status:
```bash
./scripts/status.sh
```

2. Deploy to inactive slot (auto-detected):
```bash
./scripts/deploy.sh production
```

3. Test the new deployment on its port:
   - Blue: `http://localhost:3014`
   - Green: `http://localhost:3012`

4. Switch traffic:
```bash
./scripts/switch.sh
```

5. Monitor the new deployment:
```bash
# From project root
docker-compose -f deploy/prod/docker-compose.blue.yml logs -f
# or
docker-compose -f deploy/prod/docker-compose.green.yml logs -f
```

6. If issues occur, rollback immediately:
```bash
./scripts/rollback.sh
```

### Emergency Rollback

If the new deployment has issues:

```bash
./scripts/rollback.sh
```

This instantly switches traffic back to the previous slot.

## Environment Details

### Staging
- **Port:** 3013
- **URL:** http://localhost:3013
- **Deployment:** Single container, no blue-green
- **Use case:** Testing before production

### Production Blue Slot
- **Port:** 3014 (external) → 3011 (internal)
- **Container:** nocturna-chart-blue
- **URL:** http://localhost:3014 (direct)

### Production Green Slot
- **Port:** 3012 (external) → 3011 (internal)
- **Container:** nocturna-chart-green
- **URL:** http://localhost:3012 (direct)

## Docker Network

All production containers use the shared `nocturna-network` Docker network. This network is automatically created during deployment if it doesn't exist.

## Metadata Files

### deploy/prod/.active_slot

Stores the currently active production slot (blue or green).

This file is automatically updated by `switch.sh` and `rollback.sh`.

## Troubleshooting

### Deployment fails with "unhealthy" error

Check container logs:
```bash
cd deploy/prod
docker-compose -f docker-compose.blue.yml logs --tail=100
```

### Both slots are unhealthy

1. Check Docker network:
```bash
docker network inspect nocturna-network
```

2. Restart the healthy slot:
```bash
cd deploy/prod
docker-compose -f docker-compose.blue.yml restart
```

### Need to rebuild from scratch

```bash
./scripts/deploy.sh production --no-cache
```

### Check resource usage

```bash
./scripts/status.sh
```

The status command shows CPU and memory usage for all containers.

## Advanced Usage

### Deploy specific version

```bash
cd deploy/prod
VERSION=v1.2.3 ./deploy.sh blue
```

### Manual container management

```bash
# Stop specific slot
cd deploy/prod
docker-compose -f docker-compose.blue.yml down

# View logs
docker-compose -f docker-compose.green.yml logs -f

# Restart without rebuild
docker-compose -f docker-compose.blue.yml restart
```

### Force network recreation

```bash
docker network rm nocturna-network
./scripts/deploy.sh production
```

## Related Documentation

- [Deployment Guide](../docs/DEPLOYMENT.md)
- [API Documentation](../docs/API.md)
- [Project Structure](../docs/PROJECT_STRUCTURE.md)
