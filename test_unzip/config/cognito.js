const { CognitoIdentityProviderClient } = require('@aws-sdk/client-cognito-identity-provider');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const clientConfig = {
  region: process.env.AWS_REGION || 'ap-south-1',
};

let userPoolId = process.env.COGNITO_USER_POOL_ID;
let clientId = process.env.COGNITO_CLIENT_ID;
let clientSecret = process.env.COGNITO_CLIENT_SECRET;

// Parse server/.env file directly if it exists to override defaults
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  try {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    if (envConfig.COGNITO_USER_POOL_ID) {
      userPoolId = envConfig.COGNITO_USER_POOL_ID;
    }
    if (envConfig.COGNITO_CLIENT_ID) {
      clientId = envConfig.COGNITO_CLIENT_ID;
    }
    if (envConfig.COGNITO_CLIENT_SECRET) {
      clientSecret = envConfig.COGNITO_CLIENT_SECRET;
    }
    if (envConfig.AWS_ACCESS_KEY_ID && envConfig.AWS_SECRET_ACCESS_KEY) {
      clientConfig.credentials = {
        accessKeyId: envConfig.AWS_ACCESS_KEY_ID,
        secretAccessKey: envConfig.AWS_SECRET_ACCESS_KEY,
      };
    }
  } catch (err) {
    console.error('[Cognito Config] Failed to parse local .env file:', err.message);
  }
}

// Fallback to process.env for credentials if needed
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

const cognitoClient = new CognitoIdentityProviderClient(clientConfig);

module.exports = {
  cognitoClient,
  COGNITO_USER_POOL_ID: userPoolId,
  COGNITO_CLIENT_ID: clientId,
  COGNITO_CLIENT_SECRET: clientSecret,
};
