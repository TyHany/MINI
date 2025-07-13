const db = require('../database');
const logger = require('../utils/logger');
const axios = require('axios');

// 创建订单
exports.create = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { goods, addressId } = req.body;
    const userId = req.user.id;

    // 获取收货地址
    const [addresses] = await conn.execute(
      'SELECT * FROM address WHERE id = ? AND user_id = ?',
      [addressId, userId]
    );

    if (addresses.length === 0) {
      throw new Error('收货地址不存在');
    }

    const address = addresses[0];

    // 生成订单号
    const orderNo = `ORDER${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    // 计算订单总金额
    let totalAmount = 0;
    for (const item of goods) {
      const [rows] = await conn.execute(
        'SELECT price FROM goods WHERE id = ?',
        [item.goodsId]
      );
      if (rows.length === 0) {
        throw new Error(`商品不存在: ${item.goodsId}`);
      }
      totalAmount += rows[0].price * item.num;
    }

    // 创建订单
    const [result] = await conn.execute(
      `INSERT INTO orders (
        order_no, user_id, total_amount, status,
        receiver_name, receiver_phone, receiver_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        orderNo,
        userId,
        totalAmount,
        0,
        address.receiver_name,
        address.receiver_phone,
        `${address.province}${address.city}${address.district}${address.detail_address}`
      ]
    );

    const orderId = result.insertId;

    // 创建订单商品记录
    for (const item of goods) {
      // 获取商品信息
      const [goodsInfo] = await conn.execute(
        'SELECT name, image_url, price FROM goods WHERE id = ?',
        [item.goodsId]
      );

      if (goodsInfo.length === 0) {
        throw new Error(`商品不存在: ${item.goodsId}`);
      }

      // 插入订单商品记录
      await conn.execute(
        `INSERT INTO order_goods (
          order_id, goods_id, goods_name, goods_image, goods_price, quantity
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.goodsId,
          goodsInfo[0].name,
          goodsInfo[0].image_url,
          goodsInfo[0].price,
          item.num
        ]
      );

      // 更新商品库存
      await conn.execute(
        'UPDATE goods SET stock = stock - ? WHERE id = ? AND stock >= ?',
        [item.num, item.goodsId, item.num]
      );
    }

    await conn.commit();

    res.json({
      code: 0,
      message: '创建订单成功',
      data: {
        orderId,
        orderNo
      }
    });
  } catch (error) {
    await conn.rollback();
    logger.error('创建订单失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '创建订单失败'
    });
  } finally {
    conn.release();
  }
};

// 获取订单列表
exports.list = async (req, res) => {
  try {
    const userId = req.user.id;
    let { status, page = 1, pageSize = 10 } = req.query;  // 使用 let 而不是 const
    page = parseInt(page);
    pageSize = parseInt(pageSize);
    const offset = (page - 1) * pageSize;

    // 构建基础查询
    let sql = `
      SELECT 
        o.*,
        og.goods_id,
        og.goods_name,
        og.goods_image,
        og.goods_price,
        og.quantity
      FROM orders o
      LEFT JOIN order_goods og ON o.id = og.order_id
      WHERE o.user_id = ?
    `;

    let countSql = `
      SELECT COUNT(DISTINCT o.id) as total
      FROM orders o
      WHERE o.user_id = ?
    `;

    const params = [userId];
    const countParams = [userId];

    if (status !== undefined && status !== '') {  // 添加空字符串检查
      status = parseInt(status);  // 转换为数字
      sql += ' AND o.status = ?';
      countSql += ' AND o.status = ?';
      params.push(status);
      countParams.push(status);
    }

    sql += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(pageSize, offset);

    // 并行执行查询
    const [[rows], [countResult]] = await Promise.all([
      db.execute(sql, params),
      db.execute(countSql, countParams)
    ]);

    // 重组数据，将商品信息整理到订单中
    const orders = [];
    let currentOrder = null;

    rows.forEach(row => {
      if (!currentOrder || currentOrder.id !== row.id) {
        currentOrder = {
          id: row.id,
          order_no: row.order_no,
          total_amount: Number(row.total_amount).toFixed(2),
          status: row.status,
          status_text: getOrderStatusText(row.status),
          receiver_name: row.receiver_name,
          receiver_phone: row.receiver_phone,
          receiver_address: row.receiver_address,
          pay_time: row.pay_time ? formatDate(row.pay_time) : null,
          created_at: formatDate(row.created_at),
          goods: []
        };
        orders.push(currentOrder);
      }

      if (row.goods_id) {
        currentOrder.goods.push({
          goods_id: row.goods_id,
          goods_name: row.goods_name,
          goods_image: row.goods_image,
          goods_price: Number(row.goods_price).toFixed(2),
          quantity: row.quantity
        });
      }
    });

    res.json({
      code: 0,
      data: {
        list: orders,
        pagination: {
          total: countResult.total,
          page,
          pageSize,
          pages: Math.ceil(countResult.total / pageSize)
        }
      }
    });
  } catch (error) {
    logger.error('获取订单列表失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '获取订单列表失败'
    });
  }
};

// 获取订单状态文字
function getOrderStatusText(status) {
  const statusMap = {
    0: '待支付',
    1: '待发货',
    2: '待收货',
    3: '已完成',
    4: '已取消'
  };
  return statusMap[status] || '未知状态';
}

// 格式化日期
function formatDate(date) {
  if (!date) return null;
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

// 确认收货
exports.confirm = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.body;

    // 检查订单是否存在
    const [orders] = await db.execute(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [orderId, userId]
    );

    if (orders.length === 0) {
      return res.json({
        code: 1,
        message: '订单不存在'
      });
    }

    if (orders[0].status !== 2) { // 2:已发货状态
      return res.json({
        code: 1,
        message: '订单状态不正确'
      });
    }

    // 更新订单状态为已完成
    await db.execute(
      'UPDATE orders SET status = 3 WHERE id = ?',
      [orderId]
    );

    res.json({
      code: 0,
      message: '确认成功'
    });
  } catch (error) {
    console.error('确认收货失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误'
    });
  }
};

// 发起支付
exports.pay = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.body;

    // 检查订单是否存在
    const [orders] = await db.execute(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [orderId, userId]
    );

    if (orders.length === 0) {
      return res.json({
        code: 1,
        message: '订单不存在'
      });
    }

    const order = orders[0];

    if (order.status !== 0) { // 0:待付款状态
      return res.json({
        code: 1,
        message: '订单状态不正确'
      });
    }

    // 调用支付接口
    const response = await axios.post('/api/pay/create', {
      orderNo: order.order_no
    });

    res.json({
      code: 0,
      message: '发起支付成功',
      data: response.data.data
    });
  } catch (error) {
    console.error('支付失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '服务器错误'
    });
  }
};

// 获取订单状态
exports.getStatus = async (req, res) => {
  try {
    const { orderId } = req.query;
    const userId = req.user.id;

    const [orders] = await db.execute(
      'SELECT status FROM orders WHERE id = ? AND user_id = ?',
      [orderId, userId]
    );

    if (orders.length === 0) {
      throw new Error('订单不存在');
    }

    res.json({
      code: 0,
      data: {
        status: orders[0].status
      }
    });
  } catch (error) {
    logger.error('获取订单状态失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '获取订单状态失败'
    });
  }
};

// 取消订单
exports.cancel = async (req, res) => {
  try {
    const { id } = req.body;
    const userId = req.user.id;

    // 检查订单是否存在且属于当前用户
    const [orders] = await db.execute(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (orders.length === 0) {
      throw new Error('订单不存在');
    }

    const order = orders[0];

    // 检查订单状态是否为待支付
    if (order.status !== 0) {
      throw new Error('只能取消待支付的订单');
    }

    // 开启事务
    const conn = await db.getConnection();
    await conn.beginTransaction();

    try {
      // 更新订单状态为已取消
      await conn.execute(
        'UPDATE orders SET status = 4 WHERE id = ?',
        [id]
      );

      // 恢复商品库存
      const [orderGoods] = await conn.execute(
        'SELECT goods_id, quantity FROM order_goods WHERE order_id = ?',
        [id]
      );

      for (const item of orderGoods) {
        await conn.execute(
          'UPDATE goods SET stock = stock + ? WHERE id = ?',
          [item.quantity, item.goods_id]
        );
      }

      await conn.commit();

      res.json({
        code: 0,
        message: '取消成功'
      });
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  } catch (error) {
    logger.error('取消订单失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '取消订单失败'
    });
  }
};

// 获取订单详情
exports.getDetail = async (req, res) => {
  try {
    const { id } = req.query;
    const userId = req.user.id;

    // 查询订单基本信息
    const [orders] = await db.execute(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (orders.length === 0) {
      throw new Error('订单不存在');
    }

    // 查询订单商品信息
    const [orderGoods] = await db.execute(
      'SELECT * FROM order_goods WHERE order_id = ?',
      [id]
    );

    const order = {
      ...orders[0],
      goods: orderGoods
    };

    res.json({
      code: 0,
      data: order
    });
  } catch (error) {
    logger.error('获取订单详情失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '获取订单详情失败'
    });
  }
}; 