const logger = require('../../utils/logger');
const crypto = require('crypto');

function requestLogger(req, res, next) {
  const requestId = crypto.randomUUID();
  req.id = requestId;

  const startTime = Date.now();

  logger.info('Incoming request', {
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    logger.info('Request completed', {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });
  });

  next();
}

module.exports = requestLogger;

