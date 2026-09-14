# ================================================================
# Moha Gaming Lab — Production Multi-Stage Dockerfile
# Optimized for Next.js 15, Standalone Output, & Maximum Security
# ================================================================

# ── Stage 1: Dependencies ───────────────────────────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on package-lock.json
COPY package.json package-lock.json ./
COPY prisma ./prisma/

RUN npm ci --legacy-peer-deps

# ── Stage 2: Builder ───────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client for linux-musl target
RUN npx prisma generate

# Build Next.js with standalone output enabled
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV BUILD_STANDALONE=true

# Next.js build args for public envs (with safe build-time fallbacks)
ARG NEXT_PUBLIC_SITE_URL=https://mohagaminglab.com
ARG NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-anon-key
ARG NEXT_PUBLIC_DOWNLOADS_ENABLED=true
ARG NEXT_PUBLIC_ADS_ENABLED=true
ARG NEXT_PUBLIC_ANALYTICS_ENABLED=true

ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_DOWNLOADS_ENABLED=$NEXT_PUBLIC_DOWNLOADS_ENABLED
ENV NEXT_PUBLIC_ADS_ENABLED=$NEXT_PUBLIC_ADS_ENABLED
ENV NEXT_PUBLIC_ANALYTICS_ENABLED=$NEXT_PUBLIC_ANALYTICS_ENABLED

RUN npm run build

# ── Stage 3: Production Runner ─────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Install curl for container health check
RUN apk add --no-cache curl

# Create unprivileged system user for defense-in-depth container security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy static assets and standalone server bundle
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Automated container healthcheck validating the /api/health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
