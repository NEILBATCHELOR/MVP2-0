-- Migration: Update KYC fields in the investors table
-- Description: Ensures proper enum type for kyc_status, adds timestamp with timezone for kyc_expiry_date,
--              and ensures verification_details is properly typed as JSONB

-- Create backup of investors table just in case (only if it doesn't exist already)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'investors_backup_pre_kyc_update'
    ) THEN
        CREATE TABLE public.investors_backup_pre_kyc_update AS 
        SELECT * FROM public.investors;
        
        RAISE NOTICE 'Backup table created: investors_backup_pre_kyc_update';
    ELSE
        RAISE NOTICE 'Backup table already exists, skipping backup creation';
    END IF;
END $$;

-- Check if kyc_status is already an enum type
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = 'kyc_status'
    ) THEN
        -- Create the enum type if it doesn't exist yet
        CREATE TYPE public.kyc_status AS ENUM (
            'approved', 
            'pending', 
            'failed', 
            'not_started', 
            'expired'
        );
        
        RAISE NOTICE 'Created kyc_status enum type';
    ELSE
        RAISE NOTICE 'kyc_status enum type already exists';
    END IF;
END $$;

-- Update kyc_status column to use the enum type
DO $$
BEGIN
    -- Check if kyc_status column exists and is not already of type kyc_status enum
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'investors' 
        AND column_name = 'kyc_status' 
        AND data_type <> 'USER-DEFINED'
    ) THEN
        -- Validate all existing values will fit into the enum
        IF EXISTS (
            SELECT 1 FROM public.investors 
            WHERE kyc_status IS NOT NULL
            AND LOWER(kyc_status) NOT IN ('approved', 'pending', 'failed', 'not_started', 'expired')
        ) THEN
            -- Fix any invalid values
            UPDATE public.investors 
            SET kyc_status = 'not_started' 
            WHERE kyc_status IS NOT NULL
            AND LOWER(kyc_status) NOT IN ('approved', 'pending', 'failed', 'not_started', 'expired');
            
            RAISE NOTICE 'Fixed invalid kyc_status values to not_started';
        END IF;
        
        -- Alter the column to use the enum type
        ALTER TABLE public.investors 
        ALTER COLUMN kyc_status TYPE public.kyc_status 
        USING LOWER(kyc_status)::public.kyc_status;
        
        RAISE NOTICE 'Updated kyc_status column to use enum type';
    ELSE
        RAISE NOTICE 'kyc_status column is already using the enum type or does not exist';
    END IF;
END $$;

-- Update kyc_expiry_date to timestamp with time zone if it's not already
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'investors' 
        AND column_name = 'kyc_expiry_date'
        AND data_type <> 'timestamp with time zone'
    ) THEN
        ALTER TABLE public.investors 
        ALTER COLUMN kyc_expiry_date TYPE TIMESTAMP WITH TIME ZONE 
        USING kyc_expiry_date::TIMESTAMP WITH TIME ZONE;
        
        RAISE NOTICE 'Updated kyc_expiry_date to timestamp with time zone';
    ELSE
        RAISE NOTICE 'kyc_expiry_date is already timestamp with time zone or does not exist';
    END IF;
END $$;

-- Ensure verification_details is JSONB
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'investors' 
        AND column_name = 'verification_details'
        AND data_type <> 'jsonb'
    ) THEN
        -- If the column exists but is not JSONB, try to convert it
        ALTER TABLE public.investors 
        ALTER COLUMN verification_details TYPE JSONB 
        USING CASE 
            WHEN verification_details IS NULL THEN NULL 
            WHEN verification_details::TEXT = '' THEN '{}'::JSONB
            ELSE verification_details::JSONB
        END;
        
        RAISE NOTICE 'Updated verification_details to JSONB';
    ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'investors' 
        AND column_name = 'verification_details'
    ) THEN
        -- If the column doesn't exist, create it
        ALTER TABLE public.investors 
        ADD COLUMN verification_details JSONB DEFAULT NULL;
        
        RAISE NOTICE 'Added verification_details column as JSONB';
    ELSE
        RAISE NOTICE 'verification_details is already JSONB';
    END IF;
END $$;

-- Add index on kyc_status for better query performance
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'investors' 
        AND indexname = 'idx_investors_kyc_status'
    ) THEN
        CREATE INDEX idx_investors_kyc_status ON public.investors (kyc_status);
        RAISE NOTICE 'Created index on kyc_status';
    ELSE
        RAISE NOTICE 'Index on kyc_status already exists';
    END IF;
END $$;

-- Add a comment on the table to document the changes
COMMENT ON TABLE public.investors IS 'Investor records with KYC status, expiry dates, and verification details. KYC status is an enum: approved, pending, failed, not_started, expired.';