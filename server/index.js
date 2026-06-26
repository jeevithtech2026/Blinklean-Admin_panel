require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authMiddleware = require('./middleware/auth');
const requestLogger = require('./middleware/requestLogger');
const adminRoutes = require('./routes/admin');
const healthRoutes = require('./routes/health');
const dataRoutes = require('./routes/data');

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Cross-Origin Resource Sharing (CORS) setup
app.use(cors({
  origin: '*', // Permit requests from any administrative origin host
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 2. Request body parsing interceptors
app.use(express.json());

// 3. Mount audit request logging at the top of the middleware stack
app.use(requestLogger);

// 4. Mount public diagnostics routing (ALB / Bot health checking) BEFORE authMiddleware
app.use(healthRoutes);

// 5. Secure admin routing setup - Protected via JWT verification middleware
app.use('/api/v1/admin', authMiddleware, adminRoutes);

// DynamoDB data routes - all 8 tables accessible via /api/v1/data/*
app.use('/api/v1/data', dataRoutes);

// 6. Basic service health validation endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'BlinkLean Admin Aggregation Middleware Server'
  });
});

// 7. Conditionally execute listener only when running locally (Not in AWS Lambda environment)
if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
  app.listen(PORT, () => {
    console.log(`[Server Running] BlinkLean Admin Aggregation Service listening on port ${PORT}`);
    console.log(`[Server Routes] Administrative endpoints mounted at: http://localhost:${PORT}/api/v1/admin/*`);
    console.log(`[Server Routes] Public health checks endpoint mounted at: http://localhost:${PORT}/health`);
  });
}

module.exports = app;
