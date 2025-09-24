const { HTTP_STATUS, ERROR_MESSAGES } = require('../utils/constants');


/**
 * Global error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: HTTP_STATUS.NOT_FOUND };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, statusCode: HTTP_STATUS.BAD_REQUEST };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: HTTP_STATUS.BAD_REQUEST };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: HTTP_STATUS.UNAUTHORIZED };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: HTTP_STATUS.UNAUTHORIZED };
  }

  // Database connection errors
  if (err.code === 'ECONNREFUSED') {
    const message = 'Database connection failed';
    error = { message, statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR };
  }

  // MQTT connection errors
  if (err.message && err.message.includes('MQTT')) {
    const message = 'MQTT connection failed';
    error = { message, statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR };
  }

  // WebSocket connection errors
  if (err.message && err.message.includes('WebSocket')) {
    const message = 'WebSocket connection failed';
    error = { message, statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR };
  }

  // Default error response
  const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = error.message || ERROR_MESSAGES.INTERNAL_ERROR;

  res.status(statusCode).json({
    success: false,
    message: message,
    error: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.stack
  });
};

/**
 * Handle 404 errors
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not found - ${req.originalUrl}`);
  error.statusCode = HTTP_STATUS.NOT_FOUND;
  next(error);
};

/**
 * Handle async errors
 * @param {Function} fn - Async function
 * @returns {Function} Wrapped function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Handle validation errors
 * @param {Error} err - Validation error
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const validationErrorHandler = (err, req, res, next) => {
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(val => ({
      field: val.path,
      message: val.message,
      value: val.value
    }));

    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: ERROR_MESSAGES.VALIDATION_ERROR,
      errors: errors
    });
  }
  next(err);
};

/**
 * Handle JWT errors
 * @param {Error} err - JWT error
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const jwtErrorHandler = (err, req, res, next) => {
  if (err.name === 'JsonWebTokenError') {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: ERROR_MESSAGES.UNAUTHORIZED,
      error: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: ERROR_MESSAGES.UNAUTHORIZED,
      error: 'Token expired'
    });
  }

  next(err);
};

/**
 * Handle database errors
 * @param {Error} err - Database error
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const databaseErrorHandler = (err, req, res, next) => {
  if (err.code === 'ECONNREFUSED') {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.DATABASE_ERROR,
      error: 'Database connection failed'
    });
  }

  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: ERROR_MESSAGES.VALIDATION_ERROR,
      error: 'Duplicate entry found'
    });
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: ERROR_MESSAGES.VALIDATION_ERROR,
      error: 'Referenced record not found'
    });
  }

  next(err);
};

/**
 * Handle rate limiting errors
 * @param {Error} err - Rate limit error
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const rateLimitErrorHandler = (err, req, res, next) => {
  if (err.status === 429) {
    return res.status(HTTP_STATUS.TOO_MANY_REQUESTS || 429).json({
      success: false,
      message: 'Too many requests',
      error: 'Rate limit exceeded'
    });
  }
  next(err);
};

/**
 * Handle CORS errors
 * @param {Error} err - CORS error
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const corsErrorHandler = (err, req, res, next) => {
  if (err.message && err.message.includes('CORS')) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: ERROR_MESSAGES.FORBIDDEN,
      error: 'CORS policy violation'
    });
  }
  next(err);
};

module.exports = {
  errorHandler,
  notFound,
  asyncHandler,
  validationErrorHandler,
  jwtErrorHandler,
  databaseErrorHandler,
  rateLimitErrorHandler,
  corsErrorHandler
};
