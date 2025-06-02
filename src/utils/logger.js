// src/utils/logger.js
const chalk = require('chalk');

const logger = {
    info: (message, data) => console.log(chalk.green(`[INFO] ${new Date().toISOString()} ${message}`), data ? data : ''),
    warn: (message, data) => console.warn(chalk.yellow(`[WARN] ${new Date().toISOString()} ${message}`), data ? data : ''),
    error: (message, error) => console.error(chalk.red(`[ERROR] ${new Date().toISOString()} ${message}`), error ? error : ''),
    debug: (message, data) => process.env.NODE_ENV !== 'production' && console.log(chalk.blue(`[DEBUG] ${new Date().toISOString()} ${message}`), data ? data : ''),
    critical: (message, error) => console.error(chalk.bgRed.white(`[CRITICAL] ${new Date().toISOString()} ${message}`), error ? error : '') // Lỗi cực kỳ nghiêm trọng
};

module.exports = logger;
