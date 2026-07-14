const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { CognitoIdentityProviderClient, ListUsersCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const REGION = process.env.AWS_REGION || 'ap-south-1';
const USER_POOL_ID = 'ap-south-1_yS1VWRSJh'; // Partner App User Pool
const TABLE_NAME = 'Partners';

const cognitoClient = new CognitoIdentityProviderClient({ region: REGION });
const dbClient = new DynamoDBClient({ region: REGION });
const dynamoDB = DynamoDBDocumentClient.from(dbClient);

function generateMockPhone() {
  const digits = Math.floor(100000000 + Math.random() * 900000000);
  return `+91 9${digits}`;
}

async function syncPartners() {
  console.log(`Starting synchronization of partners from Cognito Pool [${USER_POOL_ID}] to DynamoDB Table [${TABLE_NAME}]...`);
  
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
        const attributes = {};
        if (user.Attributes) {
          user.Attributes.forEach(attr => {
            attributes[attr.Name] = attr.Value;
          });
        }

        const email = attributes.email || 'unknown@example.com';
        const name = attributes.name || email.split('@')[0] || user.Username;
        const phone = attributes.phone_number || generateMockPhone();
        const createdAt = user.UserCreateDate ? user.UserCreateDate.toISOString() : new Date().toISOString();
        const updatedAt = user.UserLastModifiedDate ? user.UserLastModifiedDate.toISOString() : new Date().toISOString();

        // Use UpdateCommand with if_not_exists to avoid overwriting existing partner progress
        await dynamoDB.send(new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { id: user.Username },
          UpdateExpression: 'SET email = :email, #name = :name, phoneNumber = if_not_exists(phoneNumber, :phone), #status = if_not_exists(#status, :status), kycStatus = if_not_exists(kycStatus, :kycStatus), createdAt = if_not_exists(createdAt, :createdAt), updatedAt = :updatedAt, isOnboardingComplete = if_not_exists(isOnboardingComplete, :isOnboardingComplete), skills = if_not_exists(skills, :skills), vehicleDetails = if_not_exists(vehicleDetails, :nullVal), photoUrl = if_not_exists(photoUrl, :nullVal)',
          ExpressionAttributeNames: {
            '#name': 'name',
            '#status': 'status'
          },
          ExpressionAttributeValues: {
            ':email': email,
            ':name': name,
            ':phone': phone,
            ':status': 'pending',
            ':kycStatus': 'pending',
            ':createdAt': createdAt,
            ':updatedAt': updatedAt,
            ':isOnboardingComplete': false,
            ':skills': [],
            ':nullVal': null
          }
        }));

        console.log(`Synced partner: ${email} (${user.Username})`);
        syncedCount++;
      }

      paginationToken = response.PaginationToken;
    } while (paginationToken);

    console.log(`\n✅ Synchronization complete! Successfully synced ${syncedCount} partners to DynamoDB.`);
  } catch (error) {
    console.error('❌ Error syncing partners:', error.message);
  }
}

syncPartners();
