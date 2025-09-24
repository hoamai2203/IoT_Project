const jwt = require('jsonwebtoken');
const config = require('../../config/index');
const { HTTP_STATUS, ERROR_MESSAGES } = require('../utils/constants');


/**
 * Verify JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
        error: 'No token provided'
      });
    }
    
    const token = authHeader.split(' ')[1]; // Bearer <token>
    
    if (!token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
        error: 'No token provided'
      });
    }
    
    const decoded = jwt.verify(token, config.websocket.jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
        error: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
        error: 'Token expired'
      });
    }
    
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_ERROR,
      error: 'Token verification failed'
    });
  }
};

/**
 * Optional token verification (doesn't fail if no token)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const optionalToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return next();
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return next();
    }
    
    const decoded = jwt.verify(token, config.websocket.jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    // For optional token, we don't fail on error
    console.warn('Optional token verification failed:', error.message);
    next();
  }
};

/**
 * Generate JWT token
 * @param {Object} payload - Token payload
 * @param {string} expiresIn - Token expiration time
 * @returns {string} JWT token
 */
const generateToken = (payload, expiresIn = '24h') => {
  try {
    return jwt.sign(payload, config.websocket.jwtSecret, { expiresIn });
  } catch (error) {
    console.error('Token generation error:', error);
    throw error;
  }
};

/**
 * Verify WebSocket token
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
const verifyWebSocketToken = (token) => {
  try {
    return jwt.verify(token, config.websocket.jwtSecret);
  } catch (error) {
    console.error('WebSocket token verification error:', error);
    throw error;
  }
};

/**
 * Check if user has required role
 * @param {string|Array} roles - Required role(s)
 * @returns {Function} Middleware function
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: ERROR_MESSAGES.UNAUTHORIZED,
          error: 'Authentication required'
        });
      }
      
      const userRole = req.user.role || 'user';
      const requiredRoles = Array.isArray(roles) ? roles : [roles];
      
      if (!requiredRoles.includes(userRole)) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: ERROR_MESSAGES.FORBIDDEN,
          error: 'Insufficient permissions'
        });
      }
      
      next();
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
        error: 'Role verification failed'
      });
    }
  };
};

/**
 * Check if user has required permission
 * @param {string|Array} permissions - Required permission(s)
 * @returns {Function} Middleware function
 */
const requirePermission = (permissions) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: ERROR_MESSAGES.UNAUTHORIZED,
          error: 'Authentication required'
        });
      }
      
      const userPermissions = req.user.permissions || [];
      const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
      
      const hasPermission = requiredPermissions.every(permission => 
        userPermissions.includes(permission)
      );
      
      if (!hasPermission) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: ERROR_MESSAGES.FORBIDDEN,
          error: 'Insufficient permissions'
        });
      }
      
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
        error: 'Permission verification failed'
      });
    }
  };
};

/**
 * Rate limiting middleware (simple implementation)
 * @param {number} maxRequests - Maximum requests per window
 * @param {number} windowMs - Window size in milliseconds
 * @returns {Function} Middleware function
 */
const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    try {
      const clientId = req.ip || req.connection.remoteAddress;
      const now = Date.now();
      const windowStart = now - windowMs;
      
      // Clean up old entries
      for (const [key, value] of requests.entries()) {
        if (value < windowStart) {
          requests.delete(key);
        }
      }
      
      // Check current client
      const clientRequests = requests.get(clientId) || [];
      const recentRequests = clientRequests.filter(time => time > windowStart);
      
      if (recentRequests.length >= maxRequests) {
        return res.status(HTTP_STATUS.TOO_MANY_REQUESTS || 429).json({
          success: false,
          message: 'Too many requests',
          error: 'Rate limit exceeded'
        });
      }
      
      // Add current request
      recentRequests.push(now);
      requests.set(clientId, recentRequests);
      
      next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      next(); // Don't block on rate limiting errors
    }
  };
};

/**
 * API key authentication
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const verifyApiKey = (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    
    if (!apiKey) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
        error: 'API key required'
      });
    }
    
    // In a real application, you would validate against a database
    const validApiKeys = ['demo-api-key-123', 'test-api-key-456'];
    
    if (!validApiKeys.includes(apiKey)) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
        error: 'Invalid API key'
      });
    }
    
    req.apiKey = apiKey;
    next();
  } catch (error) {
    console.error('API key verification error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_ERROR,
      error: 'API key verification failed'
    });
  }
};

module.exports = {
  verifyToken,
  optionalToken,
  generateToken,
  verifyWebSocketToken,
  requireRole,
  requirePermission,
  rateLimit,
  verifyApiKey
};
