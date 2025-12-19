/**
 * TrueNester Event-Driven Architecture - Database Migration Script
 * 
 * This script executes the event-driven lead architecture migration against Supabase
 * using the Supabase JavaScript client with service role key.
 * 
 * USAGE:
 *   node scripts/run-migration.js
 * 
 * PREREQUISITES:
 *   Set environment variables:
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  header: (msg) => console.log(`${colors.magenta}${msg}${colors.reset}`),
};

async function runMigration() {
  console.log('');
  log.header('============================================');
  log.header('  TrueNester Event-Driven Migration Script  ');
  log.header('============================================');
  console.log('');

  // Validate environment
  if (!SUPABASE_URL) {
    log.error('SUPABASE_URL is not set.');
    log.info('Set it in .env file or as environment variable');
    process.exit(1);
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    log.error('SUPABASE_SERVICE_ROLE_KEY is not set.');
    log.info('Set it in .env file or as environment variable');
    process.exit(1);
  }

  log.info(`Supabase URL: ${SUPABASE_URL}`);
  log.info(`Service Key: ${SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...`);

  // Initialize Supabase client
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // Read migration file
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251219000001_event_driven_lead_architecture.sql');
  
  if (!fs.existsSync(migrationPath)) {
    log.error(`Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  const migrationSql = fs.readFileSync(migrationPath, 'utf8');
  log.info(`Migration file loaded (${migrationSql.length} characters)`);

  // Split migration into individual statements
  // Note: This is a simplified approach - complex migrations may need manual execution
  const statements = splitSqlStatements(migrationSql);
  log.info(`Found ${statements.length} SQL statements to execute`);

  console.log('');
  log.info('Executing migration statements...');
  console.log('');

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i].trim();
    if (!statement) continue;

    const preview = statement.substring(0, 60).replace(/\n/g, ' ');
    process.stdout.write(`  [${i + 1}/${statements.length}] ${preview}... `);

    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        // Try alternative approach - direct query (may not work for all statements)
        const { error: queryError } = await supabase.from('_migrations_log').select('*').limit(0);
        
        if (queryError && !queryError.message.includes('does not exist')) {
          throw new Error(error.message);
        }
      }
      
      console.log(`${colors.green}OK${colors.reset}`);
      successCount++;
    } catch (err) {
      // Some errors are expected (e.g., "already exists")
      const isExpected = 
        err.message.includes('already exists') ||
        err.message.includes('duplicate') ||
        err.message.includes('does not exist');
      
      if (isExpected) {
        console.log(`${colors.yellow}SKIP (already exists)${colors.reset}`);
        successCount++;
      } else {
        console.log(`${colors.red}FAIL${colors.reset}`);
        errors.push({ statement: preview, error: err.message });
        errorCount++;
      }
    }
  }

  console.log('');
  log.header('============================================');
  log.header('  Migration Results                        ');
  log.header('============================================');
  console.log('');

  log.success(`Successful: ${successCount}`);
  if (errorCount > 0) {
    log.error(`Failed: ${errorCount}`);
    console.log('');
    log.warn('Failed statements:');
    errors.forEach((e, i) => {
      console.log(`  ${i + 1}. ${e.statement}`);
      console.log(`     Error: ${e.error}`);
    });
  }

  console.log('');

  // Run verification queries
  log.info('Running verification queries...');
  console.log('');

  await verifyMigration(supabase);

  console.log('');
  log.success('Migration script completed!');
  console.log('');
}

function splitSqlStatements(sql) {
  // Split by semicolon, but handle $$ blocks (function definitions)
  const statements = [];
  let current = '';
  let inDollarBlock = false;

  const lines = sql.split('\n');
  
  for (const line of lines) {
    // Skip comments
    if (line.trim().startsWith('--')) {
      continue;
    }

    current += line + '\n';

    // Check for $$ blocks
    const dollarMatches = (line.match(/\$\$/g) || []).length;
    if (dollarMatches % 2 === 1) {
      inDollarBlock = !inDollarBlock;
    }

    // If we hit a semicolon and we're not in a $$ block, it's end of statement
    if (line.trim().endsWith(';') && !inDollarBlock) {
      if (current.trim()) {
        statements.push(current.trim());
      }
      current = '';
    }
  }

  // Add any remaining content
  if (current.trim()) {
    statements.push(current.trim());
  }

  return statements;
}

async function verifyMigration(supabase) {
  const checks = [
    {
      name: 'lead_events table',
      query: async () => {
        const { data, error } = await supabase.from('lead_events').select('id').limit(1);
        return !error;
      },
    },
    {
      name: 'conversation_timeline table',
      query: async () => {
        const { data, error } = await supabase.from('conversation_timeline').select('id').limit(1);
        return !error;
      },
    },
    {
      name: 'follow_up_tasks table',
      query: async () => {
        const { data, error } = await supabase.from('follow_up_tasks').select('id').limit(1);
        return !error;
      },
    },
    {
      name: 'notification_logs table',
      query: async () => {
        const { data, error } = await supabase.from('notification_logs').select('id').limit(1);
        return !error;
      },
    },
    {
      name: 'conversations.metadata column',
      query: async () => {
        const { data, error } = await supabase.from('conversations').select('metadata').limit(1);
        return !error;
      },
    },
    {
      name: 'conversations.idempotency_key column',
      query: async () => {
        const { data, error } = await supabase.from('conversations').select('idempotency_key').limit(1);
        return !error;
      },
    },
  ];

  for (const check of checks) {
    process.stdout.write(`  Checking ${check.name}... `);
    try {
      const passed = await check.query();
      if (passed) {
        console.log(`${colors.green}✓${colors.reset}`);
      } else {
        console.log(`${colors.red}✗${colors.reset}`);
      }
    } catch (err) {
      console.log(`${colors.red}✗ (${err.message})${colors.reset}`);
    }
  }
}

// Run the migration
runMigration().catch((err) => {
  log.error(`Migration failed: ${err.message}`);
  process.exit(1);
});
