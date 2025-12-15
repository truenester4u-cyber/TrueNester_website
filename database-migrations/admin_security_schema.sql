-- Create admin_users table for managing admin access with invitations
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  role VARCHAR(50) NOT NULL DEFAULT 'admin', -- 'super_admin', 'admin', 'moderator', 'content_editor'
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'active', 'locked', 'disabled'
  requires_mfa BOOLEAN DEFAULT TRUE,
  mfa_enabled BOOLEAN DEFAULT FALSE,
  mfa_verified_at TIMESTAMP,
  password_changed_at TIMESTAMP DEFAULT NOW(),
  password_expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '90 days'),
  last_login_at TIMESTAMP,
  last_login_ip VARCHAR(45),
  failed_login_attempts INT DEFAULT 0,
  locked_until TIMESTAMP,
  invited_by_admin_id UUID REFERENCES admin_users(id),
  invitation_token VARCHAR(255) UNIQUE,
  invitation_accepted_at TIMESTAMP,
  invitation_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  notes TEXT
);

CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_status ON admin_users(status);
CREATE INDEX idx_admin_users_role ON admin_users(role);
CREATE INDEX idx_admin_users_user_id ON admin_users(user_id);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Only admins can view admin_users table
CREATE POLICY "Admins can view admin users" ON admin_users
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM admin_users AS au
    WHERE au.user_id = auth.uid() AND au.status = 'active'
  )
);

-- Only super_admins can update admin users
CREATE POLICY "Super admins can update admin users" ON admin_users
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM admin_users AS au
    WHERE au.user_id = auth.uid() AND au.role = 'super_admin' AND au.status = 'active'
  )
);

-- Create admin_login_attempts table for security tracking
CREATE TABLE IF NOT EXISTS admin_login_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  success BOOLEAN DEFAULT FALSE,
  reason VARCHAR(255),
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_login_attempts_email ON admin_login_attempts(email);
CREATE INDEX idx_login_attempts_timestamp ON admin_login_attempts(timestamp);
CREATE INDEX idx_login_attempts_ip ON admin_login_attempts(ip_address);

-- Create admin_audit_logs table for comprehensive audit trail
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES admin_users(id),
  admin_email VARCHAR(255),
  action VARCHAR(50) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'VIEW', 'EXPORT', 'LOGIN', 'LOGOUT', 'MFA_ENABLE', 'ROLE_CHANGE'
  resource_type VARCHAR(50), -- 'property', 'location', 'blog_post', 'conversation', 'review', 'admin_user', 'settings'
  resource_id UUID,
  changes JSONB, -- What was changed
  ip_address VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(50) DEFAULT 'SUCCESS', -- 'SUCCESS', 'FAILURE'
  reason VARCHAR(255), -- Why it failed or was denied
  data_accessed TEXT[], -- Sensitive fields accessed
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX idx_audit_logs_timestamp ON admin_audit_logs(timestamp);
CREATE INDEX idx_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON admin_audit_logs(resource_type);

-- Enable RLS (only authenticated admins can view)
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs" ON admin_audit_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- Create admin_invitations table
CREATE TABLE IF NOT EXISTS admin_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'admin',
  invited_by_admin_id UUID NOT NULL REFERENCES admin_users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending' -- 'pending', 'accepted', 'expired', 'cancelled'
);

CREATE INDEX idx_invitations_email ON admin_invitations(email);
CREATE INDEX idx_invitations_token ON admin_invitations(token);
CREATE INDEX idx_invitations_status ON admin_invitations(status);

-- Create ip_whitelist table
CREATE TABLE IF NOT EXISTS ip_whitelist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address VARCHAR(45) NOT NULL, -- Single IP or CIDR range
  description VARCHAR(255),
  added_by_admin_id UUID REFERENCES admin_users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_ip_whitelist_ip ON ip_whitelist(ip_address);
CREATE INDEX idx_ip_whitelist_active ON ip_whitelist(active);

-- Create admin_sessions table for session management
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  session_token VARCHAR(500) NOT NULL UNIQUE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  device_fingerprint VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  last_activity TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '8 hours'),
  mfa_verified BOOLEAN DEFAULT FALSE,
  mfa_verified_at TIMESTAMP
);

CREATE INDEX idx_sessions_admin_id ON admin_sessions(admin_id);
CREATE INDEX idx_sessions_token ON admin_sessions(session_token);
CREATE INDEX idx_sessions_expires_at ON admin_sessions(expires_at);

-- Create security_alerts table for real-time monitoring
CREATE TABLE IF NOT EXISTS security_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  severity VARCHAR(50) NOT NULL, -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
  event VARCHAR(255) NOT NULL,
  admin_id UUID REFERENCES admin_users(id),
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMP,
  acknowledged_by_admin_id UUID REFERENCES admin_users(id)
);

CREATE INDEX idx_security_alerts_severity ON security_alerts(severity);
CREATE INDEX idx_security_alerts_created_at ON security_alerts(created_at);
CREATE INDEX idx_security_alerts_admin_id ON security_alerts(admin_id);

-- Create admin_mfa table for MFA management
CREATE TABLE IF NOT EXISTS admin_mfa (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL UNIQUE REFERENCES admin_users(id) ON DELETE CASCADE,
  mfa_type VARCHAR(50) NOT NULL, -- 'totp', 'email', 'sms'
  secret VARCHAR(255), -- TOTP secret (encrypted in application)
  backup_codes TEXT[], -- Hashed backup codes
  enabled BOOLEAN DEFAULT FALSE,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_admin_mfa_admin_id ON admin_mfa(admin_id);

-- Update auth.users metadata to include admin role (for easier queries)
-- This is handled by triggers in the application

-- Create trigger to update admin_users.updated_at
CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS admin_users_updated_at_trigger ON admin_users;
CREATE TRIGGER admin_users_updated_at_trigger
BEFORE UPDATE ON admin_users
FOR EACH ROW
EXECUTE FUNCTION update_admin_users_updated_at();
