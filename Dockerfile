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

# Prisma: generate client (DATABASE_URL not used here, only at runtime)
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

# ─── 4. Runner ────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# standalone 빌드 결과물 복사
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma 네이티브 바이너리 (standalone이 자동 추적 못하는 경우 대비)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
