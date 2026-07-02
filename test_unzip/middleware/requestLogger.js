const logger = require('../utils/logger');

/**
 * Express middleware to trace and log incoming requests and responses.
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const { method, url, ip } = req;

  // Log incoming request arrival details
  logger.info(`Request Recieved: ${method} ${url}`, {
    category: 'API_REQUEST_INBOUND',
    method,
    url,
    ip,
    adminUser: req.admin?.username || 'unauthenticated',
    time: new Date().toISOString(),
  });

  // Log response completion details when the stream terminates
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { statusCode } = res;

    logger.info(`Request Completed: ${method} ${url} - Status: ${statusCode} - Latency: ${duration}ms`, {
      category: 'API_REQUEST_OUTBOUND',
      method,
      url,
      ip,
      statusCode,
      durationMs: duration,
      adminUser: req.admin?.username || 'unauthenticated',
      time: new Date().toISOString(),
    });
  });

  next();
};

module.exports = requestLogger;
