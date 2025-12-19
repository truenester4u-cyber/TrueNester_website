-- ============================================================================
-- PRE-MIGRATION FIX: Add missing columns to existing tables
-- Run this BEFORE the main event-driven migration if you get column errors
-- ============================================================================

-- Fix follow_up_tasks table if it exists without all columns
DO $$ 
BEGIN
  -- Check if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'follow_up_tasks' AND table_schema = 'public') THEN
    -- Add missing columns
    BEGIN
      ALTER TABLE public.follow_up_tasks ADD COLUMN IF NOT EXISTS sla_deadline TIMESTAMP WITH TIME ZONE;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END;
    
    BEGIN
      ALTER TABLE public.follow_up_tasks ADD COLUMN IF NOT EXISTS sla_breached BOOLEAN NOT NULL DEFAULT FALSE;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END;
    
    BEGIN
      ALTER TABLE public.follow_up_tasks ADD COLUMN IF NOT EXISTS notes TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END;
    
    BEGIN
      ALTER TABLE public.follow_up_tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END;
    
    BEGIN
      ALTER TABLE public.follow_up_tasks ADD COLUMN IF NOT EXISTS completed_by UUID;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END;
    
    RAISE NOTICE 'follow_up_tasks table columns updated';
  END IF;
END $$;

-- Fix conversations table - add missing columns
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
  EXCEPTION WHEN duplicate_column THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS idempotency_key TEXT;
  EXCEPTION WHEN duplicate_column THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'website';
  EXCEPTION WHEN duplicate_column THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS first_response_at TIMESTAMP WITH TIME ZONE;
  EXCEPTION WHEN duplicate_column THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS sla_response_deadline TIMESTAMP WITH TIME ZONE;
  EXCEPTION WHEN duplicate_column THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS sla_breached BOOLEAN DEFAULT FALSE;
  EXCEPTION WHEN duplicate_column THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS device_info JSONB DEFAULT '{}';
  EXCEPTION WHEN duplicate_column THEN NULL;
  END;
  
  RAISE NOTICE 'conversations table columns updated';
END $$;

-- Add unique constraint to idempotency_key if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'conversations_idempotency_key_key' 
    AND conrelid = 'public.conversations'::regclass
  ) THEN
    BEGIN
      ALTER TABLE public.conversations ADD CONSTRAINT conversations_idempotency_key_key UNIQUE (idempotency_key);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

SELECT 'Pre-migration fix completed successfully!' as status;
