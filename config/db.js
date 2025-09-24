const mysql = require('mysql2/promise');
const config = require('./index');

class Database {
  constructor() {
    this.pool = null;
    this.initialize();
  }
  
  async initialize() {
    try {
      this.pool = mysql.createPool({
        host: config.database.host,
        port: config.database.port,
        user: config.database.user,
        password: config.database.password,
        database: config.database.database,
        connectionLimit: config.database.connectionLimit,
        waitForConnections: true,
        queueLimit: 0
      });
      
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    }
  }
  
  async query(sql, params = []) {
    try {
      const [rows] = await this.pool.execute(sql, params);
      return rows;
    } catch (error) {
      console.error('Database query error (in db.js):', error.message);
      throw error;
    }
  }

  async execute(sql, params = []) {
    try {
      // Return result packet for INSERT/UPDATE/DELETE
      const [result] = await this.pool.execute(sql, params);
      return result;
    } catch (error) {
      console.error('Database execute error (in db.js):', error.message);
      throw error;
    }
  }
  
  async transaction(callback) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  
  async close() {
    if (this.pool) {
      await this.pool.end();
      console.info('Database connection closed');
    }
  }
  
  async healthCheck() {
    try {
      const [rows] = await this.pool.execute('SELECT 1 as health');
      return rows[0].health === 1;
    } catch (error) {
      return false;
    }
  }
}

module.exports = new Database();
