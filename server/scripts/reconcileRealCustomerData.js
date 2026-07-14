const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const REGION = process.env.AWS_REGION || 'ap-south-1';

const dbClient = new DynamoDBClient({ region: REGION });
const dynamoDB = DynamoDBDocumentClient.from(dbClient);

async function run() {
  try {
    // 1. Scan Bookings
    console.log('Scanning table bookings...');
    const bookingsScan = await dynamoDB.send(new ScanCommand({ TableName: 'bookings' }));
    const bookings = bookingsScan.Items || [];
    console.log(`Found ${bookings.length} bookings.`);

    // 2. Scan Users
    console.log('Scanning table Users...');
    const usersScan = await dynamoDB.send(new ScanCommand({ TableName: 'Users' }));
    const users = usersScan.Items || [];
    console.log(`Found ${users.length} users.`);

    // Map users by userId and normalized name
    const usersById = new Map();
    const usersByName = new Map();
    for (const u of users) {
      if (u.userId) {
        usersById.set(u.userId, u);
      }
      if (u.name) {
        usersByName.set(u.name.toLowerCase().trim(), u);
      }
    }

    // Process bookings to extract latest info for each user
    const updates = new Map(); // userId -> { phone, address, city, name }

    // Sort bookings by createdAt ascending so the latest booking overwrites earlier ones
    bookings.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));

    for (const b of bookings) {
      let matchedUser = null;
      if (b.userId && b.userId !== 'guest') {
        matchedUser = usersById.get(b.userId);
      }
      if (!matchedUser && b.customerName) {
        matchedUser = usersByName.get(b.customerName.toLowerCase().trim());
      }

      if (matchedUser) {
        const phone = b.customerPhone || b.phone;
        const address = b.address || b.city;
        const city = b.city || b.address;

        if (phone || address) {
          updates.set(matchedUser.userId, {
            phone: phone || matchedUser.phone,
            address: address || matchedUser.address,
            city: city || matchedUser.city,
            name: b.customerName || matchedUser.name
          });
        }
      }
    }

    console.log(`Matched ${updates.size} users with real booking details.`);

    // 3. Update Users with real details
    let updatedCount = 0;
    for (const [userId, data] of updates.entries()) {
      const updateExpressions = [];
      const expressionAttributeNames = {};
      const expressionAttributeValues = {};

      if (data.phone) {
        updateExpressions.push('phone = :phone');
        expressionAttributeValues[':phone'] = data.phone;
      }
      if (data.address) {
        updateExpressions.push('address = :address');
        expressionAttributeValues[':address'] = data.address;
      }
      if (data.city) {
        updateExpressions.push('city = :city');
        expressionAttributeValues[':city'] = data.city;
      }
      if (data.name) {
        updateExpressions.push('#n = :name');
        expressionAttributeNames['#n'] = 'name';
        expressionAttributeValues[':name'] = data.name;
      }

      if (updateExpressions.length > 0) {
        await dynamoDB.send(new UpdateCommand({
          TableName: 'Users',
          Key: { userId },
          UpdateExpression: 'SET ' + updateExpressions.join(', '),
          ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
          ExpressionAttributeValues: expressionAttributeValues
        }));
        console.log(`Updated user ${userId} (${data.name}) with phone: ${data.phone}, location: ${data.city}`);
        updatedCount++;
      }
    }

    console.log(`✅ Successfully updated ${updatedCount} users with real contact numbers and locations.`);

  } catch (err) {
    console.error('Error reconciling customer data:', err.message);
  }
}

run();
