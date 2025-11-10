# Deployment Guide

## Prerequisites

- Docker and Docker Compose installed
- Node.js 20 LTS (for local development)
- Linux server with at least 1GB RAM

## Environment Variables

Create a `.env` file:

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

## Deployment Options

### Option 1: Docker Compose (Recommended)

1. **Build and start:**
   ```bash
   docker-compose up -d
   ```

2. **View logs:**
   ```bash
   docker-compose logs -f chart-service
   ```

3. **Stop service:**
   ```bash
   docker-compose down
   ```

4. **Update service:**
   ```bash
   docker-compose pull
   docker-compose up -d
   ```

### Option 2: Docker Only

1. **Build image:**
   ```bash
   docker build -t nocturna-chart-service:latest .
   ```

2. **Run container:**
   ```bash
   docker run -d \
     --name nocturna-chart-service \
     -p 3000:3000 \
     -e API_KEY=your-api-key \
     -e NODE_ENV=production \
     --restart unless-stopped \
     nocturna-chart-service:latest
   ```

3. **View logs:**
   ```bash
   docker logs -f nocturna-chart-service
   ```

### Option 3: Direct Node.js

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

## Reverse Proxy (Nginx)

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

    location / {
        proxy_pass http://localhost:3000;
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
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
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

### Browser Not Starting
```bash
# Check logs
docker logs nocturna-chart-service

# Verify Chrome installation
docker exec nocturna-chart-service chromium --version

# Check permissions
docker exec nocturna-chart-service ls -la /usr/bin/chromium
```

### Memory Issues
```bash
# Check container memory
docker stats nocturna-chart-service

# Increase memory limit
docker update --memory 2G nocturna-chart-service
```

### Slow Rendering
- Reduce `MAX_CONCURRENT_RENDERS`
- Increase server resources
- Add more instances (horizontal scaling)
- Enable caching (future feature)

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

- [ ] Environment variables configured
- [ ] API key set and secure
- [ ] HTTPS enabled
- [ ] Monitoring configured
- [ ] Logs collected and rotated
- [ ] Backups scheduled
- [ ] Health checks working
- [ ] Rate limiting tested
- [ ] Load testing completed
- [ ] Documentation updated

