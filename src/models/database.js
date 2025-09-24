const db = require('../../config/db');

class DatabaseModel {
  constructor() {
    this.db = db;
  }

  /**
   * Execute raw SQL query
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Array>} Query results
   */
  async query(sql, params = []) {
    try {
      const rows = await this.db.query(sql, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }


  /**
   * Execute transaction
   * @param {Function} callback - Transaction callback
   * @returns {Promise<any>} Transaction result
   */
  async transaction(callback) {
    try {
      const result = await this.db.transaction(callback);
      return result;
    } catch (error) {
      console.error('Database transaction error:', error.message);
      throw error;
    }
  }

  /**
   * Get paginated results
   */
  async getPaginated(table, options = {}) {
    let {
      page = 1,
      limit = 10,
      sortField = 'created_at',
      sortOrder = 'DESC',
      where = '',
      params = []
    } = options;

    page = parseInt(page, 10) > 0 ? parseInt(page, 10) : 1;
    limit = parseInt(limit, 10) > 0 ? Math.min(parseInt(limit, 10), 100) : 10;
    const offset = (page - 1) * limit;

    const allowedSortFields = [
      'id', 'created_at', 'temperature', 'humidity',
      'light_intensity', 'device_id', 'action'
    ];
    if (!allowedSortFields.includes(sortField)) sortField = 'created_at';
    sortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    try {
      // Đếm tổng số
      const countSql = `SELECT COUNT(*) as total FROM ${table} ${where}`;
      const countResult = await this.query(countSql, params);
      const total = countResult[0]?.total || 0;

      // Query dữ liệu phân trang
      const dataSql = `
        SELECT * FROM ${table}
        ${where}
        ORDER BY ${sortField} ${sortOrder}
        LIMIT ${offset}, ${limit}
      `;
      const data = await this.query(dataSql, params);

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('Database pagination error:', error.message);
      throw error;
    }
  }

  /** Insert record */
  async insert(table, data) {
    try {
      const fields = Object.keys(data);
      const values = Object.values(data);
      const placeholders = fields.map(() => '?').join(', ');

      const sql = `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders})`;
      const result = await this.db.execute(sql, values);
      return {
        id: result.insertId,
        affectedRows: result.affectedRows
      };
    } catch (error) {
      console.error('Database insert error:', error.message);
      throw error;
    }
  }

  /** Update record */
  async update(table, data, where, params = []) {
    try {
      const fields = Object.keys(data);
      const values = Object.values(data);
      const setClause = fields.map(field => `${field} = ?`).join(', ');

      const sql = `UPDATE ${table} SET ${setClause} WHERE ${where}`;
      const result = await this.db.execute(sql, [...values, ...params]);

      return {
        affectedRows: result.affectedRows,
        changedRows: result.changedRows
      };
    } catch (error) {
      console.error('Database update error:', error.message);
      throw error;
    }
  }

  /** Delete record */
  async delete(table, where, params = []) {
    try {
      const sql = `DELETE FROM ${table} WHERE ${where}`;
      const result = await this.db.execute(sql, params);
      return {
        affectedRows: result.affectedRows
      };
    } catch (error) {
      console.error('Database delete error:', error.message);
      throw error;
    }
  }

  /** Find by ID */
  async findById(table, id) {
    try {
      const sql = `SELECT * FROM ${table} WHERE id = ?`;
      const rows = await this.query(sql, [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Database findById error:', error.message);
      throw error;
    }
  }

  /** Find where */
  async findWhere(table, where, params = []) {
    try {
      const sql = `SELECT * FROM ${table} WHERE ${where}`;
      return await this.query(sql, params);
    } catch (error) {
      console.error('Database findWhere error:', error.message);
      throw error;
    }
  }

  /** Find one */
  async findOne(table, where, params = []) {
    try {
      const sql = `SELECT * FROM ${table} WHERE ${where} LIMIT 1`;
      const rows = await this.query(sql, params);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Database findOne error:', error.message);
      throw error;
    }
  }

  /** Count records */
  async count(table, where = '', params = []) {
    try {
      const sql = `SELECT COUNT(*) as count FROM ${table} ${where}`;
      const rows = await this.query(sql, params);
      return rows[0].count;
    } catch (error) {
      console.error('Database count error:', error.message);
      throw error;
    }
  }

  /** Exists */
  async exists(table, where, params = []) {
    try {
      const count = await this.count(table, `WHERE ${where}`, params);
      return count > 0;
    } catch (error) {
      console.error('Database exists error:', error.message);
      throw error;
    }
  }

  /** Health check */
  async healthCheck() {
    try {
      return await this.db.healthCheck();
    } catch (error) {
      console.error('Database health check error:', error.message);
      return false;
    }
  }
}

module.exports = new DatabaseModel();
