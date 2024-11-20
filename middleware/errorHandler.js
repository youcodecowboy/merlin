const createError = require('http-errors');
const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  // Extract relevant request information
  const requestInfo = {
    method: req.method,
    url: req.originalUrl,
    params: req.params,
    query: req.query,
    body: req.method === 'POST' || req.method === 'PUT' ? req.body : undefined,
    headers: {
      ...req.headers,
      authorization: undefined // Don't log auth headers
    }
  };

  // Log error with context
  logger.error('Request failed', {
    error: err,
    request: requestInfo,
    timestamp: new Date().toISOString()
  });

  // If headers have already been sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle specific error types
  if (err instanceof createError.HttpError) {
    return res.status(err.status).json({
      error: {
        message: err.message,
        status: err.status,
        code: err.code
      }
    });
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: {
        message: 'Validation Error',
        details: err.details,
        code: 'VALIDATION_ERROR'
      }
    });
  }

  // Handle database errors
  if (err.code === '23505') { // PostgreSQL unique violation
    return res.status(409).json({
      error: {
        message: 'Duplicate entry',
        details: err.detail,
        code: 'DUPLICATE_ENTRY'
      }
    });
  }

  if (err.code === '23503') { // PostgreSQL foreign key violation
    return res.status(409).json({
      error: {
        message: 'Foreign key violation',
        details: err.detail,
        code: 'FOREIGN_KEY_VIOLATION'
      }
    });
  }

  // Default error response
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json({
    error: {
      message: isProduction ? 'Internal Server Error' : err.message,
      code: err.code || 'INTERNAL_ERROR',
      status: err.status || 500,
      ...(isProduction ? {} : { stack: err.stack })
    }
  });
}

module.exports = { errorHandler };