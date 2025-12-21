#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Nocturna Chart Service - Production Blue-Green Deployment ===${NC}"

# Get current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if .env exists
if [ ! -f "../../.env" ]; then
    echo -e "${RED}Error: .env file not found in project root${NC}"
    echo "Please create .env file based on .env.example"
    exit 1
fi

# Determine current active slot
ACTIVE_SLOT="blue"
if [ -f ".active_slot" ]; then
    ACTIVE_SLOT=$(cat .active_slot)
fi

# Determine target slot (opposite of active)
if [ "$ACTIVE_SLOT" = "blue" ]; then
    TARGET_SLOT="green"
    TARGET_PORT=3012
else
    TARGET_SLOT="blue"
    TARGET_PORT=3011
fi

echo -e "${BLUE}Current active slot: ${ACTIVE_SLOT}${NC}"
echo -e "${BLUE}Deploying to slot: ${TARGET_SLOT}${NC}"
echo ""

# Get version tag (optional)
VERSION="${1:-latest}"
export VERSION

echo -e "${YELLOW}Step 1: Pulling latest code...${NC}"
cd ../..
git pull origin master || echo "Git pull skipped"

echo -e "${YELLOW}Step 2: Building Docker image with version: ${VERSION}${NC}"
docker build --build-arg BUILDKIT_INLINE_CACHE=1 -t nocturna-chart-service:${VERSION} -f Dockerfile .

# Tag as latest if not specified
if [ "$VERSION" != "latest" ]; then
    docker tag nocturna-chart-service:${VERSION} nocturna-chart-service:latest
fi

cd deploy/prod

echo -e "${YELLOW}Step 3: Ensuring network exists...${NC}"
docker network create nocturna-network 2>/dev/null || echo "Network already exists, continuing..."

echo -e "${YELLOW}Step 4: Stopping old ${TARGET_SLOT} container...${NC}"
docker-compose -f docker-compose.${TARGET_SLOT}.yml down || true

echo -e "${YELLOW}Step 5: Starting new ${TARGET_SLOT} container...${NC}"
docker-compose -f docker-compose.${TARGET_SLOT}.yml up -d

echo -e "${YELLOW}Step 6: Waiting for ${TARGET_SLOT} to be healthy...${NC}"
sleep 5

# Health check
MAX_ATTEMPTS=30
ATTEMPT=0
HEALTH_URL="http://localhost:${TARGET_PORT}/health"

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if curl -f $HEALTH_URL > /dev/null 2>&1; then
        echo -e "${GREEN}✓ ${TARGET_SLOT} slot is healthy!${NC}"
        break
    fi
    ATTEMPT=$((ATTEMPT + 1))
    echo -n "."
    sleep 2
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo -e "${RED}✗ ${TARGET_SLOT} slot failed to become healthy${NC}"
    echo "Checking logs:"
    docker-compose -f docker-compose.${TARGET_SLOT}.yml logs --tail=50
    exit 1
fi

echo ""
echo -e "${GREEN}Deployment to ${TARGET_SLOT} completed successfully!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Test the new deployment at: http://localhost:${TARGET_PORT}"
echo "2. If everything works, switch traffic: ./switch.sh"
echo "3. If there are issues, remove failed deployment: docker-compose -f docker-compose.${TARGET_SLOT}.yml down"
echo ""
echo -e "${BLUE}Testing endpoints:${NC}"
echo "Health: curl http://localhost:${TARGET_PORT}/health"
echo "Direct test: curl -X POST http://localhost:${TARGET_PORT}/api/chart -H 'Content-Type: application/json' -H 'X-API-Key: YOUR_KEY' -d @../../examples/chart-without-houses.json"
