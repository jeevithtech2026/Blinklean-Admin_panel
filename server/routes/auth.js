const express = require('express');
const router = express.Router();
const { InitiateAuthCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { cognitoClient, COGNITO_CLIENT_ID } = require('../config/cognito');

// POST /api/v1/auth/login - Authenticate admin credentials with AWS Cognito
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Username and password are required' });
  }

  if (!COGNITO_CLIENT_ID) {
    console.error('[Auth API] COGNITO_CLIENT_ID is not configured');
    return res.status(500).json({ success: false, error: 'Authentication service configuration error' });
  }

  console.log(`[Auth API] Sign-in attempt received for user: ${username}`);

  try {
    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: COGNITO_CLIENT_ID,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
      },
    });

    const response = await cognitoClient.send(command);
    
    if (response.AuthenticationResult) {
      const { IdToken, AccessToken, RefreshToken } = response.AuthenticationResult;
      
      console.log(`[Auth API] Authentication successful for user: ${username}`);
      
      // Return standard details + token to the client
      res.json({
        success: true,
        token: IdToken,
        accessToken: AccessToken,
        refreshToken: RefreshToken,
        user: {
          username: username,
          role: 'Super Admin', // Hardcoded role since this user pool is only for admin panel access
        }
      });
    } else {
      console.error('[Auth API] Empty AuthenticationResult returned from Cognito');
      res.status(401).json({ success: false, error: 'Invalid username or password' });
    }
  } catch (err) {
    console.warn(`[Auth API] Authentication failed for user ${username}:`, err.message);
    
    let userMsg = 'Invalid username or password';
    if (err.name === 'UserNotConfirmedException') {
      userMsg = 'User account is not confirmed';
    } else if (err.name === 'UserNotFoundException') {
      userMsg = 'Invalid username or password';
    } else if (err.name === 'NotAuthorizedException') {
      userMsg = 'Invalid username or password';
    } else if (err.name === 'PasswordResetRequiredException') {
      userMsg = 'Password reset is required';
    } else if (err.name === 'UserLambdaValidationException') {
      userMsg = err.message;
    }
    
    res.status(401).json({ success: false, error: userMsg });
  }
});

module.exports = router;
