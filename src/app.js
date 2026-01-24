const express = require('express');
const cors = require('cors');
const config = require('./config');
const logger = require('./utils/logger');
const browserService = require('./services/browser.service');
const requestLogger = require('./api/middlewares/requestLogger.middleware');
const rateLimiter = require('./api/middlewares/rateLimit.middleware');
const errorHandler = require('./api/middlewares/errorHandler.middleware');
const routes = require('./api/routes');
const routesV2 = require('./api/routes/index.v2');

const app = express();

// Middleware
app.use(cors(config.cors));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Library is loaded from CDN (v3.0.1 includes inline icons) - no static assets required
logger.info('Using nocturna-wheel v3.0.1 from CDN with built-in inline icons');

app.use(requestLogger);

// Rate limiting
app.use('/api', rateLimiter);

// Routes
app.use('/', routes);
app.use('/api/v1', routes); // v1 API (legacy wheel order)
app.use('/api/v2', routesV2); // v2 API (correct wheel order)

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Nocturna Chart Service',
    version: '2.0.0',
    status: 'running',
    apiVersions: {
      v1: {
        description: 'Legacy API (natal/person1 on outer, transit/person2 on inner)',
        status: 'deprecated',
        endpoints: {
          render: 'POST /api/v1/chart/render',
          renderTransit: 'POST /api/v1/chart/render/transit',
          renderSynastry: 'POST /api/v1/chart/render/synastry',
          renderBiwheel: 'POST /api/v1/chart/render/biwheel',
        },
      },
      v2: {
        description: 'Current API (natal/person1/inner on inner, transit/person2/outer on outer)',
        status: 'stable',
        endpoints: {
          render: 'POST /api/v2/chart/render',
          renderTransit: 'POST /api/v2/chart/render/transit',
          renderSynastry: 'POST /api/v2/chart/render/synastry',
          renderBiwheel: 'POST /api/v2/chart/render/biwheel',
        },
      },
    },
    systemEndpoints: {
      health: '/health',
      metrics: '/metrics',
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
    },
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received, starting graceful shutdown...`);

  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      await browserService.close();
      logger.info('Browser closed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// Start server
let server;

async function startServer() {
  try {
    // Initialize browser
    logger.info('Initializing browser...');
    await browserService.initialize();

    // Start HTTP server
    server = app.listen(config.port, config.host, () => {
      logger.info(`Server running on ${config.host}:${config.port}`, {
        env: config.env,
        nodeVersion: process.version,
      });
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = app;

