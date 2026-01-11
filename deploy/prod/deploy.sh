#!/bin/bash
# Blue-Green Deployment Script for Nocturna Chart Service
# Usage: ./deploy.sh [blue|green|auto] [--no-cache|--rebuild]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
METADATA_FILE="$SCRIPT_DIR/.active_slot"

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
        echo "blue"  # Default to blue if no metadata
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

# Check if slot is running
is_slot_running() {
    local slot=$1
    docker ps --format '{{.Names}}' | grep -q "^nocturna-chart-${slot}$"
}

# Wait for health check
wait_for_health() {
    local slot=$1
    local port
    
    if [ "$slot" = "blue" ]; then
        port=3014
    else
        port=3012
    fi
    
    log_info "Waiting for $slot slot to become healthy (port $port)..."
    
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -sf "http://localhost:$port/health" > /dev/null 2>&1; then
            log_success "$slot slot is healthy!"
            return 0
        fi
        
        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done
    
    echo ""
    log_error "$slot slot failed health check after $max_attempts attempts"
    return 1
}

# Ensure network exists
ensure_network() {
    log_info "Ensuring nocturna-network exists..."
    if ! docker network inspect nocturna-network >/dev/null 2>&1; then
        docker network create nocturna-network
        log_success "Network created"
    else
        log_info "Network already exists"
    fi
}

# Deploy to slot
deploy_slot() {
    local slot=$1
    local build_flag=$2
    
    log_info "Deploying to $slot slot..."
    
    cd "$PROJECT_ROOT"
    
    # Check if .env exists
    if [ ! -f ".env" ]; then
        log_error ".env file not found in project root"
        log_error "Please create .env file based on .env.example"
        exit 1
    fi
    
    # Ensure network exists
    ensure_network
    
    # Build Docker image
    log_info "Building Docker image..."
    if [ "$build_flag" = "--no-cache" ] || [ "$build_flag" = "--rebuild" ]; then
        log_info "Building without cache (full rebuild)..."
        docker build --no-cache -t nocturna-chart-service:latest -f Dockerfile .
    else
        docker build --build-arg BUILDKIT_INLINE_CACHE=1 -t nocturna-chart-service:latest -f Dockerfile .
    fi
    
    cd "$SCRIPT_DIR"
    
    # Stop old container in this slot
    log_info "Stopping old $slot container..."
    docker-compose -f "docker-compose.${slot}.yml" down || true
    
    # Start new container
    log_info "Starting $slot container..."
    docker-compose -f "docker-compose.${slot}.yml" up -d
    
    # Wait for health check
    if wait_for_health "$slot"; then
        log_success "Deployment to $slot completed successfully!"
        
        # Show logs
        log_info "Last 20 lines of logs:"
        docker-compose -f "docker-compose.${slot}.yml" logs --tail=20 "chart-service-${slot}"
        
        return 0
    else
        log_error "Deployment to $slot failed health check"
        log_info "Checking logs..."
        docker-compose -f "docker-compose.${slot}.yml" logs --tail=50 "chart-service-${slot}"
        return 1
    fi
}

# Show usage
show_usage() {
    cat << EOF
Usage: $0 [blue|green|auto] [--no-cache|--rebuild]

Deploy Nocturna Chart Service to specified slot

Arguments:
  blue   - Deploy to blue slot (port 3014)
  green  - Deploy to green slot (port 3012)
  auto   - Auto-select inactive slot (default)

Options:
  --no-cache   - Build without Docker cache (full rebuild)
  --rebuild    - Alias for --no-cache

Examples:
  $0                    # Deploy to inactive slot (use cache)
  $0 auto               # Same as above
  $0 blue               # Deploy specifically to blue (use cache)
  $0 green --no-cache   # Deploy to green with full rebuild

EOF
}

# Main script
main() {
    local target_slot=$1
    local build_flag=$2
    
    cd "$SCRIPT_DIR"
    
    log_info "Blue-Green Deployment - Nocturna Chart Service"
    log_info "==============================================="
    
    # Determine target slot
    local active_slot=$(get_active_slot)
    log_info "Currently active slot: $active_slot"
    
    if [ "$target_slot" = "auto" ] || [ -z "$target_slot" ]; then
        target_slot=$(get_inactive_slot)
        log_info "Auto-selected target slot: $target_slot"
    elif [ "$target_slot" != "blue" ] && [ "$target_slot" != "green" ]; then
        log_error "Invalid slot: $target_slot. Use 'blue', 'green', or 'auto'"
        exit 1
    fi
    
    log_info "Deploying to: $target_slot"
    echo ""
    
    # Deploy to target slot
    if deploy_slot "$target_slot" "$build_flag"; then
        local target_port
        if [ "$target_slot" = "blue" ]; then
            target_port=3014
        else
            target_port=3012
        fi
        
        log_success "Deployment completed!"
        echo ""
        log_info "Next steps:"
        log_info "  1. Test the $target_slot slot:"
        log_info "     curl http://localhost:$target_port/health"
        log_info ""
        log_info "  2. Switch traffic to $target_slot:"
        log_info "     ./switch.sh"
        log_info "     # or from project root:"
        log_info "     ./scripts/switch.sh"
        log_info ""
        log_info "  3. If something goes wrong, rollback:"
        log_info "     ./rollback.sh"
        log_info "     # or from project root:"
        log_info "     ./scripts/rollback.sh"
        echo ""
    else
        log_error "Deployment failed!"
        exit 1
    fi
}

# Parse arguments
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_usage
    exit 0
fi

main "${1:-auto}" "$2"
