#!/bin/bash
# RTA by KARM - Production Deployment Script
# Usage: ./deploy.sh [docker|pm2] [build|start|stop|restart|logs]

set -euo pipefail

PROJECT_ROOT="/home/rtabykarm/Desktop/rta-by-karmenp"
DEPLOY_MODE="${1:-docker}"
ACTION="${2:-start}"

cd "$PROJECT_ROOT"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}[INFO]${NC} $*"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

check_env_files() {
    log_info "Checking environment files..."
    if [[ ! -f "apps/flux/.env" ]]; then
        log_error "apps/flux/.env not found. Copy from .env.example and configure."
        exit 1
    fi
    if [[ ! -f "apps/gateway/.env" ]]; then
        log_warn "apps/gateway/.env not found (optional for gateway)"
    fi
    log_success "Environment files OK"
}

build_web() {
    log_info "Building web frontend..."
    cd apps/web
    npm ci
    npm run build
    cd ../..
    log_success "Web build complete"
}

deploy_docker() {
    case "$ACTION" in
        build)
            log_info "Building all Docker images..."
            docker-compose build --no-cache
            log_success "Docker images built"
            ;;
        start)
            log_info "Starting all services with Docker Compose..."
            docker-compose up -d
            log_success "Services started"
            log_info "Web: http://localhost"
            log_info "Flux API: http://localhost:8788/health"
            log_info "Gateway: http://localhost:8787/health"
            ;;
        stop)
            log_info "Stopping all services..."
            docker-compose down
            log_success "Services stopped"
            ;;
        restart)
            log_info "Restarting all services..."
            docker-compose restart
            log_success "Services restarted"
            ;;
        logs)
            docker-compose logs -f
            ;;
        status)
            docker-compose ps
            ;;
        *)
            log_error "Unknown action: $ACTION. Use: build|start|stop|restart|logs|status"
            exit 1
            ;;
    esac
}

deploy_pm2() {
    case "$ACTION" in
        build)
            log_info "Building web frontend for PM2..."
            build_web
            ;;
        start)
            log_info "Starting services with PM2..."
            pm2 start ecosystem.config.cjs
            pm2 save
            log_success "Services started with PM2"
            pm2 list
            ;;
        stop)
            log_info "Stopping all PM2 processes..."
            pm2 stop all
            log_success "All processes stopped"
            ;;
        restart)
            log_info "Restarting all PM2 processes..."
            pm2 restart all
            log_success "All processes restarted"
            ;;
        logs)
            pm2 logs
            ;;
        status)
            pm2 list
            ;;
        *)
            log_error "Unknown action: $ACTION. Use: build|start|stop|restart|logs|status"
            exit 1
            ;;
    esac
}

# Main
log_info "RTA by KARM - Production Deploy"
log_info "Mode: $DEPLOY_MODE | Action: $ACTION"

check_env_files

case "$DEPLOY_MODE" in
    docker)
        deploy_docker
        ;;
    pm2)
        deploy_pm2
        ;;
    *)
        log_error "Unknown deploy mode: $DEPLOY_MODE. Use: docker|pm2"
        exit 1
        ;;
esac

log_success "Deploy complete!"