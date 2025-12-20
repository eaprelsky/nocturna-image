# Docker Network Configuration for Nocturna Services

## Overview

All Nocturna microservices use a shared Docker network: `nocturna-network`

This allows services to communicate with each other using container names as hostnames.

## Network Architecture

```
nocturna-network (bridge)
├── nocturna-chart-blue (this service)
├── nocturna-chart-green (this service)
├── nocturna-nginx (this service)
├── nocturna-api-blue (other service example)
├── nocturna-api-green (other service example)
└── ... (other Nocturna services)
```

## Creating the Network

The network only needs to be created **once** across all services:

```bash
docker network create nocturna-network
```

If the network already exists, you'll see:

```
Error response from daemon: network with name nocturna-network already exists
```

This is **normal and safe** - just continue with deployment.

## Service Communication

Services can communicate using container names:

### Example: API calling Chart Service

```bash
# From another Nocturna service container
curl http://nocturna-chart-blue:3011/health
curl http://nocturna-chart-green:3011/health
```

### Example: Chart Service calling API

```bash
# If you have nocturna-api service
curl http://nocturna-api-blue:3000/some-endpoint
```

## Important Configuration

All docker-compose files use `external: true` for the network:

```yaml
networks:
  nocturna-network:
    name: nocturna-network
    external: true
```

This means:
- ✅ Network is not created by this compose file
- ✅ Uses existing network if available
- ✅ Multiple services can share the network
- ✅ Services in different directories work together

## Container Naming Convention

To avoid conflicts, follow this naming pattern:

```
nocturna-<service>-<slot>
```

Examples:
- `nocturna-chart-blue`
- `nocturna-chart-green`
- `nocturna-api-blue`
- `nocturna-api-green`
- `nocturna-auth-blue`
- `nocturna-nginx`

## Port Allocation

Each service must use unique **external** ports:

| Service | Blue Port | Green Port | Internal Port |
|---------|-----------|------------|---------------|
| Chart   | 3011      | 3012       | 3011          |
| API     | 3000      | 3001       | 3000          |
| Auth    | 3020      | 3021       | 3020          |
| Nginx   | 80, 443   | -          | 80, 443       |

## Network Inspection

### List all containers in the network

```bash
docker network inspect nocturna-network
```

### Test connectivity between services

```bash
# From one container to another
docker exec nocturna-chart-blue ping nocturna-api-blue

# Test HTTP connectivity
docker exec nocturna-chart-blue curl http://nocturna-api-blue:3000/health
```

### View network traffic

```bash
# Install netshoot for debugging
docker run --rm -it --network nocturna-network nicolaka/netshoot

# Inside netshoot container
curl http://nocturna-chart-blue:3011/health
nslookup nocturna-chart-blue
```

## Security Considerations

### Network Isolation

The `nocturna-network` is isolated from:
- Other Docker networks
- Host network (unless explicitly bridged)
- Internet (unless containers expose ports)

### Internal Communication

Services can communicate internally without exposing ports:

```yaml
# No ports exposed - only accessible within network
services:
  internal-service:
    networks:
      - nocturna-network
    # No 'ports:' section
```

### External Access

Only services with exposed ports are accessible from host:

```yaml
services:
  public-service:
    ports:
      - "3011:3011"  # Accessible from host
    networks:
      - nocturna-network
```

## Troubleshooting

### Network not found error

```
ERROR: Network nocturna-network declared as external, but could not be found
```

**Solution:**
```bash
docker network create nocturna-network
```

### Container name conflicts

```
ERROR: for nocturna-chart-blue  Cannot create container: conflict
```

**Solution:** Another service is using the same container name. Check naming convention.

```bash
docker ps -a | grep nocturna
docker rm nocturna-chart-blue  # if it's a leftover container
```

### Cannot communicate between services

**Check 1:** Are both services in the same network?
```bash
docker network inspect nocturna-network
```

**Check 2:** Are containers running?
```bash
docker ps --filter "network=nocturna-network"
```

**Check 3:** Test DNS resolution
```bash
docker exec nocturna-chart-blue nslookup nocturna-api-blue
```

## Network Cleanup

### Remove network (WARNING: stops all services)

```bash
# Stop all containers using the network first
docker ps --filter "network=nocturna-network" -q | xargs docker stop

# Remove the network
docker network rm nocturna-network
```

### Prune unused networks

```bash
docker network prune
```

## Best Practices

1. ✅ Use single shared network for all Nocturna services
2. ✅ Use `external: true` in all docker-compose files
3. ✅ Follow container naming convention
4. ✅ Document port allocation for each service
5. ✅ Use internal DNS names for service communication
6. ✅ Don't expose internal service ports unless needed
7. ✅ Keep network name consistent across all services
8. ✅ Test network connectivity after deployment

## Multi-Environment Setup

If you need separate environments (dev, staging, prod):

```bash
# Development
docker network create nocturna-network-dev

# Staging  
docker network create nocturna-network-stage

# Production
docker network create nocturna-network
```

Update docker-compose accordingly:

```yaml
networks:
  nocturna-network:
    name: nocturna-network-${ENV:-prod}
    external: true
```

## Related Documentation

- Main deployment guide: [README.md](README.md)
- Docker Compose reference: [docker-compose.blue.yml](prod/docker-compose.blue.yml)
- Nginx configuration: [nginx.conf](prod/nginx.conf)
