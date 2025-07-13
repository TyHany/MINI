### 切换环境变量
# 设置环境变量
# 开发环境
$env:NODE_ENV="development"
# 生产环境
$env:NODE_ENV="production"
# 验证环境变量
echo $env:NODE_ENV


### 会话日期: 2024-03-21

#### 主要目的
- 实现多环境配置文件管理系统
- 实现生产环境部署配置
- 修复生产环境构建问题

#### 完成的任务
- 创建了配置文件结构
- 实现了开发环境和生产环境的配置分离
- 建立了环境变量管理机制
- 实现了配置文件的继承和覆盖机制
- 添加了基础路由和错误处理
- 创建生产环境配置文件
- 配置PM2进程管理
- 实现构建脚本
- 配置Nginx反向代理
- 完善部署流程文档
- 添加 fs-extra 依赖
- 创建 PM2 配置文件
- 完善构建脚本

#### API 路由
- GET / - 服务器状态
- GET /api/v1/health - 健康检查
- GET /uploads/* - 静态文件访问
- POST /api/admin/login - 管理员登录
- GET /api/admin/info - 获取管理员信息
- POST /api/admin/logout - 退出登录

#### 环境启动说明
1. 安装依赖
```bash
npm install
```
  
2. 启动命令
```bash
# 开发环境
npm run dev    # 开发环境（支持热重载）

# 生产环境
npm run prod    # 生产环境

# 默认环境（development）
npm start
```

#### 关键决策和解决方案
- 使用PM2做进程管理和负载均衡
- 使用Nginx做反向代理和静态资源服务
- 实现了优雅重启机制
- 配置了安全相关的HTTP头
- 使用 fs-extra 替代原生 fs 模块，提供更多文件操作功能
- 配置 PM2 集群模式运行，提高系统可用性

#### 使用的技术栈
- Node.js
- PM2
- Nginx
- Shell Script
- fs-extra

#### 修改/新增的文件
- .env.production (新增)
- ecosystem.config.js (新增)
- scripts/build.js (新增)
- package.json (更新)
- nginx.conf (新增)
- README.md (更新)