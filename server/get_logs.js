require('dotenv').config();
const { CloudWatchLogsClient, FilterLogEventsCommand } = require("@aws-sdk/client-cloudwatch-logs");
const fs = require('fs');
const path = require('path');

const logGroupName = "/aws/lambda/blinklean-admin-backend-s-AdminAggregationFunction-xQhJXa8Ju593";
const client = new CloudWatchLogsClient({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function main() {
  try {
    console.log("Fetching logs from:", logGroupName);
    const command = new FilterLogEventsCommand({
      logGroupName,
      limit: 100
    });
    const response = await client.send(command);
    const events = response.events || [];
    
    // Sort descending by timestamp
    events.sort((a, b) => b.timestamp - a.timestamp);
    
    const output = events.map(e => `[${new Date(e.timestamp).toISOString()}] ${e.message.trim()}`).join('\n');
    fs.writeFileSync(path.join(__dirname, 'cw_logs.txt'), output);
    console.log("Successfully wrote logs to cw_logs.txt");
  } catch (err) {
    console.error("Error fetching logs:", err);
  }
}

main();
