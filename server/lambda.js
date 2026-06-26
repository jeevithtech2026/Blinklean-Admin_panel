const serverlessExpress = require('@vendia/serverless-express');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

let serverlessExpressInstance;

async function loadSecrets() {
  const secretId = process.env.DB_SECRETS_ARN;
  if (!secretId) {
    console.warn('[Lambda Init] DB_SECRETS_ARN is not defined in environment variables.');
    return;
  }

  const region = process.env.AWS_REGION || 'ap-south-1';
  console.log(`[Lambda Init] Fetching database connection credentials from Secrets Manager: "${secretId}" in region: ${region}`);

  try {
    const client = new SecretsManagerClient({ region });
    const response = await client.send(new GetSecretValueCommand({ SecretId: secretId }));
    
    if (response.SecretString) {
      const secrets = JSON.parse(response.SecretString);
      
      // Parse CUSTOMER_DB_URL
      if (secrets.CUSTOMER_DB_URL) {
        const customerDbUrl = new URL(secrets.CUSTOMER_DB_URL);
        process.env.CUSTOMER_DB_USER = customerDbUrl.username;
        process.env.CUSTOMER_DB_PASSWORD = customerDbUrl.password;
        process.env.CUSTOMER_DB_NAME = customerDbUrl.pathname.slice(1);
        process.env.CUSTOMER_DB_PORT = customerDbUrl.port || '5432';
        process.env.CUSTOMER_DB_HOST = customerDbUrl.hostname;
      }
      
      // Parse PARTNER_DB_URL
      if (secrets.PARTNER_DB_URL) {
        const partnerDbUrl = new URL(secrets.PARTNER_DB_URL);
        process.env.PARTNER_DB_USER = partnerDbUrl.username;
        process.env.PARTNER_DB_PASSWORD = partnerDbUrl.password;
        process.env.PARTNER_DB_NAME = partnerDbUrl.pathname.slice(1);
        process.env.PARTNER_DB_PORT = partnerDbUrl.port || '5432';
        process.env.PARTNER_DB_HOST = partnerDbUrl.hostname;
      }
      
      // Load JWT_SECRET
      if (secrets.JWT_SECRET) {
        process.env.JWT_SECRET = secrets.JWT_SECRET;
      }
      
      console.log('[Lambda Init] Database and JWT credentials successfully injected into environment.');
    }
  } catch (err) {
    console.error('[Lambda Init Error] Failed to fetch or parse secrets from Secrets Manager:', err.message);
  }
}

exports.handler = async (event, context) => {
  if (!serverlessExpressInstance) {
    await loadSecrets();
    // Require the Express app only after secrets have been injected into process.env
    const app = require('./index');
    serverlessExpressInstance = serverlessExpress({ app });
  }
  return serverlessExpressInstance(event, context);
};

