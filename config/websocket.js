const WebSocket = require("ws");
const jwt = require("jsonwebtoken");
const config = require("./index");

class WebSocketServer {
  constructor() {
    this.wss = null;
    this.clients = new Map();
    this.heartbeatInterval = null;
    this.eventListeners = new Map();
  }

  initialize(server) {
    this.wss = new WebSocket.Server({
      server,
    });
    this.wss.on("connection", this.handleConnection.bind(this));
  }

  handleConnection(ws, req) {
    const clientId = this.generateClientId();
    const client = {
      id: clientId,
      ws,
      isAlive: true,
      subscriptions: new Set(),
      lastPing: Date.now(),
    };

    this.clients.set(clientId, client);

    console.log(`New WebSocket connection: ${clientId}`);

    ws.on("message", (message) => {
      this.handleMessage(client, message);
    });

    ws.on("close", () => {
      this.handleDisconnection(client);
    });

    ws.on("error", (error) => {
      console.error(`WebSocket error for client ${clientId}:`, error);
    });

    this.sendToClient(client, {
      type: "connection",
      status: "connected",
      clientId: clientId,
    });
  }

  handleMessage(client, message) {
    try {
      const data = JSON.parse(message.toString());

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
          this.handleDeviceControl({
            ...data,
            clientId: client.id,
          });
          break;
        default:
          console.warn(`Unknown message type: ${data.type}`);
      }
    } catch (error) {
      this.sendToClient(client, {
        type: "error",
        message: "Invalid message format",
      });
    }
  }

  handleSubscribe(client, data) {
    const { topic } = data;
    client.subscriptions.add(topic);

    this.sendToClient(client, {
      type: "subscription",
      status: "subscribed",
      topic: topic,
    });

    console.log(`Client ${client.id} subscribed to topic: ${topic}`);
  }

  handleUnsubscribe(client, data) {
    const { topic } = data;
    client.subscriptions.delete(topic);

    this.sendToClient(client, {
      type: "subscription",
      status: "unsubscribed",
      topic: topic,
    });

    console.log(`Client ${client.id} unsubscribed from topic: ${topic}`);
  }

  handlePing(client) {
    this.sendToClient(client, {
      type: "pong",
      timestamp: Date.now(),
    });
  }

  handleDeviceControl(data) {
    const { deviceId, action, clientId } = data;
    this.emit("device_control", {
      deviceId,
      action,
      clientId: clientId,
      timestamp: new Date().toISOString(),
    });
  }

  handleDisconnection(client) {
    this.clients.delete(client.id);
    console.log(`WebSocket client disconnected: ${client.id}`);
  }

  sendToClient(client, message) {
    if (client && client.ws && client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error(`Error sending message to client ${client.id}:`, error);
      }
    }
  }

  broadcast(topic, message) {
    const data = {
      type: "broadcast",
      topic: topic,
      data: message,
      timestamp: new Date().toISOString(),
    };

    this.clients.forEach((client) => {
      this.sendToClient(client, data);
    });
  }

  broadcastAll(message) {
    const data = {
      type: "broadcast",
      data: message,
      timestamp: new Date().toISOString(),
    };

    this.clients.forEach((client) => {
      this.sendToClient(client, data);
    });
  }

  broadcastSensorData(sensorData) {
    this.broadcast("sensor_data", sensorData);
  }

  broadcastDeviceStatus(deviceStatus) {
    this.broadcast("device_status", deviceStatus);
  }

  generateClientId() {
    return "client_" + Math.random().toString(36).substr(2, 9);
  }

  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error("Error in event listener:", error);
        }
      });
    }
  }

  getConnectedClients() {
    return this.clients.size;
  }

  getClient(clientId) {
    return this.clients.get(clientId);
  }

  close() {
    this.wss.close(() => {
      console.log("WebSocket server closed");
    });
    this.clients.clear();
  }
}

module.exports = new WebSocketServer();
