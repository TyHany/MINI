const express = require('express');
const router = express.Router();
const upload = require('../config/upload');
const uploadController = require('../controllers/upload');
const auth = require('../middlewares/auth');

// 文件上传接口
router.post('/', auth, upload.single('file'), uploadController.uploadFile);

module.exports = router; 