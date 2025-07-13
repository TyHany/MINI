const baseConfig = require('./config.base');

module.exports = {
  ...baseConfig,
  env: 'production',
  logger: {
    ...baseConfig.logger,
    level: 'debug',
    format: 'combined'
  }
}; 