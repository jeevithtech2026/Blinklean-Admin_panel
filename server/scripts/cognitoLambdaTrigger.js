const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const REGION = process.env.REGION || 'ap-south-1';

const dbClient = new DynamoDBClient({ region: REGION });
const dynamoDB = DynamoDBDocumentClient.from(dbClient);

function generateMockPhone() {
    const digits = Math.floor(100000000 + Math.random() * 900000000);
    return `+91 9${digits}`;
}

/**
 * AWS Lambda Post Confirmation Trigger for Amazon Cognito.
 * This function will be triggered immediately after a user signs up and confirms their account,
 * or logs in via a social provider like Google for the first time.
 * Supports routing Cognito users from both Customer and Partner user pools.
 */
exports.handler = async (event) => {
    console.log("Received Cognito Event:", JSON.stringify(event, null, 2));

    try {
        const userAttributes = event.request.userAttributes || {};
        const userPoolId = event.userPoolId || '';

        // Check if event belongs to the Partner User Pool
        const isPartnerPool = userPoolId.toLowerCase().includes('ys1vwrsjh');

        if (isPartnerPool) {
            console.log(`[Cognito Sync] Routing user ${event.userName} to Partners table.`);
            
            const email = userAttributes.email || 'unknown@example.com';
            const name = userAttributes.name || email.split('@')[0] || event.userName;
            const phone = userAttributes.phone_number || generateMockPhone();

            await dynamoDB.send(new UpdateCommand({
                TableName: 'Partners',
                Key: { id: event.userName },
                UpdateExpression: 'SET email = :email, #name = :name, phoneNumber = if_not_exists(phoneNumber, :phone), #status = if_not_exists(#status, :status), kycStatus = if_not_exists(kycStatus, :kycStatus), createdAt = if_not_exists(createdAt, :now), updatedAt = :now, isOnboardingComplete = if_not_exists(isOnboardingComplete, :falseVal), skills = if_not_exists(skills, :emptyList), vehicleDetails = if_not_exists(vehicleDetails, :nullVal), photoUrl = if_not_exists(photoUrl, :nullVal)',
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
                    ':now': new Date().toISOString(),
                    ':falseVal': false,
                    ':emptyList': [],
                    ':nullVal': null
                }
            }));

            console.log(`Successfully added/updated partner ${email} in DynamoDB`);
        } else {
            console.log(`[Cognito Sync] Routing user ${event.userName} to Users table.`);
            
            const email = userAttributes.email || 'unknown@example.com';
            const name = userAttributes.name || email.split('@')[0] || event.userName;
            const phone = userAttributes.phone_number || generateMockPhone();

            await dynamoDB.send(new UpdateCommand({
                TableName: 'Users',
                Key: { userId: event.userName },
                UpdateExpression: 'SET email = :email, #name = :name, emailVerified = :emailVerified, #status = :status, lastLogin = :now, createdAt = if_not_exists(createdAt, :now), phone = if_not_exists(phone, :phone), #source = :source',
                ExpressionAttributeNames: {
                    '#name': 'name',
                    '#status': 'status',
                    '#source': 'source'
                },
                ExpressionAttributeValues: {
                    ':email': email,
                    ':name': name,
                    ':emailVerified': userAttributes.email_verified === 'true',
                    ':status': 'CONFIRMED',
                    ':now': new Date().toISOString(),
                    ':phone': phone,
                    ':source': 'cognito_trigger'
                }
            }));

            console.log(`Successfully added/updated user ${email} in DynamoDB`);
        }
    } catch (error) {
        console.error("Error saving user to DynamoDB:", error);
        // Throw the error so Cognito knows the trigger failed
        throw error;
    }

    return event;
};
