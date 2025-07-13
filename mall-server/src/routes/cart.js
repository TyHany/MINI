const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart');
const auth = require('../middlewares/auth');

// 添加商品到购物车
router.post('/add', auth, cartController.add);

// 获取购物车列表
router.get('/list', auth, cartController.list);

// 更新购物车商品数量
router.post('/update', auth, cartController.update);

// 删除购物车商品
router.post('/delete', auth, cartController.delete);

module.exports = router; 