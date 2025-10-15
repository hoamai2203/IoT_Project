const wsServer = require('../../config/websocket');
const mqttClient = require('../../config/mqtt');

class WebSocketService {
  async initialize(httpServer) {
    await wsServer.initialize(httpServer);
    this.setupHandlers();
  }

  setupHandlers() {
    wsServer.on('client_connected', (data) => {
      console.log('Client connected:', data.clientId);
    });

    wsServer.on('device_control', (data) => {
      mqttClient.publish(`device/control`, data, {}).catch(err => {
        console.error('Failed to publish device control:', err);
      });
    });
  }

  broadcast(message) {
    wsServer.broadcast(message);
  }

  async close() {
    await wsServer.close();
  }

  getStatistics() {
    return wsServer.getStatistics();
  }
}

module.exports = new WebSocketService();
