const express = require('express');
const cors = require('cors');
const path = require('path');
const routes = require('./routes');
const errorHandler = require('./middlewares/error');
const config = require('./config');
const logger = require('./utils/logger');

const app = express();

// 中间件配置
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API路由
app.use('/api', routes);

// 错误处理
app.use(errorHandler);

// 启动服务器
app.listen(config.app.port, () => {
  logger.info('=================================');
  logger.info(`运行环境: ${process.env.NODE_ENV}`);
  logger.info(`服务端口: ${config.app.port}`);
  logger.info('数据库配置:');
  logger.info(`  - 数据库名: ${config.database.database}`);
  logger.info(`  - 主机: ${config.database.host}`);
  logger.info(`  - 端口: ${config.database.port}`);
  logger.info(`  - 用户名: ${config.database.username}`);
  logger.info(`文件存储: ${config.upload.provider}`);
  logger.info('=================================');
}); 