const path = require('path');
const dotenv = require('dotenv');

// 加载基础环境变量
dotenv.config({ path: path.join(__dirname, '../../.env') });

// 根据环境加载对应的配置文件
const env = process.env.NODE_ENV || 'development';
console.log('Current environment:', env);

// 加载环境特定的配置
dotenv.config({ 
  path: path.join(__dirname, `../../.env.${env}`),
  override: true
});

// 打印环境变量，用于调试
console.log('Environment variables:', {
  NODE_ENV: process.env.NODE_ENV,
  DB_HOST: process.env.DB_HOST,
  WX_APP_ID: process.env.WX_APP_ID,
  BASE_URL: process.env.BASE_URL
});

try {
  const config = require(`./config.${env}.js`);
  console.log('Loaded config:', config);
  module.exports = config;
} catch (error) {
  console.error('Failed to load config:', error);
  const baseConfig = require('./config.base.js');
  module.exports = baseConfig;
} 