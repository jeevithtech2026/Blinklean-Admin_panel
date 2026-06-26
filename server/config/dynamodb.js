const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

const clientConfig = {
  region: process.env.AWS_REGION || 'ap-south-1',
};

// Only inject credentials if they are explicitly configured in the environment (e.g. during local testing)
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  clientConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
}

// Initialize the base DynamoDB client
const client = new DynamoDBClient(clientConfig);

// Wrap with the Document client for easier JS object marshalling
const dynamoDB = DynamoDBDocumentClient.from(client);

module.exports = { dynamoDB };

