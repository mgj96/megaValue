#!/usr/bin/env bash
# mesulive — Docker 배포 관리 스크립트
set -euo pipefail

# ─────────────────────────────────────────────────────────────
# 색상 / 출력 헬퍼
# ─────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[ OK ]${NC}  $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERR ]${NC}  $*" >&2; exit 1; }
step()    { echo -e "\n${BOLD}${BLUE}▶  $*${NC}"; }

# ─────────────────────────────────────────────────────────────
# 설정
# ─────────────────────────────────────────────────────────────
COMPOSE_FILE="docker-compose.yml"
COMPOSE_DEV_FILE="docker-compose.dev.yml"

# ─────────────────────────────────────────────────────────────
# 사전 검사
# ─────────────────────────────────────────────────────────────
check_docker() {
  command -v docker &>/dev/null      || error "Docker가 설치되어 있지 않습니다."
  docker compose version &>/dev/null || error "Docker Compose v2 가 필요합니다."
}

check_env() {
  [[ -f ".env" ]] || error ".env 파일이 없습니다. .env.example 을 참고해 생성해주세요."
}

# ─────────────────────────────────────────────────────────────
# compose 래퍼
# ─────────────────────────────────────────────────────────────
dc()     { docker compose -f "$COMPOSE_FILE" "$@"; }
dc_dev() { docker compose -f "$COMPOSE_FILE" -f "$COMPOSE_DEV_FILE" "$@"; }

# ─────────────────────────────────────────────────────────────
# 커맨드 구현
# ─────────────────────────────────────────────────────────────

## deploy ─ 빌드 → 시작 (전체 배포)
cmd_deploy() {
  check_env
  step "전체 배포 시작 (build → up)"
  cmd_build
  cmd_up
}

## build ─ 이미지 빌드만
cmd_build() {
  check_env
  step "이미지 빌드"
  dc build --no-cache
  success "빌드 완료"
}

## up ─ 서비스 시작 (빌드 없이)
cmd_up() {
  check_env
  step "서비스 시작"
  dc up -d
  echo ""
  dc ps
  echo ""
  success "배포 완료"
  info "앱 주소 : http://localhost:${PORT:-3000}"
}

## down ─ 서비스 중지
cmd_down() {
  step "서비스 중지"
  dc down
  success "서비스가 중지됐습니다."
}

## restart ─ 재시작 (빌드 없이)
cmd_restart() {
  check_env
  step "서비스 재시작"
  dc down
  dc up -d
  echo ""
  dc ps
  success "재시작 완료"
}

## logs ─ 로그 출력
cmd_logs() {
  local service="${1:-}"
  if [[ -n "$service" ]]; then
    step "로그: $service"
    dc logs -f "$service"
  else
    step "로그: 전체"
    dc logs -f
  fi
}

## status ─ 컨테이너 상태
cmd_status() {
  step "컨테이너 상태"
  dc ps
}

## migrate ─ Prisma 마이그레이션
cmd_migrate() {
  check_env
  step "Prisma 마이그레이션 실행"
  dc exec app npx prisma migrate deploy
  success "마이그레이션 완료"
}

## clean ─ 컨테이너 + 로컬 빌드 이미지 삭제
cmd_clean() {
  step "정리 (컨테이너 + 빌드 이미지)"
  warn "로컬에서 빌드한 이미지까지 삭제됩니다. 계속하시겠습니까? (y/N)"
  read -r confirm
  if [[ "$confirm" =~ ^[Yy]$ ]]; then
    dc down --rmi local --volumes --remove-orphans
    success "정리 완료"
  else
    info "취소됐습니다."
  fi
}

## dev ─ 개발 모드 (소스코드 마운트 + hot reload)
cmd_dev() {
  check_env
  [[ -f "$COMPOSE_DEV_FILE" ]] || error "$COMPOSE_DEV_FILE 파일이 없습니다."
  step "개발 모드 시작 (hot reload)"
  dc_dev up --build
}

# ─────────────────────────────────────────────────────────────
# 도움말
# ─────────────────────────────────────────────────────────────
usage() {
  echo -e "${BOLD}${YELLOW}"
  echo "  ╔══════════════════════════════════════════╗"
  echo "  ║   🍁  mesulive  —  manage.sh              ║"
  echo "  ╚══════════════════════════════════════════╝"
  echo -e "${NC}"
  echo -e "${BOLD}사용법${NC}"
  echo "  ./manage.sh <command> [options]"
  echo ""
  echo -e "${BOLD}Commands${NC}"
  printf "  ${GREEN}%-14s${NC} %s\n" "deploy"      "이미지 빌드 + 서비스 시작  (첫 배포 / 재배포)"
  printf "  ${GREEN}%-14s${NC} %s\n" "build"       "이미지 빌드만 (up 은 하지 않음)"
  printf "  ${GREEN}%-14s${NC} %s\n" "up"          "서비스 시작 (이미지 재빌드 없음)"
  printf "  ${GREEN}%-14s${NC} %s\n" "down"        "서비스 중지"
  printf "  ${GREEN}%-14s${NC} %s\n" "restart"     "서비스 재시작 (빌드 없음)"
  printf "  ${GREEN}%-14s${NC} %s\n" "logs [svc]"  "로그 스트림  (예: logs app)"
  printf "  ${GREEN}%-14s${NC} %s\n" "status"      "컨테이너 상태 확인"
  printf "  ${GREEN}%-14s${NC} %s\n" "migrate"     "Prisma 마이그레이션 실행"
  printf "  ${GREEN}%-14s${NC} %s\n" "clean"       "컨테이너 + 로컬 빌드 이미지 삭제"
  printf "  ${GREEN}%-14s${NC} %s\n" "dev"         "개발 모드 (hot reload, 소스코드 마운트)"
  echo ""
  echo -e "${BOLD}예시${NC}"
  echo "  ./manage.sh deploy          # 최초 배포"
  echo "  ./manage.sh deploy          # 소스 변경 후 재배포"
  echo "  ./manage.sh logs app        # 앱 로그"
  echo "  ./manage.sh clean           # 완전 초기화"
  echo ""
}

# ─────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────
check_docker

COMMAND="${1:-help}"
shift || true

case "$COMMAND" in
  deploy)           cmd_deploy ;;
  build)            cmd_build ;;
  up)               cmd_up ;;
  down)             cmd_down ;;
  restart)          cmd_restart ;;
  logs)             cmd_logs "${1:-}" ;;
  status|ps)        cmd_status ;;
  migrate)          cmd_migrate ;;
  clean)            cmd_clean ;;
  dev)              cmd_dev ;;
  help|-h|--help)   usage ;;
  *) warn "알 수 없는 커맨드: '$COMMAND'"; echo ""; usage; exit 1 ;;
esac
