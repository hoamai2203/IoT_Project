const sensorService = require('../services/sensorService');
const { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../utils/constants');


class SensorController {
  /**
   * Get sensor data with pagination and filters
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getSensorData(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        sortField = 'created_at',
        sortOrder = 'DESC',
        startDate,
        endDate,
        time,
        date,
        sensorType,
        minTemperature,
        maxTemperature,
        minHumidity,
        maxHumidity,
        minLightIntensity,
        maxLightIntensity,
        searchValue,
        searchField
      } = req.query;

      const result = await sensorService.getSensorData({
        page: parseInt(page),
        limit: parseInt(limit),
        sortField,
        sortOrder,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        time,
        date,
        sensorType,
        minTemperature: minTemperature ? parseFloat(minTemperature) : undefined,
        maxTemperature: maxTemperature ? parseFloat(maxTemperature) : undefined,
        minHumidity: minHumidity ? parseFloat(minHumidity) : undefined,
        maxHumidity: maxHumidity ? parseFloat(maxHumidity) : undefined,
        minLightIntensity: minLightIntensity ? parseInt(minLightIntensity) : undefined,
        maxLightIntensity: maxLightIntensity ? parseInt(maxLightIntensity) : undefined,
        searchValue,
        searchField
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.DATA_RETRIEVED,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error in getSensorData controller:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
        error: error.message
      });
    }
  }

  /**
   * Get sensor data by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getSensorDataById(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: ERROR_MESSAGES.INVALID_REQUEST,
          error: 'Invalid sensor data ID'
        });
      }

      const sensorData = await sensorService.getSensorDataById(parseInt(id));

      if (!sensorData) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: ERROR_MESSAGES.NOT_FOUND,
          error: 'Sensor data not found'
        });
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.DATA_RETRIEVED,
        data: sensorData
      });
    } catch (error) {
      console.error('Error in getSensorDataById controller:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
        error: error.message
      });
    }
  }

  /**
   * Get latest sensor data
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getLatestSensorData(req, res) {
    try {
      const latestData = await sensorService.getLatestSensorData();

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.DATA_RETRIEVED,
        data: latestData
      });
    } catch (error) {
      console.error('Error in getLatestSensorData controller:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
        error: error.message
      });
    }
  }

  /**
   * Get sensor data for chart
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getSensorDataForChart(req, res) {
    try {
      const { limit = 10, sensorType } = req.query;

      const chartData = await sensorService.getSensorDataForChart(
        parseInt(limit),
        sensorType
      );

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.DATA_RETRIEVED,
        data: chartData
      });
    } catch (error) {
      console.error('Error in getSensorDataForChart controller:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
        error: error.message
      });
    }
  }

  /**
   * Get sensor data statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getSensorDataStatistics(req, res) {
    try {
      const { startDate, endDate, sensorType } = req.query;

      const statistics = await sensorService.getSensorDataStatistics({
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        sensorType
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.DATA_RETRIEVED,
        data: statistics
      });
    } catch (error) {
      console.error('Error in getSensorDataStatistics controller:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
        error: error.message
      });
    }
  }

  /**
   * Search sensor data
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async searchSensorData(req, res) {
    try {
      const {
        searchValue,
        searchField,
        page = 1,
        limit = 10,
        sortField = 'created_at',
        sortOrder = 'DESC'
      } = req.query;

      if (!searchValue) {
        return res.status(400).json({
          success: false,
          message: 'Search value is required'
        });
      }

      const result = await sensorService.searchSensorData({
        searchValue,
        searchField,
        page: parseInt(page),
        limit: parseInt(limit),
        sortField,
        sortOrder
      });

      res.status(200).json({
        success: true,
        message: 'Data retrieved',
        data: result.data,
        pagination: result.pagination
      });

    } catch (error) {
      console.error('Error in searchSensorData controller:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Get sensor data count
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getSensorDataCount(req, res) {
    try {
      const { startDate, endDate, sensorType } = req.query;

      const count = await sensorService.getSensorDataCount({
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        sensorType
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.DATA_RETRIEVED,
        data: { count }
      });
    } catch (error) {
      console.error('Error in getSensorDataCount controller:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
        error: error.message
      });
    }
  }

  /**
   * Get dashboard summary
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getDashboardSummary(req, res) {
    try {
      const summary = await sensorService.getDashboardSummary();

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.DATA_RETRIEVED,
        data: summary
      });
    } catch (error) {
      console.error('Error in getDashboardSummary controller:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
        error: error.message
      });
    }
  }

  /**
   * Create sensor data (for testing or manual entry)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createSensorData(req, res) {
    try {
      const sensorData = await sensorService.createSensorData(req.body);

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: SUCCESS_MESSAGES.DATA_CREATED,
        data: sensorData
      });
    } catch (error) {
      console.error('Error in createSensorData controller:', error);

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
   * Clean up old sensor data
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async cleanupOldData(req, res) {
    try {
      const { daysToKeep = 30 } = req.body;

      const deletedCount = await sensorService.cleanupOldData(daysToKeep);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: `Cleaned up ${deletedCount} old sensor data records`,
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

  /**
 * Search sensor data by time range
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
  async searchSensorDataByTime(req, res) {
    try {
      const {
        startDate,
        endDate,
        page = 1,
        limit = 10,
        sortField = 'created_at',
        sortOrder = 'DESC'
      } = req.query;

      if (!startDate) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: ERROR_MESSAGES.INVALID_REQUEST,
          error: 'startDate is required'
        });
      }

      // Gọi service
      const sensorData = await sensorService.getSensorDataByDateRange(
        new Date(startDate),
        endDate ? new Date(endDate) : new Date()
      );

      // Pagination thủ công
      const startIndex = (page - 1) * limit;
      const paginatedData = sensorData.slice(startIndex, startIndex + parseInt(limit));

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.DATA_RETRIEVED,
        data: paginatedData,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: sensorData.length
        }
      });
    } catch (error) {
      console.error('Error in searchSensorDataByTime controller:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
        error: error.message
      });
    }
  }
}

module.exports = new SensorController();
