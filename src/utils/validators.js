const Joi = require('joi');
const { DEVICE_TYPES, DEVICE_ACTIONS, SORT_ORDERS } = require('./constants');

// Common validation schemas
const commonSchemas = {
  id: Joi.number().integer().positive().required(),
  optionalId: Joi.number().integer().positive(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortField: Joi.string().valid('id', 'created_at', 'temperature', 'humidity', 'light_intensity', 'device_id', 'action').default('created_at'),
  sortOrder: Joi.string().valid(SORT_ORDERS.ASC, SORT_ORDERS.DESC).default(SORT_ORDERS.DESC),
  date: Joi.date().iso(),
  optionalDate: Joi.date().iso().allow(null),
  timestamp: Joi.date().iso().default(() => new Date().toISOString())
};

// Sensor data validation schemas
const sensorSchemas = {
  create: Joi.object({
    temperature: Joi.number().min(-40).max(80).required(),
    humidity: Joi.number().min(0).max(100).required(),
    light_intensity: Joi.number().min(0).max(65535).required(),
    timestamp: commonSchemas.timestamp
  }),
  
  update: Joi.object({
    temperature: Joi.number().min(-40).max(80),
    humidity: Joi.number().min(0).max(100),
    light_intensity: Joi.number().min(0).max(65535),
  }),
  
  query: Joi.object({
    page: commonSchemas.page,
    limit: commonSchemas.limit,
    sortField: commonSchemas.sortField,
    sortOrder: commonSchemas.sortOrder,
    startDate: commonSchemas.optionalDate,
    endDate: commonSchemas.optionalDate,
    minTemperature: Joi.number().min(-40).max(80),
    maxTemperature: Joi.number().min(-40).max(80),
    minHumidity: Joi.number().min(0).max(100),
    maxHumidity: Joi.number().min(0).max(100),
    minLightIntensity: Joi.number().min(0).max(65535),
    maxLightIntensity: Joi.number().min(0).max(65535),
    searchValue: Joi.string().max(255),
    searchField: Joi.string().valid('temperature', 'humidity', 'light_intensity')
  })
};

// Device control validation schemas
const deviceControlSchemas = {
  create: Joi.object({
    device_id: Joi.string().valid('led1', 'led2', 'led3').required(),
    action: Joi.string().valid(DEVICE_ACTIONS.ON, DEVICE_ACTIONS.OFF, DEVICE_ACTIONS.TOGGLE).required(),
    timestamp: commonSchemas.timestamp
  }),
  
  update: Joi.object({
    device_id: Joi.string().valid('led1', 'led2', 'led3'),
    action: Joi.string().valid(DEVICE_ACTIONS.ON, DEVICE_ACTIONS.OFF, DEVICE_ACTIONS.TOGGLE)
  }),
  
  query: Joi.object({
    page: commonSchemas.page,
    limit: commonSchemas.limit,
    sortField: commonSchemas.sortField,
    sortOrder: commonSchemas.sortOrder,
    startDate: commonSchemas.optionalDate,
    endDate: commonSchemas.optionalDate,
    device_id: Joi.string().valid('led1', 'led2', 'led3'),
    action: Joi.string().valid(DEVICE_ACTIONS.ON, DEVICE_ACTIONS.OFF, DEVICE_ACTIONS.TOGGLE),
    searchValue: Joi.string().max(255),
    searchField: Joi.string().valid('device_id', 'action')
  })
};

const profileSchemas = {
  update: Joi.object({
    name: Joi.string().min(1).max(100),
    email: Joi.string().email().max(255),
    phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).max(20),
    address: Joi.string().max(500),
    avatar: Joi.string().uri().max(500)
  })
};

const websocketSchemas = {
  subscribe: Joi.object({
    type: Joi.string().valid('subscribe').required(),
    topic: Joi.string().valid('sensor_data', 'device_status', 'all').required()
  }),
  
  unsubscribe: Joi.object({
    type: Joi.string().valid('unsubscribe').required(),
    topic: Joi.string().valid('sensor_data', 'device_status', 'all').required()
  }),
  
  deviceControl: Joi.object({
    type: Joi.string().valid('device_control').required(),
    deviceId: Joi.string().valid('led1', 'led2', 'led3').required(),
    action: Joi.string().valid(DEVICE_ACTIONS.ON, DEVICE_ACTIONS.OFF, DEVICE_ACTIONS.TOGGLE).required()
  }),
  
  ping: Joi.object({
    type: Joi.string().valid('ping').required()
  })
};

const mqttSchemas = {
  sensorData: Joi.object({
    temperature: Joi.number().min(-40).max(80).required(),
    humidity: Joi.number().min(0).max(100).required(),
    light_intensity: Joi.number().min(0).max(65535).required(),
    timestamp: commonSchemas.timestamp
  }),
  
  deviceControl: Joi.object({
    deviceId: Joi.string().valid('led1', 'led2', 'led3').required(),
    action: Joi.string().valid(DEVICE_ACTIONS.ON, DEVICE_ACTIONS.OFF, DEVICE_ACTIONS.TOGGLE).required(),
    timestamp: commonSchemas.timestamp
  }),
  
  deviceStatus: Joi.object({
    deviceId: Joi.string().valid('led1', 'led2', 'led3').required(),
    action: Joi.string().valid(DEVICE_ACTIONS.ON, DEVICE_ACTIONS.OFF, DEVICE_ACTIONS.TOGGLE).required(),
    status: Joi.string().valid('on', 'off').required(),
    timestamp: commonSchemas.timestamp
  })
};

class Validators {
  static validate(data, schema, options = {}) {
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      ...options
    });
    
    return {
      isValid: !error,
      data: value,
      error: error ? error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      })) : null
    };
  }
  
  static validateSensorData(data, operation = 'create') {
    const schema = sensorSchemas[operation];
    if (!schema) {
      throw new Error(`Invalid operation: ${operation}`);
    }
    return this.validate(data, schema);
  }

  static validateDeviceControl(data, operation = 'create') {
    const schema = deviceControlSchemas[operation];
    if (!schema) {
      throw new Error(`Invalid operation: ${operation}`);
    }
    return this.validate(data, schema);
  }

  static validateProfile(data, operation = 'update') {
    const schema = profileSchemas[operation];
    if (!schema) {
      throw new Error(`Invalid operation: ${operation}`);
    }
    return this.validate(data, schema);
  }

  static validateWebSocketMessage(data, messageType) {
    const schema = websocketSchemas[messageType];
    if (!schema) {
      throw new Error(`Invalid message type: ${messageType}`);
    }
    return this.validate(data, schema);
  }

  static validateMQTTMessage(data, messageType) {
    const schema = mqttSchemas[messageType];
    if (!schema) {
      throw new Error(`Invalid message type: ${messageType}`);
    }
    return this.validate(data, schema);
  }

  static validatePagination(params) {
    const schema = Joi.object({
      page: commonSchemas.page,
      limit: commonSchemas.limit,
      sortField: commonSchemas.sortField,
      sortOrder: commonSchemas.sortOrder
    });
    
    return this.validate(params, schema);
  }

  static sanitizeString(input, maxLength = 255) {
    if (typeof input !== 'string') return '';
    return input.trim().substring(0, maxLength);
  }

  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidPhone(phone) {
    const phoneRegex = /^[0-9+\-\s()]+$/;
    return phoneRegex.test(phone) && phone.length >= 10;
  }
}

module.exports = {
  Validators,
  commonSchemas,
  sensorSchemas,
  deviceControlSchemas,
  profileSchemas,
  websocketSchemas,
  mqttSchemas
};
