const express = require('express');
const sensorRoutes = require('./sensorRoutes');
const deviceRoutes = require('./deviceRoutes');
const profileRoutes = require('./profileRoutes');
const { HTTP_STATUS, SUCCESS_MESSAGES } = require('../utils/constants');


const router = express.Router();

/**
 * @route   GET /api
 * @desc    API root endpoint
 * @access  Public
 */
router.get('/', (req, res) => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.DATA_RETRIEVED,
    data: {
      name: 'IoT Smart Home API',
      version: '1.0.0',
      description: 'RESTful API for IoT Smart Home monitoring and control system',
      endpoints: {
        sensors: '/api/sensors',
        devices: '/api/devices',
        profile: '/api/profile'
      },
      documentation: '/api/docs',
      health: '/api/health'
    }
  });
});

/**
 * @route   GET /api/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'API is healthy',
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: '1.0.0'
    }
  });
});

/**
 * @route   GET /api/docs
 * @desc    API documentation endpoint
 * @access  Public
 */
router.get('/docs', (req, res) => {
  const documentation = {
    name: 'IoT Smart Home API Documentation',
    version: '1.0.0',
    description: 'RESTful API for IoT Smart Home monitoring and control system',
    baseUrl: `${req.protocol}://${req.get('host')}/api`,
    endpoints: {
      sensors: {
        description: 'Sensor data management',
        baseUrl: '/api/sensors',
        methods: {
          'GET /': 'Get sensor data with pagination and filters',
          'GET /latest': 'Get latest sensor data',
          'GET /chart': 'Get sensor data for chart',
          'GET /statistics': 'Get sensor data statistics',
          'GET /search': 'Search sensor data',
          'GET /count': 'Get sensor data count',
          'GET /dashboard': 'Get dashboard summary',
          'GET /:id': 'Get sensor data by ID',
          'POST /': 'Create sensor data',
          'POST /cleanup': 'Clean up old sensor data'
        }
      },
      devices: {
        description: 'Device control management',
        baseUrl: '/api/devices',
        methods: {
          'GET /': 'Get device control records with pagination and filters',
          'GET /status': 'Get latest device status for all devices',
          'GET /status/:deviceId': 'Get latest status for specific device',
          'GET /:deviceId/history': 'Get device control history',
          'GET /statistics': 'Get device control statistics',
          'GET /usage/hourly': 'Get device usage statistics by hour',
          'GET /search': 'Search device control records',
          'GET /count': 'Get device control count',
          'GET /summary': 'Get device status summary',
          'GET /:id': 'Get device control record by ID',
          'POST /control': 'Control device (turn on/off/toggle)',
          'POST /': 'Create device control record',
          'POST /cleanup': 'Clean up old device control records'
        }
      },
      profile: {
        description: 'Profile and configuration management',
        baseUrl: '/api/profile',
        methods: {
          'GET /': 'Get profile information',
          'PUT /': 'Update profile information',
          'GET /config': 'Get application configuration',
          'GET /system': 'Get system information',
          'GET /health': 'Get health status',
          'GET /sensors': 'Get sensor configuration',
          'GET /devices': 'Get device configuration',
          'GET /ui': 'Get UI configuration'
        }
      }
    },
    parameters: {
      pagination: {
        page: 'Page number (default: 1)',
        limit: 'Number of records per page (default: 10, max: 100)',
        sortField: 'Field to sort by (default: created_at)',
        sortOrder: 'Sort order: ASC or DESC (default: DESC)'
      },
      filters: {
        startDate: 'Start date for filtering (ISO 8601 format)',
        endDate: 'End date for filtering (ISO 8601 format)',
        sensorType: 'Sensor type: dht11 or bh1750',
        deviceId: 'Device ID: led1, led2, or led3',
        action: 'Device action: on, off, or toggle'
      },
      search: {
        searchValue: 'Value to search for',
        searchField: 'Field to search in'
      }
    },
    responses: {
      success: {
        success: true,
        message: 'Success message',
        data: 'Response data'
      },
      error: {
        success: false,
        message: 'Error message',
        error: 'Error details'
      }
    }
  };

  res.status(HTTP_STATUS.OK).json(documentation);
});

// Mount route modules
router.use('/sensors', sensorRoutes);
router.use('/devices', deviceRoutes);
router.use('/profile', profileRoutes);

// Handle 404 for API routes
router.use('*', (req, res) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: 'API endpoint not found',
    error: `Cannot ${req.method} ${req.originalUrl}`
  });
});

module.exports = router;
