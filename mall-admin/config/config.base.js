module.exports = {
  // 应用基础配置
  app: {
    name: '微信商城',
    port: 3000,
    apiPrefix: '/api/v1',
    baseUrl: process.env.BASE_URL || 'http://localhost:3000'
  },

  // 通用数据库配置
  database: {
    dialect: 'mysql',
    timezone: '+08:00',
    define: {
      timestamps: true,
      paranoid: true,
      underscored: true
    },
    pool: {
      max: 10,
      min: 0,
      idle: 10000
    }
  },

  // 通用日志配置
  logger: {
    dir: 'logs',
    level: 'info',
    maxFiles: '14d'
  },

  // 文件上传配置
  upload: {
    maxSize: 5 * 1024 * 1024, // 5MB
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif']
  },

  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: '7d'
  }
} 