const database = require('./database');
const { DB_TABLES, SENSOR_FIELDS } = require('../utils/constants');
const { parse } = require('../utils/dateHelper');


class SensorModel {
  constructor() {
    this.table = DB_TABLES.SENSOR_DATA;
  }
  
  /**
   * Create new sensor data record
   * @param {Object} data - Sensor data
   * @returns {Promise<Object>} Created record
   */
  async create(data) {
    try {
      const sensorData = {
        temperature: data.temperature,
        humidity: data.humidity,
        light_intensity: data.light_intensity,
        created_at: data.timestamp || new Date()
      };
      
      const result = await database.insert(this.table, sensorData);
      return {
        id: result.id,
        ...sensorData
      };
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Get sensor data by ID
   * @param {number} id - Record ID
   * @returns {Promise<Object|null>} Sensor data or null
   */
  async findById(id) {
    try {
      return await database.findById(this.table, id);
    } catch (error) {
      console.error('Error finding sensor data by ID:', error);
      throw error;
    }
  }
  
  /**
   * Get paginated sensor data with filters
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated results
   */
  async findPaginated(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortField = SENSOR_FIELDS.CREATED_AT,
        sortOrder = 'DESC',
        startDate,
        endDate,
        sensorType,
        minTemperature,
        maxTemperature,
        minHumidity,
        maxHumidity,
        minLightIntensity,
        maxLightIntensity,
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
      
      // sensor_type removed
      
      // Temperature range filter
      if (minTemperature !== undefined) {
        whereConditions.push('temperature >= ?');
        params.push(minTemperature);
      }
      
      if (maxTemperature !== undefined) {
        whereConditions.push('temperature <= ?');
        params.push(maxTemperature);
      }
      
      // Humidity range filter
      if (minHumidity !== undefined) {
        whereConditions.push('humidity >= ?');
        params.push(minHumidity);
      }
      
      if (maxHumidity !== undefined) {
        whereConditions.push('humidity <= ?');
        params.push(maxHumidity);
      }
      
      // Light intensity range filter
      if (minLightIntensity !== undefined) {
        whereConditions.push('light_intensity >= ?');
        params.push(minLightIntensity);
      }
      
      if (maxLightIntensity !== undefined) {
        whereConditions.push('light_intensity <= ?');
        params.push(maxLightIntensity);
      }
      
      // Search filter
      if (searchValue && searchField) {
        if (searchField === 'temperature' || searchField === 'humidity' || searchField === 'light_intensity') {
          whereConditions.push(`${searchField} = ?`);
          params.push(parseFloat(searchValue));
        }
      }

      if (searchValue && searchField === 'created_at') {
        const date = parse(searchValue);
        if (date) {
          const startOfDay = new Date(date.setHours(0, 0, 0, 0));
          const endOfDay = new Date(date.setHours(23, 59, 59, 999));
          whereConditions.push('created_at BETWEEN ? AND ?');
          params.push(startOfDay, endOfDay);
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
      console.error('Error finding paginated sensor data:', error);
      throw error;
    }
  }
  
  /**
   * Get latest sensor data
   * @param {string} sensorType - Sensor type (optional)
   * @returns {Promise<Array>} Latest sensor data
   */
  async findLatest(sensorType = null) {
    try {
      let where = '';
      let params = [];
      
      // sensor_type removed
      
      const sql = `
        SELECT *
        FROM ${this.table}
        ORDER BY created_at DESC
        LIMIT 1
      `;
      
      const results = await database.query(sql, params);
      return results;
    } catch (error) {
      console.error('Error finding latest sensor data:', error);
      throw error;
    }
  }
  
  /**
   * Get sensor data for chart (last N records)
   * @param {number} limit - Number of records
   * @param {string} sensorType - Sensor type (optional)
   * @returns {Promise<Array>} Chart data
   */
  async findForChart(limit = 10, sensorType = null) {
    try {
      let where = '';
      let params = [];
      
      // sensor_type removed
      
      const safeLimit = Number.parseInt(limit, 10);
      if (isNaN(safeLimit) || safeLimit <= 0) {
        throw new Error('Limit must be a positive integer');
      }

      const sql = `
        SELECT 
          id,
          temperature,
          humidity,
          light_intensity,
          created_at
        FROM ${this.table}
        ${where}
        ORDER BY created_at DESC
        LIMIT ${safeLimit}
      `;

      const results = await database.query(sql, params);
      return results.reverse();
    } catch (error) {
      console.error('Error finding sensor data for chart:', error);
      throw error;
    }
  }
  
  /**
   * Get sensor data statistics
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Statistics
   */
  async getStatistics(options = {}) {
    try {
      const { startDate, endDate } = options;
      
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
      
      // sensor_type removed
      
      const where = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
      
      const sql = `
        SELECT 
          COUNT(*) as total_records,
          AVG(temperature) as avg_temperature,
          MIN(temperature) as min_temperature,
          MAX(temperature) as max_temperature,
          AVG(humidity) as avg_humidity,
          MIN(humidity) as min_humidity,
          MAX(humidity) as max_humidity,
          AVG(light_intensity) as avg_light_intensity,
          MIN(light_intensity) as min_light_intensity,
          MAX(light_intensity) as max_light_intensity
        FROM ${this.table}
        ${where}
      `;
      
      const results = await database.query(sql, params);
      return results[0];
    } catch (error) {
      console.error('Error getting sensor data statistics:', error);
      throw error;
    }
  }
  
  /**
   * Get sensor data by date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {string} sensorType - Sensor type (optional)
   * @returns {Promise<Array>} Sensor data
   */
  async findByDateRange(startDate, endDate, sensorType = null) {
    try {
      let where = 'WHERE created_at >= ? AND created_at <= ?';
      let params = [startDate, endDate];
      
      // sensor_type removed
      
      const sql = `
        SELECT * FROM ${this.table}
        ${where}
        ORDER BY created_at ASC
      `;
      
      const results = await database.query(sql, params);
      return results;
    } catch (error) {
      console.error('Error finding sensor data by date range:', error);
      throw error;
    }
  }
  
  /**
   * Delete old sensor data
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
      
      console.info(`Deleted ${result.affectedRows} old sensor data records`);
      return result.affectedRows;
    } catch (error) {
      console.error('Error deleting old sensor data:', error);
      throw error;
    }
  }
  
  /**
   * Get sensor data count
   * @param {Object} options - Query options
   * @returns {Promise<number>} Count
   */
  async count(options = {}) {
    try {
      const { startDate, endDate } = options;
      
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
      
      // sensor_type removed
      
      const where = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
      
      return await database.count(this.table, where, params);
    } catch (error) {
      console.error('Error counting sensor data:', error);
      throw error;
    }
  }
}

module.exports = new SensorModel();
