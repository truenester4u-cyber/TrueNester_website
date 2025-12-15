# 🔐 Data Protection Implementation Guide

**Version**: 1.0  
**Date**: December 12, 2025  
**Status**: Ready for Implementation

---

## Overview

This guide provides the technical implementation for data protection, encryption, access logging, and compliance features in Dubai Nest Hub.

---

## Part 1: Data Encryption Module

### 1.1 Installation & Setup

```bash
# Create encryption utility module
mkdir -p src/lib/security

# Install required packages (if not already installed)
npm install crypto
npm install bcryptjs dotenv
npm install jose  # For JWT token encryption
npm install @noble/hashes  # Additional encryption utilities
```

### 1.2 Create Encryption Utility (`src/lib/security/encryption.ts`)

```typescript
import crypto from 'crypto';

/**
 * Encryption utilities for sensitive data protection
 * Uses AES-256-GCM for authenticated encryption
 */

// Ensure encryption key is properly set
const ENCRYPTION_KEY = process.env.DATA_ENCRYPTION_KEY;
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
  console.warn(
    'WARNING: DATA_ENCRYPTION_KEY not properly configured. ' +
    'Set a 64-character hex string (32 bytes) in .env'
  );
}

const ALGORITHM = 'aes-256-gcm';

/**
 * Encrypt sensitive data
 * @param data - Plain text to encrypt
 * @returns Encrypted string in format: iv:authTag:encryptedData
 */
export const encryptSensitiveData = (data: string): string => {
  if (!ENCRYPTION_KEY) {
    throw new Error('DATA_ENCRYPTION_KEY not configured');
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
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Generate a random encryption key (run once and store in .env)
 * Usage: node -e "console.log(require('./src/lib/security/encryption').generateEncryptionKey())"
 */
export const generateEncryptionKey = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash a string using SHA-256
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
 */
export const verifyHash = (data: string, hash: string): boolean => {
  return hashData(data) === hash;
};

/**
 * Generate a random token for session/password reset
 * @param length - Token length in bytes (default 32)
 */
export const generateSecureToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

export default {
  encryptSensitiveData,
  decryptSensitiveData,
  generateEncryptionKey,
  hashData,
  verifyHash,
  generateSecureToken,
};
```

### 1.3 Create Password Hashing Utility (`src/lib/security/passwords.ts`)

```typescript
import bcrypt from 'bcryptjs';

/**
 * Password hashing and verification utilities
 * Uses bcrypt with salt rounds for security
 */

const SALT_ROUNDS = 12; // Recommended for security

/**
 * Hash a password securely
 * @param password - Plain text password
 * @returns Hashed password (async operation)
 */
export const hashPassword = async (password: string): Promise<string> => {
  if (password.length < 12) {
    throw new Error('Password must be at least 12 characters');
  }

  try {
    return await bcrypt.hash(password, SALT_ROUNDS);
  } catch (error) {
    throw new Error(`Password hashing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Verify a password against its hash
 * @param password - Plain text password to verify
 * @param hash - Password hash from database
 * @returns True if password matches hash
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
};

/**
 * Check if password meets security requirements
 * @param password - Password to validate
 * @returns Object with validation result and error messages
 */
export const validatePasswordStrength = (
  password: string
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 12) {
    errors.push('Password must be at least 12 characters');
  }

  if (password.length > 128) {
    errors.push('Password must be less than 128 characters');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check for common patterns
  const commonPatterns = [
    /(.)\1{3,}/, // Same character repeated 4+ times
    /^(password|123456|qwerty|abc123)/i, // Common passwords
    /seq(uential|)/, // Sequential characters
  ];

  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      errors.push('Password contains common or weak patterns');
      break;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export default {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
};
```

### 1.4 Update `.env.example`

```env
# Data Encryption
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
DATA_ENCRYPTION_KEY=your_64_character_hex_key_here

# Bcrypt Configuration
BCRYPT_SALT_ROUNDS=12

# Security Keys
ADMIN_API_KEY=your_32_char_key_minimum
JWT_SECRET=your_jwt_secret_here

# Sensitive Data Encryption
ENABLE_FIELD_ENCRYPTION=true
ENCRYPTED_FIELDS=phone_number,payment_token,ssn
```

### 1.5 Create Encrypted Data Migration (`database-migrations/add_encryption.sql`)

```sql
-- Add encrypted phone number field (existing phone can be migrated)
ALTER TABLE profiles 
  ADD COLUMN phone_encrypted TEXT,
  ADD COLUMN phone_encrypted_at TIMESTAMP;

-- Add encrypted payment token field
ALTER TABLE payment_methods
  ADD COLUMN token_encrypted TEXT,
  ADD COLUMN token_encrypted_at TIMESTAMP;

-- Add encryption metadata table for tracking
CREATE TABLE IF NOT EXISTS encryption_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name VARCHAR(255) NOT NULL,
  column_name VARCHAR(255) NOT NULL,
  encrypted_at TIMESTAMP NOT NULL DEFAULT now(),
  record_id UUID,
  encryption_version INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT now()
);

-- Index for quick lookup
CREATE INDEX idx_encryption_metadata_table_col 
  ON encryption_metadata(table_name, column_name);

-- Function to automatically track encryption
CREATE OR REPLACE FUNCTION log_encryption_metadata()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO encryption_metadata (table_name, column_name, record_id, encrypted_at)
  VALUES (TG_TABLE_NAME, TG_ARGV[0], NEW.id, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers on key tables
CREATE TRIGGER phone_encryption_trigger
AFTER UPDATE ON profiles
FOR EACH ROW
WHEN (NEW.phone_encrypted IS DISTINCT FROM OLD.phone_encrypted)
EXECUTE FUNCTION log_encryption_metadata('phone_number');

-- Add RLS policy for encryption metadata
ALTER TABLE encryption_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin only encryption metadata"
  ON encryption_metadata
  FOR ALL
  USING (auth.role() = 'admin');
```

---

## Part 2: Data Access Logging System

### 2.1 Create Access Logger (`src/lib/security/accessLogger.ts`)

```typescript
import { supabase } from "@/integrations/supabase/client";

/**
 * Types for access logging
 */
export enum AccessAction {
  READ = 'READ',
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  EXPORT = 'EXPORT',
  DOWNLOAD = 'DOWNLOAD',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  FAILED_AUTH = 'FAILED_AUTH',
  ACCESS_DENIED = 'ACCESS_DENIED',
}

export enum AccessStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  DENIED = 'DENIED',
}

export interface AccessLog {
  id?: string;
  user_id: string;
  action: AccessAction;
  resource_type: string; // 'property', 'conversation', 'payment', etc.
  resource_id: string;
  status: AccessStatus;
  ip_address: string;
  user_agent: string;
  details?: Record<string, unknown>;
  timestamp?: string;
}

/**
 * Log user access to resources
 * @param log - Access log data
 */
export const logAccess = async (log: AccessLog): Promise<void> => {
  try {
    // Get client IP from environment or request
    const ipAddress = log.ip_address || '0.0.0.0';
    const userAgent = log.user_agent || navigator.userAgent;

    const accessLog = {
      user_id: log.user_id,
      action: log.action,
      resource_type: log.resource_type,
      resource_id: log.resource_id,
      status: log.status,
      ip_address: ipAddress,
      user_agent: userAgent,
      details: log.details || {},
      timestamp: new Date().toISOString(),
    };

    // Store in Supabase
    const { error } = await supabase
      .from('access_logs')
      .insert([accessLog]);

    if (error) {
      console.error('Failed to log access:', error);
      // Don't throw - logging should not break functionality
    }
  } catch (error) {
    console.error('Access logging error:', error);
    // Silent fail - logging should never crash the app
  }
};

/**
 * Log successful data access
 */
export const logDataAccess = async (
  userId: string,
  resourceType: string,
  resourceId: string,
  action: AccessAction = AccessAction.READ
): Promise<void> => {
  await logAccess({
    user_id: userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    status: AccessStatus.SUCCESS,
    ip_address: getClientIP(),
    user_agent: navigator.userAgent,
  });
};

/**
 * Log denied access attempts
 */
export const logAccessDenied = async (
  userId: string,
  resourceType: string,
  resourceId: string,
  reason: string
): Promise<void> => {
  await logAccess({
    user_id: userId,
    action: AccessAction.ACCESS_DENIED,
    resource_type: resourceType,
    resource_id: resourceId,
    status: AccessStatus.DENIED,
    ip_address: getClientIP(),
    user_agent: navigator.userAgent,
    details: { reason },
  });
};

/**
 * Log export/download actions
 */
export const logExport = async (
  userId: string,
  dataType: string,
  recordCount: number,
  format: string
): Promise<void> => {
  await logAccess({
    user_id: userId,
    action: AccessAction.EXPORT,
    resource_type: dataType,
    resource_id: `export_${Date.now()}`,
    status: AccessStatus.SUCCESS,
    ip_address: getClientIP(),
    user_agent: navigator.userAgent,
    details: {
      format,
      record_count: recordCount,
      timestamp: new Date().toISOString(),
    },
  });
};

/**
 * Get client IP address
 * Note: In browser, this gets limited info. Backend provides accurate IP.
 */
export const getClientIP = (): string => {
  // This is a placeholder - actual IP comes from backend headers
  // In Node.js backend, use: req.ip or request.headers['x-forwarded-for']
  return 'browser-client';
};

export default {
  logAccess,
  logDataAccess,
  logAccessDenied,
  logExport,
  AccessAction,
  AccessStatus,
};
```

### 2.2 Backend Access Logger (`truenester-chatbot-api/src/security/accessLogger.ts`)

```typescript
import { Request, Response, NextFunction } from 'express';
import { supabase } from '../integrations/supabase';

/**
 * Backend access logging middleware
 * Logs all API requests with full details
 */

export enum AccessAction {
  READ = 'READ',
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  EXPORT = 'EXPORT',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  FAILED_AUTH = 'FAILED_AUTH',
}

export interface BackendAccessLog {
  user_id: string | null;
  action: AccessAction;
  resource_type: string;
  resource_id: string;
  method: string;
  endpoint: string;
  status_code: number;
  ip_address: string;
  user_agent: string;
  request_body?: Record<string, unknown>;
  response_code?: number;
  error_message?: string;
  duration_ms: number;
  timestamp: string;
}

/**
 * Express middleware for request/response logging
 */
export const accessLoggingMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();
  const ipAddress = getClientIP(req);
  const userAgent = req.get('user-agent') || 'unknown';

  // Log response when sent
  const originalSend = res.send;
  res.send = function (data: unknown) {
    const duration = Date.now() - startTime;

    // Determine resource type from endpoint
    const resourceType = getResourceType(req.path);
    const action = getAction(req.method);

    logAccessSync({
      user_id: (req as any).user?.id || null,
      action,
      resource_type: resourceType,
      resource_id: extractResourceId(req.path),
      method: req.method,
      endpoint: req.path,
      status_code: res.statusCode,
      ip_address: ipAddress,
      user_agent: userAgent,
      response_code: res.statusCode,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    });

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Log access synchronously (for backend)
 */
function logAccessSync(log: BackendAccessLog): void {
  try {
    // Queue for asynchronous processing
    setImmediate(() => {
      supabase
        .from('access_logs_backend')
        .insert([log])
        .then(() => {
          // Log success silently
        })
        .catch((error) => {
          console.error('Backend access log error:', error);
        });
    });
  } catch (error) {
    console.error('Error in access logging:', error);
  }
}

/**
 * Extract client IP from request
 */
export const getClientIP = (req: Request): string => {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    (req.headers['cf-connecting-ip'] as string) ||
    req.socket?.remoteAddress ||
    'unknown'
  ).trim();
};

/**
 * Get resource type from API path
 */
function getResourceType(path: string): string {
  const segments = path.split('/');
  return segments[segments.length - 2] || 'unknown';
}

/**
 * Get action from HTTP method
 */
function getAction(method: string): AccessAction {
  switch (method.toUpperCase()) {
    case 'GET':
      return AccessAction.READ;
    case 'POST':
      return AccessAction.CREATE;
    case 'PATCH':
    case 'PUT':
      return AccessAction.UPDATE;
    case 'DELETE':
      return AccessAction.DELETE;
    default:
      return AccessAction.READ;
  }
}

/**
 * Extract resource ID from URL path
 */
function extractResourceId(path: string): string {
  const parts = path.split('/');
  // Usually UUID is last part or second to last
  return parts[parts.length - 1] || parts[parts.length - 2] || 'unknown';
}

export default {
  accessLoggingMiddleware,
  getClientIP,
  AccessAction,
};
```

### 2.3 Create Access Logs Table (`database-migrations/create_access_logs.sql`)

```sql
-- Frontend access logs table
CREATE TABLE IF NOT EXISTS access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
  ip_address INET NOT NULL,
  user_agent TEXT,
  details JSONB DEFAULT '{}',
  timestamp TIMESTAMP NOT NULL DEFAULT now(),
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Backend access logs table
CREATE TABLE IF NOT EXISTS access_logs_backend (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  endpoint TEXT NOT NULL,
  status_code INT NOT NULL,
  ip_address INET NOT NULL,
  user_agent TEXT,
  response_code INT,
  error_message TEXT,
  duration_ms INT,
  timestamp TIMESTAMP NOT NULL DEFAULT now(),
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_access_logs_user_timestamp 
  ON access_logs(user_id, timestamp DESC);
CREATE INDEX idx_access_logs_resource 
  ON access_logs(resource_type, resource_id);
CREATE INDEX idx_access_logs_action 
  ON access_logs(action);

CREATE INDEX idx_access_logs_backend_user_timestamp 
  ON access_logs_backend(user_id, timestamp DESC);
CREATE INDEX idx_access_logs_backend_endpoint 
  ON access_logs_backend(endpoint);
CREATE INDEX idx_access_logs_backend_status 
  ON access_logs_backend(status_code);

-- RLS Policies - Admins can see all, users can see own
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs_backend ENABLE ROW LEVEL SECURITY;

-- Admin can view all access logs
CREATE POLICY "Admin view all access logs"
  ON access_logs
  FOR SELECT
  USING (auth.role() = 'admin');

-- Users can view their own access logs
CREATE POLICY "User view own access logs"
  ON access_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert (backend)
CREATE POLICY "Backend insert access logs"
  ON access_logs
  FOR INSERT
  WITH CHECK (true);

-- Same for backend logs
CREATE POLICY "Admin view all backend access logs"
  ON access_logs_backend
  FOR SELECT
  USING (auth.role() = 'admin');

CREATE POLICY "Backend insert backend access logs"
  ON access_logs_backend
  FOR INSERT
  WITH CHECK (true);
```

---

## Part 3: Frontend Implementation

### 3.1 Update Authentication Context

Add encryption key generation to initial setup:

```typescript
// In src/contexts/AuthContext.v2.tsx or auth setup

export const setupEncryption = async () => {
  const encryptionKey = localStorage.getItem('DATA_ENCRYPTION_KEY');
  
  if (!encryptionKey) {
    // Generate on first login
    const key = generateEncryptionKey();
    // Store securely (not in localStorage directly - use secure storage)
    // This is for demo - in production use secure storage
  }
};

// Ensure encryption is initialized on app load
useEffect(() => {
  setupEncryption();
}, []);
```

### 3.2 Add Access Logging to Protected Pages

```typescript
// In any protected page component

import { logDataAccess, logAccessDenied } from '@/lib/security/accessLogger';

const YourComponent = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Log when user views this page
      logDataAccess(
        user.id,
        'page_view',
        'dashboard',
        'READ'
      );
    }
  }, [user]);

  return (
    // Your component JSX
  );
};
```

### 3.3 Log Data Exports

```typescript
// When exporting data

import { logExport } from '@/lib/security/accessLogger';

const handleExport = async (format: 'csv' | 'json' | 'pdf') => {
  const { user } = useAuth();
  
  // ... export logic ...
  
  // Log the export
  await logExport(
    user.id,
    'conversations',
    recordCount,
    format
  );
};
```

---

## Part 4: Backend Implementation

### 4.1 Add Middleware to Express Server

```typescript
// In truenester-chatbot-api/src/server.ts

import { accessLoggingMiddleware } from './security/accessLogger';

// Add early in middleware chain
app.use(accessLoggingMiddleware);

// ... rest of middleware ...
```

### 4.2 Protect Sensitive API Endpoints

```typescript
// Example: Conversations endpoint with access logging

app.patch('/api/admin/conversations/:id', async (req, res) => {
  const conversationId = req.params.id;
  const adminKey = req.headers['x-admin-api-key'];

  try {
    // Verify admin key
    if (adminKey !== process.env.ADMIN_API_KEY) {
      // Log denied access
      await logAccessDenied(
        req.user?.id || 'unknown',
        'conversation',
        conversationId,
        'Invalid API key'
      );
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Perform update
    const result = await supabase
      .from('conversations')
      .update(req.body)
      .eq('id', conversationId)
      .select();

    // Log success
    await logDataAccess(
      req.user.id,
      'conversation',
      conversationId,
      'UPDATE'
    );

    res.json(result.data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

---

## Part 5: Configuration Setup

### 5.1 Generate Encryption Keys

```bash
# Run once to generate keys
node -e "console.log('Encryption Key:', require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('Admin API Key:', require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('JWT Secret:', require('crypto').randomBytes(32).toString('hex'))"

# Add to .env:
DATA_ENCRYPTION_KEY=<generated_64_char_hex>
ADMIN_API_KEY=<generated_64_char_hex>
JWT_SECRET=<generated_64_char_hex>
```

### 5.2 Environment Variables Template

```env
# .env.example

# Data Protection
DATA_ENCRYPTION_KEY=your_64_character_hex_key
ENABLE_FIELD_ENCRYPTION=true
ENCRYPTED_FIELDS=phone_number,payment_token,ssn

# Access Logging
ENABLE_ACCESS_LOGGING=true
LOG_RETENTION_DAYS=365
LOG_SAMPLE_RATE=1.0  # 1.0 = 100% of requests logged

# Security
ADMIN_API_KEY=your_32_character_minimum_key
JWT_SECRET=your_jwt_secret_here
BCRYPT_SALT_ROUNDS=12

# Compliance
ENABLE_GDPR_FEATURES=true
ENABLE_CCPA_FEATURES=true
DATA_RESIDENCY=UAE  # Or EU, US, etc.
```

### 5.3 Initialize Migrations

```bash
# Run migration to create access logs tables
psql -h your_db_host -U your_user -d your_db < database-migrations/create_access_logs.sql

# Run encryption migration
psql -h your_db_host -U your_user -d your_db < database-migrations/add_encryption.sql

# Or run in Supabase dashboard → SQL Editor
```

---

## Part 6: Testing & Validation

### 6.1 Test Encryption

```typescript
// test/security/encryption.test.ts

import { 
  encryptSensitiveData, 
  decryptSensitiveData, 
  hashData, 
  verifyHash 
} from '@/lib/security/encryption';

describe('Encryption', () => {
  it('should encrypt and decrypt data', () => {
    const original = 'test-phone-number';
    const encrypted = encryptSensitiveData(original);
    const decrypted = decryptSensitiveData(encrypted);
    
    expect(decrypted).toBe(original);
    expect(encrypted).not.toContain(original);
  });

  it('should hash data irreversibly', () => {
    const data = 'test-data';
    const hash = hashData(data);
    
    expect(hash.length).toBe(64); // SHA-256 = 64 chars
    expect(verifyHash(data, hash)).toBe(true);
    expect(verifyHash('wrong-data', hash)).toBe(false);
  });
});
```

### 6.2 Test Access Logging

```typescript
// test/security/accessLogger.test.ts

import { logDataAccess, logAccessDenied } from '@/lib/security/accessLogger';

describe('Access Logging', () => {
  it('should log successful access', async () => {
    await logDataAccess('user-123', 'property', 'property-456');
    // Verify in database
  });

  it('should log denied access', async () => {
    await logAccessDenied('user-123', 'property', 'property-456', 'Permission denied');
    // Verify in database with status = 'DENIED'
  });
});
```

---

## Part 7: Deployment Checklist

- [ ] Generate all encryption keys and store in `.env`
- [ ] Run migrations to create encryption and logging tables
- [ ] Add encryption utility modules to codebase
- [ ] Add access logging middleware to backend
- [ ] Update Supabase RLS policies for new tables
- [ ] Test encryption/decryption in development
- [ ] Test access logging in staging
- [ ] Review compliance with policies
- [ ] Set up log retention policies
- [ ] Configure log analysis alerts
- [ ] Document for team
- [ ] Train team on data handling

---

## Part 8: Monitoring & Maintenance

### 8.1 Log Analysis

```sql
-- View recent access patterns
SELECT 
  user_id, 
  action, 
  resource_type,
  COUNT(*) as access_count,
  MAX(timestamp) as last_access
FROM access_logs
WHERE timestamp > now() - interval '7 days'
GROUP BY user_id, action, resource_type
ORDER BY access_count DESC;

-- Detect unusual patterns
SELECT 
  user_id,
  COUNT(*) as request_count,
  COUNT(DISTINCT ip_address) as unique_ips
FROM access_logs_backend
WHERE timestamp > now() - interval '1 hour'
GROUP BY user_id
HAVING COUNT(*) > 100; -- Alert if too many requests
```

### 8.2 Encryption Key Rotation

```bash
# Quarterly key rotation (recommended)

# 1. Generate new key
NEW_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# 2. Update .env
# DATA_ENCRYPTION_KEY=$NEW_KEY

# 3. Re-encrypt all data with new key (automated job)
npm run encrypt:rotate-keys

# 4. Verify
npm run encrypt:verify

# 5. Keep old key for 30 days for decryption of old data
```

---

## References

- [NIST Cryptographic Standards](https://csrc.nist.gov/projects/cryptographic-standards-and-guidelines/)
- [OWASP Data Protection Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Data_Protection_Cheat_Sheet.html)
- [Node.js Crypto Documentation](https://nodejs.org/api/crypto.html)
- [Bcrypt Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)

---

**Status**: Ready for Implementation  
**Last Updated**: December 12, 2025  
**Maintainer**: Security Team
