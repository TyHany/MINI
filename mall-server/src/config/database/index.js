const mysql = require('mysql2/promise');
const dbConfig = require('../config/database');

// 创建连接池
const pool = mysql.createPool(dbConfig);

// 测试连接
pool.getConnection()
  .then(connection => {
    console.log('Database connected successfully');
    connection.release();
  })
  .catch(err => {
    console.error('Database connection failed:', err);
    process.exit(1);
  });

module.exports = pool; 