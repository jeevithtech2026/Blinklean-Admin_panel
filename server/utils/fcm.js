const https = require('https');
const crypto = require('crypto');
const { ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { dynamoDB } = require('../config/dynamodb');

// Firebase credentials from env vars
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL;
const PRIVATE_KEY = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

function httpPost(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function makeJWT() {
  if (!CLIENT_EMAIL || !PRIVATE_KEY) {
    throw new Error('FCM credentials not configured. Please check FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY environment variables.');
  }
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: CLIENT_EMAIL,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })).toString('base64url');
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  const sig = sign.sign(PRIVATE_KEY, 'base64url');
  return `${header}.${payload}.${sig}`;
}

async function getAccessToken() {
  const jwt = makeJWT();
  const body = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`;
  const res = await httpPost({
    hostname: 'oauth2.googleapis.com',
    path: '/token',
    method: 'POST',
    headers: { 
      'Content-Type': 'application/x-www-form-urlencoded', 
      'Content-Length': Buffer.byteLength(body) 
    },
  }, body);
  const data = JSON.parse(res.body);
  if (!data.access_token) throw new Error(`OAuth2 failed: ${res.body}`);
  return data.access_token;
}

async function sendOneFCM(accessToken, token, title, body) {
  if (!PROJECT_ID) {
    throw new Error('FIREBASE_PROJECT_ID not configured.');
  }
  const payload = JSON.stringify({
    message: {
      token,
      notification: { title, body },
      android: {
        priority: 'high',
        notification: {
          channel_id: 'high_importance_channel',
          sound: 'default',
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
        },
      },
    },
  });
  return httpPost({
    hostname: 'fcm.googleapis.com',
    path: `/v1/projects/${PROJECT_ID}/messages:send`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
  }, payload);
}

// Scans all users and returns array of fcmTokens
async function getAllFCMTokens() {
  const tokens = [];
  let lastKey;
  do {
    const result = await dynamoDB.send(new ScanCommand({
      TableName: 'Users',
      ProjectionExpression: 'fcmToken',
      FilterExpression: 'attribute_exists(fcmToken)',
      ...(lastKey ? { ExclusiveStartKey: lastKey } : {}),
    }));
    for (const item of result.Items || []) {
      if (item.fcmToken && item.fcmToken.length > 10) {
        tokens.push(item.fcmToken);
      }
    }
    lastKey = result.LastEvaluatedKey;
  } while (lastKey);
  return tokens;
}

// Broadcasts notification to all users with FCM tokens
async function broadcastNotification(title, body) {
  console.log(`[FCM Broadcast] Triggered broadcast. Title: "${title}"`);
  
  if (!PROJECT_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
    console.warn('[FCM Broadcast] Warning: Firebase configuration environment variables are missing.');
    throw new Error('Firebase push notification credentials are not configured on this server.');
  }

  const [accessToken, tokens] = await Promise.all([
    getAccessToken(),
    getAllFCMTokens()
  ]);

  console.log(`[FCM Broadcast] Found ${tokens.length} FCM tokens to broadcast to.`);
  if (tokens.length === 0) {
    return { sent: 0, failed: 0, message: 'No FCM tokens found in Users table.' };
  }

  const BATCH = 50;
  let sent = 0, failed = 0;

  for (let i = 0; i < tokens.length; i += BATCH) {
    const batch = tokens.slice(i, i + BATCH);
    const results = await Promise.allSettled(
      batch.map(token => sendOneFCM(accessToken, token, title, body))
    );
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value.status === 200) {
        sent++;
      } else {
        failed++;
        if (r.status === 'rejected') {
          console.error('[FCM Broadcast] Failed to send single FCM:', r.reason);
        } else {
          console.error('[FCM Broadcast] FCM API responded with error status:', r.value.status, r.value.body);
        }
      }
    }
  }

  console.log(`[FCM Broadcast] Complete. Sent: ${sent}, Failed: ${failed}`);
  return { sent, failed };
}

module.exports = {
  broadcastNotification,
  getAllFCMTokens
};
