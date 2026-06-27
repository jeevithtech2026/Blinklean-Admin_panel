const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const clientConfig = {
  region: process.env.AWS_REGION || 'ap-south-1',
};

// Check if we have a local .env file in the server directory
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  try {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    if (envConfig.AWS_ACCESS_KEY_ID && envConfig.AWS_SECRET_ACCESS_KEY) {
      clientConfig.credentials = {
        accessKeyId: envConfig.AWS_ACCESS_KEY_ID,
        secretAccessKey: envConfig.AWS_SECRET_ACCESS_KEY,
      };
      console.log('[DynamoDB Config] Injected credentials directly from server/.env file');
    }
  } catch (err) {
    console.error('[DynamoDB Config] Failed to parse local .env file:', err.message);
  }
}

// Fallback to process.env (e.g. if running locally without server/.env or using IAM role)
if (!clientConfig.credentials && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  const credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
  if (process.env.AWS_SESSION_TOKEN) {
    credentials.sessionToken = process.env.AWS_SESSION_TOKEN;
  }
  clientConfig.credentials = credentials;
}

// Initialize the base DynamoDB client
const client = new DynamoDBClient(clientConfig);

// Wrap with the Document client for easier JS object marshalling
const dynamoDB = DynamoDBDocumentClient.from(client);

module.exports = { dynamoDB };

