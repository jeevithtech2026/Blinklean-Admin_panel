const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const REGION = process.env.REGION || 'ap-south-1';
const TABLE_NAME = 'Users';

const dbClient = new DynamoDBClient({ region: REGION });
const dynamoDB = DynamoDBDocumentClient.from(dbClient);

/**
 * AWS Lambda Post Confirmation Trigger for Amazon Cognito.
 * This function will be triggered immediately after a user signs up and confirms their account,
 * or logs in via a social provider like Google for the first time.
 */
exports.handler = async (event) => {
    console.log("Received Cognito Event:", JSON.stringify(event, null, 2));

    try {
        const userAttributes = event.request.userAttributes;

        // Map Cognito User to DynamoDB Schema
        const dynamoItem = {
            userId: event.userName, // Unique Cognito ID (sub)
            email: userAttributes.email || 'unknown@example.com',
            name: userAttributes.name || userAttributes.email || event.userName,
            phone: userAttributes.phone_number || '',
            emailVerified: userAttributes.email_verified === 'true',
            status: 'CONFIRMED', // Post confirmation means they are confirmed
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            source: 'cognito_trigger'
        };

        // Write to DynamoDB
        await dynamoDB.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: dynamoItem
        }));

        console.log(`Successfully added user ${dynamoItem.email} to DynamoDB`);
    } catch (error) {
        console.error("Error saving user to DynamoDB:", error);
        // We throw the error so Cognito knows the trigger failed.
        // If you don't want login to fail if DynamoDB fails, you can swallow the error.
        throw error;
    }

    // Return the event to Cognito so it can proceed with the authentication flow
    return event;
};
