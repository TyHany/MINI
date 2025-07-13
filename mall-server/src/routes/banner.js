const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/banner');

// 获取轮播图列表
router.get('/list', bannerController.list);

module.exports = router; 