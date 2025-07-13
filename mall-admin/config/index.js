const dotenv = require('dotenv')
const path = require('path')

// 输出当前环境变量值
console.log('当前 NODE_ENV:', process.env.NODE_ENV)
console.log('系统环境变量:', process.env)

// 设置默认环境
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development'
  console.log('未指定 NODE_ENV，使用默认环境：development')
}

// 加载环境变量
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development'
console.log('加载配置文件:', envFile)
dotenv.config({ path: path.join(__dirname, `../${envFile}`) })

// 根据环境加载配置
const env = process.env.NODE_ENV || 'development'
const config = require(`./config.${env}.js`)

module.exports = config