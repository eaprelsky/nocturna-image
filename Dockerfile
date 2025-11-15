FROM node:20-slim

# Add metadata
LABEL maintainer="Nocturna Project"
LABEL description="Chart rendering service for astrological charts"
LABEL version="1.0.0"

# Install Chrome dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
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

# Create app directory
WORKDIR /app

# Copy package files first (for better layer caching)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application files (use built-in node user from base image)
COPY --chown=node:node . .

# Set environment variables
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    NODE_ENV=production \
    PORT=3011 \
    HOST=0.0.0.0

# Expose port
EXPOSE 3011

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3011/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Switch to non-root user (built-in from node:20-slim)
USER node

# Start application
CMD ["node", "src/app.js"]

