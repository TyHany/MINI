const path = require('path');
const config = require('../config');
const logger = require('../utils/logger');

exports.uploadFile = async (req, res) => {
  // 打印接口调用信息
  logger.info('\n-------------------------------------------------------------');
  logger.info('接口名：文件上传');
  logger.info(`接口地址：${req.protocol}://${req.get('host')}${req.originalUrl}`);
  logger.info('请求头：', {
    ...req.headers,
    // 敏感信息脱敏
    authorization: req.headers.authorization ? '******' : undefined
  });
  logger.info('请求参数：', {
    body: req.body,
    file: req.file ? {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : null
  });

  try {
    if (!req.file) {
      const response = {
        code: 400,
        message: '没有上传文件'
      };
      logger.warn('上传失败：没有文件', response);
      logger.info('-------------------------------------------------------------\n');
      return res.status(400).json(response);
    }

    // 构建文件URL
    const fileUrl = `${config.server.baseUrl}/uploads/${req.file.filename}`;

    const response = {
      code: 0,
      message: '上传成功',
      data: {
        url: fileUrl,
        filename: req.file.filename
      }
    };

    logger.info('返回结果：', response);
    logger.info('-------------------------------------------------------------\n');

    res.json(response);
  } catch (error) {
    const response = {
      code: 500,
      message: '文件上传失败'
    };

    logger.error('上传失败：', error);
    logger.info('返回结果：', response);
    logger.info('-------------------------------------------------------------\n');

    res.status(500).json(response);
  }
}; 