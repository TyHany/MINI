const base = require('./config.base')
const path = require('path')

const config = {
  // 开发环境特定配置
  isDev: true,
  
  // 数据库配置
  database: {
    ...base.database,
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: 'mall'
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
    level: 'debug'
  },

  // API配置
  api: {
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    timeout: 5000
  }
}

// 合并基础配置
module.exports = {
  ...base,
  ...config
} 