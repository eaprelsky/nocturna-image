#!/bin/bash
# Check status of all environments and slots
# Usage: ./scripts/status.sh

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
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PROD_METADATA_FILE="$PROJECT_ROOT/deploy/prod/.active_slot"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if service is running
check_service() {
    local name=$1
    local port=$2
    
    if curl -sf "http://localhost:$port/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ HEALTHY${NC}"
        return 0
    else
        if docker ps --format '{{.Names}}' | grep -q "$name"; then
            echo -e "${YELLOW}⚠ RUNNING (unhealthy)${NC}"
            return 1
        else
            echo -e "${RED}✗ STOPPED${NC}"
            return 2
        fi
    fi
}

# Get active production slot
get_active_slot() {
    if [ -f "$PROD_METADATA_FILE" ]; then
        cat "$PROD_METADATA_FILE"
    else
        echo "unknown"
    fi
}

# Print header
print_header() {
    echo -e "${CYAN}================================================${NC}"
    echo -e "${CYAN}  Nocturna Chart Service - Status Overview${NC}"
    echo -e "${CYAN}================================================${NC}"
    echo ""
}

# Check staging
check_staging() {
    echo -e "${BLUE}=== STAGING Environment ===${NC}"
    echo -n "  Port 3013: "
    check_service "nocturna-chart-stage" 3013
    echo ""
}

# Check production
check_production() {
    echo -e "${BLUE}=== PRODUCTION Environment ===${NC}"
    
    local active_slot=$(get_active_slot)
    
    if [ "$active_slot" = "blue" ]; then
        echo -e "  ${GREEN}Active Slot:${NC} blue"
        echo -e "  ${YELLOW}Standby Slot:${NC} green"
    elif [ "$active_slot" = "green" ]; then
        echo -e "  ${GREEN}Active Slot:${NC} green"
        echo -e "  ${YELLOW}Standby Slot:${NC} blue"
    else
        echo -e "  ${YELLOW}Active Slot:${NC} unknown"
    fi
    
    echo ""
    echo -n "  Blue (port 3014):  "
    local blue_status=$(check_service "nocturna-chart-blue" 3014)
    if [ "$active_slot" = "blue" ]; then
        echo "    [ACTIVE]"
    fi
    
    echo -n "  Green (port 3012): "
    local green_status=$(check_service "nocturna-chart-green" 3012)
    if [ "$active_slot" = "green" ]; then
        echo "    [ACTIVE]"
    fi
    
    echo ""
}

# Check network
check_network() {
    echo -e "${BLUE}=== Docker Network ===${NC}"
    if docker network inspect nocturna-network >/dev/null 2>&1; then
        echo -e "  nocturna-network: ${GREEN}✓ EXISTS${NC}"
    else
        echo -e "  nocturna-network: ${RED}✗ NOT FOUND${NC}"
    fi
    echo ""
}

# Show docker containers
show_containers() {
    echo -e "${BLUE}=== Docker Containers ===${NC}"
    docker ps --filter "name=nocturna-chart" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "  No containers found"
    echo ""
}

# Main script
main() {
    print_header
    check_staging
    check_production
    check_network
    show_containers
    
    echo -e "${CYAN}================================================${NC}"
    echo -e "${BLUE}Quick commands:${NC}"
    echo "  Deploy staging:    ./scripts/deploy.sh staging"
    echo "  Deploy production: ./scripts/deploy.sh production"
    echo "  Switch traffic:    ./scripts/switch.sh"
    echo "  Rollback:          ./scripts/rollback.sh"
    echo ""
}

main "$@"
