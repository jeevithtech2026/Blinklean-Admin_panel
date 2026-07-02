const jwt = require('jsonwebtoken');
const { verifyCognitoJwt } = require('../utils/cognitoJwtVerifier');

const JWT_SECRET = process.env.JWT_SECRET || 'blinklean_admin_secret_key_123';

/**
 * Express Middleware validating JWT Bearer token credentials.
 */
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    console.warn('[Auth Middleware] Access denied: Missing authorization headers.');
    return res.status(401).json({ message: 'Authorization token required. Access Denied.' });
  }

  const tokenParts = authHeader.split(' ');
  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
    console.warn('[Auth Middleware] Malformed bearer header structure.');
    return res.status(401).json({ message: 'Malformed authorization token. Use format: Bearer <token>' });
  }

  const token = tokenParts[1];

  // Local static test token bypass check
  if (token === 'admin_token' || token.startsWith('mock_admin_token')) {
    console.log('[Auth Middleware] Authenticated using local mock admin token credentials.');
    req.admin = { username: 'superadmin', role: 'Super Admin' };
    return next();
  }

  try {
    // 1. Try checking if it's a Cognito JWT
    const decoded = await verifyCognitoJwt(token);
    req.admin = {
      username: decoded['cognito:username'] || decoded.username || decoded.sub,
      email: decoded.email,
      role: 'Super Admin',
    };
    next();
  } catch (cognitoErr) {
    // 2. Fallback to local JWT verification (for backwards compatibility/other tokens)
    try {
      const decodedLocal = jwt.verify(token, JWT_SECRET);
      req.admin = decodedLocal;
      next();
    } catch (localErr) {
      console.error('[Auth Middleware Error] Auth token validation failed:', cognitoErr.message, localErr.message);
      return res.status(401).json({ message: 'Invalid or expired authorization token. Access Denied.' });
    }
  }
};

module.exports = authMiddleware;
