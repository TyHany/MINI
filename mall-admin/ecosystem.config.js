module.exports = {
  apps: [{
    name: 'mall-admin',
    script: 'app.js',
    instances: 2,  // 运行实例数量
    exec_mode: 'cluster',  // 运行模式
    env_production: {
      NODE_ENV: 'production'
    },
    // 日志配置
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: 'logs/error.log',
    out_file: 'logs/access.log',
    // 性能配置
    max_memory_restart: '1G',
    // 监控配置
    watch: false,
    // 优雅重启
    wait_ready: true,
    kill_timeout: 3000
  }]
} 