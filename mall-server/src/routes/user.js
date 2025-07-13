const express = require('express');
const router = express.Router();
const userController = require('../controllers/user');
const auth = require('../middlewares/auth');

// 微信登录
router.post('/login', userController.login);

// 更新用户信息
router.post('/update', auth, userController.update);

// 获取用户信息
router.get('/info', auth, userController.getInfo);

console.log('Available methods:', Object.keys(userController));

module.exports = router; 