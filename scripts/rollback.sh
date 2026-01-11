#!/bin/bash
# Rollback to previous slot
# Usage: ./scripts/rollback.sh

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
Usage: $0

Rollback to the previous (standby) slot

This script will switch traffic back to the standby slot.

Examples:
  $0             # Rollback to previous slot

EOF
}

# Main script
main() {
    cd "$PROJECT_ROOT/deploy/prod"
    
    log_info "Blue-Green Rollback"
    log_info "==================="
    
    # Call production rollback script
    bash rollback.sh
}

# Parse arguments
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_usage
    exit 0
fi

main "$@"
