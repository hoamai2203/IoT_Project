const config = require('../../config/index');

// API Constants
const API = {
  DEFAULT_PAGE_SIZE: config.api.defaultPageSize,
  MAX_PAGE_SIZE: config.api.maxPageSize,
  DEFAULT_SORT_FIELD: config.api.defaultSortField,
  DEFAULT_SORT_ORDER: config.api.defaultSortOrder
};

// Sensor Types
const SENSOR_TYPES = {
  DHT11: 'dht11',
  BH1750: 'bh1750'
};

// Device Types
const DEVICE_TYPES = {
  LED: 'led'
};

// Device Actions
const DEVICE_ACTIONS = {
  ON: 'on',
  OFF: 'off',
  TOGGLE: 'toggle'
};

// WebSocket Message Types
const WS_MESSAGE_TYPES = {
  CONNECTION: 'connection',
  SUBSCRIBE: 'subscribe',
  UNSUBSCRIBE: 'unsubscribe',
  PING: 'ping',
  PONG: 'pong',
  BROADCAST: 'broadcast',
  DEVICE_CONTROL: 'device_control',
  DEVICE_CONTROL_RESPONSE: 'device_control_response',
  SENSOR_DATA: 'sensor_data',
  DEVICE_RESPONSE: 'device_response',
  ERROR: 'error'
};

// MQTT Topics
const MQTT_TOPICS = {
  SENSOR_DATA: config.mqtt.topics.sensorData,
  DEVICE_CONTROL: config.mqtt.topics.deviceControl,
  DEVICE_RESPONSE: config.mqtt.topics.deviceStatus
};

// Database Tables
const DB_TABLES = {
  SENSOR_DATA: 'tbl_sensor_data',
  DEVICE_CONTROL: 'tbl_device_control'
};

// HTTP Status Codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
};

// Error Messages
const ERROR_MESSAGES = {
  INVALID_REQUEST: 'Invalid request',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Forbidden access',
  NOT_FOUND: 'Resource not found',
  INTERNAL_ERROR: 'Internal server error',
  DATABASE_ERROR: 'Database error',
  MQTT_ERROR: 'MQTT communication error',
  WEBSOCKET_ERROR: 'WebSocket communication error',
  VALIDATION_ERROR: 'Validation error',
  INVALID_SENSOR_TYPE: 'Invalid sensor type',
  INVALID_DEVICE_ID: 'Invalid device ID',
  INVALID_DEVICE_ACTION: 'Invalid device action'
};

// Success Messages
const SUCCESS_MESSAGES = {
  DATA_RETRIEVED: 'Data retrieved successfully',
  DATA_CREATED: 'Data created successfully',
  DATA_UPDATED: 'Data updated successfully',
  DATA_DELETED: 'Data deleted successfully',
  DEVICE_CONTROLLED: 'Device controlled successfully',
  CONNECTION_ESTABLISHED: 'Connection established successfully'
};

// Sensor Data Fields
const SENSOR_FIELDS = {
  ID: 'id',
  TEMPERATURE: 'temperature',
  HUMIDITY: 'humidity',
  LIGHT_INTENSITY: 'light_intensity',
  CREATED_AT: 'created_at'
};

// Device Control Fields
const DEVICE_CONTROL_FIELDS = {
  ID: 'id',
  DEVICE_ID: 'device_id',
  ACTION: 'action',
  CREATED_AT: 'created_at'
};

// Sort Orders
const SORT_ORDERS = {
  ASC: 'ASC',
  DESC: 'DESC'
};

// Date Formats
const DATE_FORMATS = {
  DATETIME: 'YYYY-MM-DD HH:mm:ss',
  DATE: 'YYYY-MM-DD',
  TIME: 'HH:mm:ss',
  ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ'
};

// UI Constants
const UI = {
  PRIMARY_COLOR: config.ui.primaryColor,
  SECONDARY_COLOR: config.ui.secondaryColor,
  SUCCESS_COLOR: config.ui.successColor,
  ERROR_COLOR: config.ui.errorColor,
  WARNING_COLOR: config.ui.warningColor,
  INFO_COLOR: config.ui.infoColor,
  BACKGROUND_COLOR: config.ui.backgroundColor,
  TEXT_COLOR: config.ui.textColor,
  BORDER_COLOR: config.ui.borderColor
};

module.exports = {
  API,
  SENSOR_TYPES,
  DEVICE_TYPES,
  DEVICE_ACTIONS,
  WS_MESSAGE_TYPES,
  MQTT_TOPICS,
  DB_TABLES,
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  SENSOR_FIELDS,
  DEVICE_CONTROL_FIELDS,
  SORT_ORDERS,
  DATE_FORMATS,
  UI
};
