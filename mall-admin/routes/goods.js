const express = require('express');
const router = express.Router();
const db = require('../config/database');
const config = require('../config');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// 配置文件上传
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads'))
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname))
    }
});
const upload = multer({ storage: storage });

// 获取商品列表
router.get('/list', auth, async (req, res) => {
    try {
        let { page = 1, pageSize = 10, name = '', categoryId = '' } = req.query;

        // 确保分页参数是数字
        page = parseInt(page, 10);
        pageSize = parseInt(pageSize, 10);

        const offset = (page - 1) * pageSize;

        // 构建查询条件
        let where = 'WHERE 1=1';
        const params = [];
        if (name) {
            where += ' AND g.name LIKE ?';
            params.push(`%${name}%`);
        }
        if (categoryId) {
            where += ' AND g.category_id = ?';
            params.push(categoryId);
        }

        // 查询总数
        const [countRows] = await db.execute(`
            SELECT COUNT(*) as total 
            FROM goods g 
            ${where}
        `, params);

        // 查询列表数据
        const [rows] = await db.execute(`
            SELECT 
                g.id,
                g.name,
                g.category_id,
                g.price,
                g.stock,
                g.image_url,
                g.\`status\`,
                g.is_recommend,
                g.create_time,
                g.update_time,
                c.name as category_name
            FROM goods g
            LEFT JOIN category c ON g.category_id = c.id
            ${where}
            ORDER BY g.id DESC
            LIMIT ?, ?
        `, [...params, offset, pageSize]);

        res.json({
            code: 0,
            data: {
                list: rows,
                total: countRows[0].total,
                page: page,
                pageSize: pageSize
            }
        });
    } catch (error) {
        console.error('获取商品列表失败:', error);
        res.status(500).json({
            code: 500,
            message: '服务器错误'
        });
    }
});

// 上传商品图片
router.post('/upload-image', auth, upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.json({
                code: 1,
                message: '请选择要上传的图片'
            });
        }
        const url = `${config.app.baseUrl}/uploads/${req.file.filename}`;
        res.json({
            code: 0,
            message: '上传成功',
            data: { url }
        });
    } catch (error) {
        console.error('上传商品图片失败:', error);
        res.status(500).json({
            code: 500,
            message: '服务器错误'
        });
    }
});

// 新增商品
router.post('/add', auth, async (req, res) => {
    try {
        // 打印接口调用信息
        console.log('\n-------------------------------------------------------------');
        console.log('接口名：新增商品');
        console.log('接口地址：/api/admin/goods/add');
        console.log('请求头：', {
            'Content-Type': req.headers['content-type'],
            'Authorization': req.headers['authorization']
        });
        console.log('请求参数：', req.body);

        const { category_id, name, price, stock, image_url, detail, status = 1, is_recommend = 0 } = req.body;
        const [result] = await db.execute(
            'INSERT INTO goods (category_id, name, price, stock, image_url, detail, `status`, is_recommend) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [category_id, name, price, stock, image_url, detail, status, is_recommend]
        );

        const responseResult = {
            code: 0,
            message: '添加成功',
            data: { id: result.insertId }
        };

        console.log('返回结果：', responseResult);
        console.log('-------------------------------------------------------------\n');

        res.json(responseResult);
    } catch (error) {
        console.error('添加商品失败:', error);
        const errResult = {
            code: 500,
            message: '服务器错误'
        };
        console.log('返回结果：', errResult);
        console.log('-------------------------------------------------------------\n');
        res.status(500).json(errResult);
    }
});

// 更新商品
router.post('/update', auth, async (req, res) => {
    try {
        // 打印接口调用信息
        console.log('\n-------------------------------------------------------------');
        console.log('接口名：更新商品');
        console.log('接口地址：/api/admin/goods/update');
        console.log('请求头：', {
            'Content-Type': req.headers['content-type'],
            'Authorization': req.headers['authorization']
        });
        console.log('请求参数：', req.body);

        const { id, category_id, name, price, stock, image_url, detail, status, is_recommend } = req.body;
        await db.execute(
            'UPDATE goods SET category_id = ?, name = ?, price = ?, stock = ?, image_url = ?, detail = ?, `status` = ?, is_recommend = ? WHERE id = ?',
            [category_id, name, price, stock, image_url, detail, status, is_recommend, id]
        );

        const result = {
            code: 0,
            message: '更新成功'
        };

        console.log('返回结果：', result);
        console.log('-------------------------------------------------------------\n');

        res.json(result);
    } catch (error) {
        console.error('更新商品失败:', error);
        const errResult = {
            code: 500,
            message: '服务器错误'
        };
        console.log('返回结果：', errResult);
        console.log('-------------------------------------------------------------\n');
        res.status(500).json(errResult);
    }
});

// 删除商品
router.post('/delete', auth, async (req, res) => {
    try {
        const { id } = req.body;

        // 检查商品是否可以删除(是否有相关订单)
        const [rows] = await db.execute(`
            SELECT COUNT(*) as count 
            FROM order_goods 
            WHERE goods_id = ?
        `, [id]);

        if (rows[0].count > 0) {
            return res.json({
                code: 1,
                message: '该商品已有订单记录,不能删除'
            });
        }

        await db.execute('DELETE FROM goods WHERE id = ?', [id]);
        res.json({
            code: 0,
            message: '删除成功'
        });
    } catch (error) {
        console.error('删除商品失败:', error);
        res.status(500).json({
            code: 500,
            message: '服务器错误'
        });
    }
});

// 修改商品状态(上下架)
router.post('/status', auth, async (req, res) => {
    try {
        const { id, status } = req.body;
        await db.execute(
            'UPDATE goods SET `status` = ? WHERE id = ?',
            [status, id]
        );
        res.json({
            code: 0,
            message: '修改成功'
        });
    } catch (error) {
        console.error('修改商品状态失败:', error);
        res.status(500).json({
            code: 500,
            message: '服务器错误'
        });
    }
});

// 修改商品推荐状态
router.post('/recommend', auth, async (req, res) => {
    try {
        // 打印接口调用信息
        console.log('\n-------------------------------------------------------------');
        console.log('接口名：修改商品推荐状态');
        console.log('接口地址：/api/admin/goods/recommend');
        console.log('请求头：', {
            'Content-Type': req.headers['content-type'],
            'Authorization': req.headers['authorization']
        });
        console.log('请求参数：', req.body);

        const { id, is_recommend } = req.body;
        await db.execute(
            'UPDATE goods SET is_recommend = ? WHERE id = ?',
            [is_recommend, id]
        );

        const result = {
            code: 0,
            message: '修改成功'
        };

        console.log('返回结果：', result);
        console.log('-------------------------------------------------------------\n');

        res.json(result);
    } catch (error) {
        console.error('修改商品推荐状态失败:', error);
        const errResult = {
            code: 500,
            message: '服务器错误'
        };
        console.log('返回结果：', errResult);
        console.log('-------------------------------------------------------------\n');
        res.status(500).json(errResult);
    }
});

// 批量修改商品状态
router.post('/batch-status', auth, async (req, res) => {
    try {
        const { ids, status } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.json({
                code: 1,
                message: '请选择要操作的商品'
            });
        }

        // 将数组转换为逗号分隔的字符串
        const idStr = ids.join(',');

        await db.execute(
            `UPDATE goods SET status = ? WHERE id IN (${idStr})`,
            [status]
        );
        res.json({
            code: 0,
            message: '修改成功'
        });
    } catch (error) {
        console.error('批量修改商品状态失败:', error);
        res.status(500).json({
            code: 500,
            message: '服务器错误'
        });
    }
});

module.exports = router; 