const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category');

// 获取分类列表
router.get('/list', categoryController.list);

// 获取首页分类及商品列表
router.get('/home', categoryController.home);

// 获取分类商品列表
router.get('/:id/goods', categoryController.goods);

module.exports = router; 