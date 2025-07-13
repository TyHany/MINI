const db = require('../database');
const logger = require('../utils/logger');

// 获取地址列表
exports.list = async (req, res) => {
  try {
    const userId = req.user.id;
    logger.debug('获取地址列表:', { userId });
    
    const [rows] = await db.execute(
      'SELECT * FROM address WHERE user_id = ? ORDER BY is_default DESC, id DESC',
      [userId]
    );

    logger.debug('地址列表查询结果:', { count: rows.length });

    res.json({
      code: 0,
      data: rows
    });
  } catch (error) {
    logger.error('获取地址列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误'
    });
  }
};

// 获取默认地址
exports.getDefault = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [rows] = await db.execute(
      'SELECT * FROM address WHERE user_id = ? AND is_default = 1 LIMIT 1',
      [userId]
    );

    res.json({
      code: 0,
      data: rows[0] || null
    });
  } catch (error) {
    logger.error('获取默认地址失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误'
    });
  }
};

// 创建地址
exports.create = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      receiverName,
      receiverPhone,
      province,
      city,
      district,
      detailAddress,
      isDefault
    } = req.body;

    // 如果设置为默认地址，先将其他地址设为非默认
    if (isDefault) {
      await db.execute(
        'UPDATE address SET is_default = 0 WHERE user_id = ?',
        [userId]
      );
    }

    const [result] = await db.execute(
      `INSERT INTO address (
        user_id, receiver_name, receiver_phone,
        province, city, district, detail_address, is_default
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, receiverName, receiverPhone, province, city, district, detailAddress, isDefault ? 1 : 0]
    );

    res.json({
      code: 0,
      message: '添加成功',
      data: {
        id: result.insertId
      }
    });
  } catch (error) {
    logger.error('创建地址失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误'
    });
  }
};

// 更新地址
exports.update = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      id,
      receiverName,
      receiverPhone,
      province,
      city,
      district,
      detailAddress,
      isDefault
    } = req.body;

    // 如果设置为默认地址，先将其他地址设为非默认
    if (isDefault) {
      await db.execute(
        'UPDATE address SET is_default = 0 WHERE user_id = ?',
        [userId]
      );
    }

    await db.execute(
      `UPDATE address SET 
        receiver_name = ?, 
        receiver_phone = ?,
        province = ?,
        city = ?,
        district = ?,
        detail_address = ?,
        is_default = ?
      WHERE id = ? AND user_id = ?`,
      [receiverName, receiverPhone, province, city, district, detailAddress, isDefault ? 1 : 0, id, userId]
    );

    res.json({
      code: 0,
      message: '更新成功'
    });
  } catch (error) {
    logger.error('更新地址失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误'
    });
  }
};

// 删除地址
exports.delete = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.body;

    await db.execute(
      'DELETE FROM address WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    res.json({
      code: 0,
      message: '删除成功'
    });
  } catch (error) {
    logger.error('删除地址失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误'
    });
  }
};

// 设置默认地址
exports.setDefault = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.body;

    // 先将所有地址设为非默认
    await db.execute(
      'UPDATE address SET is_default = 0 WHERE user_id = ?',
      [userId]
    );

    // 设置指定地址为默认
    await db.execute(
      'UPDATE address SET is_default = 1 WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    res.json({
      code: 0,
      message: '设置成功'
    });
  } catch (error) {
    logger.error('设置默认地址失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误'
    });
  }
};

// 获取地址详情
exports.getDetail = async (req, res) => {
  try {
    const { id } = req.query;
    const userId = req.user.id;

    // 查询地址信息
    const [addresses] = await db.execute(
      'SELECT * FROM address WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (addresses.length === 0) {
      throw new Error('地址不存在');
    }

    res.json({
      code: 0,
      data: addresses[0]
    });
  } catch (error) {
    logger.error('获取地址详情失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '获取地址详情失败'
    });
  }
}; 