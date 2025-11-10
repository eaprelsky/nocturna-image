const logger = require('../../utils/logger');
const { AppError } = require('../../utils/errors');

function errorHandler(err, req, res, _next) {
  // Default error
  let statusCode = 500;
  let errorResponse = {
    status: 'error',
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  };

  // Handle operational errors
  if (err instanceof AppError && err.isOperational) {
    statusCode = err.statusCode;
    errorResponse.error = {
      code: err.code,
      message: err.message,
    };

    if (err.details) {
      errorResponse.error.details = err.details;
    }

    logger.warn('Operational error', {
      requestId: req.id,
      code: err.code,
      message: err.message,
      details: err.details,
    });
  } else {
    // Log unexpected errors
    logger.error('Unexpected error', {
      requestId: req.id,
      error: err.message,
      stack: err.stack,
    });
  }

  // Add Retry-After header for rate limit errors
  if (err.code === 'RATE_LIMIT_EXCEEDED' && err.details?.retryAfter) {
    res.set('Retry-After', err.details.retryAfter);
  }

  res.status(statusCode).json(errorResponse);
}

module.exports = errorHandler;

