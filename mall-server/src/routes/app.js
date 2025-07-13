const express = require('express');
const router = express.Router();
const upload = require('../config/appUpload');
const appController = require('../controllers/app');
const appAuth = require('../middlewares/appAuth');

// 文件上传接口
router.post('/upload', appAuth, upload.single('file'), appController.uploadFile);

module.exports = router; 