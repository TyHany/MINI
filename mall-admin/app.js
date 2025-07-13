const config = require('./config')
const express = require('express')
const { Sequelize } = require('sequelize')
const multer = require('multer')
const winston = require('winston')
const path = require('path')
const fs = require('fs-extra')
const session = require('express-session')
const app = express()

// 使用配置
app.set('port', config.app.port)

// 添加日志记录中间件
app.use((req, res, next) => {
  console.log('=== 请求日志 ===')
  console.log('时间:', new Date().toISOString())
  console.log('方法:', req.method)
  console.log('路径:', req.path)
  console.log('Session ID:', req.sessionID)
  console.log('Session 数据:', req.session)
  console.log('===============')
  next()
})

// 创建 sessions 目录
const sessionsDir = path.join(__dirname, 'sessions')
fs.ensureDirSync(sessionsDir)

// 自定义 session 存储
const sessionStore = new session.MemoryStore()

// 定期保存 session 到文件
setInterval(() => {
  const sessionFile = path.join(sessionsDir, 'sessions.json')
  fs.writeJsonSync(sessionFile, sessionStore.sessions, { spaces: 2 })
  console.log('Sessions saved to file:', new Date().toISOString())
}, 5 * 60 * 1000) // 每5分钟保存一次

// 启动时加载已保存的 session
try {
  const sessionFile = path.join(sessionsDir, 'sessions.json')
  if (fs.existsSync(sessionFile)) {
    const savedSessions = fs.readJsonSync(sessionFile)
    sessionStore.sessions = savedSessions
    console.log('Sessions loaded from file')
  }
} catch (error) {
  console.error('Error loading sessions:', error)
}

// Session配置
app.use(session({
  secret: config.jwt.secret,
  resave: false,
  saveUninitialized: false,
  name: 'mall.sid',
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
    sameSite: 'lax'
  },
  rolling: true,
  store: sessionStore
}))

// 记录session状态的中间件
app.use((req, res, next) => {
  const oldEnd = res.end
  res.end = function() {
    console.log('=== 响应日志 ===')
    console.log('Session 状态:', req.session)
    console.log('Cookies:', req.cookies)
    console.log('Set-Cookie:', res.getHeader('set-cookie'))
    console.log('===============')
    oldEnd.apply(res, arguments)
  }
  next()
})

// 添加安全相关的中间件
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
})

// 数据库配置
const sequelize = new Sequelize(config.database)

// 创建上传目录
const uploadDir = config.upload.dir || path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
})

const upload = multer({ storage: storage })

// 日志配置
const logger = winston.createLogger({
  level: config.logger.level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
})

// 如果不是生产环境，也将日志输出到控制台
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }))
}

// 中间件配置
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// 基础路由
app.get('/', (req, res) => {
  // 检查是否已登录
  if (req.session && req.session.adminId) {
    res.sendFile(path.join(__dirname, 'public/index.html'))
  } else {
    res.redirect('/login.html')
  }
})

// API 路由
app.use('/api', require('./routes'))

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'API Not Found'
  })
})

// 错误处理
app.use((err, req, res, next) => {
  logger.error(err.stack)
  res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  })
})

app.listen(config.app.port, () => {
  console.log('=================================')
  console.log(`运行环境: ${process.env.NODE_ENV}`)
  console.log(`服务端口: ${config.app.port}`)
  console.log('数据库配置:')
  console.log(`  - 数据库名: ${config.database.database}`)
  console.log(`  - 主机: ${config.database.host}`)
  console.log(`  - 端口: ${config.database.port}`)
  console.log(`  - 用户名: ${config.database.username}`)
  console.log(`  - 密码: ${'*'.repeat(config.database.password.length)}`)
  console.log(`文件存储: ${config.upload.provider}`)
  console.log('=================================')
}) 