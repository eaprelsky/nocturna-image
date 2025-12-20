#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Nocturna Chart Service - Traffic Switch ===${NC}"

# Get current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Determine current active slot
ACTIVE_SLOT="blue"
if [ -f ".active_slot" ]; then
    ACTIVE_SLOT=$(cat .active_slot)
fi

# Determine target slot
if [ "$ACTIVE_SLOT" = "blue" ]; then
    TARGET_SLOT="green"
    TARGET_PORT=3012
    NEW_UPSTREAM="localhost:3012"
else
    TARGET_SLOT="blue"
    TARGET_PORT=3011
    NEW_UPSTREAM="localhost:3011"
fi

echo -e "${BLUE}Current active slot: ${ACTIVE_SLOT}${NC}"
echo -e "${BLUE}Switching to slot: ${TARGET_SLOT}${NC}"
echo ""

# Check if target slot is running and healthy
echo -e "${YELLOW}Checking ${TARGET_SLOT} health...${NC}"
if ! curl -f http://localhost:${TARGET_PORT}/health > /dev/null 2>&1; then
    echo -e "${RED}Error: ${TARGET_SLOT} slot is not healthy!${NC}"
    echo "Please deploy and test ${TARGET_SLOT} first using ./deploy.sh"
    exit 1
fi

echo -e "${GREEN}✓ ${TARGET_SLOT} is healthy${NC}"

# Update nginx configuration
echo -e "${YELLOW}Updating nginx configuration...${NC}"
sed -i.bak "s|server localhost:[0-9]*;  # Default:.*|server ${NEW_UPSTREAM};  # Default: ${TARGET_SLOT}|" nginx.conf

# Reload nginx
echo -e "${YELLOW}Reloading nginx...${NC}"
if docker ps | grep -q nocturna-nginx; then
    docker exec nocturna-nginx nginx -s reload
    echo -e "${GREEN}✓ Nginx reloaded${NC}"
else
    echo -e "${YELLOW}Warning: Nginx container not running. Starting it...${NC}"
    docker-compose -f docker-compose.nginx.yml up -d
    sleep 3
fi

# Save new active slot
echo "$TARGET_SLOT" > .active_slot

echo ""
echo -e "${GREEN}Traffic switched to ${TARGET_SLOT} successfully!${NC}"
echo ""
echo -e "${BLUE}Current status:${NC}"
echo "Active slot: ${TARGET_SLOT}"
echo "Standby slot: ${ACTIVE_SLOT}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Monitor logs: docker-compose -f docker-compose.${TARGET_SLOT}.yml logs -f"
echo "2. If issues occur, rollback: ./rollback.sh"
echo "3. After confirming stability, stop old slot: docker-compose -f docker-compose.${ACTIVE_SLOT}.yml down"
