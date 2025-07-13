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

// 获取分类列表
router.get('/list', auth, async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT * FROM category ORDER BY sort DESC, id DESC'
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
});

// 新增分类
router.post('/add', auth, async (req, res) => {
    try {
        const { name, image_url, sort = 0 } = req.body;
        const [result] = await db.execute(
            'INSERT INTO category (name, image_url, sort) VALUES (?, ?, ?)',
            [name, image_url, sort]
        );
        res.json({
            code: 0,
            message: '添加成功',
            data: { id: result.insertId }
        });
    } catch (error) {
        console.error('添加分类失败:', error);
        res.status(500).json({
            code: 500,
            message: '服务器错误'
        });
    }
});

// 更新分类
router.post('/update', auth, async (req, res) => {
    try {
        const { id, name, image_url, sort } = req.body;
        await db.execute(
            'UPDATE category SET name = ?, image_url = ?, sort = ? WHERE id = ?',
            [name, image_url, sort, id]
        );
        res.json({
            code: 0,
            message: '更新成功'
        });
    } catch (error) {
        console.error('更新分类失败:', error);
        res.status(500).json({
            code: 500,
            message: '服务器错误'
        });
    }
});

// 删除分类
router.post('/delete', auth, async (req, res) => {
    try {
        const { id } = req.body;
        // 检查分类下是否有商品
        const [rows] = await db.execute(
            'SELECT COUNT(*) as count FROM goods WHERE category_id = ?',
            [id]
        );

        if (rows[0].count > 0) {
            return res.json({
                code: 1,
                message: '该分类下有商品，不能删除'
            });
        }

        await db.execute('DELETE FROM category WHERE id = ?', [id]);
        res.json({
            code: 0,
            message: '删除成功'
        });
    } catch (error) {
        console.error('删除分类失败:', error);
        res.status(500).json({
            code: 500,
            message: '服务器错误'
        });
    }
});

// 修改分类排序
router.post('/sort', auth, async (req, res) => {
    try {
        const { id, sort } = req.body;
        await db.execute(
            'UPDATE category SET sort = ? WHERE id = ?',
            [sort, id]
        );
        res.json({
            code: 0,
            message: '修改成功'
        });
    } catch (error) {
        console.error('修改分类排序失败:', error);
        res.status(500).json({
            code: 500,
            message: '服务器错误'
        });
    }
});

// 上传分类图片
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
        console.error('上传分类图片失败:', error);
        res.status(500).json({
            code: 500,
            message: '服务器错误'
        });
    }
});

module.exports = router; 