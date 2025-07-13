const winston = require('winston');
const path = require('path');
const config = require('../config');
const fs = require('fs');

// 确保日志目录存在
const logDir = path.dirname(config.logger.filename);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 自定义格式
const customFormat = winston.format.printf(({ message }) => {
  // 直接返回消息，不包含时间戳和级别
  return message;
});

const logger = winston.createLogger({
  level: config.logger.level || 'info',
  format: customFormat,
  transports: [
    // 写入所有日志到文件
    new winston.transports.File({
      filename: config.logger.filename,
      maxsize: config.logger.maxsize,
      maxFiles: config.logger.maxFiles
    }),
    // 写入错误日志到单独文件
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error'
    })
  ]
});

// 非生产环境下同时输出到控制台
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: customFormat
  }));
}

module.exports = logger; 