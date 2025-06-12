-- Ensure entity_type and entity_id columns exist in audit_logs table
DO $$
BEGIN
    -- Check if entity_type column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'audit_logs' AND column_name = 'entity_type') THEN
        ALTER TABLE audit_logs ADD COLUMN entity_type text;
    END IF;
    
    -- Check if entity_id column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'audit_logs' AND column_name = 'entity_id') THEN
        ALTER TABLE audit_logs ADD COLUMN entity_id text;
    END IF;
END
$$;
