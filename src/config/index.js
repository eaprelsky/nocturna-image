require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  host: process.env.HOST || '0.0.0.0',

  // Security
  apiKey: process.env.API_KEY,

  // Puppeteer
  puppeteer: {
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    maxConcurrentRenders: parseInt(process.env.MAX_CONCURRENT_RENDERS, 10) || 5,
    renderTimeout: parseInt(process.env.RENDER_TIMEOUT, 10) || 10000,
  },

  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },

  // Monitoring
  enableMetrics: process.env.ENABLE_METRICS !== 'false',

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
};

// Validate required config
if (!config.apiKey && config.env === 'production') {
  throw new Error('API_KEY is required in production');
}

module.exports = config;

