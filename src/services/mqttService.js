const mqttClient = require('../../config/mqtt');
const sensorService = require('./sensorService');
const deviceService = require('./deviceService');
const { MQTT_TOPICS } = require('../utils/constants');


class MQTTService {
  constructor() {
    this.isConnected = false;
    this.messageHandlers = new Map();
    this.setupMessageHandlers();
  }
  
  async initialize() {
    try {
      await mqttClient.connect();
      this.isConnected = true;
      this.registerMessageHandlers();
    } catch (error) {
      console.error('Failed to initialize MQTT service:', error);
      throw error;
    }
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
      this.broadcastSensorData(sensorData);
    } catch (error) {
      this.broadcastSensorData({ error: 'Received data but failed to process', data });
    }
  }
  
  async handleDeviceStatus(data, topic) {
    try {
      this.broadcastDeviceStatus({
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
    try {
      if (!this.isConnected) {
        throw new Error('MQTT client not connected');
      }
      
      const message = {
        deviceId,
        action,
        timestamp: new Date().toISOString()
      };

      await mqttClient.publish(MQTT_TOPICS.DEVICE_CONTROL, message);
      console.info(`Published device control command: ${deviceId} -> ${action}`);
    } catch (error) {
      console.error('Error publishing device control command:', error);
      throw error;
    }
  }

  async publishDeviceStatus(deviceStatus) {
    try {
      if (!this.isConnected) {
        throw new Error('MQTT client not connected');
      }
      
      await mqttClient.publish(MQTT_TOPICS.DEVICE_STATUS, deviceStatus);
    } catch (error) {
      console.error('Error publishing device status:', error);
      throw error;
    }
  }

  broadcastSensorData(sensorData) {
    try {
      const websocketService = require('./websocketService');
      websocketService.broadcastSensorData(sensorData);
    } catch (error) {
      console.error('Error broadcasting sensor data:', error);
    }
  }

  broadcastDeviceStatus(deviceStatus) {
    try {
      const websocketService = require('./websocketService');
      websocketService.broadcastDeviceStatus(deviceStatus);
    } catch (error) {
      console.error('Error broadcasting device status:', error);
    }
  }

  isHealthy() {
    return this.isConnected && mqttClient.isHealthy();
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

  async reconnect() {
    try {
      if (this.isConnected) {
        await this.disconnect();
      }
      
      await this.initialize();
      console.info('MQTT service reconnected');
    } catch (error) {
      console.error('Error reconnecting MQTT service:', error);
      throw error;
    }
  }
}

module.exports = new MQTTService();
