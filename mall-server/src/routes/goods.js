const express = require('express');
const router = express.Router();
const goodsController = require('../controllers/goods');

// 获取商品列表
router.get('/list', goodsController.list);

// 获取商品详情
router.get('/detail', goodsController.detail);

// 获取推荐商品
router.get('/recommend', goodsController.recommend);

module.exports = router; 