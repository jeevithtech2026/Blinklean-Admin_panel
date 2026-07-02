const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { dynamoDB } = require('../config/dynamodb');
const { UpdateCommand } = require('@aws-sdk/lib-dynamodb');

// Razorpay Webhook Secret (Configure this in your AWS Lambda Environment Variables)
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'your_webhook_secret_here';

// POST /api/v1/webhooks/razorpay
router.post('/razorpay', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const bodyString = JSON.stringify(req.body);

    // 1. Verify Webhook Signature
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
      .update(bodyString)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.warn('[Razorpay Webhook] Invalid signature detected.');
      return res.status(400).json({ success: false, error: 'Invalid signature' });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    console.log(`[Razorpay Webhook] Received event: ${event}`);

    // 2. Handle specific events (e.g., payment.captured)
    if (event === 'payment.captured') {
      const paymentEntity = payload.payment.entity;
      
      const razorpayPaymentId = paymentEntity.id;
      // Amount in paise, convert to INR by dividing by 100
      const amount = paymentEntity.amount / 100; 
      
      // We expect the bookingId to be passed via notes from the frontend during payment creation
      const bookingId = paymentEntity.notes?.bookingId; 

      if (!bookingId) {
        console.warn(`[Razorpay Webhook] No bookingId found in notes for payment ${razorpayPaymentId}`);
        return res.status(400).json({ success: false, error: 'Missing bookingId in notes' });
      }

      console.log(`[Razorpay Webhook] Updating Booking ${bookingId} for payment ${razorpayPaymentId}`);

      // 3. Update DynamoDB Bookings Table
      await dynamoDB.send(new UpdateCommand({
        TableName: 'bookings',
        Key: { bookingId: bookingId },
        UpdateExpression: 'SET #status = :status, razorpayPaymentId = :razorpayPaymentId, paymentMethod = :paymentMethod, amount = :amount, updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':status': 'completed',
          ':razorpayPaymentId': razorpayPaymentId,
          ':paymentMethod': 'razorpay',
          ':amount': amount,
          ':updatedAt': new Date().toISOString()
        }
      }));
      
      console.log(`[Razorpay Webhook] Successfully updated booking ${bookingId}`);
    }

    // Acknowledge the webhook with 200 OK
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('[Razorpay Webhook Error]', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
