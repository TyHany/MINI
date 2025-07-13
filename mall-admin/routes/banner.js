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

// 获取轮播图列表
router.get('/list', auth, async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT * FROM banner ORDER BY sort DESC, id DESC'
        );
        res.json({
            code: 0,
            data: rows
        });
    } catch (error) {
        console.error('获取轮播图列表失败:', error);
        res.status(500).json({
            code: 500,
            message: '服务器错误'
        });
    }
});

// 新增轮播图
router.post('/add', auth, async (req, res) => {
    try {
        const { image_url, link_url, sort = 0, status = 1 } = req.body;
        const [result] = await db.execute(
            'INSERT INTO banner (image_url, link_url, sort, status) VALUES (?, ?, ?, ?)',
            [image_url, link_url, sort, status]
        );
        res.json({
            code: 0,
            message: '添加成功',
            data: { id: result.insertId }
        });
    } catch (error) {
        console.error('添加轮播图失败:', error);
        res.status(500).json({
            code: 500,
            message: '服务器错误'
        });
    }
});

// 更新轮播图
router.post('/update', auth, async (req, res) => {
    try {
        const { id, image_url, link_url, sort, status } = req.body;
        await db.execute(
            'UPDATE banner SET image_url = ?, link_url = ?, sort = ?, status = ? WHERE id = ?',
            [image_url, link_url, sort, status, id]
        );
        res.json({
            code: 0,
            message: '更新成功'
        });
    } catch (error) {
        console.error('更新轮播图失败:', error);
        res.status(500).json({
            code: 500,
            message: '服务器错误'
        });
    }
});

// 删除轮播图
router.post('/delete', auth, async (req, res) => {
    try {
        const { id } = req.body;
        await db.execute('DELETE FROM banner WHERE id = ?', [id]);
        res.json({
            code: 0,
            message: '删除成功'
        });
    } catch (error) {
        console.error('删除轮播图失败:', error);
        res.status(500).json({
            code: 500,
            message: '服务器错误'
        });
    }
});

// 修改轮播图状态
router.post('/status', auth, async (req, res) => {
    try {
        const { id, status } = req.body;
        await db.execute(
            'UPDATE banner SET status = ? WHERE id = ?',
            [status, id]
        );
        res.json({
            code: 0,
            message: '修改成功'
        });
    } catch (error) {
        console.error('修改轮播图状态失败:', error);
        res.status(500).json({
            code: 500,
            message: '服务器错误'
        });
    }
});

// 修改轮播图排序
router.post('/sort', auth, async (req, res) => {
    try {
        const { id, sort } = req.body;
        await db.execute(
            'UPDATE banner SET sort = ? WHERE id = ?',
            [sort, id]
        );
        res.json({
            code: 0,
            message: '修改成功'
        });
    } catch (error) {
        console.error('修改轮播图排序失败:', error);
        res.status(500).json({
            code: 500,
            message: '服务器错误'
        });
    }
});

// 上传轮播图
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
        console.error('上传轮播图失败:', error);
        res.status(500).json({
            code: 500,
            message: '服务器错误'
        });
    }
});

module.exports = router; 