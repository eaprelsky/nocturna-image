const config = require('../../config');
const { AuthenticationError } = require('../../utils/errors');
const logger = require('../../utils/logger');

function authenticate(req, res, next) {
  // Skip auth in development if no API key is set
  if (config.env === 'development' && !config.apiKey) {
    logger.warn('Running without authentication in development mode');
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next(new AuthenticationError('Missing authorization header'));
  }

  const [type, token] = authHeader.split(' ');

  if (type !== 'Bearer') {
    return next(new AuthenticationError('Invalid authorization type'));
  }

  if (!token || token !== config.apiKey) {
    logger.warn('Authentication failed', {
      ip: req.ip,
      path: req.path,
    });
    return next(new AuthenticationError('Invalid API key'));
  }

  next();
}

module.exports = authenticate;

