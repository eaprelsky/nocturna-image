#!/bin/bash
# Switch traffic between Blue and Green slots
# Usage: ./switch.sh [blue|green]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
METADATA_FILE="$SCRIPT_DIR/.active_slot"
SYSTEM_NGINX_UPSTREAM_FILE="/etc/nginx/upstreams/nocturna-img-production.conf"

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

# Get current active slot
get_active_slot() {
    if [ -f "$METADATA_FILE" ]; then
        cat "$METADATA_FILE"
    else
        echo "blue"  # Default to blue
    fi
}

# Get inactive slot
get_inactive_slot() {
    local active=$(get_active_slot)
    if [ "$active" = "blue" ]; then
        echo "green"
    else
        echo "blue"
    fi
}

# Check if slot is healthy
check_health() {
    local slot=$1
    local port
    
    if [ "$slot" = "blue" ]; then
        port=3014
    else
        port=3012
    fi
    
    if curl -sf "http://localhost:$port/health" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

cd "$SCRIPT_DIR"

log_info "Blue-Green Traffic Switch"
log_info "========================="

# Determine current active slot
ACTIVE_SLOT=$(get_active_slot)

# Determine target slot
if [ -n "$1" ]; then
    # Explicit slot provided
    TARGET_SLOT="$1"
    if [ "$TARGET_SLOT" != "blue" ] && [ "$TARGET_SLOT" != "green" ]; then
        log_error "Invalid slot: $TARGET_SLOT. Use 'blue' or 'green'"
        exit 1
    fi
else
    # Auto-select inactive slot
    TARGET_SLOT=$(get_inactive_slot)
fi

# Determine ports
if [ "$TARGET_SLOT" = "blue" ]; then
    TARGET_PORT=3014
    NEW_UPSTREAM_SYSTEM="localhost:3014"
    NEW_UPSTREAM_LOCAL="nocturna-chart-blue:3011"
else
    TARGET_SLOT="green"
    TARGET_PORT=3012
    NEW_UPSTREAM_SYSTEM="localhost:3012"
    NEW_UPSTREAM_LOCAL="nocturna-chart-green:3011"
fi

log_info "Current active slot: $ACTIVE_SLOT"
log_info "Switching to slot: $TARGET_SLOT"
echo ""

# Warn if switching to already active slot
if [ "$ACTIVE_SLOT" = "$TARGET_SLOT" ]; then
    log_warning "$TARGET_SLOT is already the active slot!"
    read -p "Do you want to reload nginx anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Aborted"
        exit 0
    fi
fi

# Check if target slot is running and healthy
log_info "Checking $TARGET_SLOT health..."
if ! check_health "$TARGET_SLOT"; then
    log_error "$TARGET_SLOT slot is not healthy!"
    log_error "Please deploy and test $TARGET_SLOT first using ./deploy.sh"
    exit 1
fi

log_success "$TARGET_SLOT is healthy"

# Update nginx configuration
log_info "Updating nginx configuration..."
SUDO=""
if [ "$(id -u)" -ne 0 ]; then
    SUDO="sudo"
fi

if [ -f "${SYSTEM_NGINX_UPSTREAM_FILE}" ]; then
    log_info "Using system nginx upstream file: ${SYSTEM_NGINX_UPSTREAM_FILE}"
    # Only replace the ACTIVE line inside upstream nocturna-img-production
    $SUDO sed -i.bak -E "s/^[[:space:]]*server localhost:[0-9]+;[[:space:]]*# ACTIVE: .*/    server ${NEW_UPSTREAM_SYSTEM};  # ACTIVE: ${TARGET_SLOT}/" "${SYSTEM_NGINX_UPSTREAM_FILE}"

    log_info "Reloading system nginx..."
    if $SUDO nginx -t; then
        if command -v systemctl >/dev/null 2>&1; then
            $SUDO systemctl reload nginx
        else
            $SUDO nginx -s reload
        fi
        log_success "System nginx reloaded"
    else
        log_error "Nginx configuration test failed!"
        log_error "Restoring backup..."
        $SUDO mv "${SYSTEM_NGINX_UPSTREAM_FILE}.bak" "${SYSTEM_NGINX_UPSTREAM_FILE}"
        exit 1
    fi
else
    log_warning "System upstream file not found. Falling back to local nginx.conf and container nginx."
    sed -i.bak "s|server [^;]*;  # Default:.*|server ${NEW_UPSTREAM_LOCAL};  # Default: ${TARGET_SLOT}|" nginx.conf

    # Reload nginx
    log_info "Reloading nginx container..."
    if docker ps | grep -q nocturna-nginx; then
        docker exec nocturna-nginx nginx -s reload
        log_success "Nginx container reloaded"
    else
        log_warning "Nginx container not running. Starting it..."
        docker-compose -f docker-compose.nginx.yml up -d
        sleep 3
        log_success "Nginx container started"
    fi
fi

# Save new active slot
echo "$TARGET_SLOT" > "$METADATA_FILE"

# Verify switch
log_info "Verifying switch..."
sleep 2
if check_health "$TARGET_SLOT"; then
    log_success "Traffic successfully switched to $TARGET_SLOT!"
    echo ""
    log_info "Current status:"
    log_info "  Active slot: $TARGET_SLOT (port $TARGET_PORT)"
    log_info "  Standby slot: $ACTIVE_SLOT"
    echo ""
    log_info "Next steps:"
    log_info "  1. Monitor logs:"
    log_info "     docker-compose -f docker-compose.${TARGET_SLOT}.yml logs -f"
    log_info ""
    log_info "  2. If issues occur, rollback:"
    log_info "     ./rollback.sh"
    log_info ""
    log_info "  3. After confirming stability, stop old slot:"
    log_info "     docker-compose -f docker-compose.${ACTIVE_SLOT}.yml down"
else
    log_error "Health check failed after switch!"
    log_warning "Consider rolling back immediately: ./rollback.sh"
    exit 1
fi
