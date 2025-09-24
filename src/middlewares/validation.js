const { Validators } = require('../utils/validators');
const { HTTP_STATUS, ERROR_MESSAGES } = require('../utils/constants');

/**
 * Validate sensor data
 * @param {string} operation - Operation type (create, update, query)
 * @returns {Function} Middleware function
 */
const validateSensorData = (operation = 'create') => {
  return (req, res, next) => {
    try {
      const validation = Validators.validateSensorData(req.body, operation);
      
      if (!validation.isValid) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: ERROR_MESSAGES.VALIDATION_ERROR,
          errors: validation.error
        });
      }
      
      req.validatedData = validation.data;
      next();
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
        error: error.message
      });
    }
  };
};

/**
 * Validate device control data
 * @param {string} operation - Operation type (create, update, query)
 * @returns {Function} Middleware function
 */
const validateDeviceControl = (operation = 'create') => {
  return (req, res, next) => {
    try {
      // Accept both deviceId (frontend) and device_id (API schema)
      if (req.body && req.body.deviceId && !req.body.device_id) {
        req.body.device_id = req.body.deviceId;
      }
      const validation = Validators.validateDeviceControl(req.body, operation);
      
      if (!validation.isValid) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: ERROR_MESSAGES.VALIDATION_ERROR,
          errors: validation.error
        });
      }
      
      req.validatedData = validation.data;
      next();
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
        error: error.message
      });
    }
  };
};

/**
 * Validate profile data
 * @param {string} operation - Operation type (update)
 * @returns {Function} Middleware function
 */
const validateProfile = (operation = 'update') => {
  return (req, res, next) => {
    try {
      const validation = Validators.validateProfile(req.body, operation);
      
      if (!validation.isValid) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: ERROR_MESSAGES.VALIDATION_ERROR,
          errors: validation.error
        });
      }
      
      req.validatedData = validation.data;
      next();
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
        error: error.message
      });
    }
  };
};

/**
 * Validate pagination parameters
 * @returns {Function} Middleware function
 */
const validatePagination = () => {
  return (req, res, next) => {
    try {
      const validation = Validators.validatePagination(req.query);
      
      if (!validation.isValid) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: ERROR_MESSAGES.VALIDATION_ERROR,
          errors: validation.error
        });
      }
      
      req.validatedPagination = validation.data;
      next();
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
        error: error.message
      });
    }
  };
};

/**
 * Validate ID parameter
 * @param {string} paramName - Parameter name (default: 'id')
 * @returns {Function} Middleware function
 */
const validateId = (paramName = 'id') => {
  return (req, res, next) => {
    try {
      const id = req.params[paramName];
      
      if (!id) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: ERROR_MESSAGES.INVALID_REQUEST,
          error: `${paramName} is required`
        });
      }
      
      if (isNaN(id) || parseInt(id) <= 0) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: ERROR_MESSAGES.INVALID_REQUEST,
          error: `Invalid ${paramName}`
        });
      }
      
      req.validatedId = parseInt(id);
      next();
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
        error: error.message
      });
    }
  };
};

/**
 * Validate device ID parameter
 * @returns {Function} Middleware function
 */
const validateDeviceId = () => {
  return (req, res, next) => {
    try {
      const deviceId = req.params.deviceId || req.body.deviceId;
      
      if (!deviceId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: ERROR_MESSAGES.INVALID_REQUEST,
          error: 'Device ID is required'
        });
      }
      
      const validDeviceIds = ['led1', 'led2', 'led3'];
      if (!validDeviceIds.includes(deviceId)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: ERROR_MESSAGES.INVALID_REQUEST,
          error: 'Invalid device ID'
        });
      }
      
      req.validatedDeviceId = deviceId;
      next();
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
        error: error.message
      });
    }
  };
};

/**
 * Validate sensor type parameter
 * @returns {Function} Middleware function
 */
const validateSensorType = () => {
  return (req, res, next) => {
    try {
      const sensorType = req.query.sensorType || req.body.sensorType;
      
      if (sensorType) {
        const validSensorTypes = ['dht11', 'bh1750'];
        if (!validSensorTypes.includes(sensorType)) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: ERROR_MESSAGES.INVALID_REQUEST,
            error: 'Invalid sensor type'
          });
        }
      }
      
      req.validatedSensorType = sensorType;
      next();
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
        error: error.message
      });
    }
  };
};

/**
 * Validate date range parameters
 * @returns {Function} Middleware function
 */
const validateDateRange = () => {
  return (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (isNaN(start.getTime())) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: ERROR_MESSAGES.INVALID_REQUEST,
            error: 'Invalid start date format'
          });
        }
        
        if (isNaN(end.getTime())) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: ERROR_MESSAGES.INVALID_REQUEST,
            error: 'Invalid end date format'
          });
        }
        
        if (start > end) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: ERROR_MESSAGES.INVALID_REQUEST,
            error: 'Start date must be before end date'
          });
        }
      }
      
      next();
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
        error: error.message
      });
    }
  };
};

/**
 * Validate search parameters
 * @returns {Function} Middleware function
 */
const validateSearch = () => {
  return (req, res, next) => {
    try {
      const { searchValue, searchField } = req.query;
      
      if (searchValue && !searchField) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: ERROR_MESSAGES.INVALID_REQUEST,
          error: 'Search field is required when search value is provided'
        });
      }
      
      if (searchField && !searchValue) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: ERROR_MESSAGES.INVALID_REQUEST,
          error: 'Search value is required when search field is provided'
        });
      }
      
      next();
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
        error: error.message
      });
    }
  };
};

/**
 * Sanitize input data
 * @returns {Function} Middleware function
 */
const sanitizeInput = () => {
  return (req, res, next) => {
    try {
      // Sanitize string inputs
      if (req.body) {
        Object.keys(req.body).forEach(key => {
          if (typeof req.body[key] === 'string') {
            req.body[key] = req.body[key].trim();
          }
        });
      }
      
      if (req.query) {
        Object.keys(req.query).forEach(key => {
          if (typeof req.query[key] === 'string') {
            req.query[key] = req.query[key].trim();
          }
        });
      }
      
      next();
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
        error: error.message
      });
    }
  };
};

module.exports = {
  validateSensorData,
  validateDeviceControl,
  validateProfile,
  validatePagination,
  validateId,
  validateDeviceId,
  validateSensorType,
  validateDateRange,
  validateSearch,
  sanitizeInput
};
