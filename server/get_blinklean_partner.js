const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'ap-south-1' });
const dynamoDB = DynamoDBDocumentClient.from(client);

async function main() {
  try {
    const result = await dynamoDB.send(new ScanCommand({ TableName: 'BlinkLean_Partners' }));
    console.log("BlinkLean_Partners Records:", JSON.stringify(result.Items, null, 2));
  } catch (err) {
    console.error("Error scanning BlinkLean_Partners:", err);
  }
}
main();
