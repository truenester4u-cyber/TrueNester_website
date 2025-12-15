import crypto from 'crypto';

/**
 * Encryption utilities for sensitive data protection
 * Uses AES-256-GCM for authenticated encryption
 * 
 * Recommended for: Phone numbers, payment tokens, SSNs, sensitive personal data
 */

// Get encryption key from environment
const ENCRYPTION_KEY = process.env.DATA_ENCRYPTION_KEY || 
                      (typeof window === 'undefined' ? process.env.DATA_ENCRYPTION_KEY : localStorage.getItem('DATA_ENCRYPTION_KEY'));

const ALGORITHM = 'aes-256-gcm';

/**
 * Encrypt sensitive data
 * @param data - Plain text to encrypt
 * @returns Encrypted string in format: iv:authTag:encryptedData
 * @throws Error if encryption key not configured
 */
export const encryptSensitiveData = (data: string): string => {
  if (!ENCRYPTION_KEY) {
    throw new Error('DATA_ENCRYPTION_KEY not configured. Set in environment variables.');
  }

  if (ENCRYPTION_KEY.length !== 64) {
    throw new Error('DATA_ENCRYPTION_KEY must be 64 characters (32 bytes in hex)');
  }

  const iv = crypto.randomBytes(16); // Initialization vector
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  );

  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encryptedData
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
};

/**
 * Decrypt sensitive data
 * @param encrypted - Encrypted string from encryptSensitiveData()
 * @returns Decrypted plain text
 * @throws Error if decryption fails
 */
export const decryptSensitiveData = (encrypted: string): string => {
  if (!ENCRYPTION_KEY) {
    throw new Error('DATA_ENCRYPTION_KEY not configured');
  }

  try {
    const [ivHex, authTagHex, data] = encrypted.split(':');

    if (!ivHex || !authTagHex || !data) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY, 'hex'),
      iv
    );

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Decryption failed: ${errorMsg}`);
  }
};

/**
 * Generate a random encryption key (run once and store in .env)
 * Usage: node -e "console.log(require('./src/lib/security/encryption').generateEncryptionKey())"
 * @returns 64-character hex string (32 bytes)
 */
export const generateEncryptionKey = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash a string using SHA-256
 * One-way function - cannot be reversed
 * @param data - Data to hash
 * @returns Hex-encoded hash
 */
export const hashData = (data: string): string => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Verify if a hash matches data
 * @param data - Original data
 * @param hash - Hash to verify against
 * @returns True if hash matches, false otherwise
 */
export const verifyHash = (data: string, hash: string): boolean => {
  return hashData(data) === hash;
};

/**
 * Generate a random secure token
 * Useful for: Password resets, email verification, session tokens
 * @param length - Token length in bytes (default 32)
 * @returns Hex-encoded random token
 */
export const generateSecureToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Mask sensitive data for display/logging
 * @param data - Original sensitive data
 * @param showCount - Number of characters to show at end
 * @returns Masked string (e.g., "****1234")
 */
export const maskSensitiveData = (data: string, showCount: number = 4): string => {
  if (data.length <= showCount) {
    return '*'.repeat(data.length);
  }
  
  const masked = '*'.repeat(data.length - showCount);
  const visible = data.substring(data.length - showCount);
  return masked + visible;
};

/**
 * Hash password with additional salt (for password hashing)
 * Note: Use bcryptjs for actual password hashing in production
 * @param password - Password to hash
 * @param salt - Additional salt
 * @returns Hashed password
 */
export const hashPassword = (password: string, salt: string = ''): string => {
  const dataToHash = password + salt;
  return crypto.pbkdf2Sync(dataToHash, salt || 'default-salt', 100000, 64, 'sha512').toString('hex');
};

/**
 * Generate a random API key
 * Useful for: Admin API keys, service tokens
 * @param length - Key length in bytes (default 32)
 * @returns Hex-encoded API key
 */
export const generateAPIKey = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Validate encryption key format
 * @param key - Encryption key to validate
 * @returns True if valid, false otherwise
 */
export const isValidEncryptionKey = (key: string): boolean => {
  // Should be 64 hex characters (32 bytes)
  if (key.length !== 64) {
    return false;
  }
  
  // Should contain only hex characters
  return /^[a-f0-9]{64}$/i.test(key);
};

export default {
  encryptSensitiveData,
  decryptSensitiveData,
  generateEncryptionKey,
  hashData,
  verifyHash,
  generateSecureToken,
  maskSensitiveData,
  hashPassword,
  generateAPIKey,
  isValidEncryptionKey,
};
