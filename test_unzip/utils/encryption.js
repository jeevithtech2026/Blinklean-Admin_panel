const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
// Ensure the key is exactly 32 bytes for aes-256-gcm
// We use the BANK_ENCRYPTION_KEY environment variable. 
// If it's missing (e.g. locally or not configured), we throw an error or use a fallback for safety.
const getSecretKey = () => {
  const secret = process.env.BANK_ENCRYPTION_KEY;
  if (!secret) {
    console.warn('[WARNING] BANK_ENCRYPTION_KEY is not defined. Bank details encryption will fail in production.');
    // For development fallback if missing (do not use in prod)
    return crypto.scryptSync('fallback-dev-secret-key', 'salt', 32);
  }
  // If the secret is provided as a 64-character hex string, parse it.
  // Otherwise, use scrypt to derive a 32-byte key from the provided passphrase.
  if (secret.length === 64 && /^[0-9a-fA-F]+$/.test(secret)) {
    return Buffer.from(secret, 'hex');
  }
  return crypto.scryptSync(secret, 'blinklean-salt', 32);
};

/**
 * Encrypts a plaintext string using AES-256-GCM
 * @param {string} text - The plaintext to encrypt
 * @returns {string} - The encrypted string in format iv:authTag:encryptedData (hex)
 */
function encrypt(text) {
  if (!text) return text;
  try {
    const key = getSecretKey();
    const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    // Return as a single string containing IV, Auth Tag, and Ciphertext
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (err) {
    console.error('[Encryption Error]', err.message);
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypts a ciphertext string created by the encrypt function
 * @param {string} encryptedText - The formatted encrypted string (iv:authTag:encryptedData)
 * @returns {string} - The decrypted plaintext
 */
function decrypt(encryptedText) {
  if (!encryptedText || !encryptedText.includes(':')) return encryptedText; // Not encrypted or empty
  try {
    const key = getSecretKey();
    const parts = encryptedText.split(':');
    
    // Safety check in case format is invalid
    if (parts.length !== 3) return encryptedText;

    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (err) {
    console.error('[Decryption Error]', err.message);
    // If decryption fails (e.g. key changed), we don't want to crash the whole API,
    // so we return a placeholder indicating decryption failure.
    return '[Decryption Failed]';
  }
}

module.exports = {
  encrypt,
  decrypt
};
