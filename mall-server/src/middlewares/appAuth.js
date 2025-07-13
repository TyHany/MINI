const config = require('../config');
const logger = require('../utils/logger');

module.exports = (req, res, next) => {
  logger.info('-------------------------------------------------------------');
  logger.info('接口名：APP Token验证');
  logger.info(`接口地址：${req.protocol}://${req.get('host')}${req.originalUrl}`);
  
  const appToken = req.headers['app-token'];
  const correctToken = config.app.token;
  
  logger.info('请求头：\n' + JSON.stringify({
    ...req.headers,
    'app-token': appToken ? '******' : undefined
  }, null, 2));
  
  // 验证 app-token
  if (!appToken || appToken !== correctToken) {
    logger.warn(`无效的 app-token: ${appToken || '未提供'}`);
    logger.warn(`正确的 token 应该是: ${correctToken}`);
    
    const response = {
      code: 401,
      message: '无效的访问令牌'
    };
    
    logger.info('返回结果：\n' + JSON.stringify(response, null, 2));
    logger.info('-------------------------------------------------------------');
    
    return res.status(401).json(response);
  }

  logger.info('Token验证成功');
  logger.info('-------------------------------------------------------------');
  next();
}; 