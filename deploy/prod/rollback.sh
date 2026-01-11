#!/bin/bash
# Rollback to previous (standby) slot
# Usage: ./rollback.sh

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

log_error "=== ROLLBACK ==="
echo ""

# Determine current active slot
ACTIVE_SLOT=$(get_active_slot)

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

log_info "Current active slot: $ACTIVE_SLOT"
log_warning "Rolling back to: $PREVIOUS_SLOT"
echo ""

# Confirm rollback
log_warning "This will switch traffic from $ACTIVE_SLOT back to $PREVIOUS_SLOT"
read -p "Are you sure you want to rollback? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    log_info "Rollback cancelled"
    exit 0
fi

# Check if previous slot is running and healthy
log_info "Checking $PREVIOUS_SLOT health..."
if ! check_health "$PREVIOUS_SLOT"; then
    log_error "$PREVIOUS_SLOT slot is not healthy!"
    log_error "Cannot rollback to unhealthy slot"
    log_info "You may need to restart it first:"
    log_info "  docker-compose -f docker-compose.${PREVIOUS_SLOT}.yml up -d"
    exit 1
fi

log_success "$PREVIOUS_SLOT is healthy"

# Update nginx configuration
log_info "Updating nginx configuration..."
SUDO=""
if [ "$(id -u)" -ne 0 ]; then
    SUDO="sudo"
fi

if [ -f "${SYSTEM_NGINX_UPSTREAM_FILE}" ]; then
    log_info "Using system nginx upstream file: ${SYSTEM_NGINX_UPSTREAM_FILE}"
    $SUDO sed -i.bak -E "s/^[[:space:]]*server localhost:[0-9]+;[[:space:]]*# ACTIVE: .*/    server ${PREVIOUS_UPSTREAM_SYSTEM};  # ACTIVE: ${PREVIOUS_SLOT}/" "${SYSTEM_NGINX_UPSTREAM_FILE}"

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
    sed -i.bak "s|server [^;]*;  # Default:.*|server ${PREVIOUS_UPSTREAM_LOCAL};  # Default: ${PREVIOUS_SLOT}|" nginx.conf

    log_info "Reloading nginx container..."
    if docker ps | grep -q nocturna-nginx; then
        docker exec nocturna-nginx nginx -s reload
        log_success "Nginx container reloaded"
    else
        log_warning "Nginx container not running. Starting it..."
        docker-compose -f docker-compose.nginx.yml up -d
        sleep 3
    fi
fi

# Save new active slot
echo "$PREVIOUS_SLOT" > "$METADATA_FILE"

# Verify rollback
log_info "Verifying rollback..."
sleep 2
if check_health "$PREVIOUS_SLOT"; then
    log_success "Rollback completed! Traffic restored to $PREVIOUS_SLOT"
    echo ""
    log_info "Current status:"
    log_info "  Active slot: $PREVIOUS_SLOT (port $PREVIOUS_PORT)"
    log_info "  Failed slot: $ACTIVE_SLOT"
    echo ""
    log_info "Next steps:"
    log_info "  1. Investigate issues with $ACTIVE_SLOT"
    log_info "     docker-compose -f docker-compose.${ACTIVE_SLOT}.yml logs"
    log_info ""
    log_info "  2. Stop failed slot if needed:"
    log_info "     docker-compose -f docker-compose.${ACTIVE_SLOT}.yml down"
    log_info ""
    log_info "  3. Fix and redeploy when ready:"
    log_info "     ./deploy.sh"
else
    log_error "Health check failed after rollback!"
    log_error "This is a critical situation - both slots may be unhealthy"
    exit 1
fi
