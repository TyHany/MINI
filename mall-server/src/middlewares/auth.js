const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');

module.exports = (req, res, next) => {
  logger.debug('\n认证中间件：');
  logger.debug('请求头：', {
    ...req.headers,
    authorization: req.headers.authorization ? '******' : undefined
  });

  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    const response = {
      code: 401,
      message: '请先登录'
    };
    logger.warn('认证失败：没有token');
    logger.debug('返回结果：', response);
    return res.status(401).json(response);
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    logger.debug('认证成功：', { userId: decoded.id });
    next();
  } catch (err) {
    const response = {
      code: 401,
      message: '登录已过期'
    };
    logger.warn('认证失败：token无效', err);
    logger.debug('返回结果：', response);
    res.status(401).json(response);
  }
}; 