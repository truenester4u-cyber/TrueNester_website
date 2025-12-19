# ============================================================================
# TrueNester Event-Driven Architecture - Database Migration Script
# ============================================================================
# This script runs the event-driven lead architecture migration against Supabase
# 
# USAGE:
#   .\scripts\run-event-driven-migration.ps1
#
# PREREQUISITES:
#   1. Set environment variables or update the values below
#   2. Ensure you have network access to Supabase
# ============================================================================

param(
    [string]$SupabaseUrl = $env:SUPABASE_URL,
    [string]$SupabaseServiceKey = $env:SUPABASE_SERVICE_ROLE_KEY,
    [switch]$DryRun = $false
)

# Colors for output
function Write-Success { param($msg) Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Info { param($msg) Write-Host "ℹ️  $msg" -ForegroundColor Cyan }
function Write-Warning { param($msg) Write-Host "⚠️  $msg" -ForegroundColor Yellow }
function Write-Error { param($msg) Write-Host "❌ $msg" -ForegroundColor Red }

Write-Host ""
Write-Host "============================================" -ForegroundColor Magenta
Write-Host "  TrueNester Event-Driven Migration Script  " -ForegroundColor Magenta
Write-Host "============================================" -ForegroundColor Magenta
Write-Host ""

# Validate environment
if (-not $SupabaseUrl) {
    Write-Error "SUPABASE_URL is not set. Please set the environment variable or pass -SupabaseUrl parameter."
    Write-Host ""
    Write-Host "Example:" -ForegroundColor Gray
    Write-Host '  $env:SUPABASE_URL = "https://your-project.supabase.co"' -ForegroundColor Gray
    Write-Host '  $env:SUPABASE_SERVICE_ROLE_KEY = "eyJhbGc..."' -ForegroundColor Gray
    Write-Host '  .\scripts\run-event-driven-migration.ps1' -ForegroundColor Gray
    exit 1
}

if (-not $SupabaseServiceKey) {
    Write-Error "SUPABASE_SERVICE_ROLE_KEY is not set. Please set the environment variable or pass -SupabaseServiceKey parameter."
    exit 1
}

Write-Info "Supabase URL: $SupabaseUrl"
Write-Info "Service Key: $($SupabaseServiceKey.Substring(0, 20))..."

if ($DryRun) {
    Write-Warning "DRY RUN MODE - No changes will be made"
}

# Path to migration file
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$migrationFile = Join-Path $projectRoot "supabase\migrations\20251219000001_event_driven_lead_architecture.sql"

if (-not (Test-Path $migrationFile)) {
    Write-Error "Migration file not found: $migrationFile"
    exit 1
}

Write-Info "Migration file: $migrationFile"

# Read migration SQL
$migrationSql = Get-Content $migrationFile -Raw
Write-Info "Migration SQL loaded ($($migrationSql.Length) characters)"

if ($DryRun) {
    Write-Host ""
    Write-Warning "DRY RUN - Would execute the following migration:"
    Write-Host "----------------------------------------" -ForegroundColor Gray
    Write-Host $migrationSql.Substring(0, [Math]::Min(500, $migrationSql.Length)) -ForegroundColor Gray
    Write-Host "... (truncated)" -ForegroundColor Gray
    Write-Host "----------------------------------------" -ForegroundColor Gray
    exit 0
}

# Execute migration via Supabase REST API
Write-Host ""
Write-Info "Executing migration..."

$headers = @{
    "apikey" = $SupabaseServiceKey
    "Authorization" = "Bearer $SupabaseServiceKey"
    "Content-Type" = "application/json"
    "Prefer" = "return=minimal"
}

# Supabase SQL endpoint
$sqlEndpoint = "$SupabaseUrl/rest/v1/rpc/exec_sql"

# Note: Supabase doesn't have a direct SQL execution endpoint via REST API
# You need to use the Supabase CLI or Dashboard for migrations
# This script provides guidance instead

Write-Host ""
Write-Warning "Supabase REST API doesn't support direct SQL execution."
Write-Host ""
Write-Info "Please run the migration using one of these methods:"
Write-Host ""

Write-Host "METHOD 1: Supabase Dashboard (Recommended)" -ForegroundColor Yellow
Write-Host "  1. Go to: $SupabaseUrl" -ForegroundColor Gray
Write-Host "  2. Navigate to: SQL Editor" -ForegroundColor Gray
Write-Host "  3. Click: New Query" -ForegroundColor Gray
Write-Host "  4. Paste the contents of:" -ForegroundColor Gray
Write-Host "     $migrationFile" -ForegroundColor Cyan
Write-Host "  5. Click: Run" -ForegroundColor Gray
Write-Host ""

Write-Host "METHOD 2: Supabase CLI" -ForegroundColor Yellow
Write-Host "  1. Install Supabase CLI: npm install -g supabase" -ForegroundColor Gray
Write-Host "  2. Login: supabase login" -ForegroundColor Gray
Write-Host "  3. Link project: supabase link --project-ref <your-project-ref>" -ForegroundColor Gray
Write-Host "  4. Push migration: supabase db push" -ForegroundColor Gray
Write-Host ""

Write-Host "METHOD 3: psql (Direct PostgreSQL)" -ForegroundColor Yellow
Write-Host "  1. Get connection string from Supabase Dashboard > Settings > Database" -ForegroundColor Gray
Write-Host "  2. Run: psql <connection-string> -f `"$migrationFile`"" -ForegroundColor Gray
Write-Host ""

# Offer to copy SQL to clipboard
$copyToClipboard = Read-Host "Would you like to copy the migration SQL to clipboard? (y/n)"
if ($copyToClipboard -eq "y") {
    $migrationSql | Set-Clipboard
    Write-Success "Migration SQL copied to clipboard!"
    Write-Info "Now paste it in Supabase Dashboard > SQL Editor"
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Magenta
Write-Host "  Migration Verification Queries           " -ForegroundColor Magenta
Write-Host "============================================" -ForegroundColor Magenta
Write-Host ""

$verificationQueries = @"
-- Run these queries after migration to verify success:

-- 1. Check new tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('lead_events', 'conversation_timeline', 'follow_up_tasks', 'notification_logs');

-- 2. Check new columns on conversations
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'conversations' 
AND column_name IN ('metadata', 'idempotency_key', 'source', 'first_response_at', 'sla_response_deadline', 'sla_breached', 'device_info');

-- 3. Check enum types
SELECT typname FROM pg_type WHERE typname IN ('lead_event_type', 'notification_channel', 'timeline_event_type', 'follow_up_status');

-- 4. Check functions
SELECT proname FROM pg_proc WHERE proname IN ('emit_lead_event', 'add_timeline_entry', 'update_overdue_follow_ups', 'get_sla_breach_candidates');

-- 5. Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('lead_events', 'conversation_timeline', 'follow_up_tasks', 'notification_logs');
"@

Write-Host $verificationQueries -ForegroundColor Gray
Write-Host ""

$copyVerification = Read-Host "Would you like to copy verification queries to clipboard? (y/n)"
if ($copyVerification -eq "y") {
    $verificationQueries | Set-Clipboard
    Write-Success "Verification queries copied to clipboard!"
}

Write-Host ""
Write-Success "Script completed. Please run the migration manually using one of the methods above."
Write-Host ""
