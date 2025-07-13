const baseConfig = require('./config.base');

module.exports = {
  ...baseConfig,
  env: 'development',
  logger: {
    ...baseConfig.logger,
    level: 'debug',
    format: 'dev'
  }
}; 