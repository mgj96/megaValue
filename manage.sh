#!/usr/bin/env bash
# manage.sh — mesulive Docker 관리 스크립트
set -euo pipefail

COMPOSE_BASE="docker compose -f docker-compose.yml"
COMPOSE_DEV="$COMPOSE_BASE -f docker-compose.dev.yml"

usage() {
  cat <<EOF
사용법: ./manage.sh <command>

Commands:
  dev       개발 서버 시작 (소스코드 볼륨 마운트 + 핫 리로드)
  up        프로덕션 서버 시작
  down      서버 종료
  build     프로덕션 이미지 빌드
  logs      앱 로그 실시간 출력
  db        PostgreSQL 쉘 접속
  migrate   Prisma 마이그레이션 실행 (프로덕션)
  ps        실행 중인 컨테이너 목록
  help      이 도움말 표시
EOF
}

case "${1:-help}" in
  dev)
    echo "개발 서버 시작..."
    $COMPOSE_DEV up --build
    ;;
  up)
    echo "프로덕션 서버 시작..."
    $COMPOSE_BASE up -d
    ;;
  down)
    $COMPOSE_BASE down
    ;;
  build)
    echo "프로덕션 이미지 빌드..."
    $COMPOSE_BASE build --no-cache
    ;;
  logs)
    $COMPOSE_BASE logs -f app
    ;;
  db)
    $COMPOSE_BASE exec db psql -U "${POSTGRES_USER:-mesulive}" "${POSTGRES_DB:-mesulive}"
    ;;
  migrate)
    echo "Prisma 마이그레이션 실행..."
    $COMPOSE_BASE exec app npx prisma migrate deploy
    ;;
  ps)
    $COMPOSE_BASE ps
    ;;
  help|*)
    usage
    ;;
esac
