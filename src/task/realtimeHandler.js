// const mqttService = require('../services/mqttService');
// const websocketService = require('../services/websocketService');

// class RealtimeHandler {
//   constructor() {
//     this.isRunning = false;
//     this.healthCheckInterval = null;
//     this.reconnectAttempts = 0;
//     this.maxReconnectAttempts = 5;
//   }
  
//   async start(server) {
//     try {
//       if (this.isRunning) {
//         console.warn('Realtime Handler is already running');
//         return;
//       }

//       await mqttService.initialize();
//       websocketService.initialize(server);

//       this.isRunning = true;
//     } catch (error) {
//       console.error('Failed to start Realtime Handler:', error);
//       throw error;
//     }
//   }
  
//   async stop() {
//     try {
      
//       await mqttService.disconnect();
//       websocketService.close();
      
//       this.isRunning = false;
//     } catch (error) {
//       console.error('Failed to stop Realtime Handler:', error);
//       throw error;
//     }
//   }
  
//   async reconnectMQTT() {
//     try {
//       if (this.reconnectAttempts >= this.maxReconnectAttempts) {
//         console.error('Max MQTT reconnect attempts reached');
//         return;
//       }
//       this.reconnectAttempts++;
//       await mqttService.reconnect();
//       this.reconnectAttempts = 0;
//     } catch (error) {
//       console.error('MQTT reconnect failed:', error);
//     }
//   }
  
//   broadcastSystemStatus(status) {
//     try {
//       websocketService.broadcastSystemStatus(status);
//     } catch (error) {
//       console.error('Error broadcasting system status:', error);
//     }
//   }

//   broadcastAlert(alert) {
//     try {
//       websocketService.broadcastAlert(alert);
//     } catch (error) {
//       console.error('Error broadcasting alert:', error);
//     }
//   }
  
//   broadcastNotification(notification) {
//     try {
//       websocketService.broadcastNotification(notification);
//     } catch (error) {
//       console.error('Error broadcasting notification:', error);
//     }
//   }

//   getStatistics() {
//     return {
//       isRunning: this.isRunning,
//       mqtt: mqttService.getStatistics(),
//       websocket: websocketService.getStatistics(),
//       reconnectAttempts: this.reconnectAttempts,
//       maxReconnectAttempts: this.maxReconnectAttempts
//     };
//   }

//   async restart(server) {
//     try {
//       await this.stop();
//       await new Promise(resolve => setTimeout(resolve, 2000));
//       await this.start(server);
//     } catch (error) {
//       console.error('Failed to restart Realtime Handler:', error);
//       throw error;
//     }
//   }
// }

// module.exports = new RealtimeHandler();
// src/task/realtimeHandler.js

const mqttService = require('../services/mqttService');
const eventEmitter = require('../events/eventEmitter'); // ADDED: Thêm event emitter
const websocketService = require('../services/websocketService');

class RealtimeHandler {
  constructor() {
    this.isRunning = false;
    this.reconnectAttempts = 0;
    this.isReconnecting = false;
    this.maxReconnectAttempts = 5;
  }

  async start(server) {
    try {
      if (this.isRunning) {
        console.warn('Realtime Handler is already running');
        return;
      }

      websocketService.initialize(server);
      await mqttService.initialize();

      this.isRunning = true;
    } catch (error) {
      console.error('Failed to start Realtime Handler:', error);
      throw error;
    }
  }
  
  async stop() {
    try {
      eventEmitter.removeAllListeners(); // Dọn dẹp listener khi stop
      await mqttService.disconnect();
      websocketService.close();
      this.isRunning = false;
    } catch (error) {
      console.error('Failed to stop Realtime Handler:', error);
      throw error;
    }
  }

  async reconnectMQTT() {
    this.isReconnecting = true;

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max MQTT reconnect attempts reached. Stopping reconnection attempts.');
      this.isReconnecting = false;
      return;
    }

    this.reconnectAttempts++;
    console.log(`MQTT reconnect attempt #${this.reconnectAttempts}`);
    
    try {
      await mqttService.disconnect(); // Đảm bảo ngắt kết nối cũ
      await new Promise(resolve => setTimeout(resolve, 5000)); // Đợi 5s trước khi thử lại
      await mqttService.initialize();
    } catch (error) {
      console.error(`MQTT reconnect attempt #${this.reconnectAttempts} failed:`, error.message);
      this.isReconnecting = false;
    }
  }

  broadcastSystemStatus(status) { /* ... */ }
  broadcastAlert(alert) { /* ... */ }
  broadcastNotification(notification) { /* ... */ }
  getStatistics() { /* ... */ }
  async restart(server) { /* ... */ }
}

module.exports = new RealtimeHandler();
