const database = require('./database');
const { DB_TABLES, DEVICE_CONTROL_FIELDS } = require('../utils/constants');


class DeviceModel {
  constructor() {
    this.table = DB_TABLES.DEVICE_CONTROL;
  }
  
  /**
   * Create new device control record
   * @param {Object} data - Device control data
   * @returns {Promise<Object>} Created record
   */
  async create(data) {
    try {
      const deviceControl = {
        device_id: data.device_id,
        action: data.action,
        status: data.status,
        created_at: data.timestamp || new Date()
      };
      const result = await database.insert(this.table, deviceControl);
      return {
        id: result.id,
        ...deviceControl
      };
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Get device control record by ID
   * @param {number} id - Record ID
   * @returns {Promise<Object|null>} Device control record or null
   */
  async findById(id) {
    try {
      return await database.findById(this.table, id);
    } catch (error) {
      console.error('Error finding device control record by ID:', error);
      throw error;
    }
  }
  
  /**
   * Get paginated device control records with filters
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated results
   */
  async findPaginated(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortField = DEVICE_CONTROL_FIELDS.CREATED_AT,
        sortOrder = 'DESC',
        startDate,
        endDate,
        deviceId,
        action,
        searchValue,
        searchField
      } = options;
      
      let whereConditions = [];
      let params = [];
      
      // Date range filter
      if (startDate) {
        whereConditions.push('created_at >= ?');
        params.push(startDate);
      }
      
      if (endDate) {
        whereConditions.push('created_at <= ?');
        params.push(endDate);
      }
      
      // Device ID filter
      if (deviceId) {
        whereConditions.push('device_id = ?');
        params.push(deviceId);
      }
      
      // Action filter
      if (action) {
        whereConditions.push('action = ?');
        params.push(action);
      }
      
      // Search filter
      if (searchValue && searchField) {
        if (searchField === 'device_id' || searchField === 'action') {
          whereConditions.push(`${searchField} = ?`);
          params.push(searchValue);
        }
      }
      
      const where = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
      
      const result = await database.getPaginated(this.table, {
        page,
        limit,
        sortField,
        sortOrder,
        where,
        params
      });
      
      return result;
    } catch (error) {
      console.error('Error finding paginated device control records:', error);
      throw error;
    }
  }
  
  /**
   * Get latest device status for all devices
   * @returns {Promise<Array>} Latest device status
   */
  async findLatestStatus() {
    try {
      const sql = `
        SELECT d1.*
        FROM ${this.table} d1
        INNER JOIN (
          SELECT 
            device_id,
            MAX(created_at) as latest_created_at
          FROM ${this.table}
          GROUP BY device_id
        ) d2 ON d1.device_id = d2.device_id AND d1.created_at = d2.latest_created_at
        ORDER BY d1.device_id
      `;
      
      const results = await database.query(sql);
      return results;
    } catch (error) {
      console.error('Error finding latest device status:', error);
      throw error;
    }
  }
  
  /**
   * Get latest status for specific device
   * @param {string} deviceId - Device ID
   * @returns {Promise<Object|null>} Latest device status or null
   */
  async findLatestStatusByDevice(deviceId) {
    try {
      const sql = `
        SELECT * FROM ${this.table}
        WHERE device_id = ?
        ORDER BY created_at DESC
        LIMIT 1
      `;
      
      const results = await database.query(sql, [deviceId]);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Error finding latest device status by device ID:', error);
      throw error;
    }
  }
  
  /**
   * Get device control history for specific device
   * @param {string} deviceId - Device ID
   * @param {number} limit - Number of records
   * @returns {Promise<Array>} Device control history
   */
  async findHistoryByDevice(deviceId, limit = 50) {
    try {
      const sql = `
        SELECT * FROM ${this.table}
        WHERE device_id = ?
        ORDER BY created_at DESC
        LIMIT ?
      `;
      
      const results = await database.query(sql, [deviceId, limit]);
      return results.reverse();
    } catch (error) {
      console.error('Error finding device control history:', error);
      throw error;
    }
  }
  
  /**
   * Get device control statistics
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Statistics
   */
  async getStatistics(options = {}) {
    try {
      const {
        startDate,
        endDate,
        deviceId
      } = options;
      
      let whereConditions = [];
      let params = [];
      
      if (startDate) {
        whereConditions.push('created_at >= ?');
        params.push(startDate);
      }
      
      if (endDate) {
        whereConditions.push('created_at <= ?');
        params.push(endDate);
      }
      
      if (deviceId) {
        whereConditions.push('device_id = ?');
        params.push(deviceId);
      }
      
      const where = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
      
      const sql = `
        SELECT 
          COUNT(*) as total_commands,
          COUNT(DISTINCT device_id) as unique_devices,
          SUM(CASE WHEN action = 'on' THEN 1 ELSE 0 END) as on_commands,
          SUM(CASE WHEN action = 'off' THEN 1 ELSE 0 END) as off_commands,
          SUM(CASE WHEN action = 'toggle' THEN 1 ELSE 0 END) as toggle_commands,
          SUM(CASE WHEN status = 'on' THEN 1 ELSE 0 END) as on_status,
          SUM(CASE WHEN status = 'off' THEN 1 ELSE 0 END) as off_status
        FROM ${this.table}
        ${where}
      `;
      
      const results = await database.query(sql, params);
      return results[0];
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
  async findByDateRange(startDate, endDate, deviceId = null) {
    try {
      let where = 'WHERE created_at >= ? AND created_at <= ?';
      let params = [startDate, endDate];
      
      if (deviceId) {
        where += ' AND device_id = ?';
        params.push(deviceId);
      }
      
      const sql = `
        SELECT * FROM ${this.table}
        ${where}
        ORDER BY created_at ASC
      `;
      
      const results = await database.query(sql, params);
      return results;
    } catch (error) {
      console.error('Error finding device control records by date range:', error);
      throw error;
    }
  }
  
  /**
   * Get device usage statistics by hour
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} Usage statistics by hour
   */
  async getUsageByHour(startDate, endDate) {
    try {
      const sql = `
        SELECT 
          DATE_FORMAT(created_at, '%Y-%m-%d %H:00:00') as hour,
          device_id,
          COUNT(*) as command_count,
          SUM(CASE WHEN action = 'on' THEN 1 ELSE 0 END) as on_count,
          SUM(CASE WHEN action = 'off' THEN 1 ELSE 0 END) as off_count,
          SUM(CASE WHEN action = 'toggle' THEN 1 ELSE 0 END) as toggle_count
        FROM ${this.table}
        WHERE created_at >= ? AND created_at <= ?
        GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d %H:00:00'), device_id
        ORDER BY hour ASC, device_id
      `;
      
      const results = await database.query(sql, [startDate, endDate]);
      return results;
    } catch (error) {
      console.error('Error getting device usage by hour:', error);
      throw error;
    }
  }
  
  /**
   * Get device control records by action
   * @param {string} action - Action type
   * @param {number} limit - Number of records
   * @returns {Promise<Array>} Device control records
   */
  async findByAction(action, limit = 100) {
    try {
      const sql = `
        SELECT * FROM ${this.table}
        WHERE action = ?
        ORDER BY created_at DESC
        LIMIT ?
      `;
      
      const results = await database.query(sql, [action, limit]);
      return results;
    } catch (error) {
      console.error('Error finding device control records by action:', error);
      throw error;
    }
  }
  
  /**
   * Delete old device control records
   * @param {Date} beforeDate - Delete records before this date
   * @returns {Promise<number>} Number of deleted records
   */
  async deleteOldData(beforeDate) {
    try {
      const result = await database.delete(
        this.table,
        'created_at < ?',
        [beforeDate]
      );
      
      console.info(`Deleted ${result.affectedRows} old device control records`);
      return result.affectedRows;
    } catch (error) {
      console.error('Error deleting old device control records:', error);
      throw error;
    }
  }
  
  /**
   * Get device control count
   * @param {Object} options - Query options
   * @returns {Promise<number>} Count
   */
  async count(options = {}) {
    try {
      const {
        startDate,
        endDate,
        deviceId,
        action
      } = options;
      
      let whereConditions = [];
      let params = [];
      
      if (startDate) {
        whereConditions.push('created_at >= ?');
        params.push(startDate);
      }
      
      if (endDate) {
        whereConditions.push('created_at <= ?');
        params.push(endDate);
      }
      
      if (deviceId) {
        whereConditions.push('device_id = ?');
        params.push(deviceId);
      }
      
      if (action) {
        whereConditions.push('action = ?');
        params.push(action);
      }
      
      const where = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
      
      return await database.count(this.table, where, params);
    } catch (error) {
      console.error('Error counting device control records:', error);
      throw error;
    }
  }
  
  /**
   * Get device status summary
   * @returns {Promise<Object>} Device status summary
   */
  async getStatusSummary() {
    try {
      const sql = `
        SELECT 
          device_id,
          status,
          created_at as last_updated
        FROM ${this.table} d1
        WHERE d1.created_at = (
          SELECT MAX(d2.created_at)
          FROM ${this.table} d2
          WHERE d2.device_id = d1.device_id
        )
        ORDER BY device_id
      `;
      
      const results = await database.query(sql);
      
      const summary = {};
      results.forEach(record => {
        summary[record.device_id] = {
          status: record.status,
          last_updated: record.last_updated
        };
      });
      
      return summary;
    } catch (error) {
      console.error('Error getting device status summary:', error);
      throw error;
    }
  }
}

module.exports = new DeviceModel();
