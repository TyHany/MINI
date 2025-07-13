const db = require('../config/database');

// 添加商品到购物车
exports.add = async (req, res) => {
  try {
    const { goodsId, quantity = 1 } = req.body;
    const userId = req.user.id;

    // 检查商品是否存在且上架
    const [goods] = await db.execute(
      'SELECT * FROM goods WHERE id = ? AND status = 1',
      [goodsId]
    );

    if (goods.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '商品不存在或已下架'
      });
    }

    // 检查库存
    if (goods[0].stock < quantity) {
      return res.json({
        code: 1,
        message: '商品库存不足'
      });
    }

    // 检查购物车是否已有此商品
    const [cartItems] = await db.execute(
      'SELECT * FROM cart WHERE user_id = ? AND goods_id = ?',
      [userId, goodsId]
    );

    if (cartItems.length > 0) {
      // 更新数量
      await db.execute(
        'UPDATE cart SET quantity = quantity + ? WHERE id = ?',
        [quantity, cartItems[0].id]
      );
    } else {
      // 新增记录
      await db.execute(
        'INSERT INTO cart (user_id, goods_id, quantity) VALUES (?, ?, ?)',
        [userId, goodsId, quantity]
      );
    }

    res.json({
      code: 0,
      message: '添加成功'
    });
  } catch (error) {
    console.error('添加购物车失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误'
    });
  }
};

// 获取购物车列表
exports.list = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.execute(`
      SELECT 
        c.*,
        g.name as goods_name,
        g.image_url as goods_image,
        g.price as goods_price,
        g.stock as goods_stock
      FROM cart c
      LEFT JOIN goods g ON c.goods_id = g.id
      WHERE c.user_id = ?
      ORDER BY c.id DESC
    `, [userId]);

    res.json({
      code: 0,
      data: rows
    });
  } catch (error) {
    console.error('获取购物车列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误'
    });
  }
};

// 更新购物车商品数量
exports.update = async (req, res) => {
  try {
    const { id, quantity } = req.body;
    const userId = req.user.id;

    // 检查购物车项是否存在
    const [cartItems] = await db.execute(
      'SELECT * FROM cart WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (cartItems.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '购物车商品不存在'
      });
    }

    // 检查商品库存
    const [goods] = await db.execute(
      'SELECT stock FROM goods WHERE id = ?',
      [cartItems[0].goods_id]
    );

    if (goods[0].stock < quantity) {
      return res.json({
        code: 1,
        message: '商品库存不足'
      });
    }

    // 更新数量
    await db.execute(
      'UPDATE cart SET quantity = ? WHERE id = ?',
      [quantity, id]
    );

    res.json({
      code: 0,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新购物车失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误'
    });
  }
};

// 删除购物车商品
exports.delete = async (req, res) => {
  try {
    const { id } = req.body;
    const userId = req.user.id;

    await db.execute(
      'DELETE FROM cart WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    res.json({
      code: 0,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除购物车商品失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误'
    });
  }
}; 