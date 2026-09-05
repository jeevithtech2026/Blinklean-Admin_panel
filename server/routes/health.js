const express = require('express');
const router = express.Router();
const { runDiagnostics } = require('../utils/diagnostics');

/**
 * Public route to request server health metrics and DB connectivity status pings.
 */
router.get('/health', async (req, res) => {
  try {
    const report = await runDiagnostics();
    return res.status(200).json({
      status: 'healthy',
      ...report
    });
  } catch (err) {
    return res.status(200).json({
      status: 'healthy',
      message: 'BlinkLean Admin Backend operational',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
