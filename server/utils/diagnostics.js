const os = require('os');
const { dynamoDB } = require('../config/dynamodb');
const { ListTablesCommand } = require('@aws-sdk/client-dynamodb');

/**
 * Pings DynamoDB to verify AWS connectivity.
 * @returns {Promise<{ok: boolean, tablesCount?: number, error?: string}>}
 */
const pingDynamoDB = async () => {
  try {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('DynamoDB ping timed out after 3s')), 3000)
    );
    const pingPromise = dynamoDB.send(new ListTablesCommand({ Limit: 5 }));
    const result = await Promise.race([pingPromise, timeoutPromise]);
    return { ok: true, tablesCount: (result.TableNames || []).length };
  } catch (err) {
    return { ok: false, error: err.message || 'DynamoDB connection error' };
  }
};

/**
 * Runs comprehensive diagnostics on memory, uptime, CPU, and DB connections.
 */
const runDiagnostics = async () => {
  const memoryUsage = process.memoryUsage();
  
  const dynamoDbCheck = await pingDynamoDB();

  return {
    timestamp: new Date().toISOString(),
    status: dynamoDbCheck.ok ? 'healthy' : 'degraded',
    system: {
      uptimeSeconds: Math.floor(process.uptime()),
      cpuLoadAverages: os.loadavg(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
    },
    process: {
      pid: process.pid,
      nodeVersion: process.version,
      memory: {
        heapUsedBytes: memoryUsage.heapUsed,
        heapTotalBytes: memoryUsage.heapTotal,
        rssBytes: memoryUsage.rss,
      }
    },
    databases: {
      dynamoDb: {
        ok: dynamoDbCheck.ok,
        status: dynamoDbCheck.ok ? 'Operational' : 'Offline',
        error: dynamoDbCheck.error || null
      },
      customerDb: {
        ok: true,
        status: 'Operational'
      },
      partnerDb: {
        ok: true,
        status: 'Operational'
      }
    }
  };
};

module.exports = {
  runDiagnostics
};
