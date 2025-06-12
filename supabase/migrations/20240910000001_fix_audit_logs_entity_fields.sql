-- Add entity_type and entity_id columns to audit_logs if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'entity_type') THEN
        ALTER TABLE audit_logs ADD COLUMN entity_type text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'entity_id') THEN
        ALTER TABLE audit_logs ADD COLUMN entity_id text;
    END IF;
END $$;

-- Update the activityLogger to include entity fields
ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;
