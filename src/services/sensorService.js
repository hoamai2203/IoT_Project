const sensorModel = require('../models/sensorModel');
const { Validators } = require('../utils/validators');
// sensor_type removed
const DateHelper = require('../utils/dateHelper');


class SensorService {
  async createSensorData(data) {
    try {
      const validation = Validators.validateSensorData(data, 'create');
      if (!validation.isValid) {
        throw new Error(`Validation error: ${validation.error.map(e => e.message).join(', ')}`);
      }
      const sensorData = await sensorModel.create(validation.data);
      return sensorData;
    } catch (error) {
      throw error;
    }
  }

  async getSensorDataById(id) {
    try {
      if (!id || isNaN(id)) {
        throw new Error('Invalid sensor data ID');
      }
      const sensorData = await sensorModel.findById(id);
      return sensorData;
    } catch (error) {
      throw error;
    }
  }

  async getSensorData(queryParams = {}) {
    try {
      const validation = Validators.validateSensorData(queryParams, 'query');
      if (!validation.isValid) {
        throw new Error(`Validation error: ${validation.error.map(e => e.message).join(', ')}`);
      }
      const result = await sensorModel.findPaginated(validation.data);
      return result;
    } catch (error) {
      console.error('Error getting sensor data:', error);
      throw error;
    }
  }

  async getLatestSensorData(sensorType = null) {
    try {
      const latestData = await sensorModel.findLatest();
      return latestData;
    } catch (error) {
      console.error('Error getting latest sensor data:', error);
      throw error;
    }
  }

  async getSensorDataForChart(limit = 10, sensorType = null) {
    const limitNew = parseInt(limit, 10) || 10;
    try {
      if (limit < 1 || limit > 100) {
        throw new Error('Limit must be between 1 and 100');
      }
      const chartData = await sensorModel.findForChart(limitNew);
      return chartData;
    } catch (error) {
      console.error('Error getting sensor data for chart:', error);
      throw error;
    }
  }

  async getSensorDataStatistics(options = {}) {
    try {
      const {
        startDate,
        endDate
      } = options;

      if (startDate && !DateHelper.isValid(startDate)) {
        throw new Error('Invalid start date');
      }

      if (endDate && !DateHelper.isValid(endDate)) {
        throw new Error('Invalid end date');
      }

      const statistics = await sensorModel.getStatistics({
        startDate,
        endDate
      });

      return statistics;
    } catch (error) {
      throw error;
    }
  }

  async getSensorDataByDateRange(startDate, endDate, sensorType = null) {
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

      const sensorData = await sensorModel.findByDateRange(startDate, endDate);

      console.info(`Retrieved ${sensorData.length} sensor data records for date range`);
      return sensorData;
    } catch (error) {
      console.error('Error getting sensor data by date range:', error);
      throw error;
    }
  }

  async searchSensorData(searchParams) {
    try {
      let {
        searchValue,
        searchField,
        page = 1,
        limit = 10,
        sortField = 'created_at',
        sortOrder = 'DESC'
      } = searchParams;

      if (!searchValue) {
        console.log('serchValue is required', searchValue);
      }

      // Regex hỗ trợ ngày + giờ: dd/mm/yyyy HH:mm
      const dateTimeRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2}))?$/;
      const rangeRegex = /^(.+)\s*-\s*(.+)$/;

      let startDate, endDate;

      if (searchField === 'created_at' || dateTimeRegex.test(searchValue)) {
        const rangeMatch = searchValue.match(rangeRegex);

        if (rangeMatch) {
          startDate = new Date(rangeMatch[1]);
          endDate = new Date(rangeMatch[2]);
        } else {
          const dateMatch = searchValue.match(dateTimeRegex);
          if (dateMatch) {
            const [_, dd, mm, yyyy, hh, min] = dateMatch;
            startDate = new Date(`${yyyy}-${mm}-${dd}T${hh || '00'}:${min || '00'}:00Z`);
            endDate = hh && min
              ? new Date(startDate.getTime() + 59_999) // 1 phút nếu có giờ:phút
              : new Date(`${yyyy}-${mm}-${dd}T23:59:59Z`); // cả ngày nếu không có giờ
          } else {
            startDate = new Date(searchValue);
            endDate = startDate;
          }
        }

        const data = await sensorModel.findByDateRange(startDate, endDate, {
          page, limit, sortField, sortOrder
        });

        return data;
      }

      // Các trường số khác (temperature, humidity...)
      const numericFields = ['temperature', 'humidity', 'light_intensity'];
      if (!numericFields.includes(searchField)) {
        throw new Error('Invalid search field');
      }

      const numericValue = parseFloat(searchValue);
      if (isNaN(numericValue)) {
        throw new Error('Search value must be a number for this field');
      }

      const result = await sensorModel.findPaginated({
        page, limit, sortField, sortOrder, searchField, searchValue: numericValue
      });

      return result;

    } catch (error) {
      console.error('Error in searchSensorData (by hour):', error);
      throw error;
    }
  }

  async getSensorDataCount(options = {}) {
    try {
      const count = await sensorModel.count(options);
      return count;
    } catch (error) {
      console.error('Error getting sensor data count:', error);
      throw error;
    }
  }

  async cleanupOldData(daysToKeep = 30) {
    try {
      if (daysToKeep < 1) {
        throw new Error('Days to keep must be at least 1');
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      const deletedCount = await sensorModel.deleteOldData(cutoffDate);

      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up old sensor data:', error);
      throw error;
    }
  }

  async processMQTTSensorData(mqttData) {
    try {
      const validation = Validators.validateMQTTMessage(mqttData, 'sensorData');
      if (!validation.isValid) {
        throw new Error(`MQTT validation error: ${validation.error.map(e => e.message).join(', ')}`);
      }
      const sensorData = await this.createSensorData(validation.data);
      return sensorData;
    } catch (error) {
      throw error;
    }
  }

  async getDashboardSummary() {
    try {
      const chartData = await this.getSensorDataForChart(10);

      const summary = {
        chart: chartData,
      };
      return summary;
    } catch (error) {
      console.error('Error getting sensor data dashboard summary:', error);
      throw error;
    }
  }
}

module.exports = new SensorService();
