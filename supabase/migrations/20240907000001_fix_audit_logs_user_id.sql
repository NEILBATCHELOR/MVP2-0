-- Add user_id column to audit_logs table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'user_id') THEN
        ALTER TABLE audit_logs ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END
$$;

-- Update the realtime publication to include audit_logs
ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;
