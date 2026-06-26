const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { CognitoIdentityProviderClient, ListUsersCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

// Configuration
const REGION = process.env.AWS_REGION || 'ap-south-1';
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || 'ap-south-1_cND29vJXJ';
const TABLE_NAME = 'Users';

// Initialize AWS Clients
const cognitoClient = new CognitoIdentityProviderClient({ region: REGION });
const dbClient = new DynamoDBClient({ region: REGION });
const dynamoDB = DynamoDBDocumentClient.from(dbClient);

async function syncUsers() {
  console.log(`Starting synchronization of users from Cognito Pool [${USER_POOL_ID}] to DynamoDB Table [${TABLE_NAME}]...`);
  
  let paginationToken = undefined;
  let syncedCount = 0;

  try {
    do {
      const command = new ListUsersCommand({
        UserPoolId: USER_POOL_ID,
        PaginationToken: paginationToken,
      });

      const response = await cognitoClient.send(command);
      const users = response.Users || [];

      for (const user of users) {
        // Extract attributes (email, name, phone_number, etc.)
        const attributes = {};
        if (user.Attributes) {
          user.Attributes.forEach(attr => {
            attributes[attr.Name] = attr.Value;
          });
        }

        // Map Cognito User to DynamoDB User Schema
        const dynamoItem = {
          userId: user.Username, // The unique sub/username from Cognito
          email: attributes.email || 'unknown@example.com',
          name: attributes.name || attributes.email || user.Username,
          phone: attributes.phone_number || '',
          emailVerified: attributes.email_verified === 'true',
          status: user.UserStatus,
          createdAt: user.UserCreateDate ? user.UserCreateDate.toISOString() : new Date().toISOString(),
          lastLogin: user.UserLastModifiedDate ? user.UserLastModifiedDate.toISOString() : null,
          source: 'cognito_sync'
        };

        // Write to DynamoDB
        await dynamoDB.send(new PutCommand({
          TableName: TABLE_NAME,
          Item: dynamoItem
        }));

        console.log(`Synced user: ${dynamoItem.email} (${dynamoItem.userId})`);
        syncedCount++;
      }

      paginationToken = response.PaginationToken;
    } while (paginationToken);

    console.log(`\n✅ Synchronization complete! Successfully synced ${syncedCount} users to DynamoDB.`);
  } catch (error) {
    console.error('❌ Error syncing users:', error.message);
    if (error.name === 'CredentialsProviderError') {
      console.error('Please ensure your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are correctly set in the server/.env file.');
    }
  }
}

syncUsers();
