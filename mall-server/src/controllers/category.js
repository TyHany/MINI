const db = require('../database');

// 获取分类列表
exports.list = async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM category ORDER BY sort DESC'
    );

    res.json({
      code: 0,
      data: rows
    });
  } catch (error) {
    console.error('获取分类列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误'
    });
  }
};

// 获取首页分类及商品列表
exports.home = async (req, res) => {
  try {
    // 获取所有分类
    const [categories] = await db.execute(
      'SELECT * FROM category ORDER BY sort DESC'
    );

    // 为每个分类获取3个商品
    for (let category of categories) {
      const [goods] = await db.execute(`
        SELECT * FROM goods 
        WHERE category_id = ? AND status = 1 
        ORDER BY id DESC 
        LIMIT 3
      `, [category.id]);
      
      category.goods = goods;
    }

    res.json({
      code: 0,
      data: categories
    });
  } catch (error) {
    console.error('获取首页分类商品失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误'
    });
  }
};

// 获取分类商品列表
exports.goods = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    // 查询分类是否存在
    const [categories] = await db.execute(
      'SELECT * FROM category WHERE id = ?',
      [id]
    );

    if (categories.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '分类不存在'
      });
    }

    // 查询分类下的商品
    const [goods] = await db.execute(`
      SELECT * FROM goods 
      WHERE category_id = ? AND status = 1
      ORDER BY id DESC 
      LIMIT ?, ?
    `, [id, offset, parseInt(pageSize)]);

    // 查询商品总数
    const [countResult] = await db.execute(
      'SELECT COUNT(*) as total FROM goods WHERE category_id = ? AND status = 1',
      [id]
    );

    res.json({
      code: 0,
      data: {
        list: goods,
        total: countResult[0].total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('获取分类商品列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误'
    });
  }
}; 