// WebSocket Client - IoT Smart Home Application

class WebsocketClient {
  constructor() {
    this.url = Config.websocket.url;
    this.reconnectInterval = Config.websocket.reconnectInterval;
    this.maxReconnectAttempts = Config.websocket.maxReconnectAttempts;
    this.heartbeatInterval = Config.websocket.heartbeatInterval;
 
    this.ws = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.heartbeatTimer = null;
    this.reconnectTimer = null;
    this.eventListeners = new Map();
    
    this.messageQueue = [];
    this.isReconnecting = false;
  }

  // Initialize WebSocket connection
  init() {
    console.log('🔌 Initializing WebSocket connection...');
    this.connect();
  }

  // Connect to WebSocket server
  connect() {
    try {
      this.ws = new WebSocket(this.url);
      this.setupEventListeners();
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.handleConnectionError(error);
    }
  }

  // Setup WebSocket event listeners
  setupEventListeners() {
    this.ws.onopen = (event) => {
      console.log('✅ WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.isReconnecting = false;
      
      // Clear reconnect timer
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      
      // Start heartbeat
      this.startHeartbeat();
      
      // Process queued messages
      this.processMessageQueue();
      
      // Emit connection event
      this.emit('connection', { status: 'connected', event });
      
      // Subscribe to default topics
      this.subscribe('sensor_data');
      this.subscribe('device_status');
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = (event) => {
      console.log('❌ WebSocket disconnected:', event.code, event.reason);
      this.isConnected = false;
      this.stopHeartbeat();
      
      // Emit disconnection event
      this.emit('connection', { status: 'disconnected', event });
      
      // Attempt to reconnect if not manually closed
      if (!event.wasClean && !this.isReconnecting) {
        this.attemptReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.handleConnectionError(error);
    };
  }

  // Handle incoming messages
  handleMessage(data) {
    console.log('📨 WebSocket message received:', data);
    
    switch (data.type) {
      case 'connection':
        this.handleConnectionMessage(data);
        break;
      case 'broadcast':
        this.handleBroadcastMessage(data);
        break;
      case 'sensor_data':
        this.emit('sensor_data', data.data);
        break;
      case 'device_status':
        this.emit('device_status', data.data);
        break;
      case 'error':
        this.handleErrorMessage(data);
        break;
      case 'pong':
        this.handlePongMessage(data);
        break;
      default:
        console.warn('Unknown message type:', data.type);
    }
  }

  // Handle connection message
  handleConnectionMessage(data) {
    if (data.status === 'connected') {
      console.log('WebSocket connection confirmed');
    }
  }

  // Handle broadcast message
  handleBroadcastMessage(data) {
    if (data.topic) {
      this.emit(data.topic, data.data);
    } else {
      this.emit('broadcast', data.data);
    }
  }

  // Handle error message
  handleErrorMessage(data) {
    console.error('WebSocket error message:', data.message);
    this.emit('error', new Error(data.message));
  }

  // Handle pong message
  handlePongMessage(data) {
    console.log('WebSocket pong received');
  }

  // Handle connection error
  handleConnectionError(error) {
    console.error('WebSocket connection error:', error);
    this.emit('error', error);
    
    if (!this.isReconnecting) {
      this.attemptReconnect();
    }
  }

  // Attempt to reconnect
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('error', new Error('Max reconnection attempts reached'));
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;
    
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.reconnectInterval);
  }

  // Start heartbeat
  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.ping();
      }
    }, this.heartbeatInterval);
  }

  // Stop heartbeat
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // Send ping
  ping() {
    this.send({
      type: 'ping',
      timestamp: new Date().toISOString()
    });
  }

  // Send message
  send(message) {
    if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
        console.log('📤 WebSocket message sent:', message);
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        this.queueMessage(message);
      }
    } else {
      this.queueMessage(message);
    }
  }

  // Queue message for later sending
  queueMessage(message) {
    this.messageQueue.push(message);
    console.log('Message queued:', message);
  }

  // Process queued messages
  processMessageQueue() {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const message = this.messageQueue.shift();
      this.send(message);
    }
  }

  // Subscribe to topic
  subscribe(topic) {
    this.send({
      type: 'subscribe',
      topic: topic
    });
  }

  // Unsubscribe from topic
  unsubscribe(topic) {
    this.send({
      type: 'unsubscribe',
      topic: topic
    });
  }

  // Control device
  controlDevice(deviceId, action) {
    this.send({
      type: 'device_control',
      deviceId: deviceId,
      action: action,
      timestamp: new Date().toISOString()
    });
  }

  // Add event listener
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  // Remove event listener
  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Emit event
  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  // Disconnect
  disconnect() {
    console.log('🔌 Disconnecting WebSocket...');
    
    this.isReconnecting = true;
    this.stopHeartbeat();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.isConnected = false;
    this.messageQueue = [];
  }

  // Get connection status
  getStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      queuedMessages: this.messageQueue.length,
      readyState: this.ws ? this.ws.readyState : null
    };
  }

  // Test connection
  testConnection() {
    if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
      this.ping();
      return true;
    }
    return false;
  }

  // Reconnect manually
  reconnect() {
    console.log('🔄 Manually reconnecting WebSocket...');
    this.disconnect();
    setTimeout(() => {
      this.isReconnecting = false;
      this.reconnectAttempts = 0;
      this.connect();
    }, 1000);
  }
}


const led1ToggleBtn = document.getElementById('led1Toggle');
const led2ToggleBtn = document.getElementById('led2Toggle');
const led3ToggleBtn = document.getElementById('led3Toggle');

led1ToggleBtn.addEventListener('click', () => {
  WSClient.controlDevice('led1', 'toggle');
});

led2ToggleBtn.addEventListener('click', () => {
  WSClient.controlDevice('led2', 'toggle');
});

led3ToggleBtn.addEventListener('click', () => {
  WSClient.controlDevice('led3', 'toggle');
});

// Create WebSocket client instance
const WSClient = new WebsocketClient();

// Export for global access
window.WebSocketClient = WSClient;
