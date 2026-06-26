const serverlessExpress = require('@vendia/serverless-express');
const app = require('./index');

// Wraps the Node.js/Express app instance using the Serverless Express adapter handler
exports.handler = serverlessExpress({ app });
