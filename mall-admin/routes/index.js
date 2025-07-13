const express = require('express')
const router = express.Router()

// 引入管理员路由
const adminRouter = require('./admin')

// 健康检查
router.get('/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'API Server is healthy',
    timestamp: new Date().toISOString()
  })
})

// 注册管理员路由
router.use('/admin', adminRouter)

// 导出路由
module.exports = router 