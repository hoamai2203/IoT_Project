const deviceModel = require('../models/deviceModel');
const { Validators } = require('../utils/validators');
const { DEVICE_ACTIONS } = require('../utils/constants');
const DateHelper = require('../utils/dateHelper');


class DeviceService {
  async createDeviceControl(data) {
    try {
      const validation = Validators.validateDeviceControl(data, 'create');
      if (!validation.isValid) {
        throw new Error(`Validation error: ${validation.error.map(e => e.message).join(', ')}`);
      }
      const deviceControl = await deviceModel.create(validation.data);
      return deviceControl;
    } catch (error) {
      throw error;
    }
  }
  
  async getDeviceControlById(id) {
    try {
      if (!id || isNaN(id)) {
        throw new Error('Invalid device control record ID');
      }
      
      const deviceControl = await deviceModel.findById(id);
      return deviceControl;
    } catch (error) {
      console.error('Error getting device control record by ID:', error);
      throw error;
    }
  }
  
  /**
   * Get paginated device control records
   * @param {Object} queryParams - Query parameters
   * @returns {Promise<Object>} Paginated device control records
   */
  async getDeviceControlRecords(queryParams = {}) {
    try {
      // Validate query parameters
      const validation = Validators.validateDeviceControl(queryParams, 'query');
      if (!validation.isValid) {
        throw new Error(`Validation error: ${validation.error.map(e => e.message).join(', ')}`);
      }
      
      const result = await deviceModel.findPaginated(validation.data);
      
      console.info(`Retrieved ${result.data.length} device control records`);
      return result;
    } catch (error) {
      console.error('Error getting device control records:', error);
      throw error;
    }
  }
  
  /**
   * Get latest device status for all devices
   * @returns {Promise<Array>} Latest device status
   */
  async getLatestDeviceStatus() {
    try {
      const latestStatus = await deviceModel.findLatestStatus();
      
      console.info(`Retrieved latest status for ${latestStatus.length} devices`);
      return latestStatus;
    } catch (error) {
      console.error('Error getting latest device status:', error);
      throw error;
    }
  }
  
  /**
   * Get latest status for specific device
   * @param {string} deviceId - Device ID
   * @returns {Promise<Object|null>} Latest device status or null
   */
  async getLatestDeviceStatusById(deviceId) {
    try {
      if (!deviceId) {
        throw new Error('Device ID is required');
      }
      
      const validDeviceIds = ['led-phong-khach', 'led-phong-ngu', 'led-nha-bep'];
      if (!validDeviceIds.includes(deviceId)) {
        throw new Error('Invalid device ID');
      }
      
      const deviceStatus = await deviceModel.findLatestStatusByDevice(deviceId);
      return deviceStatus;
    } catch (error) {
      console.error('Error getting latest device status by ID:', error);
      throw error;
    }
  }
  
  /**
   * Get device control history
   * @param {string} deviceId - Device ID
   * @param {number} limit - Number of records
   * @returns {Promise<Array>} Device control history
   */
  async getDeviceControlHistory(deviceId, limit = 50) {
    try {
      if (!deviceId) {
        throw new Error('Device ID is required');
      }
      
      const validDeviceIds = ['led-phong-khach', 'led-phong-ngu', 'led-nha-bep'];
      if (!validDeviceIds.includes(deviceId)) {
        throw new Error('Invalid device ID');
      }
      
      if (limit < 1 || limit > 1000) {
        throw new Error('Limit must be between 1 and 1000');
      }
      
      const history = await deviceModel.findHistoryByDevice(deviceId, limit);
      
      console.info(`Retrieved ${history.length} device control history records for ${deviceId}`);
      return history;
    } catch (error) {
      console.error('Error getting device control history:', error);
      throw error;
    }
  }
  
  /**
   * Get device control statistics
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Statistics
   */
  async getDeviceControlStatistics(options = {}) {
    try {
      const {
        startDate,
        endDate,
        deviceId
      } = options;
      
      // Validate dates if provided
      if (startDate && !DateHelper.isValid(startDate)) {
        throw new Error('Invalid start date');
      }
      
      if (endDate && !DateHelper.isValid(endDate)) {
        throw new Error('Invalid end date');
      }
      
      if (deviceId) {
        const validDeviceIds = ['led-phong-khach', 'led-phong-ngu', 'led-nha-bep'];
        if (!validDeviceIds.includes(deviceId)) {
          throw new Error('Invalid device ID');
        }
      }
      
      const statistics = await deviceModel.getStatistics({
        startDate,
        endDate,
        deviceId
      });
      
      console.info('Retrieved device control statistics');
      return statistics;
    } catch (error) {
      console.error('Error getting device control statistics:', error);
      throw error;
    }
  }
  
  /**
   * Get device control records by date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {string} deviceId - Device ID (optional)
   * @returns {Promise<Array>} Device control records
   */
  async getDeviceControlByDateRange(startDate, endDate, deviceId = null) {
    try {
      if (!DateHelper.isValid(startDate)) {
        throw new Error('Invalid start date');
      }
      
      if (!DateHelper.isValid(endDate)) {
        throw new Error('Invalid end date');
      }
      
      if (DateHelper.isAfter(startDate, endDate)) {
        throw new Error('Start date must be before end date');
      }
      
      if (deviceId) {
        const validDeviceIds = ['led-phong-khach', 'led-phong-ngu', 'led-nha-bep'];
        if (!validDeviceIds.includes(deviceId)) {
          throw new Error('Invalid device ID');
        }
      }
      
      const deviceControl = await deviceModel.findByDateRange(startDate, endDate, deviceId);
      
      console.info(`Retrieved ${deviceControl.length} device control records for date range`);
      return deviceControl;
    } catch (error) {
      console.error('Error getting device control records by date range:', error);
      throw error;
    }
  }
  
  /**
   * Get device usage statistics by hour
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} Usage statistics by hour
   */
  async getDeviceUsageByHour(startDate, endDate, groupBy) {
    try {
      if (!DateHelper.isValid(startDate)) {
        throw new Error('Invalid start date');
      }
      
      if (!DateHelper.isValid(endDate)) {
        throw new Error('Invalid end date');
      }
      if (!DateHelper.isValid(groupBy)) {
        throw new Error('Invalid group by date');
      }
      
      if (DateHelper.isAfter(startDate, endDate, groupBy)) {
        throw new Error('Start date must be before end date');
      }
      
      const usageStats = await deviceModel.getUsageByHour(startDate, endDate, groupBy);
      
      console.info(`Retrieved device usage statistics for ${usageStats.length} hours`);
      return usageStats;
    } catch (error) {
      console.error('Error getting device usage by hour:', error);
      throw error;
    }
  }
  
  /**
   * Search device control records
   * @param {Object} searchParams - Search parameters
   * @returns {Promise<Object>} Search results
   */
  async searchDeviceControl(searchParams) {
    try {
      const {
        searchValue,
        searchField,
        page = 1,
        limit = 10,
        sortField = 'created_at',
        sortOrder = 'DESC'
      } = searchParams;
      
      if (!searchValue || !searchField) {
        throw new Error('Search value and field are required');
      }
      
      const validSearchFields = ['device_id', 'action'];
      if (!validSearchFields.includes(searchField)) {
        throw new Error('Invalid search field');
      }
      
      const result = await deviceModel.findPaginated({
        page,
        limit,
        sortField,
        sortOrder,
        searchValue,
        searchField
      });
      
      console.info(`Search completed: ${result.data.length} results found`);
      return result;
    } catch (error) {
      console.error('Error searching device control records:', error);
      throw error;
    }
  }
  
  /**
   * Get device control count
   * @param {Object} options - Query options
   * @returns {Promise<number>} Count
   */
  async getDeviceControlCount(options = {}) {
    try {
      const count = await deviceModel.count(options);
      return count;
    } catch (error) {
      console.error('Error getting device control count:', error);
      throw error;
    }
  }
  
  /**
   * Clean up old device control records
   * @param {number} daysToKeep - Number of days to keep
   * @returns {Promise<number>} Number of deleted records
   */
  async cleanupOldData(daysToKeep = 30) {
    try {
      if (daysToKeep < 1) {
        throw new Error('Days to keep must be at least 1');
      }
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const deletedCount = await deviceModel.deleteOldData(cutoffDate);
      
      console.info(`Cleaned up ${deletedCount} old device control records`);
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up old device control records:', error);
      throw error;
    }
  }
  
  /**
   * Process MQTT device control command
   * @param {Object} mqttData - MQTT device control data
   * @returns {Promise<Object>} Processed device control record
   */
  async processMQTTDeviceControl(mqttData) {
    try {
      // Validate MQTT data
      const validation = Validators.validateMQTTMessage(mqttData, 'deviceControl');
      if (!validation.isValid) {
        throw new Error(`MQTT validation error: ${validation.error.map(e => e.message).join(', ')}`);
      }
      
      const deviceControl = await this.createDeviceControl(validation.data);
      
      console.info(`Processed MQTT device control: ${deviceControl.id}`);
      return deviceControl;
    } catch (error) {
      console.error('Error processing MQTT device control:', error);
      throw error;
    }
  }
  
  /**
   * Process MQTT device status update
   * @param {Object} mqttData - MQTT device status data
   * @returns {Promise<Object>} Processed device control record
   */
  async processMQTTDeviceStatus(mqttData) {
    try {
      const validation = Validators.validateMQTTMessage(mqttData, 'deviceStatus');
      if (!validation.isValid) {
        throw new Error(`MQTT validation error: ${validation.error.map(e => e.message).join(', ')}`);
      }
      
      const { deviceId, action, status, timestamp } = validation.data;

      console.log(validation.data);

      const deviceControl = await this.createDeviceControl({
        device_id: deviceId,
        action: action,
        status: status,
        timestamp: timestamp
      });
      
      return deviceControl;
    } catch (error) {
      console.error('Error processing MQTT device status:', error);
      throw error;
    }
  }

  async getDeviceStatusSummary() {
    try {
      const latestStatus = await this.getLatestDeviceStatus();
      const statusSummary = await deviceModel.getStatusSummary();
      const statistics = await this.getDeviceControlStatistics();
      
      const summary = {
        latest: latestStatus,
        statusSummary: statusSummary,
        statistics: {
          totalCommands: statistics.total_commands,
          uniqueDevices: statistics.unique_devices,
          onCommands: statistics.on_commands,
          offCommands: statistics.off_commands,
          toggleCommands: statistics.toggle_commands
        }
      };
      
      console.info('Retrieved device status summary');
      return summary;
    } catch (error) {
      console.error('Error getting device status summary:', error);
      throw error;
    }
  }
  
  async controlDevice(deviceId, action) {
    try {
      if (!deviceId) {
        throw new Error('Device ID is required');
      }

      if (!action) {
        throw new Error('Action is required');
      }

      const validDeviceIds = ['led-phong-khach', 'led-phong-ngu', 'led-nha-bep'];
      if (!validDeviceIds.includes(deviceId)) {
        throw new Error('Invalid device ID');
      }

      if (!Object.values(DEVICE_ACTIONS).includes(action)) {
        throw new Error('Invalid action');
      }

      let newStatus = action;
      if (action === DEVICE_ACTIONS.TOGGLE) {
        const currentStatus = await this.getLatestDeviceStatusById(deviceId);
        newStatus = currentStatus && currentStatus.status === 'on' ? 'off' : 'on';
      }
      
      const deviceControl = await this.createDeviceControl({
        device_id: deviceId,
        action: action,
        status: newStatus,
        timestamp: new Date()
      });
      
      return {
        deviceId,
        action,
        status: newStatus,
        recordId: deviceControl.id,
        timestamp: deviceControl.created_at
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new DeviceService();
