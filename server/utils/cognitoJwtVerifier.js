const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { COGNITO_USER_POOL_ID } = require('../config/cognito');

let jwksCache = null;
let lastFetched = 0;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours caching

async function fetchJWKS() {
  const now = Date.now();
  if (jwksCache && (now - lastFetched < CACHE_TTL_MS)) {
    return jwksCache;
  }

  const jwksUrl = `https://cognito-idp.ap-south-1.amazonaws.com/${COGNITO_USER_POOL_ID}/.well-known/jwks.json`;
  console.log(`[Cognito JWT Verifier] Fetching JWKS from: ${jwksUrl}`);
  
  // Use native fetch (available in Node 18)
  const response = await fetch(jwksUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch JWKS: ${response.statusText}`);
  }
  
  const jwks = await response.json();
  jwksCache = jwks.keys;
  lastFetched = now;
  return jwksCache;
}

/**
 * Cryptographically verifies a Cognito-issued JWT ID Token.
 * @param {string} token - The raw JWT token string
 * @returns {Promise<Object>} The decoded token payload
 */
async function verifyCognitoJwt(token) {
  if (!COGNITO_USER_POOL_ID) {
    throw new Error('COGNITO_USER_POOL_ID is not configured');
  }

  // 1. Decode token header to get 'kid'
  const decodedHeader = jwt.decode(token, { complete: true });
  if (!decodedHeader || !decodedHeader.header || !decodedHeader.header.kid) {
    throw new Error('Invalid JWT: Missing kid in header');
  }
  
  const { kid } = decodedHeader.header;

  // 2. Fetch JWKS and find matching key
  const keys = await fetchJWKS();
  const jwk = keys.find(key => key.kid === kid);
  if (!jwk) {
    throw new Error(`JWK key not found for kid: ${kid}`);
  }

  // 3. Create Public Key directly from JWK (native in Node 15.9+)
  // We need to map JWK properties format for node crypto
  const publicKeyObj = {
    kty: jwk.kty,
    n: jwk.n,
    e: jwk.e,
  };
  
  const publicKey = crypto.createPublicKey({
    key: publicKeyObj,
    format: 'jwk'
  });

  // 4. Verify signature and claims (iss and token_use)
  const expectedIssuer = `https://cognito-idp.ap-south-1.amazonaws.com/${COGNITO_USER_POOL_ID}`;
  
  return new Promise((resolve, reject) => {
    jwt.verify(
      token, 
      publicKey, 
      { 
        algorithms: ['RS256'],
        issuer: expectedIssuer
      }, 
      (err, decoded) => {
        if (err) {
          return reject(err);
        }
        
        // Ensure the token use is either 'id' or 'access'
        if (decoded.token_use !== 'id' && decoded.token_use !== 'access') {
          return reject(new Error('Invalid token_use claim'));
        }
        
        resolve(decoded);
      }
    );
  });
}

module.exports = { verifyCognitoJwt };
