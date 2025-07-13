const express = require('express');
const cors = require('cors');
const path = require('path');
const routes = require('./src/routes');
const errorHandler = require('./src/middlewares/error');
const config = require('./src/config');
const logger = require('./src/utils/logger');
const fs = require('fs');

// 打印数据库配置
console.log('Database Config:', {
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  database: config.database.database
  // 不要打印密码
});

// 添加未捕获异常处理
process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('未处理的 Promise 拒绝:', err);
  process.exit(1);
});

// 添加调试信息
console.log('当前环境:', process.env.NODE_ENV);
console.log('配置信息:', config);

const app = express();

// 中间件配置
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// 创建上传目录
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API路由
app.use('/api', routes);

// 错误处理
app.use(errorHandler);

// 打印加载的配置，用于调试
console.log('Loaded config:', config);

// 设置端口
const port = config.server.port || 4000;

app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
}); 