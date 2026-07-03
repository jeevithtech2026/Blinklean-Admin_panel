const winston = require('winston');
const path = require('path');
const fs = require('fs');

const isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;

// Ensure the logs directory exists (only if not running in AWS Lambda)
let logsDir = null;
if (!isLambda) {
  logsDir = path.join(__dirname, '..', 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
}

// Custom format optimized for console readability in development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `[${timestamp}] ${level}: ${message} ${metaString}`;
  })
);

// Standard JSON format for structured production file logging
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }), // Automatically append error stack traces
  winston.format.json()
);

const transports = [
  // 1. Console transport for development debugging & CloudWatch logs capturing
  new winston.transports.Console({
    format: consoleFormat,
  }),
];

// 2. Add File transport capturing JSON outputs for production auditing only if not in Lambda
if (!isLambda && logsDir) {
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'admin-audit.log'),
      format: fileFormat,
      maxsize: 10 * 1024 * 1024, // 10MB per log file rotating limits
      maxFiles: 5, // Keep up to 5 archive files
    })
  );
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports,
});

module.exports = logger;
