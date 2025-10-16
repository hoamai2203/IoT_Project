const deviceService = require('../services/deviceService');
const { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../utils/constants');

class DeviceController {
  /**
   * Get device control records with pagination and filters
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getDeviceControlRecords(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        sortField = 'created_at',
        sortOrder = 'DESC',
        startDate,
        endDate,
        deviceId,
        action,
        searchValue,
        searchField
      } = req.query;

      const result = await deviceService.getDeviceControlRecords({
        page: parseInt(page),
        limit: parseInt(limit),
        sortField,
        sortOrder,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        deviceId,
        action,
        searchValue,
        searchField
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.DATA_RETRIEVED,
        data: result.data.reverse(),
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error in getDeviceControlRecords controller:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
        error: error.message
      });
    }
  }

  /**
   * Get device control record by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getDeviceControlById(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: ERROR_MESSAGES.INVALID_REQUEST,
          error: 'Invalid device control record ID'
        });
      }

      const deviceControl = await deviceService.getDeviceControlById(parseInt(id));

      if (!deviceControl) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: ERROR_MESSAGES.NOT_FOUND,
          error: 'Device control record not found'
        });
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.DATA_RETRIEVED,
        data: deviceControl
      });
    } catch (error) {
      console.error('Error in getDeviceControlById controller:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
        error: error.message
      });
    }
  }

  /**
   * Get latest device status for all devices
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getLatestDeviceStatus(req, res) {
    try {
      const latestStatus = await deviceService.getLatestDeviceStatus();

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.DATA_RETRIEVED,
        data: latestStatus
      });
    } catch (error) {
      console.error('Error in getLatestDeviceStatus controller:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
        error: error.message
      });
    }
  }

  /**
   * Get latest status for specific device
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getLatestDeviceStatusById(req, res) {
    try {
      const { deviceId } = req.params;

      if (!deviceId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: ERROR_MESSAGES.INVALID_REQUEST,
          error: 'Device ID is required'
        });
      }

      const deviceStatus = await deviceService.getLatestDeviceStatusById(deviceId);

      if (!deviceStatus) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: ERROR_MESSAGES.NOT_FOUND,
          error: 'Device status not found'
        });
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.DATA_RETRIEVED,
        data: deviceStatus
      });
    } catch (error) {
      console.error('Error in getLatestDeviceStatusById controller:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
        error: error.message
      });
    }
  }

  /**
   * Get device control history
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getDeviceControlHistory(req, res) {
    try {
      const { deviceId } = req.params;
      const { limit = 50 } = req.query;

      if (!deviceId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: ERROR_MESSAGES.INVALID_REQUEST,
          error: 'Device ID is required'
        });
      }

      const history = await deviceService.getDeviceControlHistory(
        deviceId,
        parseInt(limit)
      );

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.DATA_RETRIEVED,
        data: history
      });
    } catch (error) {
      console.error('Error in getDeviceControlHistory controller:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
        error: error.message
      });
    }
  }

  /**
   * Get device control statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getDeviceControlStatistics(req, res) {
    try {
      const { startDate, endDate, deviceId } = req.query;

      const statistics = await deviceService.getDeviceControlStatistics({
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        deviceId
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.DATA_RETRIEVED,
        data: statistics
      });
    } catch (error) {
      console.error('Error in getDeviceControlStatistics controller:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
        error: error.message
      });
    }
  }

  /**
   * Get device usage statistics by hour
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getDeviceUsageByHour(req, res) {
    try {
      const { startDate, endDate, groupBy } = req.query;

      if (!startDate || !endDate || !groupBy) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: ERROR_MESSAGES.INVALID_REQUEST,
          error: 'Start date and end date are required'
        });
      }

      const usageStats = await deviceService.getDeviceUsageByHour(
        new Date(startDate),
        new Date(endDate),
        new Date(groupBy)
      );

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.DATA_RETRIEVED,
        data: usageStats
      });
    } catch (error) {
      console.error('Error in getDeviceUsageByHour controller:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
        error: error.message
      });
    }
  }
  

  /**
   * Search device control records
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async searchDeviceControl(req, res) {
    try {
      const {
        searchValue,
        searchField,
        page = 1,
        limit = 10,
        sortField = 'created_at',
        sortOrder = 'DESC'
      } = req.query;

      if (!searchValue || !searchField) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: ERROR_MESSAGES.INVALID_REQUEST,
          error: 'Search value and field are required'
        });
      }

      const result = await deviceService.searchDeviceControl({
        searchValue,
        searchField,
        page: parseInt(page),
        limit: parseInt(limit),
        sortField,
        sortOrder
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.DATA_RETRIEVED,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error in searchDeviceControl controller:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
        error: error.message
      });
    }
  }

  /**
   * Get device control count
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getDeviceControlCount(req, res) {
    try {
      const { startDate, endDate, deviceId, action } = req.query;

      const count = await deviceService.getDeviceControlCount({
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        deviceId,
        action
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.DATA_RETRIEVED,
        data: { count }
      });
    } catch (error) {
      console.error('Error in getDeviceControlCount controller:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
        error: error.message
      });
    }
  }

  /**
   * Get device status summary
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getDeviceStatusSummary(req, res) {
    try {
      const summary = await deviceService.getDeviceStatusSummary();

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.DATA_RETRIEVED,
        data: summary
      });
    } catch (error) {
      console.error('Error in getDeviceStatusSummary controller:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
        error: error.message
      });
    }
  }

  /**
   * Create device control record (for testing or manual entry)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createDeviceControl(req, res) {
    try {
      const deviceControl = await deviceService.createDeviceControl(req.body);

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: SUCCESS_MESSAGES.DATA_CREATED,
        data: deviceControl
      });
    } catch (error) {
      console.error('Error in createDeviceControl controller:', error);

      if (error.message.includes('Validation error')) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: ERROR_MESSAGES.VALIDATION_ERROR,
          error: error.message
        });
      }

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
        error: error.message
      });
    }
  }

  /**
   * Clean up old device control records
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async cleanupOldData(req, res) {
    try {
      const { daysToKeep = 30 } = req.body;

      const deletedCount = await deviceService.cleanupOldData(daysToKeep);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: `Cleaned up ${deletedCount} old device control records`,
        data: { deletedCount }
      });
    } catch (error) {
      console.error('Error in cleanupOldData controller:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
        error: error.message
      });
    }
  }

  async searchDeviceDataByTime(req, res) {
    try {
      const { startDate, endDate, deviceId, page = 1, limit = 10, sortField = 'created_at', sortOrder = 'DESC' } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ success: false, message: 'Start date and end date are required' });
      }

      // Gọi service đúng
      const allData = await deviceService.getDeviceControlByDateRange(
        new Date(startDate),
        new Date(endDate),
        deviceId || null
      );

      // Phân trang thủ công
      const startIdx = (page - 1) * limit;
      const paginatedData = allData.slice(startIdx, startIdx + Number(limit));

      res.status(200).json({
        success: true,
        data: paginatedData,
        pagination: {
          page: Number(page),
          totalPages: Math.ceil(allData.length / limit),
          totalItems: allData.length
        }
      });

    } catch (err) {
      console.error('Error in searchDeviceDataByTime:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

}

module.exports = new DeviceController();
