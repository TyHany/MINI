const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

// 获取销售统计数据
router.get('/sales', auth, async (req, res) => {
    try {
        // 今日订单总数
        const [todayOrderCount] = await db.execute(`
            SELECT COUNT(*) as count
            FROM orders
            WHERE DATE(create_time) = CURDATE()
        `);

        // 今日销售额
        const [todaySales] = await db.execute(`
            SELECT COALESCE(SUM(total_amount), 0) as total
            FROM orders
            WHERE DATE(create_time) = CURDATE()
            AND status != 0  -- 排除已取消的订单
        `);

        // 本月订单总数
        const [monthOrderCount] = await db.execute(`
            SELECT COUNT(*) as count
            FROM orders
            WHERE DATE_FORMAT(create_time, '%Y%m') = DATE_FORMAT(CURDATE(), '%Y%m')
        `);

        // 本月销售额
        const [monthSales] = await db.execute(`
            SELECT COALESCE(SUM(total_amount), 0) as total
            FROM orders
            WHERE DATE_FORMAT(create_time, '%Y%m') = DATE_FORMAT(CURDATE(), '%Y%m')
            AND status != 0  -- 排除已取消的订单
        `);

        // 商品总数
        const [goodsCount] = await db.execute(`
            SELECT COUNT(*) as count
            FROM goods
            WHERE status = 1
        `);

        // 用户总数
        const [userCount] = await db.execute(`
            SELECT COUNT(*) as count
            FROM user
        `);

        // 近7天销售趋势
        const [salesTrend] = await db.execute(`
            SELECT 
                DATE(create_time) as date,
                COUNT(*) as order_count,
                COALESCE(SUM(total_amount), 0) as sales_amount
            FROM orders
            WHERE create_time >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
            AND status != 0
            GROUP BY DATE(create_time)
            ORDER BY date ASC
        `);

        // 补充没有数据的日期
        const result = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const formatDate = date.toISOString().slice(0, 10);

            const data = salesTrend.find(item => item.date === formatDate) || {
                date: formatDate,
                order_count: 0,
                sales_amount: 0
            };

            result.push(data);
        }

        res.json({
            code: 0,
            data: {
                today: todaySales[0].total || 0,
                week: result.reduce((sum, item) => sum + item.sales_amount, 0),
                month: monthSales[0].total || 0,
                trend: result,
                total: {
                    orderCount: monthOrderCount[0].count || 0,
                    goodsCount: goodsCount[0].count || 0,
                    userCount: userCount[0].count || 0
                }
            }
        });
    } catch (error) {
        console.error('获取销售统计失败:', error);
        res.status(500).json({
            code: 500,
            message: '服务器错误'
        });
    }
});

// 获取销售趋势数据
router.get('/sales-trend', auth, async (req, res) => {
    try {
        const { range = 'week' } = req.query;
        let days, format, groupBy;

        switch(range) {
            case 'month':
                days = 30;
                format = '%Y-%m-%d';
                groupBy = 'DATE(create_time)';
                break;
            case 'year':
                days = 365;
                format = '%Y-%m';
                groupBy = 'DATE_FORMAT(create_time, "%Y-%m")';
                break;
            default: // week
                days = 7;
                format = '%Y-%m-%d';
                groupBy = 'DATE(create_time)';
        }

        // 查询销售趋势
        const [rows] = await db.execute(`
            SELECT 
                ${groupBy} as date,
                COUNT(*) as order_count,
                COALESCE(SUM(total_amount), 0) as sales_amount,
                COUNT(DISTINCT user_id) as user_count
            FROM orders
            WHERE create_time >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            AND status != 0  -- 排除已取消的订单
            GROUP BY ${groupBy}
            ORDER BY date ASC
        `, [days]);

        // 补充没有数据的日期
        const result = [];
        const today = new Date();
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            
            // 格式化日期
            const formatDate = range === 'year' 
                ? date.toISOString().slice(0, 7)  // YYYY-MM
                : date.toISOString().slice(0, 10); // YYYY-MM-DD

            // 查找对应数据
            const data = rows.find(item => item.date === formatDate) || {
                date: formatDate,
                order_count: 0,
                sales_amount: 0,
                user_count: 0
            };

            result.push(data);
        }

        res.json({
            code: 0,
            data: result
        });
    } catch (error) {
        console.error('获取销售趋势失败:', error);
        res.status(500).json({
            code: 500,
            message: '服务器错误'
        });
    }
});

// 获取热销商品数据
router.get('/hot-goods', auth, async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        // 查询销量前N的商品
        const [rows] = await db.execute(`
            SELECT 
                g.id,
                g.name,
                g.image_url,
                g.price,
                c.name as category_name,
                COUNT(og.id) as sale_count,
                SUM(g.price * og.quantity) as sale_amount
            FROM goods g
            LEFT JOIN category c ON g.category_id = c.id
            LEFT JOIN order_goods og ON g.id = og.goods_id
            LEFT JOIN orders o ON og.order_id = o.id AND o.status != 0  -- 排除已取消的订单
            WHERE g.status = 1  -- 只统计上架商品
            GROUP BY g.id
            HAVING sale_count > 0  -- 只显示有销量的商品
            ORDER BY sale_count DESC, sale_amount DESC
            LIMIT ?
        `, [parseInt(limit)]);

        // 计算总销量和总销售额
        const [total] = await db.execute(`
            SELECT 
                COUNT(DISTINCT og.goods_id) as goods_count,
                SUM(og.quantity) as total_quantity,
                SUM(g.price * og.quantity) as total_amount
            FROM order_goods og
            LEFT JOIN goods g ON og.goods_id = g.id
            LEFT JOIN orders o ON og.order_id = o.id
            WHERE o.status != 0  -- 排除已取消的订单
        `);

        res.json({
            code: 0,
            data: {
                list: rows,
                total: {
                    goodsCount: total[0].goods_count || 0,
                    saleQuantity: total[0].total_quantity || 0,
                    saleAmount: total[0].total_amount || 0
                }
            }
        });
    } catch (error) {
        console.error('获取热销商品失败:', error);
        res.status(500).json({
            code: 500,
            message: '服务器错误'
        });
    }
});

// 获取订单统计数据
router.get('/orders', auth, async (req, res) => {
    try {
        // 各状态订单数量
        const [statusCount] = await db.execute(`
            SELECT 
                status,
                COUNT(*) as count
            FROM orders
            GROUP BY status
        `);

        // 今日订单数据
        const [todayOrders] = await db.execute(`
            SELECT 
                COUNT(*) as total_count,
                COUNT(DISTINCT user_id) as user_count,
                COALESCE(SUM(total_amount), 0) as total_amount,
                COALESCE(SUM(total_amount) / COUNT(*), 0) as avg_amount
            FROM orders
            WHERE DATE(create_time) = CURDATE()
        `);

        // 近7天订单趋势
        const [orderTrend] = await db.execute(`
            SELECT 
                DATE(create_time) as date,
                COUNT(*) as order_count,
                COUNT(DISTINCT user_id) as user_count,
                COALESCE(SUM(total_amount), 0) as total_amount,
                COALESCE(SUM(total_amount) / COUNT(*), 0) as avg_amount
            FROM orders
            WHERE create_time >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
            GROUP BY DATE(create_time)
            ORDER BY date ASC
        `);

        // 补充没有数据的日期
        const result = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const formatDate = date.toISOString().slice(0, 10);

            const data = orderTrend.find(item => item.date === formatDate) || {
                date: formatDate,
                order_count: 0,
                user_count: 0,
                total_amount: 0,
                avg_amount: 0
            };

            result.push(data);
        }

        // 格式化状态统计数据
        const statusStats = {
            pending: 0,    // 待付款
            paid: 0,       // 待发货
            shipped: 0,    // 待收货
            completed: 0,  // 已完成
            cancelled: 0   // 已取消
        };

        statusCount.forEach(item => {
            switch(item.status) {
                case 0: statusStats.pending = item.count; break;
                case 1: statusStats.paid = item.count; break;
                case 2: statusStats.shipped = item.count; break;
                case 3: statusStats.completed = item.count; break;
                case 4: statusStats.cancelled = item.count; break;
            }
        });

        res.json({
            code: 0,
            data: {
                status: statusStats,
                today: {
                    orderCount: todayOrders[0].total_count,
                    userCount: todayOrders[0].user_count,
                    totalAmount: todayOrders[0].total_amount,
                    avgAmount: todayOrders[0].avg_amount
                },
                trend: result
            }
        });
    } catch (error) {
        console.error('获取订单统计失败:', error);
        res.status(500).json({
            code: 500,
            message: '服务器错误'
        });
    }
});

// 获取转化率统计数据
router.get('/conversion', auth, async (req, res) => {
    try {
        const { range = 'today' } = req.query;
        let dateCondition;

        switch(range) {
            case 'week':
                dateCondition = 'create_time >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)';
                break;
            case 'month':
                dateCondition = 'DATE_FORMAT(create_time, "%Y%m") = DATE_FORMAT(CURDATE(), "%Y%m")';
                break;
            default: // today
                dateCondition = 'DATE(create_time) = CURDATE()';
        }

        // 访问量统计
        const [viewStats] = await db.execute(`
            SELECT 
                COUNT(*) as pv,
                COUNT(DISTINCT user_id) as uv
            FROM page_view
            WHERE ${dateCondition}
        `);

        // 下单用户和订单数统计
        const [orderStats] = await db.execute(`
            SELECT 
                COUNT(*) as order_count,
                COUNT(DISTINCT user_id) as user_count,
                COALESCE(SUM(total_amount), 0) as total_amount
            FROM orders
            WHERE ${dateCondition}
            AND status != 4  -- 排除已取消的订单
        `);

        // 计算转化率
        const pv = viewStats[0].pv || 0;
        const uv = viewStats[0].uv || 0;
        const orderCount = orderStats[0].order_count || 0;
        const orderUserCount = orderStats[0].user_count || 0;
        const totalAmount = orderStats[0].total_amount || 0;

        res.json({
            code: 0,
            data: {
                pv,                                    // 访问量
                uv,                                    // 访客数
                orderCount,                           // 订单数
                orderUserCount,                       // 下单用户数
                totalAmount,                          // 成交金额
                orderRate: pv ? (orderCount / pv * 100).toFixed(2) : 0,      // 下单转化率
                userRate: uv ? (orderUserCount / uv * 100).toFixed(2) : 0,   // 用户转化率
                avgAmount: orderCount ? (totalAmount / orderCount).toFixed(2) : 0  // 客单价
            }
        });
    } catch (error) {
        console.error('获取转化率统计失败:', error);
        res.status(500).json({
            code: 500,
            message: '服务器错误'
        });
    }
});

module.exports = router; 