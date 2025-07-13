const mysql = require('mysql2/promise');
const config = require('../config');
const logger = require('../utils/logger');

// 创建连接池
const pool = mysql.createPool({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 测试连接
pool.getConnection()
  .then(connection => {
    logger.info('数据库连接成功');
    connection.release();
  })
  .catch(err => {
    logger.error('数据库连接失败:', err);
    process.exit(1);
  });

// 导出数据库连接池
module.exports = pool; 