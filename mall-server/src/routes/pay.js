const express = require('express');
const router = express.Router();
const payController = require('../controllers/pay');
const auth = require('../middlewares/auth');

// 创建支付订单
router.post('/create', auth, payController.create);

// 查询支付状态
router.get('/query', auth, payController.queryOrderStatus);

// 支付结果通知
router.post('/notify', payController.notify);

module.exports = router; 