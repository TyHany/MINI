const express = require('express');
const router = express.Router();
const md5 = require('md5');
const db = require('../config/database');
const auth = require('../middleware/auth');
const bannerRouter = require('./banner');
const categoryRouter = require('./category');
const goodsRouter = require('./goods');
const orderRouter = require('./order');
const statsRouter = require('./stats');

// 管理员登录
router.post('/login', async (req, res) => {
    console.log('=== 登录请求 ===')
    console.log('用户名:', req.body.username)
    console.log('Session ID:', req.sessionID)
    
    try {
        const { username, password } = req.body;
        
        // 查询管理员用户
        const [rows] = await db.execute(
            'SELECT * FROM admin_user WHERE username = ? AND password = ? AND status = 1',
            [username, md5(password)]
        );

        console.log('查询结果:', rows)

        if (rows.length > 0) {
            // 登录成功,保存用户信息到session
            req.session.adminId = rows[0].id;
            req.session.adminName = rows[0].username;
            
            console.log('设置 Session 数据:', req.session)
            
            // 确保session保存成功
            req.session.save((err) => {
                if (err) {
                    console.error('Session 保存错误:', err);
                    return res.status(500).json({
                        code: 500,
                        message: '登录失败，请重试'
                    });
                }
                
                console.log('Session 保存成功')
                res.json({
                    code: 0,
                    message: '登录成功',
                    data: {
                        id: rows[0].id,
                        username: rows[0].username
                    }
                });
            });
        } else {
            console.log('登录失败: 用户名或密码错误')
            res.json({
                code: 1,
                message: '用户名或密码错误'
            });
        }
    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({
            code: 500,
            message: '服务器错误'
        });
    }
});

// 检查登录状态
router.get('/check-login', (req, res) => {
    console.log('=== 检查登录状态 ===')
    console.log('Session ID:', req.sessionID)
    console.log('Session 数据:', req.session)
    
    if (req.session && req.session.adminId) {
        console.log('已登录')
        res.json({
            code: 0,
            data: {
                isLoggedIn: true,
                adminId: req.session.adminId,
                adminName: req.session.adminName
            }
        });
    } else {
        console.log('未登录')
        res.json({
            code: 0,
            data: {
                isLoggedIn: false
            }
        });
    }
});

// 获取当前登录管理员信息
router.get('/info', auth, async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT id, username, create_time FROM admin_user WHERE id = ?',
            [req.session.adminId]
        );

        if (rows.length > 0) {
            res.json({
                code: 0,
                data: rows[0]
            });
        } else {
            res.status(401).json({
                code: 401,
                message: '未登录或登录已过期'
            });
        }
    } catch (error) {
        console.error('获取管理员信息错误:', error);
        res.status(500).json({
            code: 500,
            message: '服务器错误'
        });
    }
});

// 退出登录
router.post('/logout', auth, (req, res) => {
    req.session.destroy();
    res.json({
        code: 0,
        message: '退出成功'
    });
});

// 注册轮播图路由
router.use('/banner', bannerRouter);

// 注册分类路由
router.use('/category', categoryRouter);

// 注册商品路由
router.use('/goods', goodsRouter);

// 注册订单路由
router.use('/order', orderRouter);

// 注册统计路由
router.use('/stats', statsRouter);

module.exports = router; 