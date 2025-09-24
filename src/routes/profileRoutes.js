const express = require('express');
const profileController = require('../controllers/profileController');
const { validateProfile, sanitizeInput } = require('../middlewares/validation');
const { asyncHandler } = require('../middlewares/errorHandler');

const router = express.Router();

// Apply sanitization middleware to all routes
router.use(sanitizeInput());

/**
 * @route   GET /api/profile
 * @desc    Get profile information
 * @access  Public
 */
router.get('/',
  asyncHandler(profileController.getProfile)
);

/**
 * @route   PUT /api/profile
 * @desc    Update profile information
 * @access  Public
 */
router.put('/',
  validateProfile('update'),
  asyncHandler(profileController.updateProfile)
);

/**
 * @route   GET /api/profile/config
 * @desc    Get application configuration
 * @access  Public
 */
router.get('/config',
  asyncHandler(profileController.getAppConfig)
);

/**
 * @route   GET /api/profile/system
 * @desc    Get system information
 * @access  Public
 */
router.get('/system',
  asyncHandler(profileController.getSystemInfo)
);

/**
 * @route   GET /api/profile/health
 * @desc    Get health status
 * @access  Public
 */
router.get('/health',
  asyncHandler(profileController.getHealthStatus)
);

/**
 * @route   GET /api/profile/sensors
 * @desc    Get sensor configuration
 * @access  Public
 */
router.get('/sensors',
  asyncHandler(profileController.getSensorConfig)
);

/**
 * @route   GET /api/profile/devices
 * @desc    Get device configuration
 * @access  Public
 */
router.get('/devices',
  asyncHandler(profileController.getDeviceConfig)
);

/**
 * @route   GET /api/profile/ui
 * @desc    Get UI configuration
 * @access  Public
 */
router.get('/ui',
  asyncHandler(profileController.getUIConfig)
);

module.exports = router;
