const mqttClient = require('../../config/mqtt');
const sensorService = require('./sensorService');
const deviceService = require('./deviceService');
const websocketService = require('./websocketService'); // MOVED: Di chuyển lên đầu file
const { MQTT_TOPICS } = require('../utils/constants');
const eventEmitter = require('../events/eventEmitter'); // ADDED: Thêm event emitter

class MQTTService {
  constructor() {
    this.isConnected = false;
    this.messageHandlers = new Map();
    this.setupMessageHandlers();
  }

async initialize() {
  try {
    await mqttClient.connect();
    this.registerClientEventListeners();
    this.registerMessageHandlers();
  } catch (error) {
    console.error('Failed to initialize MQTT service:', error);
    this.isConnected = false; // Đảm bảo trạng thái đúng khi có lỗi
    throw error;
  }
}

  // ADDED: Hàm mới để quản lý các sự kiện của MQTT client
  registerClientEventListeners() {
    mqttClient.getClient().on('connect', () => {
      console.info('MQTT client connected to broker.');
      this.isConnected = true;
      eventEmitter.emit('mqtt_connected');
    });

    mqttClient.getClient().on('offline', () => {
      console.warn('MQTT client went offline.');
      this.isConnected = false;
      eventEmitter.emit('mqtt_disconnected');
    });

    mqttClient.getClient().on('error', (error) => {
        console.error('MQTT client error:', error);
        this.isConnected = false;
        eventEmitter.emit('mqtt_disconnected');
    });
  }

  setupMessageHandlers() {
    this.messageHandlers.set(MQTT_TOPICS.SENSOR_DATA, this.handleSensorData.bind(this));
    this.messageHandlers.set(MQTT_TOPICS.DEVICE_STATUS, this.handleDeviceStatus.bind(this));
  }

  registerMessageHandlers() {
    this.messageHandlers.forEach((handler, topic) => {
      mqttClient.onMessage(topic, handler);
    });
  }

  async handleSensorData(data, topic) {
    try {
      const sensorData = await sensorService.processMQTTSensorData(data);
      websocketService.broadcastSensorData(sensorData);
    } catch (error) {
      console.error('Error handling sensor data:', error);
      websocketService.broadcastSensorData({ error: 'Received data but failed to process', data });
    }
  }

  async handleDeviceStatus(data, topic) {
    try {
      websocketService.broadcastDeviceStatus({
        deviceId: data.deviceId,
        action: data.action,
        status: data.status,
        timestamp: data.timestamp || new Date().toISOString()
      });
      await deviceService.processMQTTDeviceStatus(data);
    } catch (error) {
      console.error('Error handling device status message:', error);
    }
  }

  async publishDeviceControl(deviceId, action) {
    await mqttClient.publish(MQTT_TOPICS.DEVICE_CONTROL, "Hello");
    try {
      const message = { deviceId, action, timestamp: new Date().toISOString() };
      await mqttClient.publish(MQTT_TOPICS.DEVICE_CONTROL, message);
      console.info(`Published device control command: ${deviceId} -> ${action}`);
    } catch (error) {
      console.error('Error publishing device control command:', error);
      throw error;
    }
  }

  broadcastSensorData(sensorData) {
      websocketService.broadcastSensorData(sensorData);
  }
  broadcastDeviceStatus(deviceStatus) {
      websocketService.broadcastDeviceStatus(deviceStatus);
  }

  isHealthy() {
    return this.isConnected && mqttClient.getClient().connected;
  }

  async disconnect() {
    try {
      await mqttClient.disconnect();
      this.isConnected = false;
    } catch (error) {
      console.error('Error disconnecting MQTT service:', error);
      throw error;
    }
  }

  getStatistics() {
    return {
      isConnected: this.isConnected,
      isHealthy: this.isHealthy(),
      subscribedTopics: Array.from(this.messageHandlers.keys()),
      brokerUrl: mqttClient.brokerUrl || 'N/A'
    };
  }
}

module.exports = new MQTTService();