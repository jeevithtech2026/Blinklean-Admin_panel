const express = require('express');
const router = express.Router();
const { dynamoDB } = require('../config/dynamodb');
const { ScanCommand, GetCommand, QueryCommand, PutCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const { CognitoIdentityProviderClient, ListUsersCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { encrypt, decrypt } = require('../utils/encryption');

// ─── USERS ───────────────────────────────────────────────────────────────────

// GET /api/v1/admin/users - List all users
router.get('/users', async (req, res) => {
  try {
    const result = await dynamoDB.send(new ScanCommand({ TableName: 'Users' }));
    res.json({ success: true, count: result.Count, data: result.Items });
  } catch (err) {
    console.error('[Users] Scan error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/admin/users/:userId - Get single user
router.get('/users/:userId', async (req, res) => {
  try {
    const result = await dynamoDB.send(new GetCommand({
      TableName: 'Users',
      Key: { userId: req.params.userId },
    }));
    if (!result.Item) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, data: result.Item });
  } catch (err) {
    console.error('[Users] Get error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/admin/users/register - Upsert user profile from Customer App after Google Sign-In
// Called by the Flutter app when a user completes the profile setup form (name, phone, gender).
// Uses UpdateExpression so it does NOT overwrite existing fields like referralCode or createdAt.
const { UpdateCommand } = require('@aws-sdk/lib-dynamodb');
router.post('/users/register', async (req, res) => {
  try {
    const { name, phone, email, gender } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'email is required' });
    }

    // Extract the Cognito userId from the Authorization token (JWT sub claim)
    // The token is a JWT — decode the payload (middle section) to get the sub
    let userId = email; // fallback to email if token parsing fails
    const authHeader = req.headers.authorization || '';
    if (authHeader && authHeader.length > 20) {
      try {
        const payload = JSON.parse(
          Buffer.from(authHeader.split('.')[1], 'base64').toString('utf8')
        );
        userId = payload.sub || payload['cognito:username'] || email;
      } catch (_) {
        // Token not a JWT — use email as key
      }
    }

    await dynamoDB.send(new UpdateCommand({
      TableName: 'Users',
      Key: { userId },
      UpdateExpression: 'SET #n = :name, phone = :phone, email = :email, gender = :gender, profileComplete = :complete, updatedAt = :updatedAt',
      ExpressionAttributeNames: { '#n': 'name' }, // 'name' is a reserved word in DynamoDB
      ExpressionAttributeValues: {
        ':name': name || '',
        ':phone': phone || '',
        ':email': email,
        ':gender': gender || '',
        ':complete': true,
        ':updatedAt': new Date().toISOString(),
      },
    }));

    console.log(`[Users/Register] Profile updated for userId: ${userId} (${email})`);
    res.json({ success: true, message: 'Profile saved successfully' });
  } catch (err) {
    console.error('[Users/Register] Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── PARTNERS ─────────────────────────────────────────────────────────────────

// GET /api/v1/admin/partners - List all partners
router.get('/partners', async (req, res) => {
  try {
    const result = await dynamoDB.send(new ScanCommand({ TableName: 'Partners' }));
    
    // Decrypt sensitive bank details before sending to admin
    const decryptedItems = (result.Items || []).map(partner => {
      if (partner.bankDetails && partner.bankDetails.accountNumber) {
        partner.bankDetails.accountNumber = decrypt(partner.bankDetails.accountNumber);
      }
      return partner;
    });

    res.json({ success: true, count: result.Count, data: decryptedItems });
  } catch (err) {
    console.error('[Partners] Scan error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/admin/partners/:id - Get single partner
router.get('/partners/:id', async (req, res) => {
  try {
    const result = await dynamoDB.send(new GetCommand({
      TableName: 'Partners',
      Key: { id: req.params.id },
    }));
    if (!result.Item) return res.status(404).json({ success: false, error: 'Partner not found' });
    
    // Decrypt sensitive bank details before sending to admin
    if (result.Item.bankDetails && result.Item.bankDetails.accountNumber) {
      result.Item.bankDetails.accountNumber = decrypt(result.Item.bankDetails.accountNumber);
    }
    
    res.json({ success: true, data: result.Item });
  } catch (err) {
    console.error('[Partners] Get error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/v1/admin/partners/:id/bank - Update partner bank details
router.put('/partners/:id/bank', async (req, res) => {
  try {
    const { id } = req.params;
    const { accountHolderName, bankName, accountNumber, ifscCode } = req.body;

    if (!accountNumber || !ifscCode) {
      return res.status(400).json({ success: false, error: 'Account Number and IFSC Code are required' });
    }

    // Encrypt the sensitive account number before saving
    const encryptedAccountNumber = encrypt(accountNumber);

    const bankDetails = {
      accountHolderName: accountHolderName || '',
      bankName: bankName || '',
      accountNumber: encryptedAccountNumber,
      ifscCode: ifscCode || '',
      updatedAt: new Date().toISOString()
    };

    await dynamoDB.send(new UpdateCommand({
      TableName: 'Partners',
      Key: { id },
      UpdateExpression: 'SET bankDetails = :bankDetails, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':bankDetails': bankDetails,
        ':updatedAt': new Date().toISOString()
      }
    }));

    res.json({ success: true, message: 'Bank details securely updated' });
  } catch (err) {
    console.error('[Partners] Bank Details Update error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/admin/partners/:id/payout - Process payout for a partner
router.post('/partners/:id/payout', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Valid payout amount is required' });
    }

    await dynamoDB.send(new UpdateCommand({
      TableName: 'Partners',
      Key: { id },
      UpdateExpression: 'SET paidAmount = if_not_exists(paidAmount, :zero) + :amount, lastPayoutDate = :now, updatedAt = :now',
      ExpressionAttributeValues: {
        ':zero': 0,
        ':amount': Number(amount),
        ':now': new Date().toISOString()
      }
    }));

    res.json({ success: true, message: 'Payout successfully recorded' });
  } catch (err) {
    console.error('[Partners] Payout Process error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── BOOKINGS ─────────────────────────────────────────────────────────────────

// GET /api/v1/admin/bookings - List all bookings
router.get('/bookings', async (req, res) => {
  try {
    const result = await dynamoDB.send(new ScanCommand({ TableName: 'bookings' }));
    res.json({ success: true, count: result.Count, data: result.Items });
  } catch (err) {
    console.error('[Bookings] Scan error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/admin/bookings/:bookingId - Get single booking
router.get('/bookings/:bookingId', async (req, res) => {
  try {
    const result = await dynamoDB.send(new GetCommand({
      TableName: 'bookings',
      Key: { bookingId: req.params.bookingId },
    }));
    if (!result.Item) return res.status(404).json({ success: false, error: 'Booking not found' });
    res.json({ success: true, data: result.Item });
  } catch (err) {
    console.error('[Bookings] Get error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── PARTNER LOCATIONS ────────────────────────────────────────────────────────

// GET /api/v1/admin/partner-locations - List all partner locations
router.get('/partner-locations', async (req, res) => {
  try {
    const result = await dynamoDB.send(new ScanCommand({ TableName: 'PartnerLocations' }));
    res.json({ success: true, count: result.Count, data: result.Items });
  } catch (err) {
    console.error('[PartnerLocations] Scan error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── PARTNER SCHEDULES ────────────────────────────────────────────────────────

// GET /api/v1/admin/partner-schedules - List all partner schedules
router.get('/partner-schedules', async (req, res) => {
  try {
    const result = await dynamoDB.send(new ScanCommand({ TableName: 'PartnerSchedules' }));
    res.json({ success: true, count: result.Count, data: result.Items });
  } catch (err) {
    console.error('[PartnerSchedules] Scan error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/admin/partner-schedules/:partnerId - Get schedules for one partner
router.get('/partner-schedules/:partnerId', async (req, res) => {
  try {
    const result = await dynamoDB.send(new QueryCommand({
      TableName: 'PartnerSchedules',
      KeyConditionExpression: 'partnerId = :pid',
      ExpressionAttributeValues: { ':pid': req.params.partnerId },
    }));
    res.json({ success: true, count: result.Count, data: result.Items });
  } catch (err) {
    console.error('[PartnerSchedules] Query error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── SERVICES ─────────────────────────────────────────────────────────────────

// GET /api/v1/admin/services - List all services
router.get('/services', async (req, res) => {
  try {
    const result = await dynamoDB.send(new ScanCommand({ TableName: 'Services' }));
    res.json({ success: true, count: result.Count, data: result.Items });
  } catch (err) {
    console.error('[Services] Scan error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── FEEDBACKS ────────────────────────────────────────────────────────────────

// GET /api/v1/admin/feedbacks - List all feedbacks
router.get('/feedbacks', async (req, res) => {
  try {
    const result = await dynamoDB.send(new ScanCommand({ TableName: 'Feedbacks' }));
    res.json({ success: true, count: result.Count, data: result.Items });
  } catch (err) {
    console.error('[Feedbacks] Scan error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── COUPONS ──────────────────────────────────────────────────────────────────

// GET /api/v1/admin/coupons - List all coupons
router.get('/coupons', async (req, res) => {
  try {
    const result = await dynamoDB.send(new ScanCommand({ TableName: 'Coupons' }));
    res.json({ success: true, count: result.Count, data: result.Items });
  } catch (err) {
    console.error('[Coupons] Scan error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/admin/coupons - Create a new coupon
router.post('/coupons', async (req, res) => {
  try {
    const newCoupon = {
      couponId: req.body.couponId || `COUPON-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      ...req.body,
      createdAt: new Date().toISOString()
    };
    
    await dynamoDB.send(new PutCommand({
      TableName: 'Coupons',
      Item: newCoupon
    }));
    
    res.json({ success: true, data: newCoupon });
  } catch (err) {
    console.error('[Coupons] POST error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/v1/admin/coupons/:couponId - Delete a coupon
router.delete('/coupons/:couponId', async (req, res) => {
  try {
    await dynamoDB.send(new DeleteCommand({
      TableName: 'Coupons',
      Key: { couponId: req.params.couponId }
    }));
    res.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (err) {
    console.error('[Coupons] DELETE error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
const { broadcastNotification } = require('../utils/fcm');

// POST /api/v1/admin/notifications/broadcast - Send custom push notification or broadcast a coupon
router.post('/notifications/broadcast', async (req, res) => {
  try {
    const { title, body } = req.body;
    if (!title || !body) {
      return res.status(400).json({ success: false, error: 'Title and body are required' });
    }

    const result = await broadcastNotification(title, body);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[Notifications] Broadcast error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/admin/notifications/scheduled - List all scheduled notifications
router.get('/notifications/scheduled', async (req, res) => {
  try {
    const result = await dynamoDB.send(new ScanCommand({ TableName: 'ScheduledNotifications' }));
    res.json({ success: true, count: result.Count, data: result.Items });
  } catch (err) {
    console.warn('[ScheduledNotifications] Table scan failed. Returning empty list.', err.message);
    res.json({ success: true, count: 0, data: [] });
  }
});

// POST /api/v1/admin/notifications/scheduled - Schedule a notification
router.post('/notifications/scheduled', async (req, res) => {
  try {
    const { title, body, sendAt } = req.body;
    if (!title || !body || !sendAt) {
      return res.status(400).json({ success: false, error: 'Title, body, and sendAt timestamp are required' });
    }

    const newNotification = {
      notificationId: `SCHED-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      title,
      body,
      sendAt,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    await dynamoDB.send(new PutCommand({
      TableName: 'ScheduledNotifications',
      Item: newNotification
    }));

    res.json({ success: true, data: newNotification });
  } catch (err) {
    console.error('[ScheduledNotifications] POST error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/v1/admin/notifications/scheduled/:id - Delete/cancel a scheduled notification
router.delete('/notifications/scheduled/:id', async (req, res) => {
  try {
    await dynamoDB.send(new DeleteCommand({
      TableName: 'ScheduledNotifications',
      Key: { notificationId: req.params.id }
    }));
    res.json({ success: true, message: 'Scheduled notification deleted successfully' });
  } catch (err) {
    console.error('[ScheduledNotifications] DELETE error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── AUDIT LOGS ───────────────────────────────────────────────────────────────

// GET /api/v1/admin/audit-logs - List all audit logs
router.get('/audit-logs', async (req, res) => {
  try {
    const result = await dynamoDB.send(new ScanCommand({ TableName: 'AuditLogs' }));
    res.json({ success: true, count: result.Count, data: result.Items });
  } catch (err) {
    console.warn('[AuditLogs] Table might not exist yet or scan failed. Falling back to empty array.', err.message);
    // Since the user might not have created this table yet, we fail gracefully.
    res.json({ success: true, count: 0, data: [] });
  }
});

// ─── SYSTEM SETTINGS ──────────────────────────────────────────────────────────

// GET /api/v1/admin/webhooks - List all webhooks
router.get('/webhooks', async (req, res) => {
  try {
    const result = await dynamoDB.send(new ScanCommand({ TableName: 'Webhooks' }));
    res.json({ success: true, count: result.Count, data: result.Items });
  } catch (err) {
    console.warn('[Webhooks] Table might not exist yet or scan failed.', err.message);
    res.json({ success: true, count: 0, data: [] });
  }
});

// POST /api/v1/admin/webhooks - Create a new webhook or API key
router.post('/webhooks', async (req, res) => {
  try {
    const newWebhook = {
      webhookId: req.body.webhookId || Math.random().toString(36).substr(2, 9),
      ...req.body,
      timestamp: new Date().toISOString()
    };
    
    await dynamoDB.send(new PutCommand({
      TableName: 'Webhooks',
      Item: newWebhook
    }));
    
    res.json({ success: true, data: newWebhook });
  } catch (err) {
    console.error('[Webhooks] POST error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/v1/admin/webhooks/:webhookId - Delete a webhook or API key
router.delete('/webhooks/:webhookId', async (req, res) => {
  try {
    await dynamoDB.send(new DeleteCommand({
      TableName: 'Webhooks',
      Key: { webhookId: req.params.webhookId }
    }));
    res.json({ success: true, message: 'Webhook deleted successfully' });
  } catch (err) {
    console.error('[Webhooks] DELETE error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/admin/system-alerts - List all system alerts (security/perf)
router.get('/system-alerts', async (req, res) => {
  try {
    const result = await dynamoDB.send(new ScanCommand({ TableName: 'SystemAlerts' }));
    res.json({ success: true, count: result.Count, data: result.Items });
  } catch (err) {
    console.warn('[SystemAlerts] Table might not exist yet or scan failed.', err.message);
    res.json({ success: true, count: 0, data: [] });
  }
});

module.exports = router;
