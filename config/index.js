const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

const appConfigPath = path.join(__dirname, 'app-config.json');
const appConfig = JSON.parse(fs.readFileSync(appConfigPath, 'utf8'));

class Config {
  constructor() {
    this.env = process.env.NODE_ENV || 'development';
    this.port = parseInt(process.env.PORT) || 3000;
    this.wsPort = parseInt(process.env.WS_PORT) || 8080;

    this.database = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'iot_smart_home',
      connectionLimit: 10,
      acquireTimeout: 60000,
      timeout: 60000
    };

    this.mqtt = {
      brokerUrl: process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
      username: process.env.MQTT_USERNAME || '',
      password: process.env.MQTT_PASSWORD || '',
      clientId: process.env.MQTT_CLIENT_ID || 'iot_backend_server',
      topics: {
        sensorData: process.env.MQTT_TOPIC_SENSOR_DATA || 'sensor/data',
        deviceControl: process.env.MQTT_TOPIC_DEVICE_CONTROL || 'device/control',
        deviceResponse: process.env.MQTT_TOPIC_DEVICE_RESPONSE || 'device/response'
      },
      options: {
        clean: true,
        connectTimeout: 40000,
        reconnectPeriod: 1000,
        keepalive: 60
      }
    };
    
    this.websocket = {
      port: this.wsPort,
      jwtSecret: process.env.WS_JWT_SECRET || 'your_jwt_secret_key',
      heartbeatInterval: 30000,
      maxConnections: 1000
    };

    this.app = appConfig.app;
    this.profile = appConfig.profile;
    this.sensors = appConfig.sensors;
    this.devices = appConfig.devices;
    this.ui = appConfig.ui;
    this.api = appConfig.api;

    this.logging = {
      level: this.env === 'production' ? 'info' : 'debug',
      filename: 'logs/app.log',
      maxSize: '10m',
      maxFiles: 5
    };
  }
  
  getDatabaseUrl() {
    return `mysql://${this.database.user}:${this.database.password}@${this.database.host}:${this.database.port}/${this.database.database}`;
  }
}

module.exports = new Config();
