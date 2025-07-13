const path = require('path');
const multer = require('multer');
const config = require('./index');

// MIME类型到文件扩展名的映射
const mimeToExt = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/bmp': '.bmp',
  'image/svg+xml': '.svg'
};

// 配置文件存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: function (req, file, cb) {
    // 从MIME类型获取后缀名
    const ext = mimeToExt[file.mimetype] || path.extname(file.originalname).toLowerCase() || '.jpg';
    
    // 生成文件名：时间戳-随机数.后缀名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
    cb(null, uniqueSuffix);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 只允许上传图片
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('只能上传图片文件！'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: config.upload.maxSize || 5 * 1024 * 1024 // 默认限制5MB
  }
});

module.exports = upload; 