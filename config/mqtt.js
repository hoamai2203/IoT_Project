const mqtt = require('mqtt');
const config = require('./index');

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
        this.isConnected = false;
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          try { this.client.end(true); } catch (_) {}
        }
      });

      this.client.on('close', () => {
        this.isConnected = false;
      });

      this.client.on('reconnect', () => {
        if (this.isShuttingDown) {
          // Ensure no further reconnects during shutdown
          try { this.client.end(true); } catch (_) {}
          return;
        }
        this.reconnectAttempts++;
        console.warn(`MQTT client reconnecting... (attempt ${this.reconnectAttempts})`);
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('MQTT max reconnect attempts reached. Stopping MQTT client.');
          try { this.client.end(true); } catch (_) {}
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
          this.client.off('connect', onConnect);
          resolve();
        };
        const onError = (err) => {
          this.client.off('error', onError);
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
  
  subscribeToTopics() {
    const topics = [
      config.mqtt.topics.sensorData,
      config.mqtt.topics.deviceStatus
    ];
    
    topics.forEach(topic => {
      this.client.subscribe(topic, (error) => {
        if (error) {
          console.error(`Failed to subscribe to topic ${topic}:`, error);
        } else {
          console.info(`Subscribed to topic: ${topic}`);
        }
      });
    });
  }
  
  handleMessage(topic, message) {
    try {
      const data = JSON.parse(message.toString());
      const handlers = this.messageHandlers.get(topic) || [];

      handlers.forEach(handler => {
        try {
          handler(data, topic);
        } catch (error) {
          console.error(`Error in message handler for topic ${topic}:`, error);
        }
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
    if (!this.isConnected) {
      throw new Error('MQTT client not connected');
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

  // async publishDeviceControl(deviceId, action) {
  //   const message = {
  //     deviceId,
  //     action,
  //     timestamp: new Date().toISOString()
  //   };
    
  //   await this.publish(config.mqtt.topics.deviceControl, message);
  // }
  
  async disconnect() {
    if (this.client) {
      this.isShuttingDown = true;
      // Remove listeners to avoid further retries and logs
      try { this.client.removeAllListeners('message'); } catch (_) {}
      try { this.client.removeAllListeners('connect'); } catch (_) {}
      try { this.client.removeAllListeners('error'); } catch (_) {}
      try { this.client.removeAllListeners('close'); } catch (_) {}
      try { this.client.removeAllListeners('reconnect'); } catch (_) {}

      await new Promise((resolve) => {
        try {
          // Force end to cancel any pending reconnects
          this.client.end(true, {}, () => resolve());
        } catch (_) {
          resolve();
        }
      });

      this.isConnected = false;
      this.client = null;
      this.reconnectAttempts = 0;
    }
  }
  
  isHealthy() {
    return this.isConnected;
  }
}

module.exports = new MQTTClient();
