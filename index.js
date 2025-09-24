const httpsHandler = require('./src/task/httpsHandler');
const realtimeHandler = require('./src/task/realtimeHandler');

class IoTApplication {
  constructor() {
    this.isRunning = false;
    this.shutdownTimeout = 10000;
  }
  
  async start() {
    try {
      if (this.isRunning) {
        return;
      }

      await httpsHandler.start();
      await realtimeHandler.start(httpsHandler.getServer());
      
      this.isRunning = true;
      this.setupGracefulShutdown();
    } catch (error) {
      console.error('Failed to start application:', error);
      throw error;
    }
  }
  
  async stop() {
    try {
      if (!this.isRunning) {
        return;
      }
      
      await httpsHandler.stop();
      await realtimeHandler.stop();
      
      this.isRunning = false;
      console.log('IoT Smart Home Application stopped successfully');
    } catch (error) {
      console.error('Failed to stop application:', error);
      throw error;
    }
  }
  
  async restart() {
    try {
      await this.stop();
      await new Promise(resolve => setTimeout(resolve, 2000));
      await this.start();
      console.log('IoT Smart Home Application restarted successfully');
    } catch (error) {
      console.error('Failed to restart application:', error);
      throw error;
    }
  }

  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      try {
        await this.stop();
        process.exit(0);
      } catch (error) {
        console.error('Error during graceful shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGUSR2', () => shutdown('SIGUSR2')); // For nodemon
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      shutdown('uncaughtException');
    });
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      shutdown('unhandledRejection');
    });
  }
}

const app = new IoTApplication();

if (require.main === module) {
  app.start().catch((error) => {
    console.error('Failed to start application:', error);
    process.exit(1);
  });
}

module.exports = app;
