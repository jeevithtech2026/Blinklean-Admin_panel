const os = require('os');
const { customerPool, partnerPool } = require('../config/db');

/**
 * Pings a database connection pool to verify connectivity.
 * @param {Pool} pool - PG database connection pool instance.
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
const pingPool = async (pool) => {
  if (!pool) {
    return { ok: false, error: 'Database pool is null or uninitialized' };
  }
  
  let client;
  try {
    // Acquire a client from the pool with a timeout safety margin
    client = await pool.connect();
    await client.query('SELECT 1');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message || 'Connection timed out' };
  } finally {
    if (client) {
      client.release(); // release client back to pool
    }
  }
};

/**
 * Runs comprehensive diagnostics on memory, uptime, CPU, and DB connections.
 */
const runDiagnostics = async () => {
  const memoryUsage = process.memoryUsage();
  
  // Perform dynamic database connectivity ping validation tests
  const [customerDbCheck, partnerDbCheck] = await Promise.all([
    pingPool(customerPool),
    pingPool(partnerPool)
  ]);

  return {
    timestamp: new Date().toISOString(),
    system: {
      uptimeSeconds: Math.floor(process.uptime()),
      cpuLoadAverages: os.loadavg(), // 1, 5, and 15 min load averages
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
      customerDb: {
        ok: customerDbCheck.ok,
        status: customerDbCheck.ok ? 'Operational' : 'Offline',
        error: customerDbCheck.error || null
      },
      partnerDb: {
        ok: partnerDbCheck.ok,
        status: partnerDbCheck.ok ? 'Operational' : 'Offline',
        error: partnerDbCheck.error || null
      }
    }
  };
};

module.exports = {
  runDiagnostics
};
