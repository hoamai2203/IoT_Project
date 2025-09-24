const websocketServer = require('../../config/websocket');
const mqttService = require('./mqttService');
const { WS_MESSAGE_TYPES } = require('../utils/constants');

class WebSocketService {
  constructor() {
    this.isInitialized = false;
  }
  
  initialize(server) {
    try {
      websocketServer.initialize(server);
      this.isInitialized = true;
      this.setupEventHandlers();
    } catch (error) {
      console.error('Failed to initialize WebSocket service:', error);
      throw error;
    }
  }

  setupEventHandlers() {
    websocketServer.on('device_control', this.handleDeviceControl.bind(this));
  }

  async handleDeviceControl(data) {
    try {
      const { deviceId, action } = data;
      await mqttService.publishDeviceControl(deviceId, action);
      this.broadcastDeviceStatus({
        deviceId,
        action,
        status: 'pending',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.sendErrorToClient(data.clientId, 'Device control failed', error.message);
    }
  }
  
  broadcastSensorData(sensorData) {
    try {
      websocketServer.broadcastSensorData(sensorData);
    } catch (error) {
      console.error('Error broadcasting sensor data:', error);
    }
  }
  
  broadcastDeviceStatus(deviceStatus) {
    try {
      websocketServer.broadcastDeviceStatus(deviceStatus);
    } catch (error) {
      console.error('Error broadcasting device status:', error);
    }
  }
  
  broadcastAll(message) {
    try {
      websocketServer.broadcastAll(message);
    } catch (error) {
      console.error('Error broadcasting message to all clients:', error);
    }
  }
  
  sendToClient(clientId, message) {
    try {
      const client = this.getClient(clientId);
      if (client) {
        websocketServer.sendToClient(client, message);
      } else {
        console.warn(`Client ${clientId} not found`);
      }
    } catch (error) {
      console.error(`Error sending message to client ${clientId}:`, error);
    }
  }

  sendErrorToClient(clientId, message, details = '') {
    this.sendToClient(clientId, {
      type: WS_MESSAGE_TYPES.ERROR,
      message: message,
      details: details,
      timestamp: new Date().toISOString()
    });
  }

  sendSuccessToClient(clientId, message, data = {}) {
    this.sendToClient(clientId, {
      type: 'success',
      message: message,
      data: data,
      timestamp: new Date().toISOString()
    });
  }

  getClient(clientId) {
    const client = websocketServer.getClient(clientId);
    if (client) return client;
    return null;
  }
  
  getConnectedClientsCount() {
    try {
      return websocketServer.getConnectedClients();
    } catch (error) {
      console.error('Error getting connected clients count:', error);
      return 0;
    }
  }

  getStatistics() {
    return {
      isInitialized: this.isInitialized,
      connectedClients: this.getConnectedClientsCount(),
      isHealthy: this.isInitialized
    };
  }
  

  close() {
    try {
      websocketServer.close();
      this.isInitialized = false;
    } catch (error) {
      console.error('Error closing WebSocket service:', error);
      throw error;
    }
  }

  broadcastSystemStatus(status) {
    try {
      const message = {
        type: 'system_status',
        data: status,
        timestamp: new Date().toISOString()
      };
      
      this.broadcastAll(message);
      console.debug('Broadcasted system status update');
    } catch (error) {
      console.error('Error broadcasting system status:', error);
    }
  }
  
  broadcastAlert(alert) {
    try {
      const message = {
        type: 'alert',
        data: alert,
        timestamp: new Date().toISOString()
      };
      
      this.broadcastAll(message);
      console.info(`Broadcasted alert: ${alert.message}`);
    } catch (error) {
      console.error('Error broadcasting alert:', error);
    }
  }

  broadcastNotification(notification) {
    try {
      const message = {
        type: 'notification',
        data: notification,
        timestamp: new Date().toISOString()
      };
      
      this.broadcastAll(message);
      console.debug('Broadcasted notification');
    } catch (error) {
      console.error('Error broadcasting notification:', error);
    }
  }

  subscribeClient(clientId, topic) {
    try {
      const client = this.getClient(clientId);
      if (client) {
        websocketServer.handleSubscribe(client, { type: 'subscribe', topic });
        console.info(`Client ${clientId} subscribed to topic: ${topic}`);
      }
    } catch (error) {
      console.error(`Error subscribing client ${clientId} to topic ${topic}:`, error);
    }
  }
  
  unsubscribeClient(clientId, topic) {
    try {
      const client = this.getClient(clientId);
      if (client) {
        websocketServer.handleUnsubscribe(client, { type: 'unsubscribe', topic });
        console.info(`Client ${clientId} unsubscribed from topic: ${topic}`);
      }
    } catch (error) {
      console.error(`Error unsubscribing client ${clientId} from topic ${topic}:`, error);
    }
  }
}

module.exports = new WebSocketService();
