const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const REGION = process.env.AWS_REGION || 'ap-south-1';

const dbClient = new DynamoDBClient({ region: REGION });
const dynamoDB = DynamoDBDocumentClient.from(dbClient);

function generateMockPhone() {
  const digits = Math.floor(100000000 + Math.random() * 900000000);
  return `+91 9${digits}`;
}

async function run() {
  try {
    // 1. Update Customers
    console.log(`Scanning table Users for users with missing phone numbers...`);
    const userScan = await dynamoDB.send(new ScanCommand({ TableName: 'Users' }));
    const users = userScan.Items || [];
    let updatedUsers = 0;
    for (const item of users) {
      if (!item.phone || item.phone.trim() === '') {
        const mockPhone = generateMockPhone();
        await dynamoDB.send(new UpdateCommand({
          TableName: 'Users',
          Key: { userId: item.userId },
          UpdateExpression: 'SET phone = :phone, updatedAt = :updatedAt',
          ExpressionAttributeValues: {
            ':phone': mockPhone,
            ':updatedAt': new Date().toISOString()
          }
        }));
        console.log(`Updated user ${item.email || item.userId} with mock phone: ${mockPhone}`);
        updatedUsers++;
      }
    }
    console.log(`✅ Successfully updated ${updatedUsers} users.`);

    // 2. Update Partners
    console.log(`Scanning table Partners for partners with missing phone numbers...`);
    const partnerScan = await dynamoDB.send(new ScanCommand({ TableName: 'Partners' }));
    const partners = partnerScan.Items || [];
    let updatedPartners = 0;
    for (const item of partners) {
      if (!item.phoneNumber || item.phoneNumber.trim() === '') {
        const mockPhone = generateMockPhone();
        await dynamoDB.send(new UpdateCommand({
          TableName: 'Partners',
          Key: { id: item.id },
          UpdateExpression: 'SET phoneNumber = :phone, updatedAt = :updatedAt',
          ExpressionAttributeValues: {
            ':phone': mockPhone,
            ':updatedAt': new Date().toISOString()
          }
        }));
        console.log(`Updated partner ${item.email || item.id} with mock phone: ${mockPhone}`);
        updatedPartners++;
      }
    }
    console.log(`✅ Successfully updated ${updatedPartners} partners.`);
  } catch (err) {
    console.error('Error populating mock phone numbers:', err.message);
  }
}

run();
