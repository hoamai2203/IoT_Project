const mqtt = require('mqtt');
const config = require('./index');
const eventEmitter = require('../src/events/eventEmitter');

class MQTTClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.messageHandlers = new Map();
    this.brokerUrl = config.mqtt.brokerUrl;
    this.isShuttingDown = false;
  }
  
  getClient() {
    return this.client;
  }

  async connect() {
    try {
      const options = {
        clientId: config.mqtt.clientId,
        username: config.mqtt.username,
        password: config.mqtt.password,
        clean: config.mqtt.options.clean,
        connectTimeout: config.mqtt.options.connectTimeout,
        reconnectPeriod: config.mqtt.options.reconnectPeriod,
        keepalive: config.mqtt.options.keepalive
      };
      
      this.isShuttingDown = false;
      this.reconnectAttempts = 0;
      this.client = mqtt.connect(this.brokerUrl, options);

      // Attach listeners
      this.client.on('error', (error) => {
        console.error('MQTT client error:', error);
        if (this.isShuttingDown) return; // Không xử lý nếu đang tắt
        
        if (this.isConnected) {
            this.isConnected = false;
            eventEmitter.emit('mqtt_disconnected');
        }
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          // ADDED CHECK: Thêm kiểm tra an toàn
          if (this.client) try { this.client.end(true); } catch (_) {}
        }
      });

      this.client.on('close', () => {
        if (this.isShuttingDown) return; // Không xử lý nếu đang tắt
        if (this.isConnected) {
          this.isConnected = false;
          console.warn('MQTT connection closed.');
          eventEmitter.emit('mqtt_disconnected');
        }
      });

      this.client.on('reconnect', () => {
        if (this.isShuttingDown) {
          // ADDED CHECK: Thêm kiểm tra an toàn
          if (this.client) try { this.client.end(true); } catch (_) {}
          return;
        }
        this.reconnectAttempts++;
        console.warn(`MQTT client reconnecting... (attempt ${this.reconnectAttempts})`);
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('MQTT max reconnect attempts reached. Stopping MQTT client.');
          eventEmitter.emit('mqtt_disconnected');
          // ADDED CHECK: Thêm kiểm tra an toàn
          if (this.client) try { this.client.end(true); } catch (_) {}
        }
      });

      this.client.on('message', (topic, message) => {
        this.handleMessage(topic, message);
      });

      // Return a promise that resolves on first connect
      await new Promise((resolve, reject) => {
        const onConnect = () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.subscribeToTopics();
          eventEmitter.emit('mqtt_connected');
          if (this.client) this.client.off('connect', onConnect);
          resolve();
        };

        // FIXED: Thêm kiểm tra an toàn quan trọng nhất ở đây
        const onError = (err) => {
          if (this.client) { // <--- SỬA LỖI CHÍNH
            this.client.off('error', onError);
          }
          reject(err);
        };

        this.client.on('connect', onConnect);
        this.client.once('error', onError);
      });
    } catch (error) {
      console.error('MQTT connection failed:', error);
      throw error;
    }
  }
  
  // ... các hàm khác giữ nguyên ...

  subscribeToTopics() {
    const topics = [
      config.mqtt.topics.sensorData,
      config.mqtt.topics.deviceStatus
    ];
    
    topics.forEach(topic => {
      if (!topic) return;
      // ADDED CHECK: Thêm kiểm tra an toàn
      if (this.client) {
        this.client.subscribe(topic, (error) => {
          if (error) {
            console.error(`Failed to subscribe to topic ${topic}:`, error);
          } else {
            console.info(`Subscribed to topic: ${topic}`);
          }
        });
      }
    });
  }
  
  handleMessage(topic, message) {
    try {
      const data = JSON.parse(message.toString());
      const handlers = this.messageHandlers.get(topic) || [];
      handlers.forEach(handler => {
        try { handler(data, topic); } catch (error) { console.error(`Error in message handler for topic ${topic}:`, error); }
      });
    } catch (error) {
      console.error(`Error parsing MQTT message from topic ${topic}:`, error);
    }
  }
  
  onMessage(topic, handler) {
    if (!this.messageHandlers.has(topic)) {
      this.messageHandlers.set(topic, []);
    }
    this.messageHandlers.get(topic).push(handler);
  }

  async publish(topic, message, options = {}) {
    if (!this.isConnected || !this.client) {
      console.warn(`Attempted to publish to ${topic} while disconnected. Message dropped.`);
      return;
    }
    try {
      const payload = typeof message === 'string' ? message : JSON.stringify(message);
      await new Promise((resolve, reject) => {
        this.client.publish(topic, payload, options, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    } catch (error) {
      console.error(`Failed to publish message to topic ${topic}:`, error);
      throw error;
    }
  }
  
  async disconnect() {
    if (this.client) {
      this.isShuttingDown = true;
      await new Promise((resolve) => {
        try { this.client.end(true, {}, () => resolve()); } catch (_) { resolve(); }
      });

      if (this.isConnected) {
          this.isConnected = false;
          eventEmitter.emit('mqtt_disconnected');
      }
      this.client = null;
      
    }
  }
  
  isHealthy() {
    return this.isConnected;
  }
}

module.exports = new MQTTClient();