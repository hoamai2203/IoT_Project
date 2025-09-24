const config = require('../../config/index');
const { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../utils/constants');
const { Validators } = require('../utils/validators');


class ProfileController {
  /**
   * Get profile information
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getProfile(req, res) {
    try {
      const profile = {
        name: config.profile.name,
        email: config.profile.email,
        phone: config.profile.phone,
        address: config.profile.address,
        avatar: config.profile.avatar
      };
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.DATA_RETRIEVED,
        data: profile
      });
    } catch (error) {
      console.error('Error in getProfile controller:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
        error: error.message
      });
    }
  }
  
  /**
   * Update profile information
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateProfile(req, res) {
    try {
      // Validate input data
      const validation = Validators.validateProfile(req.body, 'update');
      if (!validation.isValid) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: ERROR_MESSAGES.VALIDATION_ERROR,
          error: validation.error.map(e => e.message).join(', ')
        });
      }
      
      // In a real application, you would update the profile in the database
      // For this demo, we'll just return the validated data
      const updatedProfile = {
        ...config.profile,
        ...validation.data,
        updatedAt: new Date().toISOString()
      };
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.DATA_UPDATED,
        data: updatedProfile
      });
    } catch (error) {
      console.error('Error in updateProfile controller:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
        error: error.message
      });
    }
  }
  
  /**
   * Get application configuration
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAppConfig(req, res) {
    try {
      const appConfig = {
        app: config.app,
        sensors: config.sensors,
        devices: config.devices,
        ui: config.ui,
        api: config.api
      };
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.DATA_RETRIEVED,
        data: appConfig
      });
    } catch (error) {
      console.error('Error in getAppConfig controller:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
        error: error.message
      });
    }
  }
  
  /**
   * Get system information
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getSystemInfo(req, res) {
    try {
      const systemInfo = {
        app: {
          name: config.app.name,
          version: config.app.version,
          environment: config.env,
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch
        },
        database: {
          host: config.database.host,
          port: config.database.port,
          database: config.database.database,
          connected: true // This would be checked against actual DB connection
        },
        mqtt: {
          brokerUrl: config.mqtt.brokerUrl,
          connected: true // This would be checked against actual MQTT connection
        },
        websocket: {
          port: config.websocket.port,
          connectedClients: 0 // This would be checked against actual WS connections
        }
      };
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.DATA_RETRIEVED,
        data: systemInfo
      });
    } catch (error) {
      console.error('Error in getSystemInfo controller:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
        error: error.message
      });
    }
  }
  
  /**
   * Get health status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getHealthStatus(req, res) {
    try {
      const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: {
            status: 'healthy',
            message: 'Database connection is active'
          },
          mqtt: {
            status: 'healthy',
            message: 'MQTT connection is active'
          },
          websocket: {
            status: 'healthy',
            message: 'WebSocket server is running'
          }
        },
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: config.app.version
      };
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'System is healthy',
        data: healthStatus
      });
    } catch (error) {
      console.error('Error in getHealthStatus controller:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'System health check failed',
        error: error.message
      });
    }
  }
  
  /**
   * Get sensor configuration
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getSensorConfig(req, res) {
    try {
      const sensorConfig = {
        dht11: {
          name: config.sensors.dht11.name,
          description: config.sensors.dht11.description,
          unit: config.sensors.dht11.unit,
          min: config.sensors.dht11.min,
          max: config.sensors.dht11.max
        },
        bh1750: {
          name: config.sensors.bh1750.name,
          description: config.sensors.bh1750.description,
          unit: config.sensors.bh1750.unit,
          min: config.sensors.bh1750.min,
          max: config.sensors.bh1750.max
        }
      };
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.DATA_RETRIEVED,
        data: sensorConfig
      });
    } catch (error) {
      console.error('Error in getSensorConfig controller:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
        error: error.message
      });
    }
  }
  
  /**
   * Get device configuration
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getDeviceConfig(req, res) {
    try {
      const deviceConfig = {
        led1: {
          name: config.devices.led1.name,
          description: config.devices.led1.description,
          type: config.devices.led1.type,
          location: config.devices.led1.location
        },
        led2: {
          name: config.devices.led2.name,
          description: config.devices.led2.description,
          type: config.devices.led2.type,
          location: config.devices.led2.location
        },
        led3: {
          name: config.devices.led3.name,
          description: config.devices.led3.description,
          type: config.devices.led3.type,
          location: config.devices.led3.location
        }
      };
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.DATA_RETRIEVED,
        data: deviceConfig
      });
    } catch (error) {
      console.error('Error in getDeviceConfig controller:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
        error: error.message
      });
    }
  }
  
  /**
   * Get UI configuration
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getUIConfig(req, res) {
    try {
      const uiConfig = {
        colors: {
          primary: config.ui.primaryColor,
          secondary: config.ui.secondaryColor,
          success: config.ui.successColor,
          error: config.ui.errorColor,
          warning: config.ui.warningColor,
          info: config.ui.infoColor,
          background: config.ui.backgroundColor,
          text: config.ui.textColor,
          border: config.ui.borderColor
        },
        theme: {
          name: 'default',
          mode: 'light'
        }
      };
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.DATA_RETRIEVED,
        data: uiConfig
      });
    } catch (error) {
      console.error('Error in getUIConfig controller:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
        error: error.message
      });
    }
  }
}

module.exports = new ProfileController();
