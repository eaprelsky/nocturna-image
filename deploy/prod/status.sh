#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Nocturna Chart Service - Deployment Status ===${NC}"
echo ""

# Get current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Determine current active slot
ACTIVE_SLOT="blue"
if [ -f ".active_slot" ]; then
    ACTIVE_SLOT=$(cat .active_slot)
fi

echo -e "${BLUE}Active Slot: ${ACTIVE_SLOT}${NC}"
echo ""

# Check blue status
echo -e "${YELLOW}Blue Slot (port 3011):${NC}"
if docker ps | grep -q nocturna-chart-blue; then
    echo -e "  Status: ${GREEN}Running${NC}"
    if curl -f http://localhost:3011/health > /dev/null 2>&1; then
        echo -e "  Health: ${GREEN}Healthy${NC}"
        BLUE_VERSION=$(curl -s http://localhost:3011/health | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
        echo "  Version: $BLUE_VERSION"
    else
        echo -e "  Health: ${RED}Unhealthy${NC}"
    fi
else
    echo -e "  Status: ${RED}Not Running${NC}"
fi
echo ""

# Check green status
echo -e "${YELLOW}Green Slot (port 3012):${NC}"
if docker ps | grep -q nocturna-chart-green; then
    echo -e "  Status: ${GREEN}Running${NC}"
    if curl -f http://localhost:3012/health > /dev/null 2>&1; then
        echo -e "  Health: ${GREEN}Healthy${NC}"
        GREEN_VERSION=$(curl -s http://localhost:3012/health | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
        echo "  Version: $GREEN_VERSION"
    else
        echo -e "  Health: ${RED}Unhealthy${NC}"
    fi
else
    echo -e "  Status: ${RED}Not Running${NC}"
fi
echo ""

# Check nginx status
echo -e "${YELLOW}Nginx Load Balancer:${NC}"
if docker ps | grep -q nocturna-nginx; then
    echo -e "  Status: ${GREEN}Running${NC}"
else
    echo -e "  Status: ${RED}Not Running${NC}"
fi
echo ""

# Show recent activity
echo -e "${YELLOW}Recent Container Activity:${NC}"
docker ps -a --filter "name=nocturna-chart" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | head -n 10
echo ""

# Show resource usage
echo -e "${YELLOW}Resource Usage:${NC}"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" $(docker ps -q --filter "name=nocturna")
