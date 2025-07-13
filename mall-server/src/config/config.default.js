const path = require('path');

// 打印环境变量，用于调试
console.log('Database ENV:', {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  database: process.env.DB_NAME
  // 不要打印密码
});

module.exports = {
  // 数据库配置
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'mall'
  },

  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'your-jwt-secret-key',
    expiresIn: '7d'
  },

  // 微信小程序配置
  wx: {
    appId: process.env.WX_APP_ID,
    appSecret: process.env.WX_APP_SECRET
  },

  // 服务器配置
  server: {
    port: parseInt(process.env.PORT) || 4000,
    baseUrl: process.env.BASE_URL || 'http://localhost:4000'
  },

  // 日志配置
  logger: {
    level: process.env.LOG_LEVEL || 'debug',
    filename: path.join(__dirname, '../../logs/app.log'),
    maxsize: 5242880,
    maxFiles: 5,
    format: 'dev'
  }
}; 