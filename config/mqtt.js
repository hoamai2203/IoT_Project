const mqtt = require('mqtt');
const EventEmitter = require('events');
const config = require('./index');

class MQTTClient extends EventEmitter {
  constructor() {
    super();
    this.client = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.messageHandlers = new Map();
    this.brokerUrl = config.mqtt.brokerUrl;
    this.isShuttingDown = false;
    this.isInitializing = false;
  }

  async initialize() {
    if (this.isInitializing) {
      return new Promise(resolve => this.once('initialized', () => resolve(this)));
    }

    if (this.isConnected && this.client) {
      console.log('[MQTT] Already connected');
      return this;
    }

    this.isInitializing = true;
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

      this.client = mqtt.connect(this.brokerUrl, options);
      this.setupEventListeners();

      await this.waitForConnection();

      this.isInitializing = false;
      this.emit('initialized');
      console.log('[MQTT] Client initialized successfully');
      return this;
    } catch (error) {
      this.isInitializing = false;
      console.error('[MQTT] Initialization failed:', error);
      throw error;
    }
  }

  setupEventListeners() {
    if (!this.client) return;

    this.client.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log('[MQTT] Connected');
      this.subscribeToDefaultTopics();
      this.emit('connected');
    });

    this.client.on('error', (err) => {
      console.error('[MQTT] Error:', err);
      if (!this.isShuttingDown) this.emit('error', err);
    });

    this.client.on('close', () => {
      if (this.isShuttingDown) return;
      if (this.isConnected) {
        this.isConnected = false;
        console.warn('[MQTT] Connection closed');
        this.emit('disconnected');
      }
    });

    this.client.on('reconnect', () => {
      if (this.isShuttingDown) {
        try { this.client.end(true); } catch (_) {}
        return;
      }

      this.reconnectAttempts++;
      console.warn(`[MQTT] Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('[MQTT] Max reconnect attempts reached');
        try { this.client.end(true); } catch (_) {}
      }
    });

    this.client.on('message', (topic, message) => {
      this.handleMessage(topic, message);
    });
  }

  waitForConnection() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('MQTT connection timeout')), 30000);

      this.client.once('connect', () => {
        clearTimeout(timeout);
        resolve();
      });

      this.client.once('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  }

  subscribeToDefaultTopics() {
    const topics = [
      config.mqtt.topics.sensorData,
      config.mqtt.topics.deviceStatus
    ];

    topics.forEach(topic => {
      if (topic && this.isConnected) {
        this.client.subscribe(topic, (err) => {
          if (err) console.error(`[MQTT] Failed to subscribe ${topic}:`, err);
          else console.log(`[MQTT] Subscribed to: ${topic}`);
        });
      }
    });
  }

  handleMessage(topic, message) {
    try {
      const data = JSON.parse(message.toString());
      this.emit('message', topic, data);
      this.emit(`message:${topic}`, data);

      const handlers = this.messageHandlers.get(topic) || [];
      handlers.forEach(h => h(data, topic));
    } catch (err) {
      console.error(`[MQTT] Failed to parse message from ${topic}:`, err);
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
      throw new Error(`[MQTT] Cannot publish to ${topic}: not connected`);
    }

    try {
      const payload = typeof message === 'object'
        ? JSON.stringify(message)
        : String(message);

      await new Promise((resolve, reject) => {
        this.client.publish(topic, payload, options, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });

      console.log(`[MQTT] Published to ${topic}:`, payload);
    } catch (error) {
      console.error(`[MQTT] Failed to publish to ${topic}:`, error);
      throw error;
    }
  }

  async disconnect() {
    if (!this.client) return;

    this.isShuttingDown = true;
    await new Promise(resolve => {
      try {
        this.client.end(true, {}, () => resolve());
      } catch (err) {
        console.error('[MQTT] Disconnect error:', err);
        resolve();
      }
    });

    this.isConnected = false;
    this.client = null;
    this.messageHandlers.clear();
    this.emit('disconnected');
    console.log('[MQTT] Disconnected');
  }

  isHealthy() {
    return this.isConnected && this.client;
  }

  getStatistics() {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      handlers: this.messageHandlers.size,
      brokerUrl: this.brokerUrl
    };
  }
}

module.exports = new MQTTClient();
