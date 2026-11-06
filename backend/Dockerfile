# ==========================================
# ATLAS PAY - Production Multi-stage Dockerfile
# Optimized for minimal footprint and maximum security
# ==========================================

# Stage 1: Build & Prune
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Install OpenSSL for Prisma engine compatibility
RUN apk add --no-cache openssl libc6-compat

# Install dependencies with exact lockfile resolution
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

# Copy application source code
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src/

# Generate Prisma Client & compile TypeScript to production artifacts
RUN npx prisma generate
RUN npm run build

# Prune dev dependencies for lean footprint
RUN npm prune --production

# ==========================================
# Stage 2: Lean Production Runtime
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

# Security & runtime dependencies
RUN apk add --no-cache openssl dumb-init

ENV NODE_ENV=production
ENV PORT=3000

# Run container as non-privileged system user
USER node

# Copy production node_modules with pre-generated Prisma binaries
COPY --chown=node:node --from=builder /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=builder /usr/src/app/dist ./dist
COPY --chown=node:node --from=builder /usr/src/app/package*.json ./
COPY --chown=node:node --from=builder /usr/src/app/prisma ./prisma

EXPOSE 3000

# Use dumb-init to properly handle PID 1 signals and graceful shutdown
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
