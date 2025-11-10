class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

class RateLimitError extends AppError {
  constructor(retryAfter = 60) {
    super('Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED', { retryAfter });
  }
}

class RenderError extends AppError {
  constructor(message, details = null) {
    super(message, 500, 'RENDER_ERROR', details);
  }
}

class TimeoutError extends AppError {
  constructor(message = 'Operation timed out') {
    super(message, 504, 'TIMEOUT_ERROR');
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  RateLimitError,
  RenderError,
  TimeoutError,
};

