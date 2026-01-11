#!/bin/bash
# Unified deployment script for Nocturna Chart Service
# Usage: ./scripts/deploy.sh [staging|production] [options]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

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

show_usage() {
    cat << EOF
Usage: $0 [staging|production] [options]

Deploy Nocturna Chart Service to specified environment

Environments:
  staging     - Deploy to staging environment (port 3013)
  production  - Deploy to production with blue-green strategy

Options for production:
  --slot=SLOT      - Deploy to specific slot (blue|green|auto)
  --no-cache       - Build without Docker cache
  --rebuild        - Alias for --no-cache

Examples:
  $0 staging                    # Deploy to staging
  $0 production                 # Deploy to production (auto-select slot)
  $0 production --slot=blue     # Deploy to blue slot
  $0 production --no-cache      # Full rebuild for production

EOF
}

# Deploy to staging
deploy_staging() {
    log_info "Deploying to STAGING environment"
    log_info "=================================="
    
    cd "$PROJECT_ROOT"
    
    # Check if .env exists
    if [ ! -f ".env" ]; then
        log_error ".env file not found in project root"
        log_error "Please create .env file based on .env.example"
        exit 1
    fi
    
    log_info "Step 1: Pulling latest code..."
    git pull origin master 2>/dev/null || log_warning "Git pull skipped (not in git repo or no changes)"
    
    log_info "Step 2: Building Docker image..."
    cd deploy/stage
    docker-compose -f docker-compose.stage.yml build
    
    log_info "Step 3: Stopping old container..."
    docker-compose -f docker-compose.stage.yml down
    
    log_info "Step 4: Starting new container..."
    docker-compose -f docker-compose.stage.yml up -d
    
    log_info "Step 5: Waiting for service to be healthy..."
    sleep 5
    
    # Check health
    local max_attempts=30
    local attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if curl -sf http://localhost:3013/health > /dev/null 2>&1; then
            log_success "Service is healthy!"
            break
        fi
        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done
    
    if [ $attempt -eq $max_attempts ]; then
        log_error "Service failed to become healthy"
        log_info "Checking logs:"
        docker-compose -f docker-compose.stage.yml logs --tail=50
        exit 1
    fi
    
    echo ""
    log_success "Staging deployment completed successfully!"
    echo ""
    log_info "Service is running at: http://localhost:3013"
    log_info "Health check: http://localhost:3013/health"
    log_info "Metrics: http://localhost:3013/metrics"
    echo ""
    log_info "View logs: docker-compose -f deploy/stage/docker-compose.stage.yml logs -f"
}

# Deploy to production
deploy_production() {
    local slot="${1:-auto}"
    local build_flag="$2"
    
    log_info "Deploying to PRODUCTION environment"
    log_info "===================================="
    
    cd "$PROJECT_ROOT/deploy/prod"
    
    # Call production deployment script with parameters
    if [ "$slot" = "auto" ]; then
        if [ -n "$build_flag" ]; then
            bash deploy.sh "$build_flag"
        else
            bash deploy.sh
        fi
    else
        if [ -n "$build_flag" ]; then
            bash deploy.sh "$slot" "$build_flag"
        else
            bash deploy.sh "$slot"
        fi
    fi
}

# Main script
main() {
    local environment="$1"
    local slot="auto"
    local build_flag=""
    
    # Parse arguments
    shift || true
    while [ $# -gt 0 ]; do
        case "$1" in
            --slot=*)
                slot="${1#*=}"
                ;;
            --no-cache|--rebuild)
                build_flag="--no-cache"
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
        shift
    done
    
    # Validate environment
    case "$environment" in
        staging)
            deploy_staging
            ;;
        production)
            deploy_production "$slot" "$build_flag"
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        "")
            log_error "Environment not specified"
            show_usage
            exit 1
            ;;
        *)
            log_error "Invalid environment: $environment"
            log_error "Valid environments: staging, production"
            show_usage
            exit 1
            ;;
    esac
}

main "$@"
