const db = require('../database');
const logger = require('../utils/logger');

// 处理图片URL，确保返回完整的URL
const getFullImageUrl = (imageUrl) => {
  if (!imageUrl) return '';
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  return imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
};

// 处理商品数据，添加完整的图片URL
const processGoodsData = (goods) => {
  if (Array.isArray(goods)) {
    return goods.map(item => ({
      ...item,
      image_url: getFullImageUrl(item.image_url)
    }));
  }
  return {
    ...goods,
    image_url: getFullImageUrl(goods.image_url)
  };
};

// 获取推荐商品列表
exports.recommend = async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM goods WHERE status = 1 AND is_recommend = 1 ORDER BY id DESC LIMIT 10'
    );

    res.json({
      code: 0,
      data: processGoodsData(rows)
    });
  } catch (error) {
    console.error('获取推荐商品失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误'
    });
  }
};

// 获取商品详情
exports.detail = async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        code: 400,
        message: '商品ID不能为空'
      });
    }

    // 查询商品基本信息
    const [rows] = await db.execute(
      'SELECT id, category_id, name, price, stock, image_url, detail, status, is_recommend, create_time, update_time FROM goods WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '商品不存在'
      });
    }

    // 处理商品数据
    const goods = processGoodsData(rows[0]);
    
    // 处理富文本内容中的图片URL
    if (goods.detail) {
      const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
      goods.content = goods.detail.replace(/src="([^"]+)"/g, (match, url) => {
        return `src="${getFullImageUrl(url)}"`;
      });
    } else {
      goods.content = '';
    }

    res.json({
      code: 0,
      data: goods
    });
  } catch (error) {
    logger.error('获取商品详情失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取商品详情失败'
    });
  }
};

// 获取商品列表
exports.list = async (req, res) => {
  try {
    const { categoryId, page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    // 构建查询条件
    let sql = 'SELECT * FROM goods WHERE 1=1';
    const params = [];

    if (categoryId) {
      sql += ' AND category_id = ?';
      params.push(categoryId);
    }

    sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), offset);

    // 获取总数
    let countSql = 'SELECT COUNT(*) as total FROM goods WHERE 1=1';
    if (categoryId) {
      countSql += ' AND category_id = ?';
    }

    const [[rows], [countResult]] = await Promise.all([
      db.execute(sql, params),
      db.execute(countSql, categoryId ? [categoryId] : [])
    ]);

    res.json({
      code: 0,
      data: {
        list: processGoodsData(rows),
        pagination: {
          total: countResult[0].total,
          page: parseInt(page),
          pageSize: parseInt(pageSize)
        }
      }
    });
  } catch (error) {
    logger.error('获取商品列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取商品列表失败'
    });
  }
};

// 更新商品
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      categoryId, 
      name, 
      price, 
      stock, 
      imageUrl, 
      detail, 
      status,
      isRecommend 
    } = req.body;

    await db.execute(`
      UPDATE goods 
      SET category_id = ?, 
          name = ?, 
          price = ?, 
          stock = ?, 
          image_url = ?, 
          detail = ?, 
          status = ?,
          is_recommend = ?
      WHERE id = ?
    `, [categoryId, name, price, stock, imageUrl, detail, status, isRecommend, id]);

    res.json({
      code: 0,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新商品失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误'
    });
  }
};

// 添加商品
exports.add = async (req, res) => {
  try {
    const { 
      categoryId, 
      name, 
      price, 
      stock, 
      imageUrl, 
      detail, 
      status,
      isRecommend 
    } = req.body;

    await db.execute(`
      INSERT INTO goods (
        category_id, name, price, stock, 
        image_url, detail, status, is_recommend
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [categoryId, name, price, stock, imageUrl, detail, status, isRecommend]);

    res.json({
      code: 0,
      message: '添加成功'
    });
  } catch (error) {
    console.error('添加商品失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误'
    });
  }
}; 