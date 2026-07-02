const express = require('express');
const router = express.Router();
const { runDiagnostics } = require('../utils/diagnostics');

/**
 * Public route to request server health metrics and DB connectivity status pings.
 */
router.get('/health', async (req, res) => {
  try {
    const report = await runDiagnostics();
    
    // Determine overall database cluster health state
    const databasesHealthy = report.databases.customerDb.ok && report.databases.partnerDb.ok;

    if (databasesHealthy) {
      console.log('[Health Endpoint] GET /health - Status: 200 (System and DB pools operational)');
      return res.status(200).json({
        status: 'healthy',
        ...report
      });
    } else {
      console.warn('[Health Endpoint Warning] GET /health - Status: 503 (Downstream database connection failure)');
      return res.status(503).json({
        status: 'unhealthy',
        error: 'Downstream microservice database layer timed out or refused connection.',
        ...report
      });
    }
  } catch (err) {
    console.error('[Health Endpoint Error] Uncaught error during diagnostics:', err.message);
    return res.status(500).json({
      status: 'error',
      message: err.message || 'Internal diagnostics execution failure'
    });
  }
});

module.exports = router;
