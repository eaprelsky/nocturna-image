#!/bin/bash
# Check status of production blue-green deployment
# Usage: ./status.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
METADATA_FILE="$SCRIPT_DIR/.active_slot"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Get current active slot
get_active_slot() {
    if [ -f "$METADATA_FILE" ]; then
        cat "$METADATA_FILE"
    else
        echo "unknown"
    fi
}

# Check if slot is healthy
check_slot_status() {
    local slot=$1
    local port=$2
    
    if ! docker ps --format '{{.Names}}' | grep -q "nocturna-chart-${slot}"; then
        echo -e "  Status: ${RED}Not Running${NC}"
        return 2
    fi
    
    echo -e "  Status: ${GREEN}Running${NC}"
    
    if curl -sf "http://localhost:$port/health" > /dev/null 2>&1; then
        echo -e "  Health: ${GREEN}✓ Healthy${NC}"
        
        # Try to get version
        local version=$(curl -s "http://localhost:$port/health" 2>/dev/null | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
        if [ -n "$version" ]; then
            echo "  Version: $version"
        fi
        return 0
    else
        echo -e "  Health: ${RED}✗ Unhealthy${NC}"
        return 1
    fi
}

cd "$SCRIPT_DIR"

echo -e "${CYAN}================================================${NC}"
echo -e "${CYAN}  Production Status - Blue-Green Deployment${NC}"
echo -e "${CYAN}================================================${NC}"
echo ""

# Determine current active slot
ACTIVE_SLOT=$(get_active_slot)

if [ "$ACTIVE_SLOT" = "blue" ]; then
    echo -e "  ${GREEN}Active Slot:${NC} blue (port 3014)"
    echo -e "  ${YELLOW}Standby Slot:${NC} green (port 3012)"
elif [ "$ACTIVE_SLOT" = "green" ]; then
    echo -e "  ${GREEN}Active Slot:${NC} green (port 3012)"
    echo -e "  ${YELLOW}Standby Slot:${NC} blue (port 3014)"
else
    echo -e "  ${YELLOW}Active Slot:${NC} unknown (no .active_slot file)"
fi

echo ""
echo -e "${BLUE}=== Slot Status ===${NC}"

# Check blue slot
echo -e "${YELLOW}Blue Slot (port 3014):${NC}"
check_slot_status "blue" 3014
if [ "$ACTIVE_SLOT" = "blue" ]; then
    echo -e "  ${GREEN}▶ ACTIVE - SERVING TRAFFIC${NC}"
fi
echo ""

# Check green slot
echo -e "${YELLOW}Green Slot (port 3012):${NC}"
check_slot_status "green" 3012
if [ "$ACTIVE_SLOT" = "green" ]; then
    echo -e "  ${GREEN}▶ ACTIVE - SERVING TRAFFIC${NC}"
fi
echo ""

# Check nginx status
echo -e "${BLUE}=== Load Balancer ===${NC}"
echo -e "${YELLOW}Nginx:${NC}"
if docker ps | grep -q nocturna-nginx; then
    echo -e "  Status: ${GREEN}Running${NC}"
else
    echo -e "  Status: ${RED}Not Running${NC}"
fi
echo ""

# Show containers
echo -e "${BLUE}=== Docker Containers ===${NC}"
docker ps -a --filter "name=nocturna-chart" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null | head -n 10 || echo "  No containers found"
echo ""

# Show resource usage
echo -e "${BLUE}=== Resource Usage ===${NC}"
if docker ps -q --filter "name=nocturna-chart" | grep -q .; then
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" $(docker ps -q --filter "name=nocturna-chart")
else
    echo "  No containers running"
fi
echo ""

echo -e "${CYAN}================================================${NC}"
echo -e "${BLUE}Quick commands:${NC}"
echo "  View blue logs:   docker-compose -f docker-compose.blue.yml logs -f"
echo "  View green logs:  docker-compose -f docker-compose.green.yml logs -f"
echo "  Deploy new slot:  ./deploy.sh"
echo "  Switch traffic:   ./switch.sh"
echo "  Rollback:         ./rollback.sh"
echo ""
