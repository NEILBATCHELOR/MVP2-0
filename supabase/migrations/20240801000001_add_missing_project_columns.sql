-- Add missing columns to projects table if they don't exist
DO $$ 
BEGIN
    -- Check if project_type column exists and add it if it doesn't
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'project_type') THEN
        ALTER TABLE projects ADD COLUMN project_type text;
    END IF;

    -- Check if token_symbol column exists and add it if it doesn't
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'token_symbol') THEN
        ALTER TABLE projects ADD COLUMN token_symbol text;
    END IF;

    -- Check if target_raise column exists and add it if it doesn't
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'target_raise') THEN
        ALTER TABLE projects ADD COLUMN target_raise numeric;
    END IF;

    -- Check if authorized_shares column exists and add it if it doesn't
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'authorized_shares') THEN
        ALTER TABLE projects ADD COLUMN authorized_shares integer;
    END IF;

    -- Check if share_price column exists and add it if it doesn't
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'share_price') THEN
        ALTER TABLE projects ADD COLUMN share_price numeric;
    END IF;

    -- Check if company_valuation column exists and add it if it doesn't
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'company_valuation') THEN
        ALTER TABLE projects ADD COLUMN company_valuation numeric;
    END IF;

    -- Check if funding_round column exists and add it if it doesn't
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'funding_round') THEN
        ALTER TABLE projects ADD COLUMN funding_round text;
    END IF;

    -- Check if legal_entity column exists and add it if it doesn't
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'legal_entity') THEN
        ALTER TABLE projects ADD COLUMN legal_entity text;
    END IF;

    -- Check if jurisdiction column exists and add it if it doesn't
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'jurisdiction') THEN
        ALTER TABLE projects ADD COLUMN jurisdiction text;
    END IF;

    -- Check if tax_id column exists and add it if it doesn't
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'tax_id') THEN
        ALTER TABLE projects ADD COLUMN tax_id text;
    END IF;

    -- Add realtime publication for projects table
    ALTER PUBLICATION supabase_realtime ADD TABLE projects;

END $$;
