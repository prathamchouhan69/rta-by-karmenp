#!/bin/bash
# KARM OS Production Deployment Script
# Sets up the complete production environment with systemd services

set -euo pipefail

PROJECT_DIR="/opt/karm-os"
REPO_URL="${REPO_URL:-https://github.com/your-org/rta-by-karmenp.git}"
BRANCH="${BRANCH:-main}"

echo "=========================================="
echo "KARM OS Production Deployment"
echo "=========================================="

# Check prerequisites
check_command() {
    if ! command -v "$1" &> /dev/null; then
        echo "ERROR: $1 is required but not installed"
        return 1
    fi
}

for cmd in docker docker-compose node npm git openssl; do
    check_command "$cmd" || exit 1
done

# Check Docker socket access
if ! docker info &> /dev/null; then
    echo "ERROR: Cannot access Docker daemon. Add user to docker group or run with sudo."
    exit 1
fi

# Create project directory
echo "Creating project directory: $PROJECT_DIR"
sudo mkdir -p "$PROJECT_DIR"
sudo chown "$USER:$USER" "$PROJECT_DIR"

# Clone or update repository
if [ -d "$PROJECT_DIR/.git" ]; then
    echo "Updating existing repository..."
    cd "$PROJECT_DIR"
    git fetch origin
    git checkout "$BRANCH"
    git pull origin "$BRANCH"
else
    echo "Cloning repository..."
    git clone -b "$BRANCH" "$REPO_URL" "$PROJECT_DIR"
    cd "$PROJECT_DIR"
fi

# Setup environment file
if [ ! -f "$PROJECT_DIR/.env.production" ]; then
    echo "Creating .env.production from template..."
    cp "$PROJECT_DIR/.env.production.example" "$PROJECT_DIR/.env.production"
    
    echo ""
    echo "IMPORTANT: You must edit $PROJECT_DIR/.env.production with your secrets!"
    echo "Required variables:"
    grep -E '^\w+=' "$PROJECT_DIR/.env.production.example" | grep -v '^#' | cut -d= -f1 | while read var; do
        echo "  - $var"
    done
    echo ""
    read -p "Press Enter after editing .env.production, or Ctrl+C to abort..."
fi

# Validate environment
echo "Validating environment..."
node "$PROJECT_DIR/scripts/validate-env.mjs" --env-file=.env.production || {
    echo "Environment validation failed. Run with --fix to auto-generate secrets:"
    echo "  node scripts/validate-env.mjs --fix --env-file=.env.production"
    exit 1
}

# Build Docker image
echo "Building Docker image..."
docker build -t karm-os:latest .

# Validate Docker Compose
echo "Validating Docker Compose configuration..."
docker compose config > /dev/null

# Install systemd services
echo "Installing systemd services..."
sudo cp "$PROJECT_DIR/deploy/systemd"/*.service /etc/systemd/system/
sudo cp "$PROJECT_DIR/deploy/systemd"/*.timer /etc/systemd/system/
sudo systemctl daemon-reload

# Enable and start timers
echo "Enabling systemd timers..."
sudo systemctl enable --now karm-backup.timer
sudo systemctl enable --now karm-health-monitor.timer
sudo systemctl enable --now karm-log-rotate.timer
sudo systemctl enable --now karm-db-maintenance.timer
sudo systemctl enable --now karm-verify-backups.timer

# Enable main service (but don't start yet - let user verify first)
sudo systemctl enable karm-gateway.service

# Run initial smoke test
echo "Running initial smoke test..."
docker compose up -d
sleep 10

for i in {1..30}; do
    if curl -sf http://127.0.0.1:8787/readyz >/dev/null; then
        echo "Gateway is ready!"
        break
    fi
    sleep 2
done

# Run gateway smoke test
if [ -n "${SETUP_CODE:-}" ] && [ -n "${FLUX_OWNER_PASSWORD:-}" ]; then
    echo "Running gateway smoke test..."
    KARM_BASE_URL=http://127.0.0.1:8787 \
    SETUP_CODE="$SETUP_CODE" \
    FLUX_OWNER_PASSWORD="$FLUX_OWNER_PASSWORD" \
    node scripts/smoke-gateway.mjs
else
    echo "Skipping authenticated smoke test (SETUP_CODE/FLUX_OWNER_PASSWORD not in environment)"
fi

# Stop test containers
docker compose down

echo ""
echo "=========================================="
echo "Deployment preparation complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Review and edit $PROJECT_DIR/.env.production"
echo "2. Configure DNS for ${CADDY_DOMAIN:-your-domain} to point to this server"
echo "3. Start the gateway service:"
echo "   sudo systemctl start karm-gateway"
echo "4. Check status:"
echo "   sudo systemctl status karm-gateway"
echo "   sudo journalctl -u karm-gateway -f"
echo "5. Verify HTTPS at https://${CADDY_DOMAIN:-your-domain}"
echo ""
echo "Automated tasks (timers) are enabled:"
systemctl list-timers --all | grep karm-