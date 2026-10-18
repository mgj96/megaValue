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

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time env vars (NEXT_PUBLIC_* 는 빌드 시 번들에 포함됨)
ARG CACHEBUST
ARG GOOGLE_ADS_TXT_CONTENT=""
ARG NEXT_PUBLIC_GOOGLE_ADSENSE_ACCOUNT=""
ARG GA4_ID=""

ENV GOOGLE_ADS_TXT_CONTENT=$GOOGLE_ADS_TXT_CONTENT \
    NEXT_PUBLIC_GOOGLE_ADSENSE_ACCOUNT=$NEXT_PUBLIC_GOOGLE_ADSENSE_ACCOUNT \
    GA4_ID=$GA4_ID \
    NEXT_TELEMETRY_DISABLED=1

# ads.txt 생성 (Docker에서는 tsx 없이 Node로만 처리 → generate-ads-txt 스크립트 스킵)
RUN node -e "require('fs').mkdirSync('public',{recursive:true}); require('fs').writeFileSync('public/ads.txt', process.env.GOOGLE_ADS_TXT_CONTENT || '')"

# CACHEBUST(예: git sha)로 푸시마다 이 레이어 캐시 무효화 → 항상 최신 소스로 빌드
RUN echo "Build from ${CACHEBUST:-unknown}" && pnpm exec next build

# ─── 4. Runner ────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# standalone 빌드 결과물
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 엔트리포인트
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
