-- Check if entity_type column exists and add it if it doesn't
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'audit_logs' AND column_name = 'entity_type') THEN
        ALTER TABLE audit_logs ADD COLUMN entity_type text;
    END IF;
END
$$;

-- Check if entity_id column exists and add it if it doesn't
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'audit_logs' AND column_name = 'entity_id') THEN
        ALTER TABLE audit_logs ADD COLUMN entity_id text;
    END IF;
END
$$;

-- Make sure RLS policies are properly set
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow all users to view audit logs" ON audit_logs;

-- Create a policy that allows all authenticated users to view audit logs
CREATE POLICY "Allow all users to view audit logs"
    ON audit_logs
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow all users to insert audit logs" ON audit_logs;

-- Create a policy that allows all authenticated users to insert audit logs
CREATE POLICY "Allow all users to insert audit logs"
    ON audit_logs
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
