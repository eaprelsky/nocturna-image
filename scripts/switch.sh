#!/bin/bash
# Switch traffic between Blue and Green slots
# Usage: ./scripts/switch.sh [blue|green]

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
Usage: $0 [blue|green]

Switch traffic between blue and green slots

Arguments:
  blue   - Switch to blue slot (port 3014)
  green  - Switch to green slot (port 3012)

If no argument provided, switches to the inactive slot automatically.

Examples:
  $0             # Auto-switch to inactive slot
  $0 blue        # Switch to blue slot
  $0 green       # Switch to green slot

EOF
}

# Main script
main() {
    local target_slot="$1"
    
    cd "$PROJECT_ROOT/deploy/prod"
    
    log_info "Blue-Green Traffic Switch"
    log_info "========================="
    
    # Call production switch script
    if [ -z "$target_slot" ]; then
        bash switch.sh
    else
        bash switch.sh "$target_slot"
    fi
}

# Parse arguments
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_usage
    exit 0
fi

main "$@"
