const express = require('express');
const http = require('http');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');

const config = require('../../config/index');
const routes = require('../routes/index');
const { corsMiddleware, corsErrorHandler } = require('../middlewares/cors');
const { errorHandler, notFound } = require('../middlewares/errorHandler');

class HTTPSHandler {
  constructor() {
    this.app = null;
    this.server = null;
    this.isRunning = false;
  }

  initialize() {
    try {
      this.app = express();
      this.app.use(
        helmet({
          contentSecurityPolicy: {
            directives: {
              defaultSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              scriptSrc: ["'self'", 'https:'],
              imgSrc: ["'self'", 'data:', 'https:'],
              connectSrc: ["'self'", 'ws:', 'wss:', 'https:'],
            },
          },
        })
      );
      this.app.use(corsMiddleware);
      this.app.use(corsErrorHandler);
      this.app.use(express.json({ limit: '10mb' }));
      this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
      this.app.use(express.static(path.join(__dirname, '../../public')));
      this.app.use((req, res, next) => {
        console.log(`${req.method} ${req.url}`);
        next();
      });
      this.app.use('/api', routes);
      this.app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, '../../public/index.html'));
      });
      this.app.use(notFound);
      this.app.use(errorHandler);
    } catch (error) {
      console.error('Failed to initialize HTTPS Handler:', error);
      throw error;
    }
  }

  async start() {
    try {
      if (this.isRunning) {
        console.warn('HTTPS Handler is already running');
        return;
      }

      if (!this.app) {
        this.initialize();
      }

      this.server = http.createServer(this.app);

      this.server.listen(config.port, () => {
        this.isRunning = true;
        console.log(`HTTPS Handler started on port ${config.port}`);
        console.log(`Access the application at http://localhost:${config.port}`);
      });

      this.server.on('error', (error) => {
        console.error('HTTPS Handler server error:', error);
        this.isRunning = false;
      });

      this.server.on('close', () => {
        this.isRunning = false;
      });
    } catch (error) {
      throw error;
    }
  }

  async stop() {
    try {
      if (!this.server || !this.server.listening) {
        if (this.isRunning) {
          this.isRunning = false;
        }
        console.warn('HTTPS Handler is not running');
        return;
      }

      return new Promise((resolve, reject) => {
        try {
          this.server.close((error) => {
            if (error) {
              if (error.code === 'ERR_SERVER_NOT_RUNNING') {
                this.isRunning = false;
                return resolve();
              }
              console.error('Error stopping HTTPS Handler:', error);
              return reject(error);
            } else {
              this.isRunning = false;
              return resolve();
            }
          });
        } catch (error) {
          if (error.code === 'ERR_SERVER_NOT_RUNNING') {
            this.isRunning = false;
            return resolve();
          }
          if (error) {
            console.error('Error stopping HTTPS Handler:', error);
            return reject(error);
          }
          this.isRunning = false;
          return resolve();
        }
      });
    } catch (error) {
      console.error('Failed to stop HTTPS Handler:', error);
      throw error;
    }
  }

  getServer() {
    return this.server;
  }

  getApp() {
    return this.app;
  }

  isHealthy() {
    return this.isRunning && this.server && this.server.listening;
  }

  getStatistics() {
    return {
      isRunning: this.isRunning,
      isHealthy: this.isHealthy(),
      port: config.port,
      uptime: this.isRunning ? process.uptime() : 0,
      memory: process.memoryUsage(),
    };
  }

  async restart() {
    try {
      await this.stop();
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
      await this.start();
      console.log('HTTPS Handler restarted successfully');
    } catch (error) {
      console.error('Failed to restart HTTPS Handler:', error);
      throw error;
    }
  }
}

module.exports = new HTTPSHandler();
