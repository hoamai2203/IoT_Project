const express = require('express');
const sensorController = require('../controllers/sensorController');
const { validateSensorData, validatePagination, validateId, validateSensorType, validateDateRange, validateSearch, sanitizeInput } = require('../middlewares/validation');
const { asyncHandler } = require('../middlewares/errorHandler');

const router = express.Router();

router.use(sanitizeInput());

/**
 * @route   GET /api/sensors
 * @desc    Get sensor data with pagination and filters
 * @access  Public
 */
router.get('/',
  validatePagination(),
  validateSensorType(),
  validateDateRange(),
  validateSearch(),
  asyncHandler(sensorController.getSensorData)
);

/**
 * @route   GET /api/sensors/latest
 * @desc    Get latest sensor data
 * @access  Public
 */
router.get('/latest',
  validateSensorType(),
  asyncHandler(sensorController.getLatestSensorData)
);

/**
 * @route   GET /api/sensors/chart
 * @desc    Get sensor data for chart
 * @access  Public
 */
router.get('/chart',
  validateSensorType(),
  asyncHandler(sensorController.getSensorDataForChart)
);

/**
 * @route   GET /api/sensors/statistics
 * @desc    Get sensor data statistics
 * @access  Public
 */
router.get('/statistics',
  validateSensorType(),
  validateDateRange(),
  asyncHandler(sensorController.getSensorDataStatistics)
);

/**
 * @route   GET /api/sensors/search
 * @desc    Search sensor data
 * @access  Public
 */
router.get('/search',
  validatePagination(),
  validateSearch(),
  asyncHandler(sensorController.searchSensorData)
);

/**
 * @route   GET /api/sensors/count
 * @desc    Get sensor data count
 * @access  Public
 */
router.get('/count',
  validateSensorType(),
  validateDateRange(),
  asyncHandler(sensorController.getSensorDataCount)
);

/**
 * @route   GET /api/sensors/dashboard
 * @desc    Get dashboard summary
 * @access  Public
 */
router.get('/dashboard',
  asyncHandler(sensorController.getDashboardSummary)
);

/**
 * @route   GET /api/sensors/:id
 * @desc    Get sensor data by ID
 * @access  Public
 */
router.get('/:id',
  validateId(),
  asyncHandler(sensorController.getSensorDataById)
);

/**
 * @route   POST /api/sensors
 * @desc    Create sensor data
 * @access  Public
 */
router.post('/',
  validateSensorData('create'),
  asyncHandler(sensorController.createSensorData)
);

/**
 * @route   POST /api/sensors/cleanup
 * @desc    Clean up old sensor data
 * @access  Public
 */
router.post('/cleanup',
  asyncHandler(sensorController.cleanupOldData)
);

router.get('/search/time', sensorController.searchSensorDataByTime);

module.exports = router;
