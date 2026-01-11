# ============================================
# Stage 1: Base image with system dependencies
# ============================================
FROM node:20-slim AS base

# Add metadata
LABEL maintainer="Nocturna Project"
LABEL description="Chart rendering service for astrological charts"
LABEL version="1.0.0"

# Install Chrome dependencies (cached unless apt packages change)
# Using BuildKit cache mount for apt cache
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    fonts-noto-color-emoji \
    libnss3 \
    libatk-bridge2.0-0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libasound2 \
    libxshmfence1 \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set Puppeteer to use system chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# ============================================
# Stage 2: Dependencies installation
# ============================================
FROM base AS dependencies

WORKDIR /app

# Copy only package files (this layer is cached unless dependencies change)
COPY package*.json ./

# Install production dependencies with npm cache mount
# This layer is cached unless package*.json changes
RUN --mount=type=cache,target=/root/.npm \
    npm ci --only=production && \
    npm cache clean --force

# ============================================
# Stage 3: Production image
# ============================================
FROM base AS production

WORKDIR /app

# Copy dependencies from previous stage (reuses cache if dependencies haven't changed)
COPY --from=dependencies --chown=node:node /app/node_modules ./node_modules

# Copy package.json for version info
COPY --chown=node:node package*.json ./

# Copy application source code (changes frequently, but doesn't trigger dependency reinstall)
COPY --chown=node:node src ./src
COPY --chown=node:node public ./public

# Set environment variables
ENV NODE_ENV=production \
    PORT=3011 \
    HOST=0.0.0.0

# Expose port
EXPOSE 3011

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3011/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Switch to non-root user for security
USER node

# Start application
CMD ["node", "src/app.js"]

