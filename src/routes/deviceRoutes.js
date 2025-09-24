const express = require('express');
const deviceController = require('../controllers/deviceController');
const { validateDeviceControl, validatePagination, validateId, validateDeviceId, validateDateRange, validateSearch, sanitizeInput } = require('../middlewares/validation');
const { asyncHandler } = require('../middlewares/errorHandler');

const router = express.Router();

// Apply sanitization middleware to all routes
router.use(sanitizeInput());

/**
 * @route   GET /api/devices
 * @desc    Get device control records with pagination and filters
 * @access  Public
 */
router.get('/', 
  validatePagination(),
  validateDateRange(),
  validateSearch(),
  asyncHandler(deviceController.getDeviceControlRecords)
);

/**
 * @route   GET /api/devices/status
 * @desc    Get latest device status for all devices
 * @access  Public
 */
router.get('/status',
  asyncHandler(deviceController.getLatestDeviceStatus)
);

/**
 * @route   GET /api/devices/status/:deviceId
 * @desc    Get latest status for specific device
 * @access  Public
 */
router.get('/status/:deviceId',
  validateDeviceId(),
  asyncHandler(deviceController.getLatestDeviceStatusById)
);

/**
 * @route   GET /api/devices/:deviceId/history
 * @desc    Get device control history
 * @access  Public
 */
router.get('/:deviceId/history',
  validateDeviceId(),
  asyncHandler(deviceController.getDeviceControlHistory)
);

/**
 * @route   GET /api/devices/statistics
 * @desc    Get device control statistics
 * @access  Public
 */
router.get('/statistics',
  validateDateRange(),
  asyncHandler(deviceController.getDeviceControlStatistics)
);

/**
 * @route   GET /api/devices/usage/hourly
 * @desc    Get device usage statistics by hour
 * @access  Public
 */
router.get('/usage/hourly',
  validateDateRange(),
  asyncHandler(deviceController.getDeviceUsageByHour)
);

/**
 * @route   GET /api/devices/search
 * @desc    Search device control records
 * @access  Public
 */
router.get('/search',
  validatePagination(),
  validateSearch(),
  asyncHandler(deviceController.searchDeviceControl)
);

/**
 * @route   GET /api/devices/count
 * @desc    Get device control count
 * @access  Public
 */
router.get('/count',
  validateDateRange(),
  asyncHandler(deviceController.getDeviceControlCount)
);

/**
 * @route   GET /api/devices/summary
 * @desc    Get device status summary
 * @access  Public
 */
router.get('/summary',
  asyncHandler(deviceController.getDeviceStatusSummary)
);

/**
 * @route   GET /api/devices/:id
 * @desc    Get device control record by ID
 * @access  Public
 */
router.get('/:id',
  validateId(),
  asyncHandler(deviceController.getDeviceControlById)
);

/**
 * @route   POST /api/devices/control
 * @desc    Control device (turn on/off/toggle)
 * @access  Public
 */
router.post('/control',
  validateDeviceControl('create'),
  asyncHandler(deviceController.controlDevice)
);

/**
 * @route   POST /api/devices
 * @desc    Create device control record
 * @access  Public
 */
router.post('/',
  validateDeviceControl('create'),
  asyncHandler(deviceController.createDeviceControl)
);

/**
 * @route   POST /api/devices/cleanup
 * @desc    Clean up old device control records
 * @access  Public
 */
router.post('/cleanup',
  asyncHandler(deviceController.cleanupOldData)
);

module.exports = router;
