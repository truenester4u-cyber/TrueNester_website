# 🔐 Security and Data Protection Policy

**Document Version**: 1.0  
**Last Updated**: December 12, 2025  
**Status**: Active  
**Compliance**: GDPR, CCPA, UAE DPA, ISO 27001

---

## 1. Executive Summary

Dubai Nest Hub implements comprehensive security and data protection measures to safeguard consumer information. This policy outlines our commitment to protecting user data through technical, organizational, and legal safeguards.

**Our Promise**: We protect your data with enterprise-grade security and transparent practices.

---

## 2. Data We Collect

### 2.1 User Registration Data
- **Full Name**: Used for account identification and personalization
- **Email Address**: For authentication and communications
- **Phone Number**: For contact and inquiry follow-up (optional)
- **Password**: Hashed with bcrypt (never stored in plain text)
- **Account Created Date**: For audit and compliance tracking

### 2.2 Property Inquiry Data
- **Customer Name & Email**: From inquiry forms
- **Phone Number**: For agent contact
- **Property Interest**: Which property was inquired about
- **Message**: Customer's specific questions or requirements
- **Intent**: Buy, rent, or sell
- **Budget Range**: Property price preferences
- **Location Preferences**: Areas of interest

### 2.3 Chatbot & Lead Data
- **Conversation History**: Chat messages with our AI bot
- **Lead Score**: Calculated engagement metric (0-100)
- **Interaction Metadata**: Timestamps, session info
- **Property Preferences**: Types, locations, budgets
- **Contact Information**: Email, phone (from chatbot flows)

### 2.4 Saved Properties & Activities
- **Saved Properties List**: Properties marked as favorites
- **View History**: Which properties you viewed
- **Interaction Timestamps**: When activities occurred
- **Search Queries**: Properties and locations searched

### 2.5 Payment & Transaction Data
- **Payment Methods**: Credit card last 4 digits, type (not full card)
- **Transaction Records**: Payment amounts, dates, status
- **Billing Address**: For transaction processing

---

## 3. How We Protect Your Data

### 3.1 Data Encryption

#### In Transit (End-to-End)
```
All data transmission uses TLS 1.3 encryption:
├── Frontend to Backend: HTTPS/TLS 1.3
├── Backend to Supabase: Encrypted connection
├── API Communications: SSL Certificate pinning (production)
└── External APIs: Verified HTTPS endpoints
```

#### At Rest (Database)
```
Supabase PostgreSQL Encryption:
├── Database Level: AES-256 encryption
├── Sensitive Fields: Additional encryption layer
│   ├── phone_numbers: Encrypted
│   ├── passwords: Bcrypt hashed + salted
│   └── payment_data: Tokenized (PCI-DSS compliant)
└── Backups: Encrypted daily
```

#### Sensitive Field Encryption Implementation
```typescript
// Encryption utilities for sensitive data
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.DATA_ENCRYPTION_KEY; // 32-byte key
const ALGORITHM = 'aes-256-gcm';

export const encryptSensitiveData = (data: string): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
};

export const decryptSensitiveData = (encrypted: string): string => {
  const [iv, authTag, data] = encrypted.split(':');
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY),
    Buffer.from(iv, 'hex')
  );
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  let decrypted = decipher.update(data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};
```

### 3.2 Access Control

#### Role-Based Access Control (RBAC)
```
User Roles:
├── Public User
│   ├── Can: View published properties
│   ├── Can: Create inquiries
│   ├── Can: Chat with chatbot
│   └── Cannot: Access other users' data
│
├── Authenticated Customer
│   ├── Can: All public user actions
│   ├── Can: Save properties
│   ├── Can: View own inquiries
│   ├── Can: Manage own profile
│   └── Cannot: Access admin features
│
├── Admin
│   ├── Can: Manage all conversations
│   ├── Can: Create/edit properties
│   ├── Can: View analytics
│   ├── Can: Export customer data
│   └── Can: Manage system settings
│
└── Super Admin
    ├── Can: All admin features
    ├── Can: Manage admin users
    ├── Can: Configure security policies
    └── Can: Access audit logs
```

#### Row-Level Security (RLS) in Supabase
```sql
-- Customer can only view own profile
CREATE POLICY customer_own_profile ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Customer can only view own conversations
CREATE POLICY customer_conversations ON conversations
  FOR SELECT USING (auth.uid() = customer_id);

-- Admin can view all conversations (with API key)
CREATE POLICY admin_conversations ON conversations
  FOR SELECT USING (auth.role() = 'admin');

-- Public can only view published properties
CREATE POLICY public_properties ON properties
  FOR SELECT USING (published = true);

-- Only property owner can edit property
CREATE POLICY property_owner_edit ON properties
  FOR UPDATE USING (auth.uid() = created_by);
```

### 3.3 Authentication Security

#### Password Requirements
```
Minimum Requirements:
├── Length: 12+ characters
├── Complexity: Must include:
│   ├── Uppercase letters (A-Z)
│   ├── Lowercase letters (a-z)
│   ├── Numbers (0-9)
│   └── Special characters (!@#$%^&*)
├── No: Dictionary words, sequential patterns
└── No: Reuse of last 5 passwords
```

#### Multi-Factor Authentication (MFA)
```
Available Methods:
├── Email OTP: 6-digit code (7 min expiry)
├── TOTP: Time-based one-time password
│   └── Support: Google Authenticator, Authy
├── SMS: Short code (when verified)
└── Backup Codes: 10x single-use recovery codes

Implementation:
├── Enabled for: Admin accounts (mandatory)
├── Optional for: Customer accounts
└── Recovery: Backup codes provided
```

#### Session Management
```
Session Configuration:
├── Duration: 24 hours (extendable)
├── Idle Timeout: 30 minutes
├── Refresh Token: Rotated on each use
├── Device Binding: Device fingerprinting
├── Concurrent Sessions: Max 3 devices
└── Logout: All sessions terminable
```

### 3.4 Admin API Security

#### API Key Management
```
Requirements:
├── Minimum Length: 32 characters
├── Rotation Policy: Every 90 days
├── Validation: x-admin-api-key header
├── Rate Limiting: 1000 requests/hour
├── IP Whitelisting: (Optional)
└── Request Signing: HMAC-SHA256

Key Generation:
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### API Endpoint Security
```
Endpoint Protection:
├── GET /api/admin/conversations
│   ├── Requires: API key + Admin role
│   └── Returns: Paginated results (max 100)
│
├── PATCH /api/admin/conversations/:id
│   ├── Requires: API key + Ownership/Admin
│   └── Validates: Input with Zod
│
├── POST /api/chatbot/leads
│   ├── Rate Limited: 100 req/hour per IP
│   ├── CAPTCHA: Optional on high volume
│   └── Validates: Email format, phone format
│
└── GET /health
    ├── Public endpoint
    └── Returns: Service status only
```

---

## 4. Data Usage Policies

### 4.1 Permitted Uses

We use your data to:
- **Account Management**: Create, authenticate, maintain your account
- **Service Delivery**: Connect you with properties and agents
- **Communication**: Send notifications, inquiries, updates
- **Analytics**: Improve service and user experience (anonymized)
- **Legal Compliance**: Meet regulatory requirements
- **Fraud Prevention**: Detect and prevent fraudulent activity
- **Slack Notifications**: Alert agents about new leads (aggregate)

### 4.2 Prohibited Uses

We will NOT:
- Sell your personal data to third parties
- Use your data for marketing without consent
- Share with unauthorized organizations
- Use payment info for any purpose besides processing
- Create consumer profiles for resale
- Use for discriminatory purposes
- Share with data brokers

### 4.3 Data Retention Schedule

```
Data Type               | Retention Period | Notes
|----------------------|------------------|------------|
| Active Account        | Duration + 1yr   | Then deletion
| Closed Account        | 1 year max       | Then secure deletion
| Inquiries/Messages    | 2 years          | Then anonymized
| Payment Records       | 7 years          | Tax/audit requirements
| Logs                  | 90 days          | Archived after
| Analytics Data        | 24 months        | Anonymized
| Backup Data           | 90 days          | Encrypted off-site
| User Activity Logs    | 1 year           | GDPR compliance
```

---

## 5. Consumer Rights & Data Subject Access

### 5.1 Your Rights

Under GDPR/CCPA/UAE DPA, you have the right to:

#### Right to Access (Article 15/1798.100)
- Request copy of all personal data we hold
- Understand how and why we use it
- **Process**: Submit request to privacy@nesthubarabia.com
- **Timeline**: 30 days response

#### Right to Rectification (Article 16/1798.110)
- Correct inaccurate or incomplete data
- Update your profile directly or request assistance
- **Self-Service**: Dashboard settings
- **Assisted**: Contact support@nesthubarabia.com

#### Right to Erasure (Article 17/1798.105)
- Request deletion of personal data
- Right to "be forgotten" (with exceptions)
- **Exceptions**: Legal obligations, legitimate business interests
- **Timeline**: 30 days after verification

#### Right to Data Portability (Article 20/1798.100)
- Receive data in portable format (JSON/CSV)
- Transfer to another service provider
- **Supported Formats**: JSON, CSV, XML
- **Timeline**: 30 days

#### Right to Object (Article 21/1798.120)
- Opt-out of profiling/automated decisions
- Stop marketing communications
- Withdraw consent anytime

#### Right to Restrict Processing (Article 18)
- Limit how we use your data
- Data remains stored but not processed
- Exception: Fraud prevention

#### Right to Lodge a Complaint (Article 77)
- File complaint with data protection authority
- **UAE**: DFSA (dfsa.ae)
- **EU**: Your local DPA
- **California**: California Attorney General

### 5.2 How to Exercise Your Rights

```
Contact Methods:

📧 Email:
   privacy@nesthubarabia.com
   (Standard reply: 3 business days)

📱 Phone:
   +971-4-XXX-XXXX
   (Hours: 9AM-6PM GST, Mon-Fri)

🌐 Online Portal:
   dashboard.nesthubarabia.com/privacy
   (Self-service requests)

📮 Mail:
   Dubai Nest Hub Privacy Team
   Dubai, UAE
```

---

## 6. Data Breach Response Protocol

### 6.1 Breach Detection & Assessment

```
Step 1: Detection
├── Automated monitoring: Real-time alerts
├── Manual review: Weekly security audits
├── User reports: Support tickets
└── Timeline: Investigate within 24 hours

Step 2: Assessment
├── Determine: Type and scope of data
├── Identify: Affected users count
├── Risk analysis: Impact level (Low/Medium/High/Critical)
└── Document: All findings with evidence
```

### 6.2 Breach Notification Timeline

```
Risk Level  | Notification Timeline | Actions
|-----------|----------------------|---------|
| Low       | Within 5 days        | Email + Dashboard alert
| Medium    | Within 48 hours      | Email + SMS + Support call
| High      | Within 24 hours      | Email + SMS + Call + Press
| Critical  | Immediate (< 4hrs)   | All methods + Authority
```

### 6.3 Breach Response Actions

```
For GDPR/CCPA Breaches:

1. Notification (required)
   ├── To affected individuals
   ├── To regulatory authorities
   └── To media (if >500 people)

2. Mitigation (immediate)
   ├── Isolate compromised systems
   ├── Revoke compromised credentials
   ├── Force password resets
   └── Reset API keys

3. Investigation (10 days)
   ├── Forensic analysis
   ├── Determine cause
   ├── Identify vulnerabilities
   └── Document timeline

4. Prevention (30 days)
   ├── Implement fixes
   ├── Enhance monitoring
   ├── Update security policies
   └── Security training
```

### 6.4 Breach Contact Information

```
Email Security Reports to:
  security@nesthubarabia.com

Phone (24/7):
  +971-4-XXX-XXXX (option 1: "Security Incident")

Backup Contacts:
  privacy@nesthubarabia.com
  ciso@nesthubarabia.com
```

---

## 7. Compliance Standards

### 7.1 Regulatory Compliance

```
✅ GDPR Compliance (EU residents)
├── Legal basis: Consent + Legitimate interest
├── Data Processing Agreements: In place
├── Privacy by Design: Implemented
├── DPA: Supabase as processor
└── Audit: Annual third-party audit

✅ CCPA Compliance (California residents)
├── Consumer rights: Fully implemented
├── Opt-out mechanisms: Available
├── Data sale prohibition: Enforced
├── Privacy policy: Updated
└── Verification: Consumer identity verified

✅ UAE Data Protection Law
├── Data localization: Compliant
├── Processing lawfulness: Documented
├── Consumer rights: Available
├── Cross-border transfers: Approved
└── Registration: With DFSA

✅ PCI-DSS Compliance (Payment)
├── Level: 3 (Service Provider)
├── Assessment: Annual
├── Scope: Payment processing only
├── Non-compliance: Zero tolerance
└── Vendor: Stripe (PCI-DSS Level 1)
```

### 7.2 Industry Standards

```
ISO 27001: Information Security Management
├── Scope: Entire organization
├── Certification: Applied for
├── Audit: Quarterly internal
└── Gap analysis: Monthly

SOC 2 Type II: Security & Availability
├── Controls: 64 control objectives
├── Audit period: 6+ months
├── Scope: Systems & processes
└── Report: For customer due diligence
```

---

## 8. Third-Party Data Handling

### 8.1 Data Processors & Controllers

```
Processor            | Purpose         | Data Type           | Location
|-------------------|-----------------|---------------------|----------|
| Supabase           | Database        | All personal data    | EU/US
| Stripe             | Payments        | Payment info only    | US
| Slack              | Notifications   | Lead info (agg)      | US
| Google OAuth       | Auth            | Email, name          | US
| SendGrid           | Email           | Email + message      | US
| Datadog            | Monitoring      | Anonymized logs      | US/EU
```

### 8.2 Data Processing Agreements

All processors have signed Data Processing Agreements (DPAs) that:
- Limit data use to specified purposes
- Mandate security standards (SOC2/ISO27001)
- Require sub-processor agreements
- Allow data subject rights exercise
- Enable audits and inspections
- Mandate breach notification
- Ensure data deletion on termination

### 8.3 International Data Transfers

```
Transfer Mechanism: Standard Contractual Clauses (SCCs)
├── Compliant with: GDPR Article 46
├── Covers: EU→US transfers
├── Updated: December 2024 (post-Schrems II)
├── Adequacy review: Ongoing
└── Supplementary measures: Encryption

Transfer Countries:
├── EU (Supabase): Essential infrastructure
├── US (Stripe, Slack, Google): Contractually restricted
└── UAE (Optional local deployment)
```

---

## 9. Security Incident Response Plan

### 9.1 Incident Classification

```
Level 1 - Informational
├── Definition: No data risk
├── Examples: Failed login attempts, access denied
└── Response: Monitor only

Level 2 - Minor
├── Definition: Limited exposure, contained quickly
├── Examples: Misconfigured permissions, brief access
├── Response: Fix within 24 hours, log incident

Level 3 - Moderate
├── Definition: Data accessed, notification needed
├── Examples: Compromised account, unauthorized access
├── Response: Notify users + authorities, 48-hour investigation

Level 4 - Severe
├── Definition: Widespread data exposure
├── Examples: Database breach, ransomware
├── Response: Immediate response, law enforcement, media notice

Level 5 - Critical
├── Definition: Complete system compromise
├── Examples: Nation-state attack, large-scale breach
├── Response: Executive escalation, all stakeholders, law enforcement
```

### 9.2 Incident Response Team

```
CISO (Chief Information Security Officer)
├── Authority: Final decision maker
├── Availability: 24/7
└── Contact: ciso@nesthubarabia.com

Security Engineer
├── Role: Investigation & remediation
├── Team: 2-3 engineers
└── Timeline: On-call rotation

Legal Counsel
├── Role: Regulatory compliance
├── Review: All notifications
└── Escalation: When needed

Communications Lead
├── Role: Internal & external messaging
├── Approval: CISO/CEO
└── Channels: Email, press, social media
```

---

## 10. Employee Security Obligations

### 10.1 Access Requirements

All employees handling customer data must:
- Sign confidentiality agreement
- Complete security training (annual)
- Pass background check
- Maintain minimum credentials:
  - CompTIA Security+
  - GDPR certification
  - PCI-DSS training

### 10.2 Code of Conduct

```
Prohibited Actions:
├── Accessing data outside job scope
├── Sharing credentials or API keys
├── Discussing customer data publicly
├── Removing data from company devices
├── Using personal devices for work
├── Connecting to public WiFi
├── Sharing passwords via email
└── Disabling security features

Enforcement:
├── First violation: Written warning
├── Second violation: Suspension
├── Third violation: Termination
└── Law enforcement: Serious breaches
```

---

## 11. Customer Communication & Transparency

### 11.1 Privacy Policy Notices

- **Clear Language**: Avoid legal jargon where possible
- **Layered Approach**: Summary + detailed sections
- **Language Options**: Arabic + English
- **Update Notification**: Email when policies change
- **Consent Recording**: Timestamps saved

### 11.2 Data Usage Transparency

```
Dashboard Transparency Features:
├── Data download: Export all personal data
├── Activity log: View all access to your data
├── Consent management: See/change permissions
├── Deletion requests: Initiate erasure process
├── Privacy settings: Control data sharing
├── Notification preferences: Email/SMS/push
└── Third-party access: View connected apps
```

---

## 12. Annual Security Assessment

### 12.1 Review Schedule

```
Quarterly (Every 3 months)
├── Internal security audit
├── Vulnerability scanning
├── Access control review
└── Incident analysis

Semi-Annual (Every 6 months)
├── Penetration testing
├── Code review (security focus)
├── Policy effectiveness review
└── Compliance check

Annual (Every 12 months)
├── Third-party security audit (external)
├── ISO 27001 assessment
├── SOC2 Type II audit
├── Regulatory compliance review
└── Security policy update
```

### 12.2 Continuous Monitoring

```
Real-Time Monitoring:
├── Intrusion detection: 24/7
├── Log analysis: Automated alerts
├── Vulnerability scanning: Daily
├── API monitoring: Rate limits + anomalies
├── Database queries: Unusual patterns
└── Access logs: Failed login tracking
```

---

## 13. Policy Enforcement & Updates

### 13.1 Enforcement Mechanisms

```
Monitoring:
├── Automated: Security tools (24/7)
├── Manual: Security team reviews (weekly)
├── Audit: Compliance audits (quarterly)
└── Penetration: Red team testing (annual)

Consequences of Non-Compliance:
├── Developer: Code review required + fixes
├── Employee: Training + monitoring
├── Manager: Accountability review
├── Customer: Account restrictions
└── Violation severity: Escalation to CISO
```

### 13.2 Policy Update Process

```
1. Proposal (Identify need)
   ├── External: Regulatory change
   ├── Internal: Incident/improvement
   └── Timeline: Documented

2. Review (Security team evaluation)
   ├── Risk assessment: Impact analysis
   ├── Feasibility: Technical/operational
   ├── Cost: Resources required
   └── Timeline: 1-2 weeks

3. Approval (Executive sign-off)
   ├── CISO: Security review
   ├── CEO: Business approval
   ├── Legal: Compliance verification
   └── Timeline: 1 week

4. Communication (Stakeholder notification)
   ├── Employees: Training + documentation
   ├── Customers: Clear communication
   ├── Compliance: Regulatory updates
   └── Timeline: 30 days before effective

5. Implementation (System updates)
   ├── Code changes: Deployed
   ├── Process changes: Trained
   ├── Policy updates: Published
   └── Timeline: Effective date
```

---

## 14. Glossary of Security Terms

```
Authentication: Verifying identity (username + password)
Authorization: Determining what authenticated user can access
Encryption: Converting data to unreadable format using keys
Hashing: One-way conversion making data unreversible
MFA: Multi-Factor Authentication (2+ methods)
RLS: Row-Level Security (database-level access control)
API Key: Unique credential for system authentication
GDPR: General Data Protection Regulation (EU law)
CCPA: California Consumer Privacy Act
DPA: Data Processing Agreement
DPA: Data Protection Authority
PII: Personally Identifiable Information
RTC: Right to be Forgotten (GDPR)
```

---

## 15. Contact Information

### 15.1 Security & Privacy Contacts

```
Highest Priority (Security Incident):
  Email: security@nesthubarabia.com
  Phone: +971-4-XXX-XXXX ext. 1
  Hours: 24/7

Privacy Inquiries:
  Email: privacy@nesthubarabia.com
  Phone: +971-4-XXX-XXXX ext. 2
  Hours: 9AM-6PM GST, Mon-Fri
  Response time: 3 business days

General Support:
  Email: support@nesthubarabia.com
  Phone: +971-4-XXX-XXXX ext. 3
  Chat: In-app support chat
```

### 15.2 Regulatory Authority Contacts

```
UAE Data Protection:
  Dubai Financial Services Authority (DFSA)
  Website: dfsa.ae
  Email: DPA@dfsa.ae

EU GDPR:
  Your country's Data Protection Authority
  Lookup: edpb.eu/dataprotectionauthorities

California CCPA:
  California Attorney General
  Website: oag.ca.gov
  Phone: (916) 322-3360
```

---

## Acknowledgment & Agreement

By using Dubai Nest Hub, you acknowledge that:
1. You have read and understood this policy
2. You consent to data collection as described
3. You understand your rights under applicable laws
4. You agree to our security and privacy practices

**Policy Effective Date**: December 12, 2025  
**Next Review Date**: December 12, 2026

---

**Document Status**: ✅ APPROVED FOR IMPLEMENTATION  
**Last Reviewed**: December 12, 2025  
**Next Review**: June 12, 2026
