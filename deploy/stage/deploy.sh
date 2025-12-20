#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Nocturna Chart Service - Stage Deployment ===${NC}"

# Check if .env exists
if [ ! -f "../../.env" ]; then
    echo -e "${RED}Error: .env file not found in project root${NC}"
    echo "Please create .env file based on .env.example"
    exit 1
fi

# Get current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${YELLOW}Step 1: Pulling latest code...${NC}"
cd ../..
git pull origin master || echo "Git pull skipped (not in git repo or no changes)"

echo -e "${YELLOW}Step 2: Building Docker image...${NC}"
cd deploy/stage
docker-compose -f docker-compose.stage.yml build --no-cache

echo -e "${YELLOW}Step 3: Stopping old container...${NC}"
docker-compose -f docker-compose.stage.yml down

echo -e "${YELLOW}Step 4: Starting new container...${NC}"
docker-compose -f docker-compose.stage.yml up -d

echo -e "${YELLOW}Step 5: Waiting for service to be healthy...${NC}"
sleep 5

# Check health
MAX_ATTEMPTS=30
ATTEMPT=0
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if curl -f http://localhost:3011/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Service is healthy!${NC}"
        break
    fi
    ATTEMPT=$((ATTEMPT + 1))
    echo -n "."
    sleep 2
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo -e "${RED}✗ Service failed to become healthy${NC}"
    echo "Checking logs:"
    docker-compose -f docker-compose.stage.yml logs --tail=50
    exit 1
fi

echo -e "${GREEN}Step 6: Deployment completed successfully!${NC}"
echo ""
echo "Service is running at: http://localhost:3011"
echo "Health check: http://localhost:3011/health"
echo "Metrics: http://localhost:3011/metrics"
echo ""
echo "View logs: docker-compose -f docker-compose.stage.yml logs -f"
echo "Stop service: docker-compose -f docker-compose.stage.yml down"
