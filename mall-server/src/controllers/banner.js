const db = require('../database');

// 获取轮播图列表
exports.list = async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM banner WHERE status = 1 ORDER BY sort DESC'
    );

    res.json({
      code: 0,
      data: rows
    });
  } catch (error) {
    console.error('获取轮播图列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误'
    });
  }
}; 