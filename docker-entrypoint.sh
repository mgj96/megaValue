#!/bin/sh
set -e

echo "▶  Prisma: DB 스키마 동기화 중..."
node node_modules/prisma/build/index.js db push --skip-generate

echo "▶  Next.js 서버 시작..."
exec node server.js
