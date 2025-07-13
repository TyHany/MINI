const db = require('../database');
const jwt = require('jsonwebtoken');
const config = require('../config');
const axios = require('axios');
const logger = require('../utils/logger');

// 微信登录
exports.login = async (req, res) => {
  try {
    const { code } = req.body;
    logger.debug('微信登录请求参数:', { code });
    
    // 请求微信API获取openid
    logger.debug('请求微信API:', {
      appid: config.wx.appId,
      js_code: code
    });

    const response = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
      params: {
        appid: config.wx.appId,
        secret: config.wx.appSecret,
        js_code: code,
        grant_type: 'authorization_code'
      }
    });

    const { openid, session_key } = response.data;
    logger.debug('微信API响应:', { openid });

    // 查询用户是否存在
    let [users] = await db.execute(
      'SELECT * FROM user WHERE openid = ?',
      [openid]
    );

    let userId;
    if (users.length === 0) {
      logger.debug('新用户注册');
      const [result] = await db.execute(
        'INSERT INTO user (openid) VALUES (?)',
        [openid]
      );
      userId = result.insertId;
    } else {
      logger.debug('老用户登录');
      userId = users[0].id;
    }

    // 生成token
    const token = jwt.sign(
      { id: userId, openid },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    logger.info('用户登录成功:', { userId, openid });
    res.json({
      code: 0,
      message: '登录成功',
      data: { token }
    });
  } catch (error) {
    logger.error('登录失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误'
    });
  }
};

// 更新用户信息
exports.update = async (req, res) => {
  logger.info('\n-------------------------------------------------------------');
  logger.info('接口名：更新用户信息');
  logger.info(`接口地址：${req.protocol}://${req.get('host')}${req.originalUrl}`);
  logger.info('请求头：', {
    ...req.headers,
    'authorization': req.headers.authorization ? '******' : undefined
  });
  logger.info('请求参数：', req.body);

  try {
    const { nickname, avatar } = req.body;
    const userId = req.user.id;

    // 参数验证
    if (!nickname || !avatar) {
      const response = {
        code: 400,
        message: '昵称和头像不能为空'
      };
      logger.info('返回结果：', response);
      logger.info('-------------------------------------------------------------\n');
      return res.json(response);
    }

    // 更新用户信息 - 修改这里的字段名为 avatar_url
    await db.execute(
      'UPDATE user SET nickname = ?, avatar_url = ? WHERE id = ?',
      [nickname, avatar, userId]
    );

    const response = {
      code: 0,
      message: '更新成功'
    };
    
    logger.info('返回结果：', response);
    logger.info('-------------------------------------------------------------\n');
    
    res.json(response);
  } catch (err) {
    const response = {
      code: 500,
      message: '服务器错误'
    };
    
    logger.error('更新用户信息失败:', err);
    logger.info('返回结果：', response);
    logger.info('-------------------------------------------------------------\n');
    
    res.status(500).json(response);
  }
};

// 获取用户信息
exports.getInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    logger.debug('获取用户信息:', { userId });

    const [users] = await db.execute(
      'SELECT id, nickname, avatar_url, openid FROM user WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      logger.warn('用户不存在:', { userId });
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    const user = users[0];
    logger.debug('获取用户信息成功:', {
      userId,
      nickname: user.nickname
    });

    res.json({
      code: 0,
      data: {
        id: user.id,
        nickname: user.nickname || '',
        avatar: user.avatar_url || '',
        hasUserInfo: !!(user.nickname && user.avatar_url)
      }
    });
  } catch (error) {
    logger.error('获取用户信息失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误'
    });
  }
}; 