const path = require('path');

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
    secret: process.env.JWT_SECRET || 'dev-secret-key',
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
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    format: process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
    console: true
  },

  // 微信支付配置
  wxpay: {
    appid: process.env.WX_APPID,
    mchid: process.env.WX_MCHID,  // 商户号
    key: process.env.WX_PAY_KEY,  // API密钥
    notify_url: process.env.WX_PAY_NOTIFY_URL  // 支付结果通知地址
  },

  // 上传配置
  upload: {
    maxSize: 10 * 1024 * 1024, // 10MB
    provider: 'local'
  },

  // APP配置
  app: {
    token: process.env.APP_TOKEN || 'your-default-app-token-123456',
  },
}; 