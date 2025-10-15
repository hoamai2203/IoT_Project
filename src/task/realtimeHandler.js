const mqttService = require('../services/mqttService');
const websocketService = require('../services/websocketService');
const mqttClient = require('../../config/mqtt');
const wsServer = require('../../config/websocket');

class RealtimeHandler {
  constructor() {
    this.isRunning = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  async start(server) {
    if (this.isRunning) {
      console.warn('Already running');
      return;
    }

    try {
      await mqttService.initialize();
      await websocketService.initialize(server);
      
      this.setupBridge();
      
      this.isRunning = true;
      console.log('Realtime Handler started');
    } catch (error) {
      console.error('Failed to start:', error);
      throw error;
    }
  }

  setupBridge() {
    mqttClient.on('message', (topic, data) => {
      wsServer.broadcast({
        type: 'mqtt_message',
        topic,
        data
      });
    });

    mqttClient.on('connected', () => {
      this.reconnectAttempts = 0;
      wsServer.broadcast({
        type: 'mqtt_status',
        status: 'connected'
      });
    });

    mqttClient.on('disconnected', () => {
      wsServer.broadcast({
        type: 'mqtt_status',
        status: 'disconnected'
      });
    });

    // WebSocket → MQTT
    wsServer.on('publish', async (data) => {
      try {
        await mqttClient.publish(data.topic, data.payload);
      } catch (error) {
        console.error('Failed to publish:', error);
      }
    });

    wsServer.on('device_control', async (data) => {
      // Forward to MQTT or handle
      console.log('Device control from WS:', data);
    });
  }

  async stop() {
    try {
      this.isRunning = false;
      await mqttService.disconnect();
      await websocketService.close();
      console.log('Realtime Handler stopped');
    } catch (error) {
      console.error('Error stopping:', error);
      throw error;
    }
  }

  getStatistics() {
    return {
      mqtt: mqttService.getStatistics(),
      websocket: websocketService.getStatistics(),
      isRunning: this.isRunning,
    };
  }
}

module.exports = new RealtimeHandler();
