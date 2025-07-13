const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

// 获取订单列表
router.get('/list', auth, async (req, res) => {
    try {
        const { page = 1, pageSize = 10, orderNo = '', status = '', startTime = '', endTime = '' } = req.query;
        const offset = (page - 1) * pageSize;

        // 构建查询条件
        let where = 'WHERE 1=1';
        const params = [];
        
        if (orderNo) {
            where += ' AND o.order_no LIKE ?';
            params.push(`%${orderNo}%`);
        }
        if (status !== '') {
            where += ' AND o.status = ?';
            params.push(status);
        }
        if (startTime) {
            where += ' AND o.create_time >= ?';
            params.push(startTime);
        }
        if (endTime) {
            where += ' AND o.create_time <= ?';
            params.push(endTime);
        }

        // 查询总数
        const [countRows] = await db.execute(`
            SELECT COUNT(*) as total 
            FROM orders o 
            ${where}
        `, params);

        // 查询列表数据
        const [rows] = await db.execute(`
            SELECT 
                o.*,
                u.nickname as user_nickname
            FROM orders o
            LEFT JOIN user u ON o.user_id = u.id
            ${where}
            ORDER BY o.create_time DESC
            LIMIT ?, ?
        `, [...params, offset, parseInt(pageSize)]);

        // 查询订单商品
        for (let order of rows) {
            const [goods] = await db.execute(`
                SELECT 
                    og.*,
                    g.name as goods_name,
                    g.image_url as goods_image
                FROM order_goods og
                LEFT JOIN goods g ON og.goods_id = g.id
                WHERE og.order_id = ?
            `, [order.id]);
            order.goods = goods;
        }

        res.json({
            code: 0,
            data: {
                list: rows,
                total: countRows[0].total,
                page: parseInt(page),
                pageSize: parseInt(pageSize)
            }
        });
    } catch (error) {
        console.error('获取订单列表失败:', error);
        res.status(500).json({
            code: 500,
            message: '服务器错误'
        });
    }
});

// 获取订单详情
router.get('/detail/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;

        // 查询订单信息
        const [orders] = await db.execute(`
            SELECT 
                o.*,
                u.nickname as user_nickname
            FROM orders o
            LEFT JOIN user u ON o.user_id = u.id
            WHERE o.id = ?
        `, [id]);

        if (orders.length === 0) {
            return res.json({
                code: 1,
                message: '订单不存在'
            });
        }

        const order = orders[0];

        // 查询订单商品
        const [goods] = await db.execute(`
            SELECT 
                og.*,
                g.name as goods_name,
                g.image_url as goods_image
            FROM order_goods og
            LEFT JOIN goods g ON og.goods_id = g.id
            WHERE og.order_id = ?
        `, [id]);

        order.goods = goods;

        res.json({
            code: 0,
            data: order
        });
    } catch (error) {
        console.error('获取订单详情失败:', error);
        res.status(500).json({
            code: 500,
            message: '服务器错误'
        });
    }
});

// 修改订单状态
router.post('/status', auth, async (req, res) => {
    try {
        const { id, status } = req.body;
        await db.execute(
            'UPDATE orders SET status = ? WHERE id = ?',
            [status, id]
        );
        res.json({
            code: 0,
            message: '修改成功'
        });
    } catch (error) {
        console.error('修改订单状态失败:', error);
        res.status(500).json({
            code: 500,
            message: '服务器错误'
        });
    }
});

module.exports = router; 