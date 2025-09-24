const cors = require('cors');
const config = require('../../config/index');

/**
 * Cau hinh CORS
 */
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:8080',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:8080'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Count',
    'X-Current-Page',
    'X-Per-Page'
  ],
  optionsSuccessStatus: 200,
  maxAge: 86400 // 24 hours
};

/**
 * CORS middleware
 */
const corsMiddleware = cors(corsOptions);

/**
 * Custom CORS handler for WebSocket connections
 * @param {Object} req - Request object
 * @param {Function} callback - Callback function
 */
const corsWebSocketHandler = (req, callback) => {
  const origin = req.headers.origin;

  if (!origin) return callback(null, true);
  
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:8080',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:8080'
  ];
  
  if (allowedOrigins.indexOf(origin) !== -1) {
    callback(null, true);
  } else {
    callback(new Error('Not allowed by CORS'), false);
  }
};

/**
 * CORS error handler
 * @param {Error} err - CORS error
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const corsErrorHandler = (err, req, res, next) => {
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      message: 'CORS policy violation',
      error: 'Origin not allowed'
    });
  }
  next(err);
};

module.exports = {
  corsMiddleware,
  corsWebSocketHandler,
  corsErrorHandler
};
