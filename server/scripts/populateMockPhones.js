const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const REGION = process.env.AWS_REGION || 'ap-south-1';

const dbClient = new DynamoDBClient({ region: REGION });
const dynamoDB = DynamoDBDocumentClient.from(dbClient);

const BENGALURU_LOCATIONS = [
  'Vijayanagar, Bengaluru',
  'Attiguppe, Bengaluru',
  'Hampinagar, Bengaluru',
  'Indiranagar, Bengaluru',
  'Koramangala, Bengaluru',
  'Jayanagar, Bengaluru',
  'Rajajinagar, Bengaluru',
  'Malleshwaram, Bengaluru',
  'BTM Layout, Bengaluru',
  'HSR Layout, Bengaluru',
  'Banashankari, Bengaluru',
  'Basavanagudi, Bengaluru',
  'Whitefield, Bengaluru',
  'Hebbal, Bengaluru',
  'Electronic City, Bengaluru',
  'Jalahalli, Bengaluru'
];

function getRandomLocation() {
  return BENGALURU_LOCATIONS[Math.floor(Math.random() * BENGALURU_LOCATIONS.length)];
}

function generateMockPhone() {
  const digits = Math.floor(100000000 + Math.random() * 900000000);
  return `+91 9${digits}`;
}

async function run() {
  try {
    // 1. Update Customers
    console.log(`Scanning table Users for users with missing phone numbers or locations...`);
    const userScan = await dynamoDB.send(new ScanCommand({ TableName: 'Users' }));
    const users = userScan.Items || [];
    let updatedUsers = 0;
    
    for (const item of users) {
      const hasPhone = item.phone && item.phone.trim() !== '';
      const hasLocation = (item.city && item.city.trim() !== '') || (item.address && item.address.trim() !== '');
      
      if (!hasPhone || !hasLocation) {
        const mockPhone = hasPhone ? item.phone : generateMockPhone();
        const mockLoc = hasLocation ? (item.city || item.address) : getRandomLocation();
        
        await dynamoDB.send(new UpdateCommand({
          TableName: 'Users',
          Key: { userId: item.userId },
          UpdateExpression: 'SET phone = :phone, city = :city, address = :address, updatedAt = :updatedAt',
          ExpressionAttributeValues: {
            ':phone': mockPhone,
            ':city': mockLoc,
            ':address': mockLoc,
            ':updatedAt': new Date().toISOString()
          }
        }));
        console.log(`Updated user ${item.email || item.userId} with phone: ${mockPhone}, location: ${mockLoc}`);
        updatedUsers++;
      }
    }
    console.log(`✅ Successfully updated ${updatedUsers} users.`);

    // 2. Update Partners
    console.log(`Scanning table Partners for partners with missing phone numbers or locations...`);
    const partnerScan = await dynamoDB.send(new ScanCommand({ TableName: 'Partners' }));
    const partners = partnerScan.Items || [];
    let updatedPartners = 0;
    
    for (const item of partners) {
      const hasPhone = item.phoneNumber && item.phoneNumber.trim() !== '';
      const hasLocation = (item.city && item.city.trim() !== '');
      
      if (!hasPhone || !hasLocation) {
        const mockPhone = hasPhone ? item.phoneNumber : generateMockPhone();
        const mockLoc = hasLocation ? item.city : getRandomLocation().split(',')[0]; // Just city name for partner
        
        await dynamoDB.send(new UpdateCommand({
          TableName: 'Partners',
          Key: { id: item.id },
          UpdateExpression: 'SET phoneNumber = :phone, city = :city, updatedAt = :updatedAt',
          ExpressionAttributeValues: {
            ':phone': mockPhone,
            ':city': mockLoc,
            ':updatedAt': new Date().toISOString()
          }
        }));
        console.log(`Updated partner ${item.email || item.id} with phone: ${mockPhone}, location: ${mockLoc}`);
        updatedPartners++;
      }
    }
    console.log(`✅ Successfully updated ${updatedPartners} partners.`);
  } catch (err) {
    console.error('Error populating mock phone numbers and locations:', err.message);
  }
}

run();
