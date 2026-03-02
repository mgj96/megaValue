# ─── 1. Base ──────────────────────────────────────────────────────────────────
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.15.1 --activate

# ─── 2. Dependencies ──────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ─── 3. Builder ───────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

# Prisma 바이너리 실행에 필요한 OpenSSL (prisma db push / generate 시 사용)
RUN apk add --no-cache openssl

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma: generate client (DATABASE_URL은 런타임에만 필요)
RUN npx prisma generate

# Build-time env vars (NEXT_PUBLIC_* 는 빌드 시 번들에 포함됨)
ARG DATABASE_URL="postgresql://user:pass@localhost:5432/db"
ARG GOOGLE_ADS_TXT_CONTENT=""
ARG NEXT_PUBLIC_POTENTIAL_DATA_VERSION="1"
ARG NEXT_PUBLIC_LOG_VERSION="1"
ARG NEXT_PUBLIC_GOOGLE_ADSENSE_ACCOUNT=""
ARG GA4_ID=""

ENV DATABASE_URL=$DATABASE_URL \
    GOOGLE_ADS_TXT_CONTENT=$GOOGLE_ADS_TXT_CONTENT \
    NEXT_PUBLIC_POTENTIAL_DATA_VERSION=$NEXT_PUBLIC_POTENTIAL_DATA_VERSION \
    NEXT_PUBLIC_LOG_VERSION=$NEXT_PUBLIC_LOG_VERSION \
    NEXT_PUBLIC_GOOGLE_ADSENSE_ACCOUNT=$NEXT_PUBLIC_GOOGLE_ADSENSE_ACCOUNT \
    GA4_ID=$GA4_ID \
    NEXT_TELEMETRY_DISABLED=1

RUN pnpm build

# pnpm 가상 스토어의 .prisma 클라이언트를 표준 경로로 복사
# (runner 이미지에서 COPY 시 실제 파일이 필요)
RUN PRISMA_DIR=$(find /app/node_modules/.pnpm -name ".prisma" -type d 2>/dev/null | head -1) && \
    [ -n "$PRISMA_DIR" ] && cp -r "$PRISMA_DIR" /app/node_modules/ || \
    (echo "ERROR: .prisma not found!" && exit 1)

# ─── 4. Runner ────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

# Prisma 네이티브 바이너리 실행에 필요한 OpenSSL (Alpine)
RUN apk add --no-cache openssl

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# standalone 빌드 결과물
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma 런타임 클라이언트 (네이티브 바이너리)
# builder 단계에서 표준 경로로 복사해뒀으므로 실제 파일이 복사됨
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# 엔트리포인트
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
