# Admin Panel Security: MNC Best Practices
**Securing Dubai Nest Hub Admin Panel Against Advanced Threats**

> This guide outlines enterprise-grade security measures used by multinational corporations (MNCs) to prevent unauthorized access, data breaches, and cyber attacks on admin panels. Implementation roadmap included.

---

## Table of Contents
1. [Security Architecture Overview](#security-architecture-overview)
2. [Authentication Hardening](#authentication-hardening)
3. [Access Control & Authorization](#access-control--authorization)
4. [Rate Limiting & Brute Force Protection](#rate-limiting--brute-force-protection)
5. [Session Management](#session-management)
6. [Audit Logging & Monitoring](#audit-logging--monitoring)
7. [Network Security](#network-security)
8. [Data Encryption](#data-encryption)
9. [Incident Response](#incident-response)
10. [Implementation Roadmap](#implementation-roadmap)

---

## Security Architecture Overview

### Security Layers (Defense in Depth)

```
┌─────────────────────────────────────────────────────────┐
│ Layer 1: Authentication Layer                           │
│ - Email/Password + MFA                                  │
│ - Invitation-only access                                │
│ - Strong password policy                                │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 2: Authorization Layer                            │
│ - Role-Based Access Control (RBAC)                      │
│ - Least Privilege Principle                             │
│ - Resource-level permissions                            │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 3: Network Security Layer                         │
│ - IP Whitelisting                                       │
│ - TLS/SSL Encryption                                    │
│ - VPN requirement (optional)                            │
│ - WAF (Web Application Firewall)                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 4: Monitoring & Detection Layer                   │
│ - Real-time audit logs                                  │
│ - Anomaly detection                                     │
│ - Failed login tracking                                 │
│ - Suspicious activity alerts                            │
└─────────────────────────────────────────────────────────┘
```

### Current Vulnerabilities
- ❌ Public signup available for admin panel
- ❌ No invitation-only access control
- ❌ Weak password requirements (6 chars minimum)
- ❌ No email domain verification
- ❌ No MFA enforcement for admins
- ❌ No rate limiting on login attempts
- ❌ No IP whitelisting
- ❌ Limited audit trail for admin actions
- ❌ No session timeout controls
- ❌ No admin creation workflow

---

## Authentication Hardening

### 1. Remove Public Signup (Immediate Fix)

**Problem:** Admin signup is publicly accessible, allowing anyone to create an admin account.

**Solution:** Implement invitation-only admin creation.

```typescript
// Admin-only authentication flow
interface AdminInvitation {
  id: string;
  email: string;
  token: string;
  created_at: string;
  accepted_at: string | null;
  invited_by_admin: string;
  expires_at: string; // 7 days from creation
}

// Only super-admin can create invitations
async function inviteAdmin(email: string, role: 'admin' | 'super_admin') {
  // Check if user is super_admin
  // Generate unique invitation token
  // Create invitation record with expiry (7 days)
  // Send invitation email with acceptance link
}

// Users accept invitation with token
async function acceptAdminInvitation(token: string, password: string) {
  // Verify token exists and not expired
  // Verify password meets admin requirements
  // Create user account with admin role
  // Mark invitation as accepted
}
```

### 2. Strong Password Policy for Admins

**Current State:** Minimum 6 characters (Unsafe)

**MNC Best Practice:**
- Minimum 12 characters
- Require: UPPERCASE, lowercase, numbers, special characters
- Cannot contain username/email
- No dictionary words
- Password expiry: 90 days (with warnings at 60, 30, 7 days)
- Password history: Cannot reuse last 5 passwords

```typescript
const ADMIN_PASSWORD_REQUIREMENTS = {
  minLength: 12,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  expiryDays: 90,
  historySize: 5, // Cannot reuse last 5 passwords
};

function validateAdminPassword(password: string, email: string): ValidationResult {
  const checks = {
    length: password.length >= ADMIN_PASSWORD_REQUIREMENTS.minLength,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    numbers: /\d/.test(password),
    specialChars: ADMIN_PASSWORD_REQUIREMENTS.specialChars.split('').some(char => password.includes(char)),
    notEmail: !password.toLowerCase().includes(email.split('@')[0]),
    notCommon: !isCommonPassword(password),
  };

  return {
    isValid: Object.values(checks).every(v => v === true),
    checks,
    message: Object.entries(checks)
      .filter(([_, pass]) => !pass)
      .map(([check]) => `Missing: ${check}`)
      .join(', ')
  };
}
```

### 3. Email Domain Whitelisting

**MNC Best Practice:** Only company email addresses can become admins.

```typescript
// Company email domains configuration
const WHITELISTED_ADMIN_DOMAINS = [
  'truenester.com',
  'nesterhub.com',
  // Add company domains only
];

function validateAdminEmail(email: string): boolean {
  const domain = email.split('@')[1];
  return WHITELISTED_ADMIN_DOMAINS.includes(domain);
}

// Usage in invitation creation
async function inviteAdmin(email: string) {
  if (!validateAdminEmail(email)) {
    throw new Error('Only company email addresses can be admins');
  }
  // Create invitation...
}
```

### 4. Multi-Factor Authentication (MFA) for Admins

**MNC Standard:** All admin accounts MUST have MFA enabled.

**Implementation Options:**
1. **TOTP (Time-based One-Time Password)** - Google Authenticator, Authy
2. **Email OTP** - One-time code sent to verified email
3. **SMS OTP** - One-time code sent to verified phone
4. **Backup Codes** - When MFA setup, generate 10 backup codes for account recovery

```typescript
interface AdminMFA {
  admin_id: string;
  mfa_type: 'totp' | 'email' | 'sms' | 'backup';
  enabled: boolean;
  verified: boolean;
  secret?: string; // TOTP secret
  backup_codes?: string[]; // Hashed backup codes
  created_at: string;
}

// Step 1: Generate TOTP secret
async function generateMFASecret() {
  const secret = speakeasy.generateSecret({
    name: `Dubai Nest Hub (${userEmail})`,
    length: 32,
  });
  return { secret: secret.base32, qrCode: secret.otpauth_url };
}

// Step 2: Verify and enable MFA
async function enableMFA(secret: string, verificationCode: string) {
  const isValid = speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: verificationCode,
    window: 2,
  });

  if (isValid) {
    // Generate 10 backup codes
    const backupCodes = generateBackupCodes();
    // Save to database
    // Return backup codes to user (for safe storage)
  }
}

// Step 3: Login with MFA
async function adminLoginWithMFA(email: string, password: string, mfaCode: string) {
  const admin = await authenticateWithPassword(email, password);
  
  if (!admin.mfa_enabled) {
    throw new Error('Admin account requires MFA');
  }

  const isValidMFA = speakeasy.totp.verify({
    secret: admin.mfa_secret,
    encoding: 'base32',
    token: mfaCode,
    window: 2,
  });

  if (!isValidMFA) {
    throw new Error('Invalid MFA code');
  }

  // MFA verified, create session
  return createAdminSession(admin);
}
```

---

## Access Control & Authorization

### 1. Role-Based Access Control (RBAC)

**MNC Standard:** Principle of Least Privilege - users have minimum permissions needed.

```typescript
enum AdminRole {
  SUPER_ADMIN = 'super_admin',      // Full system access
  ADMIN = 'admin',                  // Standard admin (properties, locations, blog)
  MODERATOR = 'moderator',          // Can only view conversations & approve reviews
  CONTENT_EDITOR = 'content_editor', // Can only manage blog posts
}

interface AdminPermission {
  role: AdminRole;
  canCreate: {
    properties: boolean;
    locations: boolean;
    blogPosts: boolean;
    adminUsers: boolean;
    manageMFA: boolean;
    viewAuditLogs: boolean;
    manageRoles: boolean;
  };
  canEdit: { /* ... */ };
  canDelete: { /* ... */ };
  canView: { /* ... */ };
}

const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission> = {
  [AdminRole.SUPER_ADMIN]: {
    role: AdminRole.SUPER_ADMIN,
    canCreate: {
      properties: true,
      locations: true,
      blogPosts: true,
      adminUsers: true,    // ← Can invite admins
      manageMFA: true,     // ← Can reset MFA for others
      viewAuditLogs: true,
      manageRoles: true,   // ← Can change admin roles
    },
    // ... full permissions for all operations
  },
  [AdminRole.ADMIN]: {
    role: AdminRole.ADMIN,
    canCreate: {
      properties: true,
      locations: true,
      blogPosts: true,
      adminUsers: false,    // ← Cannot invite admins
      manageMFA: false,
      viewAuditLogs: true,  // ← Can view logs
      manageRoles: false,
    },
    // ... standard admin permissions
  },
  // ... other roles
};
```

### 2. Implement Route-Level Protection

```typescript
// In App.tsx - Wrap admin routes with role-based protection

<Route 
  path="/admin/settings" 
  element={
    <ProtectedRoute requireAdmin={true} requiredRole={AdminRole.SUPER_ADMIN}>
      <Settings />
    </ProtectedRoute>
  } 
/>

<Route 
  path="/admin/conversations" 
  element={
    <ProtectedRoute requireAdmin={true} requiredRole={AdminRole.MODERATOR}>
      <ConversationsPage />
    </ProtectedRoute>
  } 
/>

// Can also use hook-based protection
function useRequireRole(requiredRole: AdminRole) {
  const { adminRole } = useAuth();
  
  if (!ROLE_PERMISSIONS[adminRole]?.canView?.some) {
    throw new Error('Insufficient permissions');
  }
}
```

---

## Rate Limiting & Brute Force Protection

### 1. Login Rate Limiting

**MNC Best Practice:** Prevent automated brute force attacks using exponential backoff.

```typescript
interface LoginAttempt {
  email: string;
  ip_address: string;
  timestamp: string;
  success: boolean;
}

// Track login attempts
async function trackLoginAttempt(email: string, ipAddress: string, success: boolean) {
  const window = 15 * 60 * 1000; // 15-minute window
  const now = new Date();
  const windowStart = new Date(now.getTime() - window);

  const attempts = await supabase
    .from('login_attempts')
    .select('*')
    .eq('email', email)
    .eq('ip_address', ipAddress)
    .gte('timestamp', windowStart.toISOString())
    .eq('success', false);

  return attempts.data || [];
}

// Check if account should be locked
async function shouldLockAccount(email: string, ipAddress: string): Promise<{ locked: boolean; until?: Date }> {
  const attempts = await trackLoginAttempt(email, ipAddress, false);
  
  if (attempts.length >= 5) {
    const lockoutDuration = Math.min(60 * attempts.length, 3600) * 1000; // Max 1 hour
    const lockedUntil = new Date(new Date().getTime() + lockoutDuration);
    return { locked: true, until: lockedUntil };
  }
  
  return { locked: false };
}

// In admin login endpoint
async function adminLogin(email: string, password: string, ipAddress: string) {
  const { locked, until } = await shouldLockAccount(email, ipAddress);
  
  if (locked) {
    throw new Error(`Account temporarily locked. Try again after ${until.toLocaleTimeString()}`);
  }

  const admin = await authenticateWithPassword(email, password);
  
  if (admin) {
    await trackLoginAttempt(email, ipAddress, true);
    return createAdminSession(admin);
  } else {
    await trackLoginAttempt(email, ipAddress, false);
    throw new Error('Invalid email or password');
  }
}
```

### 2. Request Rate Limiting (API Level)

```typescript
// Using express-rate-limit
import rateLimit from 'express-rate-limit';

// Admin login endpoint - strict limits
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isWhitelistedIP(req.ip), // Skip for company IPs
  store: new RedisStore(), // Use Redis for distributed rate limiting
});

// MFA endpoint - moderate limits
const mfaLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 attempts per windowMs
  message: 'Too many MFA attempts',
});

// Admin API endpoints - general limits
const adminApiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests',
  skip: (req) => req.adminId, // Only apply to non-authenticated
});

// Usage in Express
app.post('/api/admin/login', adminLoginLimiter, adminLoginHandler);
app.post('/api/admin/mfa/verify', mfaLimiter, verifyMFAHandler);
app.use('/api/admin/', adminApiLimiter);
```

---

## Session Management

### 1. Secure Session Configuration

```typescript
interface AdminSession {
  session_id: string;
  admin_id: string;
  admin_email: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
  last_activity: string;
  expires_at: string;
  mfa_verified: boolean;
  device_fingerprint: string;
}

const SESSION_CONFIG = {
  maxDuration: 8 * 60 * 60 * 1000, // 8 hours max session
  inactivityTimeout: 30 * 60 * 1000, // 30 minutes inactivity
  absoluteTimeout: 24 * 60 * 60 * 1000, // 24 hours absolute
  refreshInterval: 15 * 60 * 1000, // Refresh token every 15 minutes
};

// Session timeout check
function isSessionExpired(session: AdminSession): boolean {
  const now = new Date();
  const lastActivity = new Date(session.last_activity);
  const expiresAt = new Date(session.expires_at);

  // Check absolute timeout
  if (now > expiresAt) return true;

  // Check inactivity timeout
  if (now.getTime() - lastActivity.getTime() > SESSION_CONFIG.inactivityTimeout) {
    return true;
  }

  return false;
}

// Device fingerprinting (prevent session hijacking)
function generateDeviceFingerprint(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';
  ctx.font = '14px "Arial"';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#f60';
  ctx.fillRect(125, 1, 62, 20);
  ctx.fillStyle = '#069';
  ctx.fillText('Browser Fingerprint', 2, 15);
  ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
  ctx.fillText('Browser Fingerprint', 4, 17);
  
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(canvas.toDataURL()));
}

// Verify session device hasn't changed
function validateSessionDevice(session: AdminSession, currentFingerprint: string): boolean {
  return session.device_fingerprint === currentFingerprint;
}
```

### 2. Secure Logout

```typescript
async function adminLogout(sessionId: string) {
  // Invalidate session in database
  await supabase
    .from('admin_sessions')
    .update({ expires_at: new Date().toISOString() })
    .eq('session_id', sessionId);

  // Clear auth tokens from storage
  localStorage.removeItem('admin_session_token');
  localStorage.removeItem('admin_refresh_token');

  // Optional: Notify of logout
  await logAdminActivity({
    admin_id: session.admin_id,
    action: 'LOGOUT',
    ipAddress: getClientIP(),
    timestamp: new Date(),
  });

  // Redirect to login
  window.location.href = '/admin/login';
}
```

---

## Audit Logging & Monitoring

### 1. Comprehensive Audit Trail

**MNC Standard:** Log every significant admin action with immutable records.

```typescript
interface AuditLog {
  id: string;
  admin_id: string;
  admin_email: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'EXPORT' | 'LOGIN' | 'LOGOUT' | 'MFA_ENABLE' | 'MFA_DISABLE' | 'ROLE_CHANGE';
  resource_type: 'property' | 'location' | 'blog_post' | 'conversation' | 'review' | 'admin_user' | 'settings';
  resource_id?: string;
  changes?: Record<string, any>; // What was changed
  ip_address: string;
  user_agent: string;
  timestamp: string;
  status: 'SUCCESS' | 'FAILURE';
  reason?: string; // Why it failed or was denied
  data_accessed?: string[]; // Sensitive fields accessed
}

// Log helper function
export async function logAdminAudit(log: Omit<AuditLog, 'id' | 'timestamp'>) {
  const { data, error } = await supabase
    .from('admin_audit_logs')
    .insert([{
      ...log,
      timestamp: new Date().toISOString(),
    }]);

  if (error) console.error('Failed to log audit:', error);
  return data;
}

// Usage examples
// When property is updated:
await logAdminAudit({
  admin_id: currentAdmin.id,
  admin_email: currentAdmin.email,
  action: 'UPDATE',
  resource_type: 'property',
  resource_id: propertyId,
  changes: { price: { old: 5000000, new: 5500000 } },
  ip_address: req.ip,
  user_agent: req.headers['user-agent'],
  status: 'SUCCESS',
});

// When sensitive data is accessed:
await logAdminAudit({
  admin_id: currentAdmin.id,
  admin_email: currentAdmin.email,
  action: 'VIEW',
  resource_type: 'conversation',
  resource_id: conversationId,
  data_accessed: ['customer_email', 'customer_phone'],
  ip_address: req.ip,
  user_agent: req.headers['user-agent'],
  status: 'SUCCESS',
});
```

### 2. Real-time Alerts for Suspicious Activity

```typescript
interface SecurityAlert {
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  event: string;
  admin_id: string;
  timestamp: string;
  details: Record<string, any>;
}

async function checkAndAlertSuspiciousActivity(auditLog: AuditLog) {
  const alerts: SecurityAlert[] = [];

  // Check 1: Multiple failed login attempts from new IP
  const failedLogins = await supabase
    .from('admin_audit_logs')
    .select('*')
    .eq('admin_id', auditLog.admin_id)
    .eq('action', 'LOGIN')
    .eq('status', 'FAILURE')
    .gte('timestamp', new Date(Date.now() - 60 * 60 * 1000).toISOString())
    .neq('ip_address', auditLog.ip_address);

  if (failedLogins.data.length >= 3) {
    alerts.push({
      severity: 'HIGH',
      event: 'Multiple failed login attempts from new IP',
      admin_id: auditLog.admin_id,
      timestamp: new Date().toISOString(),
      details: {
        failedAttempts: failedLogins.data.length,
        lastIP: failedLogins.data[0].ip_address,
      },
    });
  }

  // Check 2: Mass export of sensitive data
  if (auditLog.action === 'EXPORT') {
    const exports = await supabase
      .from('admin_audit_logs')
      .select('*')
      .eq('admin_id', auditLog.admin_id)
      .eq('action', 'EXPORT')
      .gte('timestamp', new Date(Date.now() - 60 * 60 * 1000).toISOString());

    if (exports.data.length >= 5) {
      alerts.push({
        severity: 'MEDIUM',
        event: 'Unusual export pattern detected',
        admin_id: auditLog.admin_id,
        timestamp: new Date().toISOString(),
        details: {
          exportsInLastHour: exports.data.length,
        },
      });
    }
  }

  // Check 3: Access from unexpected geographic location
  const lastIP = auditLog.ip_address;
  const previousIPs = await getAdminAccessHistory(auditLog.admin_id);
  if (isUnexpectedLocation(lastIP, previousIPs)) {
    alerts.push({
      severity: 'MEDIUM',
      event: 'Access from unexpected location',
      admin_id: auditLog.admin_id,
      timestamp: new Date().toISOString(),
      details: {
        newLocation: await getIPLocation(lastIP),
      },
    });
  }

  // Send alerts to admin team
  for (const alert of alerts) {
    await sendSecurityAlert(alert);
  }
}

async function sendSecurityAlert(alert: SecurityAlert) {
  // Send email notification
  await sendEmail({
    to: 'security@truenester.com',
    subject: `${alert.severity} Security Alert: ${alert.event}`,
    body: formatAlertEmail(alert),
  });

  // Send Slack notification
  await sendSlackNotification({
    channel: '#security-alerts',
    text: `🚨 ${alert.severity}: ${alert.event}`,
    blocks: formatAlertSlack(alert),
  });

  // Log to SIEM system
  await sendToSIEM(alert);
}
```

### 3. Audit Log Dashboard

Create `/admin/audit-logs` page with:
- Filter by admin user, date range, action type, resource type
- Search by admin email, IP address, resource ID
- Export audit logs (CSV/JSON) for compliance
- Real-time alert visualization
- Suspicious activity highlighting

---

## Network Security

### 1. IP Whitelisting for Admin Access

**MNC Best Practice:** Restrict admin panel access to company IP ranges.

```typescript
interface IPWhitelist {
  id: string;
  ip_address: string; // Can be single IP or CIDR range
  description: string; // e.g., "Dubai office", "VPN gateway"
  added_by: string;
  created_at: string;
  active: boolean;
}

// Check if IP is whitelisted
async function isIPWhitelisted(ipAddress: string): Promise<boolean> {
  const whitelist = await supabase
    .from('ip_whitelist')
    .select('ip_address')
    .eq('active', true);

  const ip = require('ip');

  return whitelist.data.some(entry => {
    if (entry.ip_address.includes('/')) {
      // CIDR range
      return ip.cidrSubnet(entry.ip_address).contains(ipAddress);
    }
    return entry.ip_address === ipAddress;
  });
}

// Middleware to enforce IP whitelisting
async function enforceIPWhitelist(req, res, next) {
  const clientIP = getClientIP(req);
  const isWhitelisted = await isIPWhitelisted(clientIP);

  if (!isWhitelisted) {
    await logAdminAudit({
      action: 'LOGIN',
      status: 'FAILURE',
      reason: 'IP not whitelisted',
      ip_address: clientIP,
    });

    return res.status(403).json({
      error: 'Access denied: Your IP address is not whitelisted for admin access',
    });
  }

  next();
}

// Apply to admin routes
app.use('/admin', enforceIPWhitelist);
```

### 2. HTTPS/TLS Enforcement

```typescript
// Always redirect HTTP to HTTPS
app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https' && process.env.NODE_ENV === 'production') {
    return res.redirect(307, `https://${req.header('host')}${req.url}`);
  }
  next();
});

// Set security headers
app.use((req, res, next) => {
  res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});
```

### 3. CORS Configuration for Admin

```typescript
const adminCorsOptions = {
  origin: process.env.ADMIN_FRONTEND_URL, // e.g., https://admin.truenester.com
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-api-key'],
  maxAge: 3600,
};

app.use('/api/admin', cors(adminCorsOptions));
```

---

## Data Encryption

### 1. Sensitive Data Encryption at Rest

```typescript
import { encrypt, decrypt } from '@/lib/security/encryption';

// Encrypt sensitive admin-accessed data
async function getConversationWithEncryption(conversationId: string) {
  const { data: conversation, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single();

  if (conversation) {
    // Decrypt sensitive fields
    return {
      ...conversation,
      customer_email: decrypt(conversation.customer_email, ENCRYPTION_KEY),
      customer_phone: decrypt(conversation.customer_phone, ENCRYPTION_KEY),
      customer_name: decrypt(conversation.customer_name, ENCRYPTION_KEY),
    };
  }

  return null;
}

// Encrypt when storing
async function saveConversation(data: any) {
  const encrypted = {
    ...data,
    customer_email: encrypt(data.customer_email, ENCRYPTION_KEY),
    customer_phone: encrypt(data.customer_phone, ENCRYPTION_KEY),
    customer_name: encrypt(data.customer_name, ENCRYPTION_KEY),
  };

  const { data: saved, error } = await supabase
    .from('conversations')
    .insert([encrypted]);

  return saved;
}
```

### 2. Encryption Keys Management

```typescript
const ENCRYPTION_CONFIG = {
  algorithm: 'aes-256-gcm',
  keyDerivation: 'pbkdf2',
  iterations: 100000,
  saltLength: 32,
  ivLength: 16,
  authTagLength: 16,
};

// Use environment variables for keys (never hardcode)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || Buffer.from(
  crypto.pbkdf2Sync(
    process.env.ENCRYPTION_PASSWORD || 'default',
    process.env.ENCRYPTION_SALT || 'default',
    ENCRYPTION_CONFIG.iterations,
    32,
    'sha256'
  )
);

// Rotate encryption keys periodically
async function rotateEncryptionKeys() {
  // Generate new key
  const newKey = crypto.randomBytes(32);
  
  // Re-encrypt all sensitive data with new key
  // Store old key temporarily for decryption
  // Update environment variables
  // Monitor process to ensure successful rotation
  
  // This should be done at least annually
}
```

---

## Incident Response

### 1. Security Incident Response Plan

When suspicious activity is detected:

```typescript
async function handleSecurityIncident(incident: SecurityAlert) {
  // Step 1: Immediate containment
  if (incident.severity === 'CRITICAL') {
    // Lock the admin account
    await lockAdminAccount(incident.admin_id, 'Security incident detected');
    
    // Invalidate all sessions
    await invalidateAllAdminSessions(incident.admin_id);
    
    // Reset MFA
    await resetAdminMFA(incident.admin_id);
  }

  // Step 2: Collect evidence
  const auditLogs = await getAuditLogsByAdmin(incident.admin_id);
  const sessionLogs = await getSessionLogsByAdmin(incident.admin_id);
  const ipLogs = await getIPAccessLogs(incident.admin_id);

  // Step 3: Notify security team
  await notifySecurityTeam({
    incident,
    auditLogs,
    sessionLogs,
    ipLogs,
  });

  // Step 4: Investigation
  const investigation = await createIncidentInvestigation({
    incident_id: generateID(),
    severity: incident.severity,
    incident_details: incident,
    evidence: { auditLogs, sessionLogs, ipLogs },
    assigned_to: 'security-team',
    status: 'OPEN',
    created_at: new Date(),
  });

  // Step 5: Recovery (after investigation confirms action needed)
  if (investigation.confirmed_breach) {
    // Force password reset
    // Revoke all sessions
    // Require MFA re-setup
    // Audit all actions by this admin
  }
}
```

### 2. Breach Notification Procedures

```typescript
async function notifyDataBreach(details: {
  affected_count: number;
  data_types: string[];
  affected_customers?: string[];
  root_cause: string;
}) {
  // Notify legal team (within 72 hours of discovery per GDPR)
  await sendToLegalTeam(details);

  // Notify affected customers (if needed)
  if (details.affected_customers?.length > 0) {
    await notifyAffectedCustomers(details.affected_customers, details);
  }

  // File incident report
  await createIncidentReport(details);

  // Update security dashboard
  await updateSecurityMetrics('breach_detected', details);

  // Document for compliance audits
  await storeComplianceDocumentation(details);
}
```

---

## Implementation Roadmap

### Phase 1: Immediate (This Week) ⚡
Priority: **CRITICAL** - Address current vulnerabilities

- [ ] Remove public signup from admin panel
- [ ] Implement invitation-only admin creation
- [ ] Wrap admin routes with `ProtectedRoute` and `requireAdmin=true`
- [ ] Create admin-only authentication page
- [ ] Add email domain whitelisting

**Effort:** 2-3 hours
**Risk Reduction:** 60%

### Phase 2: High Priority (Week 1-2)
Priority: **HIGH** - Core security controls

- [ ] Implement strong password policy for admins (12+ chars)
- [ ] Add brute force protection with account lockout
- [ ] Create admin audit logging system
- [ ] Implement rate limiting on login endpoints
- [ ] Add session timeout and management
- [ ] Create admin_users table with roles

**Effort:** 8-10 hours
**Risk Reduction:** 30%

### Phase 3: Medium Priority (Week 2-3)
Priority: **MEDIUM** - Enhanced controls

- [ ] Implement MFA (TOTP/Google Authenticator) for admins
- [ ] Add IP whitelisting functionality
- [ ] Create audit log dashboard
- [ ] Implement real-time security alerts
- [ ] Add device fingerprinting for session validation
- [ ] Create admin management page (invite, roles, permissions)

**Effort:** 12-15 hours
**Risk Reduction:** 8%

### Phase 4: Advanced (Week 3-4)
Priority: **NICE-TO-HAVE** - Premium features

- [ ] Implement encryption for sensitive data at rest
- [ ] Add API key authentication for backend services
- [ ] Create security incident response playbook
- [ ] Implement SIEM integration
- [ ] Add anomaly detection for admin behavior
- [ ] Create compliance reporting dashboard

**Effort:** 16-20 hours
**Risk Reduction:** 2%

---

## Testing Checklist

### Authentication Testing
- [ ] Attempt to signup as admin (should fail)
- [ ] Attempt to access /admin without authentication (should redirect to login)
- [ ] Login with valid credentials (should succeed)
- [ ] Login with invalid password (should fail after N attempts and lock account)
- [ ] Accept invitation with valid token (should succeed)
- [ ] Accept invitation with expired token (should fail)
- [ ] Set password with weak credentials (should fail with specific requirements)
- [ ] Setup and verify MFA (TOTP codes should work)

### Authorization Testing
- [ ] Access /admin/dashboard as ADMIN role (should succeed)
- [ ] Access /admin/settings as ADMIN role (should fail - need SUPER_ADMIN)
- [ ] Create new admin as SUPER_ADMIN (should succeed)
- [ ] Create new admin as ADMIN role (should fail)

### Security Testing
- [ ] Brute force login (should lock after 5 attempts)
- [ ] Test with non-whitelisted IP (should fail if configured)
- [ ] Attempt to manipulate JWT token (should fail)
- [ ] Check rate limiting on API endpoints (should block excessive requests)
- [ ] Verify audit logs are created for all actions
- [ ] Verify session expires after inactivity period
- [ ] Test MFA bypass attempts (should fail)

---

## Compliance & Standards

This implementation follows:
- **OWASP Top 10** - Protects against A01:2021 – Broken Access Control
- **NIST Cybersecurity Framework** - Core Functions: Identify, Protect, Detect, Respond
- **ISO 27001** - Information Security Management
- **GDPR/CCPA** - Data protection requirements
- **SOC 2 Type II** - Security controls for service organizations
- **PCI DSS** - Payment Card Industry standards (where applicable)

---

## Resources

### Recommended Tools
- **Authy** or **Google Authenticator** - MFA
- **1Password** or **HashiCorp Vault** - Secrets management
- **Datadog** or **New Relic** - Monitoring & alerting
- **Okta** or **Auth0** - Identity management (alternative to Supabase Auth)
- **Cloudflare** - DDoS protection & WAF

### Documentation
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Supabase Security](https://supabase.com/docs/guides/security)
- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)

---

## Quick Reference: What's Different from Standard Users

| Feature | Standard User | Admin User |
|---------|---------------|-----------|
| Signup | Public |  Invitation-only |
| Password Length | 6+ chars | 12+ chars with complexity |
| Password Expiry | No | 90 days |
| Email Domain | Any | Company domains only |
| MFA | Optional | **Required** |
| Session Timeout | 30 days | 8 hours |
| Inactivity Timeout | 7 days | 30 minutes |
| IP Whitelisting | No | Yes (by company policy) |
| Audit Logging | Limited | Comprehensive |
| Rate Limiting | Per account | Strict per IP |
| Device Binding | No | Yes (fingerprinting) |

---

## Summary

By implementing these MNC best practices, Dubai Nest Hub will achieve:

✅ **Prevention**: Stop unauthorized access before it happens
✅ **Detection**: Identify suspicious activity in real-time
✅ **Response**: Quickly contain and investigate incidents
✅ **Compliance**: Meet legal and regulatory requirements
✅ **Trust**: Demonstrate commitment to data protection
✅ **Resilience**: Recover quickly from security incidents

**Status:** 🚨 Phase 1 (Immediate fixes) can be implemented TODAY

**Next:** Begin with removing public signup and implementing invitation-only access.
