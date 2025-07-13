const express = require('express');
const router = express.Router();
const userRoutes = require('./user');
const uploadRoutes = require('./upload');

// 测试路由
router.get('/test', (req, res) => {
  res.json({
    code: 0,
    message: 'API服务正常',
    data: {
      env: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    }
  });
});

// 用户相关路由
router.use('/user', userRoutes);

// 商品相关路由
router.use('/goods', require('./goods'));

// 订单相关路由
router.use('/order', require('./order'));

// 购物车相关路由
router.use('/cart', require('./cart'));

// 地址相关路由
router.use('/address', require('./address'));

// 分类相关路由
router.use('/category', require('./category'));

// 轮播图相关路由
router.use('/banner', require('./banner'));

// 上传相关路由
router.use('/upload', uploadRoutes);

// 支付相关路由
router.use('/pay', require('./pay'));

// APP通用接口路由
router.use('/app', require('./app'));

module.exports = router; 