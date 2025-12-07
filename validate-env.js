#!/usr/bin/env node

/**
 * Environment Variable Validator
 * Checks all required vars before deployment
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_REQUIRED = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  'VITE_ADMIN_API_URL',
  'VITE_SLACK_WEBHOOK_URL',
];

const BACKEND_REQUIRED = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SLACK_WEBHOOK_URL',
  'FRONTEND_URL',
  'ADMIN_API_KEY',
];

const validateEnv = (envVars, required, location) => {
  console.log(`\n📋 Validating ${location}...\n`);
  let errors = [];
  let warnings = [];

  required.forEach(key => {
    const value = envVars[key];
    
    if (!value) {
      errors.push(`❌ Missing: ${key}`);
    } else if (value.length < 5) {
      warnings.push(`⚠️  Warning: ${key} seems too short`);
    } else if (value.includes('YOUR_') || value.includes('REPLACE_') || value === 'undefined') {
      errors.push(`❌ Placeholder not replaced: ${key}`);
    } else {
      console.log(`✅ ${key}: ${value.substring(0, 20)}...`);
    }
  });

  return { errors, warnings };
};

try {
  console.log('\n🔐 ENVIRONMENT VARIABLE VALIDATOR\n');
  console.log('================================\n');

  // Check frontend
  const frontendEnvPath = path.join(__dirname, '.env');
  let frontendEnv = {};
  if (fs.existsSync(frontendEnvPath)) {
    const content = fs.readFileSync(frontendEnvPath, 'utf8');
    content.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && !key.startsWith('#')) {
        frontendEnv[key.trim()] = valueParts.join('=').trim();
      }
    });
  } else {
    console.log('⚠️  No .env file found in frontend root');
  }

  // Check backend
  const backendEnvPath = path.join(__dirname, 'truenester-chatbot-api', '.env');
  let backendEnv = {};
  if (fs.existsSync(backendEnvPath)) {
    const content = fs.readFileSync(backendEnvPath, 'utf8');
    content.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && !key.startsWith('#')) {
        backendEnv[key.trim()] = valueParts.join('=').trim();
      }
    });
  } else {
    console.log('⚠️  No .env file found in backend root');
  }

  const { errors: fe_errors, warnings: fe_warnings } = validateEnv(frontendEnv, FRONTEND_REQUIRED, 'Frontend .env');
  const { errors: be_errors, warnings: be_warnings } = validateEnv(backendEnv, BACKEND_REQUIRED, 'Backend .env');

  const allErrors = [...fe_errors, ...be_errors];
  const allWarnings = [...fe_warnings, ...be_warnings];

  // Print errors
  if (allErrors.length > 0) {
    console.log('\n\n🚨 ERRORS (Fix before deployment)\n');
    allErrors.forEach(err => console.log(err));
  }

  // Print warnings
  if (allWarnings.length > 0) {
    console.log('\n\n⚠️  WARNINGS (Review)\n');
    allWarnings.forEach(warn => console.log(warn));
  }

  // Summary
  console.log('\n\n================================\n');
  if (allErrors.length === 0) {
    console.log('✅ All environment variables validated!\n');
    console.log('🚀 Ready for deployment!\n');
    process.exit(0);
  } else {
    console.log(`❌ Found ${allErrors.length} error(s)\n`);
    console.log('⛔ Fix all errors before deploying!\n');
    process.exit(1);
  }
} catch (error) {
  console.error('Error during validation:', error.message);
  process.exit(1);
}
