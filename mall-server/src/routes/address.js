const express = require('express');
const router = express.Router();
const addressController = require('../controllers/address');
const auth = require('../middlewares/auth');

// 获取地址列表
router.get('/list', auth, addressController.list);

// 获取默认地址
router.get('/default', auth, addressController.getDefault);

// 添加地址
router.post('/create', auth, addressController.create);

// 更新地址
router.post('/update', auth, addressController.update);

// 删除地址
router.post('/delete', auth, addressController.delete);

// 设置默认地址
router.post('/set-default', auth, addressController.setDefault);

// 获取地址详情
router.get('/detail', auth, addressController.getDetail);

module.exports = router; 