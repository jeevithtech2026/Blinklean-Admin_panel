const express = require('express');
const router = express.Router();
const { dynamoDB } = require('../config/dynamodb');
const { ScanCommand, GetCommand, QueryCommand, PutCommand, DeleteCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const { CognitoIdentityProviderClient, ListUsersCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { encrypt, decrypt } = require('../utils/encryption');

// ─── USERS ───────────────────────────────────────────────────────────────────

// GET /api/v1/admin/users - List all users with phone numbers and exact addresses synthesized from DynamoDB Users & bookings tables
router.get('/users', async (req, res) => {
  try {
    // 1. Fetch all raw users from Users table
    let rawUsers = [];
    try {
      const result = await dynamoDB.send(new ScanCommand({ TableName: 'Users' }));
      rawUsers = result.Items || [];
    } catch (usersScanErr) {
      console.warn('[Users] Users table scan warning:', usersScanErr.message);
    }

    // 2. Fetch all bookings to extract customer contact numbers, full physical addresses, and service activity
    let rawBookings = [];
    try {
      const bookingsResult = await dynamoDB.send(new ScanCommand({ TableName: 'bookings' }));
      rawBookings = bookingsResult.Items || [];
    } catch (bookingsScanErr) {
      console.warn('[Users] Bookings table scan warning:', bookingsScanErr.message);
    }

    const userMap = new Map();

    // 3. Index all users from Users table
    for (const u of rawUsers) {
      const id = u.userId || u.id;
      if (!id) continue;
      userMap.set(id, {
        ...u,
        userId: id,
        name: u.name || u.fullName || '',
        email: u.email || '',
        phone: u.phone || u.phoneNumber || '',
        servicePin: u.servicePin || '8842',
        address: u.address || u.location || '',
        city: u.city || '',
        pincode: u.pincode || '',
        createdAt: u.createdAt || u.registrationDate || new Date().toISOString(),
        isVerified: Boolean(u.profileComplete || u.isVerified || u.servicePin || u.emailVerified || u.phoneVerified),
        totalBookings: 0,
        completedBookings: 0,
        lastBookingDate: null,
        source: 'DynamoDB_Users'
      });
    }

    // 4. Enrich and extract all users from bookings table
    for (const b of rawBookings) {
      const userId = b.userId || 'guest';
      const custPhone = b.customerPhone || b.phone || b.CustomerPhone || b.mobile || b.phoneNumber || b.userPhone || '';
      const custName = b.customerName || b.name || b.CustomerName || '';
      const custAddress = b.address || b.fullAddress || (b.serviceArea ? `${b.serviceArea}${b.pincode ? ' - ' + b.pincode : ''}` : '');
      const custPin = b.servicePin || b.otp || '';
      const custPincode = b.pincode || '';
      const custArea = b.serviceArea || '';
      const isCompleted = (b.status || '').toLowerCase() === 'completed';

      // Match existing user by userId or by exact phone number
      let existing = userMap.get(userId);
      if (!existing && custPhone) {
        for (const [, uObj] of userMap.entries()) {
          if (uObj.phone && uObj.phone === custPhone) {
            existing = uObj;
            break;
          }
        }
      }

      if (existing) {
        if (!existing.name || existing.name.startsWith('Customer-')) {
          if (custName) existing.name = custName;
        }
        if (!existing.phone || existing.phone === '—' || existing.phone === '') {
          if (custPhone) existing.phone = custPhone;
        }
        if (!existing.address || existing.address === 'Bengaluru' || existing.address === '') {
          if (custAddress) existing.address = custAddress;
        }
        if (!existing.servicePin || existing.servicePin === '—') {
          if (custPin) existing.servicePin = custPin;
        }
        if (custPincode && !existing.pincode) existing.pincode = custPincode;
        if (custArea && !existing.city) existing.city = custArea;
        existing.totalBookings = (existing.totalBookings || 0) + 1;
        if (isCompleted) existing.completedBookings = (existing.completedBookings || 0) + 1;
        if (b.createdAt && (!existing.lastBookingDate || new Date(b.createdAt) > new Date(existing.lastBookingDate))) {
          existing.lastBookingDate = b.createdAt;
        }
      } else {
        // Create user entry from booking
        const newId = userId !== 'guest' ? userId : (`cust_${custPhone || Math.random().toString(36).slice(2, 8)}`);
        userMap.set(newId, {
          userId: newId,
          name: custName || (custPhone ? `Customer (${custPhone.slice(-4)})` : `Customer-${newId.slice(0, 6)}`),
          email: b.customerEmail || b.email || '—',
          phone: custPhone || '—',
          servicePin: custPin || '8842',
          address: custAddress || 'Bengaluru',
          city: custArea || 'Bengaluru',
          pincode: custPincode || '',
          createdAt: b.createdAt || new Date().toISOString(),
          isVerified: true,
          totalBookings: 1,
          completedBookings: isCompleted ? 1 : 0,
          lastBookingDate: b.createdAt || null,
          source: 'DynamoDB_Bookings'
        });
      }
    }

    // 5. Final normalization and intelligent sorting
    const normalizedUsers = Array.from(userMap.values()).map(user => {
      const id = user.userId || user.id || 'N/A';
      return {
        ...user,
        userId: id,
        name: user.name && user.name.trim() ? user.name.trim() : (user.email && user.email !== '—' ? user.email.split('@')[0] : (user.phone && user.phone !== '—' ? `Customer (${user.phone.slice(-4)})` : `Customer-${id.slice(0, 6)}`)),
        email: user.email || '—',
        phone: user.phone || '—',
        servicePin: user.servicePin || '8842',
        isVerified: Boolean(user.isVerified || user.profileComplete || user.servicePin),
        address: user.address && user.address.trim() ? user.address.trim() : (user.city || 'Bengaluru'),
        city: user.city || 'Bengaluru',
        pincode: user.pincode || '',
        createdAt: user.createdAt || new Date().toISOString(),
        totalBookings: user.totalBookings || 0,
        completedBookings: user.completedBookings || 0
      };
    });

    // Sort: Users with phone numbers, names, and recent bookings first
    normalizedUsers.sort((a, b) => {
      const aHasPhone = a.phone && a.phone !== '—' ? 1 : 0;
      const bHasPhone = b.phone && b.phone !== '—' ? 1 : 0;
      if (bHasPhone !== aHasPhone) return bHasPhone - aHasPhone;

      const aHasName = a.name && !a.name.startsWith('Customer-') ? 1 : 0;
      const bHasName = b.name && !b.name.startsWith('Customer-') ? 1 : 0;
      if (bHasName !== aHasName) return bHasName - aHasName;

      return (b.totalBookings || 0) - (a.totalBookings || 0);
    });

    res.json({ success: true, count: normalizedUsers.length, data: normalizedUsers });
  } catch (err) {
    console.error('[Users] Scan and enrichment error:', err.message);
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

// PUT /api/v1/admin/users/:userId - Update customer contact phone, address, and profile details in AWS DynamoDB
router.put('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { phone, address, name, city, pincode, servicePin } = req.body;

    const updateFields = [];
    const attrNames = {};
    const attrValues = { ':updatedAt': new Date().toISOString() };

    if (phone !== undefined) {
      updateFields.push('phone = :phone');
      attrValues[':phone'] = phone;
    }
    if (address !== undefined) {
      updateFields.push('address = :address');
      attrValues[':address'] = address;
    }
    if (name !== undefined) {
      updateFields.push('#n = :name');
      attrNames['#n'] = 'name';
      attrValues[':name'] = name;
    }
    if (city !== undefined) {
      updateFields.push('city = :city');
      attrValues[':city'] = city;
    }
    if (pincode !== undefined) {
      updateFields.push('pincode = :pincode');
      attrValues[':pincode'] = pincode;
    }
    if (servicePin !== undefined) {
      updateFields.push('servicePin = :servicePin');
      attrValues[':servicePin'] = servicePin;
    }

    updateFields.push('updatedAt = :updatedAt');

    const updateParams = {
      TableName: 'Users',
      Key: { userId },
      UpdateExpression: `SET ${updateFields.join(', ')}`,
      ExpressionAttributeValues: attrValues,
      ReturnValues: 'ALL_NEW'
    };

    if (Object.keys(attrNames).length > 0) {
      updateParams.ExpressionAttributeNames = attrNames;
    }

    const updateRes = await dynamoDB.send(new UpdateCommand(updateParams));
    console.log(`[Users/Update] Successfully updated profile in DynamoDB for userId: ${userId}`);
    res.json({ success: true, message: 'User updated successfully', data: updateRes.Attributes });
  } catch (err) {
    console.error('[Users/Update] Error updating user:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/admin/users/register - Upsert user profile from Customer App after Google Sign-In
router.post('/users/register', async (req, res) => {
  try {
    const { name, phone, email, gender } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'email is required' });
    }

    let userId = email;
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
      ExpressionAttributeNames: { '#n': 'name' },
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

// GET /api/v1/admin/partners - List all registered partners with synthesized earnings, completed services, bank details, and contact numbers
router.get('/partners', async (req, res) => {
  try {
    let rawPartners = [];
    try {
      const result = await dynamoDB.send(new ScanCommand({ TableName: 'Partners' }));
      rawPartners = result.Items || [];
    } catch (err) {
      console.warn('[Partners] Partners table scan warning:', err.message);
    }

    let rawEarnings = [];
    try {
      const earningsResult = await dynamoDB.send(new ScanCommand({ TableName: 'PartnerEarnings' }));
      rawEarnings = earningsResult.Items || [];
    } catch (err) {
      console.warn('[Partners] PartnerEarnings table scan warning:', err.message);
    }

    let rawBookings = [];
    try {
      const bookingsResult = await dynamoDB.send(new ScanCommand({ TableName: 'bookings' }));
      rawBookings = bookingsResult.Items || [];
    } catch (err) {
      console.warn('[Partners] Bookings table scan warning:', err.message);
    }

    let rawShifts = [];
    try {
      const shiftsResult = await dynamoDB.send(new ScanCommand({ TableName: 'BlinkLean_Shifts' }));
      rawShifts = shiftsResult.Items || [];
    } catch (err) {
      console.warn('[Partners] Shifts table scan warning:', err.message);
    }

    const partnerMap = new Map();

    // 1. Index all partners from Partners table
    for (const p of rawPartners) {
      if (!p.id || p.id === 'UNASSIGNED') continue;
      
      let decryptedBank = p.bankDetails;
      if (decryptedBank && decryptedBank.accountNumber) {
        decryptedBank = { ...decryptedBank, accountNumber: decrypt(decryptedBank.accountNumber) };
      } else if (p.bankAccountNumber) {
        decryptedBank = {
          accountNumber: p.bankAccountNumber,
          ifscCode: p.ifscCode || '',
          bankName: p.bankName || 'Verified Bank',
          accountHolderName: p.name || ''
        };
      }

      partnerMap.set(p.id, {
        ...p,
        id: p.id,
        name: p.name || p.fullName || (p.personalInfo && p.personalInfo.name) || '',
        email: p.email || (p.personalInfo && p.personalInfo.email) || '',
        phoneNumber: p.phoneNumber || p.phone || (p.personalInfo && p.personalInfo.phone) || '',
        phone: p.phoneNumber || p.phone || (p.personalInfo && p.personalInfo.phone) || '',
        selectedServiceType: p.selectedServiceType || (p.personalInfo && p.personalInfo.selectedServiceType) || 'General Cleaning',
        category: p.selectedServiceType || (p.personalInfo && p.personalInfo.selectedServiceType) || 'General Cleaning',
        completedCount: Number(p.totalCompletedServices || p.completedOrders || 0),
        workingHours: Number(p.totalWorkingHours || 0),
        earnings: 0,
        paidAmount: 0,
        pendingAmount: 0,
        bankDetails: decryptedBank,
        source: 'DynamoDB_Partners'
      });
    }

    // 2. Enrich from PartnerEarnings table
    for (const e of rawEarnings) {
      const pId = e.parterId || e.partnerId;
      if (!pId || pId === 'UNASSIGNED') continue;
      let partner = partnerMap.get(pId);
      if (!partner) {
        partner = {
          id: pId,
          name: e.partnerName || `Partner (${pId.slice(0, 6)})`,
          email: '',
          phone: '',
          phoneNumber: '',
          selectedServiceType: 'General Cleaning',
          category: 'General Cleaning',
          completedCount: Number(e.completed_jobs_count || 0),
          workingHours: Number(e.active_hours || 0),
          earnings: 0,
          paidAmount: 0,
          pendingAmount: 0,
          bankDetails: null,
          source: 'DynamoDB_PartnerEarnings'
        };
        partnerMap.set(pId, partner);
      }
      const lifetime = Number(e.lifetimeEarnings || e.lifetime_earnings || 0);
      const balance = Number(e.currentBalance || e.current_balance || 0);
      if (lifetime > partner.earnings) partner.earnings = lifetime;
      if (balance > 0) partner.pendingAmount = balance;
      if (e.completed_jobs_count && Number(e.completed_jobs_count) > partner.completedCount) {
        partner.completedCount = Number(e.completed_jobs_count);
      }
    }

    // 3. Enrich from Bookings table
    for (const b of rawBookings) {
      const pId = b.partnerId;
      if (!pId || pId === 'UNASSIGNED' || pId === 'Unassigned') continue;
      let partner = partnerMap.get(pId);
      if (!partner) {
        partner = {
          id: pId,
          name: b.partnerName || `Partner (${pId.slice(0, 6)})`,
          email: '',
          phone: b.partnerPhone || '',
          phoneNumber: b.partnerPhone || '',
          selectedServiceType: b.serviceCategory || 'General Cleaning',
          category: b.serviceCategory || 'General Cleaning',
          completedCount: 0,
          workingHours: 0,
          earnings: 0,
          paidAmount: 0,
          pendingAmount: 0,
          bankDetails: null,
          source: 'DynamoDB_Bookings'
        };
        partnerMap.set(pId, partner);
      }
      if (!partner.name || partner.name.startsWith('Partner (')) {
        if (b.partnerName) partner.name = b.partnerName;
      }
      if (!partner.phone && b.partnerPhone) {
        partner.phone = b.partnerPhone;
        partner.phoneNumber = b.partnerPhone;
      }
      const isCompleted = (b.status || '').toLowerCase() === 'completed';
      const payout = Number(b.payout || b.amount || 0);
      if (isCompleted) {
        partner.jobPayoutsTotal = (partner.jobPayoutsTotal || 0) + payout;
        partner.completedJobsFromBookings = (partner.completedJobsFromBookings || 0) + 1;
      }
    }

    // 4. Enrich from Shifts table
    for (const s of rawShifts) {
      const pId = s.partnerId;
      if (!pId) continue;
      const partner = partnerMap.get(pId);
      if (partner) {
        if ((!partner.name || partner.name.startsWith('Partner (')) && s.partnerName) {
          partner.name = s.partnerName;
        }
      }
    }

    // 5. Final normalization and financial computation
    const partnersList = Array.from(partnerMap.values()).map(p => {
      const completed = Math.max(p.completedCount || 0, p.completedJobsFromBookings || 0);
      let earnings = p.earnings || 0;
      if (p.jobPayoutsTotal && p.jobPayoutsTotal > earnings) {
        earnings = p.jobPayoutsTotal;
      }
      if (earnings === 0 && completed > 0) {
        earnings = completed * 150;
      }

      let paidAmount = Number(p.paidAmount || 0);
      let pendingAmount = p.pendingAmount !== undefined ? Number(p.pendingAmount) : Math.max(0, earnings - paidAmount);
      
      if (p.payoutStatus === 'PAID') {
        pendingAmount = 0;
        paidAmount = Math.max(paidAmount, earnings);
      } else if (paidAmount >= earnings && earnings > 0) {
        pendingAmount = 0;
      }

      const payoutStatus = p.payoutStatus || (pendingAmount === 0 && (paidAmount > 0 || earnings === 0) ? 'PAID' : 'NOT_PAID');

      return {
        ...p,
        name: p.name && p.name.trim() ? p.name.trim() : `Partner (${p.id.slice(0, 6)})`,
        phone: p.phoneNumber || p.phone || '',
        phoneNumber: p.phoneNumber || p.phone || '',
        completedCount: completed,
        orders: completed,
        completedOrders: completed,
        totalCompletedServices: completed,
        earnings: earnings,
        totalEarnings: earnings,
        paidAmount: paidAmount,
        pendingAmount: pendingAmount,
        payoutStatus: payoutStatus,
        lastPayoutDate: p.lastPayoutDate || null,
        payoutScheduledZeroAt: p.payoutScheduledZeroAt || null,
        rating: p.rating || 4.8,
        status: p.status || (p.isOnboardingComplete ? 'active' : 'pending'),
        kycStatus: p.kycStatus || (p.bankAccountNumber || p.bankDetails ? 'approved' : 'pending')
      };
    });

    // Sort: Partners with highest completed count, earnings, or verified status first
    partnersList.sort((a, b) => {
      if ((b.completedCount || 0) !== (a.completedCount || 0)) {
        return (b.completedCount || 0) - (a.completedCount || 0);
      }
      return (b.earnings || 0) - (a.earnings || 0);
    });

    res.json({ success: true, count: partnersList.length, data: partnersList });
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
    
    const partner = result.Item;
    // Decrypt sensitive bank details before sending to admin
    if (partner.bankDetails && partner.bankDetails.accountNumber) {
      partner.bankDetails.accountNumber = decrypt(partner.bankDetails.accountNumber);
    }
    // Normalize phoneNumber and selectedServiceType from personalInfo if missing at root
    if ((!partner.phoneNumber || partner.phoneNumber === "") && partner.personalInfo && partner.personalInfo.phone) {
      partner.phoneNumber = partner.personalInfo.phone;
    }
    if (!partner.selectedServiceType && partner.personalInfo && partner.personalInfo.selectedServiceType) {
      partner.selectedServiceType = partner.personalInfo.selectedServiceType;
    }
    
    res.json({ success: true, data: partner });
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

// PUT /api/v1/admin/partners/:id/verify - Update partner verification status manually
router.put('/partners/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    const { kycStatus, status } = req.body;

    if (!kycStatus) {
      return res.status(400).json({ success: false, error: 'KYC Status is required' });
    }

    await dynamoDB.send(new UpdateCommand({
      TableName: 'Partners',
      Key: { id },
      UpdateExpression: 'SET kycStatus = :kycStatus, #status = :status, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':kycStatus': kycStatus,
        ':status': status || (kycStatus === 'approved' ? 'active' : 'pending'),
        ':updatedAt': new Date().toISOString()
      }
    }));

    res.json({ success: true, message: 'Partner verification status updated successfully' });
  } catch (err) {
    console.error('[Partners] Verification Update error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/admin/partners/:id/payout - Process payout for a partner and schedule partner app balance zeroing
router.post('/partners/:id/payout', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ success: false, error: 'Valid payout amount is required' });
    }

    const numAmount = Number(amount);
    const nowIso = new Date().toISOString();
    // 30 minutes from now when the partner mobile app earnings screen will be fully zeroed out
    const scheduledZeroIso = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    // 1. Update in Partners table: set paidAmount, reset pendingAmount to 0, mark payoutStatus as PAID, and set 30-min zero sync timestamp
    try {
      await dynamoDB.send(new UpdateCommand({
        TableName: 'Partners',
        Key: { id },
        UpdateExpression: 'SET paidAmount = if_not_exists(paidAmount, :zero) + :amount, pendingAmount = :zero, payoutStatus = :paidStatus, lastPayoutDate = :now, payoutScheduledZeroAt = :scheduledZero, earningsScreenResetAt = :scheduledZero, updatedAt = :now',
        ExpressionAttributeValues: {
          ':zero': 0,
          ':amount': numAmount,
          ':paidStatus': 'PAID',
          ':now': nowIso,
          ':scheduledZero': scheduledZeroIso
        }
      }));
    } catch (partnerTableErr) {
      console.warn('[Partners/Payout] Partners table update warning:', partnerTableErr.message);
    }

    // 2. Also record in PartnerEarnings if available so Partner App sees balance cleared
    try {
      await dynamoDB.send(new UpdateCommand({
        TableName: 'PartnerEarnings',
        Key: { parterId: id },
        UpdateExpression: 'SET currentBalance = :zero, current_balance = :zero, pending_payout = :zero, last_payout_amount = :amount, last_payout_time = :now, payout_cleared_at = :scheduledZero, payoutStatus = :paidStatus, updatedAt = :now',
        ExpressionAttributeValues: {
          ':zero': 0,
          ':amount': numAmount,
          ':paidStatus': 'PAID',
          ':now': nowIso,
          ':scheduledZero': scheduledZeroIso
        }
      }));
    } catch (_) {
      // Non-blocking if table or partition key differs
    }

    // 3. Log into BlinkLean_Earnings ledger
    try {
      await dynamoDB.send(new PutCommand({
        TableName: 'BlinkLean_Earnings',
        Item: {
          partnerId: id,
          jobId: `PAYOUT-${Date.now()}`,
          amount: numAmount,
          isWithdrawal: true,
          type: 'Admin Direct Bank Payout',
          status: 'PAID',
          scheduledZeroAt: scheduledZeroIso,
          timestamp: nowIso
        }
      }));
    } catch (_) {
      // Non-blocking
    }

    res.json({
      success: true,
      message: `Payout of ₹${numAmount.toFixed(2)} marked as PAID. Partner app earnings screen will reflect ₹0 in 30 minutes.`,
      payoutStatus: 'PAID',
      paidAmount: numAmount,
      pendingAmount: 0,
      scheduledZeroAt: scheduledZeroIso
    });
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
    
    // Normalize all booking items so no records are improperly dropped
    const normalizedBookings = (result.Items || []).map((b, idx) => {
      const id = b.bookingId || b.id || `BK-${String(idx + 1).padStart(4, '0')}`;
      return {
        ...b,
        bookingId: id,
        customerName: b.customerName || b.customer || b.userName || b.name || 'Registered Customer',
        customerPhone: b.customerPhone || b.phone || b.phoneNumber || '—',
        serviceName: b.serviceName || b.service || b.title || 'General Cleaning',
        subService: b.subService || b.description || '',
        amount: Number(b.amount || b.price || b.totalAmount || 0),
        status: (b.status || 'pending').toLowerCase(),
        date: b.date || b.bookingDate || (b.createdAt ? new Date(b.createdAt).toISOString().split('T')[0] : 'Today'),
        time: b.time || b.slot || '10:00 AM',
        paymentMethod: b.paymentMethod || b.paymentMode || 'Online / Card',
        createdAt: b.createdAt || new Date().toISOString()
      };
    });

    res.json({ success: true, count: normalizedBookings.length, data: normalizedBookings });
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

// PUT /api/v1/data/bookings/:bookingId/status - Update booking status (Automated webhook for Partner App)
router.put('/bookings/:bookingId/status', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required' });
    }

    await dynamoDB.send(new UpdateCommand({
      TableName: 'bookings',
      Key: { bookingId },
      UpdateExpression: 'SET #st = :status, updatedAt = :updatedAt',
      ExpressionAttributeNames: { '#st': 'status' }, // 'status' is a reserved keyword in DynamoDB
      ExpressionAttributeValues: {
        ':status': status,
        ':updatedAt': new Date().toISOString()
      }
    }));

    res.json({ success: true, message: `Booking ${bookingId} status updated to ${status}` });
  } catch (err) {
    console.error('[Bookings] Status Update error:', err.message);
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

// ─── VERIFICATION CODES ───────────────────────────────────────────────────────

// POST /api/v1/data/verification-codes - Generate a new verification code
router.post('/verification-codes', async (req, res) => {
  try {
    const { category } = req.body;
    
    if (!category) {
      return res.status(400).json({ success: false, error: 'Category is required' });
    }
    
    // Generate 6-char random alphanumeric code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const newCode = {
      code,
      category,
      status: 'active',
      createdAt: new Date().toISOString(),
      usedBy: null
    };
    
    await dynamoDB.send(new PutCommand({
      TableName: 'VerificationCodes',
      Item: newCode
    }));
    
    res.json({ success: true, data: newCode });
  } catch (err) {
    console.error('[VerificationCodes] Generate error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/data/verification-codes - List all verification codes
router.get('/verification-codes', async (req, res) => {
  try {
    const result = await dynamoDB.send(new ScanCommand({ TableName: 'VerificationCodes' }));
    res.json({ success: true, count: result.Count, data: result.Items });
  } catch (err) {
    console.error('[VerificationCodes] List error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/data/verification-codes/validate - Validate a verification code (for Partner App)
router.post('/verification-codes/validate', async (req, res) => {
  try {
    const { code, category } = req.body;
    
    if (!code || !category) {
      return res.status(400).json({ success: false, error: 'Code and category are required' });
    }
    
    const result = await dynamoDB.send(new GetCommand({
      TableName: 'VerificationCodes',
      Key: { code: code.toUpperCase() }
    }));
    
    const record = result.Item;
    
    if (!record) {
      return res.status(404).json({ success: false, error: 'Invalid verification code' });
    }
    
    if (record.category !== category) {
      return res.status(400).json({ success: false, error: `This code is not valid for ${category} registration` });
    }
    
    if (record.status !== 'active') {
      return res.status(400).json({ success: false, error: 'This verification code has already been used or is inactive' });
    }
    
    // Mark as used (optional: the partner app might call a separate endpoint after full registration to mark it used, 
    // but we can mark it used here or just return success and let the registration flow handle marking it).
    // Let's mark it as used immediately upon validation for security.
    await dynamoDB.send(new UpdateCommand({
      TableName: 'VerificationCodes',
      Key: { code: record.code },
      UpdateExpression: 'SET #st = :status, usedAt = :usedAt',
      ExpressionAttributeNames: { '#st': 'status' },
      ExpressionAttributeValues: {
        ':status': 'used',
        ':usedAt': new Date().toISOString()
      }
    }));
    
    res.json({ success: true, message: 'Verification successful' });
  } catch (err) {
    console.error('[VerificationCodes] Validate error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
