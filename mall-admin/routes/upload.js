const config = require('../config');

router.post('/upload', upload.single('file'), (req, res) => {
  if (req.file) {
    const url = `${config.app.baseUrl}/uploads/${req.file.filename}`;
    res.json({
      code: 0,
      message: '上传成功',
      data: { url }
    });
  } else {
    res.status(400).json({
      code: 400,
      message: '上传失败'
    });
  }
}); 