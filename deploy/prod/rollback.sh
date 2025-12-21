#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${RED}=== Nocturna Chart Service - ROLLBACK ===${NC}"

# System nginx upstream (preferred in production)
SYSTEM_NGINX_UPSTREAM_FILE="/etc/nginx/upstreams/nocturna-img-production.conf"

# Get current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Determine current active slot
ACTIVE_SLOT="blue"
if [ -f ".active_slot" ]; then
    ACTIVE_SLOT=$(cat .active_slot)
fi

# Determine previous slot (where we're rolling back to)
if [ "$ACTIVE_SLOT" = "blue" ]; then
    PREVIOUS_SLOT="green"
    PREVIOUS_PORT=3012
    PREVIOUS_UPSTREAM_SYSTEM="localhost:3012"
    PREVIOUS_UPSTREAM_LOCAL="nocturna-chart-green:3011"
else
    PREVIOUS_SLOT="blue"
    PREVIOUS_PORT=3014
    PREVIOUS_UPSTREAM_SYSTEM="localhost:3014"
    PREVIOUS_UPSTREAM_LOCAL="nocturna-chart-blue:3011"
fi

echo -e "${BLUE}Current active slot: ${ACTIVE_SLOT}${NC}"
echo -e "${RED}Rolling back to: ${PREVIOUS_SLOT}${NC}"
echo ""

# Confirm rollback
read -p "Are you sure you want to rollback to ${PREVIOUS_SLOT}? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Rollback cancelled"
    exit 0
fi

# Check if previous slot is running and healthy
echo -e "${YELLOW}Checking ${PREVIOUS_SLOT} health...${NC}"
if ! curl -f http://localhost:${PREVIOUS_PORT}/health > /dev/null 2>&1; then
    echo -e "${RED}Error: ${PREVIOUS_SLOT} slot is not healthy!${NC}"
    echo "Cannot rollback to unhealthy slot"
    exit 1
fi

echo -e "${GREEN}✓ ${PREVIOUS_SLOT} is healthy${NC}"

# Update nginx configuration
echo -e "${YELLOW}Updating nginx configuration...${NC}"
SUDO=""
if [ "$(id -u)" -ne 0 ]; then
    SUDO="sudo"
fi

if [ -f "${SYSTEM_NGINX_UPSTREAM_FILE}" ]; then
    echo -e "${BLUE}Using system nginx upstream file: ${SYSTEM_NGINX_UPSTREAM_FILE}${NC}"
    $SUDO sed -i.bak -E "s/^[[:space:]]*server localhost:[0-9]+;[[:space:]]*# ACTIVE: .*/    server ${PREVIOUS_UPSTREAM_SYSTEM};  # ACTIVE: ${PREVIOUS_SLOT}/" "${SYSTEM_NGINX_UPSTREAM_FILE}"

    echo -e "${YELLOW}Reloading system nginx...${NC}"
    $SUDO nginx -t
    if command -v systemctl >/dev/null 2>&1; then
        $SUDO systemctl reload nginx
    else
        $SUDO nginx -s reload
    fi
    echo -e "${GREEN}✓ System nginx reloaded${NC}"
else
    echo -e "${YELLOW}Warning: system upstream file not found. Falling back to local nginx.conf and container nginx.${NC}"
    sed -i.bak "s|server [^;]*;  # Default:.*|server ${PREVIOUS_UPSTREAM_LOCAL};  # Default: ${PREVIOUS_SLOT}|" nginx.conf

    echo -e "${YELLOW}Reloading nginx...${NC}"
    docker exec nocturna-nginx nginx -s reload
fi

# Save new active slot
echo "$PREVIOUS_SLOT" > .active_slot

echo ""
echo -e "${GREEN}Rollback completed! Traffic restored to ${PREVIOUS_SLOT}${NC}"
echo ""
echo -e "${BLUE}Current status:${NC}"
echo "Active slot: ${PREVIOUS_SLOT}"
echo "Failed slot: ${ACTIVE_SLOT}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Investigate issues with ${ACTIVE_SLOT}"
echo "2. Check logs: docker-compose -f docker-compose.${ACTIVE_SLOT}.yml logs"
echo "3. Fix and redeploy when ready: ./deploy.sh"
