const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order');
const auth = require('../middlewares/auth');

// 创建订单
router.post('/create', auth, orderController.create);

// 获取订单列表
router.get('/list', auth, orderController.list);

// 确认收货
router.post('/confirm', auth, orderController.confirm);

// 发起支付
router.post('/pay', auth, orderController.pay);

// 取消订单
router.post('/cancel', auth, orderController.cancel);

// 获取订单详情
router.get('/detail', auth, orderController.getDetail);

module.exports = router; 