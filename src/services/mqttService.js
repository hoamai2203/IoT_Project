const mqttClient = require('../../config/mqtt');

class MQTTService {
  async initialize() {
    await mqttClient.initialize();
    this.setupHandlers();
  }

  setupHandlers() {
    mqttClient.on('message', (topic, data) => {
      console.log(`[MQTT] Message received on ${topic}:`, data);
    });

    mqttClient.on('message:device/response', (data) => {
      console.log('[MQTT] Device response:', data);
      this.emit('device_response', data);
    });

    mqttClient.on('connected', () => {
      console.log('MQTT Service: Connected');
    });

    mqttClient.on('error', (error) => {
      console.error('MQTT Service: Error', error);
    });
  }

  async publish(topic, data) {
    await mqttClient.publish(topic, data);
  }

  async disconnect() {
    await mqttClient.disconnect();
  }

  getStatistics() {
    return mqttClient.getStatistics();
  }
}

module.exports = new MQTTService();
