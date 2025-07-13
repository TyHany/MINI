const fs = require('fs-extra')
const path = require('path')

// 清理构建目录
fs.emptyDirSync(path.join(__dirname, '../dist'))

// 复制必要文件到dist目录
fs.copySync(path.join(__dirname, '../public'), path.join(__dirname, '../dist/public'))
fs.copySync(path.join(__dirname, '../views'), path.join(__dirname, '../dist/views'))

// 复制配置文件
fs.copySync(path.join(__dirname, '../config'), path.join(__dirname, '../dist/config'))

// 复制环境变量文件
fs.copyFileSync(
  path.join(__dirname, '../.env.production'),
  path.join(__dirname, '../dist/.env.production')
)

// 复制主程序文件
fs.copyFileSync(
  path.join(__dirname, '../app.js'),
  path.join(__dirname, '../dist/app.js')
)

// 复制PM2配置
fs.copyFileSync(
  path.join(__dirname, '../ecosystem.config.js'),
  path.join(__dirname, '../dist/ecosystem.config.js')
)

// 复制package文件
fs.copyFileSync(
  path.join(__dirname, '../package.json'),
  path.join(__dirname, '../dist/package.json')
)

console.log('Build completed!') 