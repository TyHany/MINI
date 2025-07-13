const base = require('./config.base')
const path = require('path')

const config = {
  // 生产环境特定配置
  isDev: false,

  // 应用配置
  app: {
    ...base.app,
    baseUrl: process.env.BASE_URL || 'https://your-domain.com'
  },

  // 数据库配置
  database: {
    ...base.database,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    replication: {
      read: [
        { host: process.env.DB_READ_HOST_1 },
        { host: process.env.DB_READ_HOST_2 }
      ],
      write: { host: process.env.DB_WRITE_HOST }
    }
  },

  // 文件上传配置
  upload: {
    ...base.upload,
    provider: 'local',
    dir: path.join(__dirname, '../uploads')
  },

  // 日志配置
  logger: {
    ...base.logger,
    level: 'info'
  },

  // API配置
  api: {
    baseUrl: process.env.BASE_URL || 'http://mall-admin.guoxu.tech',
    timeout: 10000
  }
}

// 合并基础配置
module.exports = {
  ...base,
  ...config
} 