const mqttService = require('../services/mqttService');
const websocketService = require('../services/websocketService');

class RealtimeHandler {
  constructor() {
    this.isRunning = false;
    this.healthCheckInterval = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }
  
  async start(server) {
    try {
      if (this.isRunning) {
        console.warn('Realtime Handler is already running');
        return;
      }

      await mqttService.initialize();
      websocketService.initialize(server);

      this.isRunning = true;
    } catch (error) {
      console.error('Failed to start Realtime Handler:', error);
      throw error;
    }
  }
  
  async stop() {
    try {
      
      await mqttService.disconnect();
      websocketService.close();
      
      this.isRunning = false;
    } catch (error) {
      console.error('Failed to stop Realtime Handler:', error);
      throw error;
    }
  }
  
  async reconnectMQTT() {
    try {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max MQTT reconnect attempts reached');
        return;
      }
      this.reconnectAttempts++;
      await mqttService.reconnect();
      this.reconnectAttempts = 0;
    } catch (error) {
      console.error('MQTT reconnect failed:', error);
    }
  }
  
  broadcastSystemStatus(status) {
    try {
      websocketService.broadcastSystemStatus(status);
    } catch (error) {
      console.error('Error broadcasting system status:', error);
    }
  }

  broadcastAlert(alert) {
    try {
      websocketService.broadcastAlert(alert);
    } catch (error) {
      console.error('Error broadcasting alert:', error);
    }
  }
  
  broadcastNotification(notification) {
    try {
      websocketService.broadcastNotification(notification);
    } catch (error) {
      console.error('Error broadcasting notification:', error);
    }
  }

  getStatistics() {
    return {
      isRunning: this.isRunning,
      mqtt: mqttService.getStatistics(),
      websocket: websocketService.getStatistics(),
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts
    };
  }

  async restart(server) {
    try {
      await this.stop();
      await new Promise(resolve => setTimeout(resolve, 2000));
      await this.start(server);
    } catch (error) {
      console.error('Failed to restart Realtime Handler:', error);
      throw error;
    }
  }
}

module.exports = new RealtimeHandler();
