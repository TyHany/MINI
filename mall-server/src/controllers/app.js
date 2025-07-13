const config = require('../config');
const logger = require('../utils/logger');

exports.uploadFile = async (req, res) => {
  // 打印接口调用信息
  logger.info('-------------------------------------------------------------');
  logger.info('接口名：APP文件上传');
  logger.info(`接口地址：${req.protocol}://${req.get('host')}${req.originalUrl}`);
  logger.info('请求头：\n' + JSON.stringify({
    ...req.headers,
    'app-token': req.headers['app-token'] ? '******' : undefined
  }, null, 2));
  logger.info('请求参数：\n' + JSON.stringify({
    body: req.body,
    file: req.file ? {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : null
  }, null, 2));

  try {
    if (!req.file) {
      const response = {
        code: 400,
        message: '没有上传文件'
      };
      logger.warn('上传失败：没有文件');
      logger.info('返回结果：\n' + JSON.stringify(response, null, 2));
      logger.info('-------------------------------------------------------------');
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

    logger.info('返回结果：\n' + JSON.stringify(response, null, 2));
    logger.info('-------------------------------------------------------------');

    res.json(response);
  } catch (error) {
    const response = {
      code: 500,
      message: '文件上传失败'
    };

    logger.error('上传失败：' + error.message);
    logger.info('返回结果：\n' + JSON.stringify(response, null, 2));
    logger.info('-------------------------------------------------------------');

    res.status(500).json(response);
  }
}; 