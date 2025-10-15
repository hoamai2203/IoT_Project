const WebSocket = require("ws");
const EventEmitter = require("events");

class WebSocketServer extends EventEmitter {
  constructor() {
    super();
    this.wss = null;
    this.clients = new Map();
    this.heartbeatInterval = null;
    this.isInitialized = false;
    this.isInitializing = false;
    this.isShuttingDown = false;
  }

  async initialize(server) {
    if (this.isInitializing) {
      return new Promise((resolve) => {
        this.once('initialized', () => resolve(this));
      });
    }

    if (this.isInitialized && this.wss) {
      console.warn('WebSocket already initialized');
      return this;
    }

    if (!server) {
      throw new Error('HTTP Server required');
    }

    this.isInitializing = true;
    this.isShuttingDown = false;

    try {
      this.wss = new WebSocket.Server({ server });

      this.wss.on("connection", this.handleConnection.bind(this));
      
      this.wss.on("error", (error) => {
        console.error("WebSocket error:", error);
        this.emit("error", error);
      });

      this.startHeartbeat();

      this.isInitialized = true;
      this.isInitializing = false;
      this.emit('initialized');

      console.log(`WebSocket Server initialized`);
      return this;
    } catch (error) {
      this.isInitializing = false;
      console.error("WebSocket initialization failed:", error);
      throw error;
    }
  }

  handleConnection(ws, req) {
    if (this.isShuttingDown) {
      ws.close(1001, "Server shutting down");
      return;
    }

    const clientId = this.generateClientId();
    const client = {
      id: clientId,
      ws,
      isAlive: true,
      subscriptions: new Set(),
      lastPing: Date.now(),
      connectedAt: new Date().toISOString(),
      metadata: {
        ip: req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      }
    };

    this.clients.set(clientId, client);
    console.log(`New WS connection: ${clientId}`);

    ws.on("message", (message) => this.handleMessage(client, message));
    ws.on("close", (code, reason) => this.handleDisconnection(client, code, reason));
    ws.on("error", (error) => {
      console.error(`WS error for ${clientId}:`, error);
      this.emit("client_error", { clientId, error });
    });
    ws.on("pong", () => {
      client.isAlive = true;
      client.lastPing = Date.now();
    });

    this.sendToClient(client, {
      type: "connection",
      status: "connected",
      clientId: clientId,
      serverTime: new Date().toISOString(),
    });

    this.emit("client_connected", { clientId, metadata: client.metadata });
  }

  handleMessage(client, message) {
    try {
      const data = JSON.parse(message.toString());
      client.lastPing = Date.now();

      switch (data.type) {
        case "subscribe":
          this.handleSubscribe(client, data);
          break;
        case "unsubscribe":
          this.handleUnsubscribe(client, data);
          break;
        case "ping":
          this.handlePing(client);
          break;
        case "device_control":
          this.handleDeviceControl(client, data);
          break;
        case "publish":
          this.handlePublish(client, data);
          break;
        default:
          this.sendToClient(client, {
            type: "error",
            message: `Unknown type: ${data.type}`,
          });
      }

      this.emit("message", { clientId: client.id, data });
    } catch (error) {
      this.sendToClient(client, {
        type: "error",
        message: "Invalid message format",
      });
    }
  }

  handleSubscribe(client, data) {
    const { topic } = data;
    if (!topic) return;

    client.subscriptions.add(topic);
    this.sendToClient(client, {
      type: "subscription",
      status: "subscribed",
      topic,
    });

    this.emit("client_subscribed", { clientId: client.id, topic });
  }

  handleUnsubscribe(client, data) {
    const { topic } = data;
    client.subscriptions.delete(topic);

    this.sendToClient(client, {
      type: "subscription",
      status: "unsubscribed",
      topic,
    });

    this.emit("client_unsubscribed", { clientId: client.id, topic });
  }

  handlePing(client) {
    client.isAlive = true;
    this.sendToClient(client, {
      type: "pong",
      timestamp: Date.now(),
    });
  }

  handleDeviceControl(client, data) {
    const { deviceId, action, payload } = data;
    
    if (!deviceId || !action) {
      this.sendToClient(client, {
        type: "error",
        message: "deviceId and action required",
      });
      return;
    }

    this.emit("device_control", {
      deviceId,
      action,
      payload,
      clientId: client.id,
      timestamp: new Date().toISOString(),
    });

    this.sendToClient(client, {
      type: "device_control_ack",
      deviceId,
      action,
      status: "received",
    });
  }

  handlePublish(client, data) {
    const { topic, payload } = data;
    
    if (!topic || !payload) return;

    this.emit("publish", {
      topic,
      payload,
      clientId: client.id,
    });
  }

  handleDisconnection(client, code, reason) {
    this.clients.delete(client.id);
    console.log(`WS disconnected: ${client.id}`);
    
    this.emit("client_disconnected", {
      clientId: client.id,
      code,
      reason: reason?.toString(),
    });
  }

  sendToClient(client, message) {
    if (!client || !client.ws || client.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      client.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error(`Error sending to ${client.id}:`, error);
      return false;
    }
  }

  broadcast(message, options = {}) {
    const { excludeClientId = null, topic = null } = options;

    const data = {
      type: "broadcast",
      ...(topic && { topic }),
      data: message,
      timestamp: new Date().toISOString(),
    };

    let count = 0;
    this.clients.forEach((client) => {
      if (excludeClientId && client.id === excludeClientId) return;
      if (topic && !client.subscriptions.has(topic)) return;

      if (this.sendToClient(client, data)) count++;
    });

    return count;
  }

  broadcastSensorData(data) {
    return this.broadcast(data, { topic: "sensor_data" });
  }

  broadcastDeviceStatus(data) {
    return this.broadcast(data, { topic: "device_status" });
  }

  startHeartbeat() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);

    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((client) => {
        if (!client.isAlive) {
          client.ws.terminate();
          this.clients.delete(client.id);
          return;
        }

        client.isAlive = false;
        try {
          client.ws.ping();
        } catch (error) {
          console.error(`Ping error ${client.id}:`, error);
        }
      });
    }, 30000);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  async close() {
    if (!this.wss) return;

    this.isShuttingDown = true;
    this.stopHeartbeat();

    this.clients.forEach((client) => {
      try {
        client.ws.close(1001, "Server shutting down");
      } catch (error) {}
    });

    this.clients.clear();

    return new Promise((resolve) => {
      try {
        this.wss.close(() => {
          this.wss = null;
          this.isInitialized = false;
          this.isShuttingDown = false;
          console.log("WebSocket closed");
          resolve();
        });
      } catch (error) {
        this.wss = null;
        this.isInitialized = false;
        this.isShuttingDown = false;
        resolve();
      }
    });
  }

  isHealthy() {
    return this.isInitialized && this.wss !== null && !this.isShuttingDown;
  }

  getStatistics() {
    return {
      isInitialized: this.isInitialized,
      totalClients: this.clients.size,
      hasHeartbeat: !!this.heartbeatInterval,
    };
  }

  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = new WebSocketServer();