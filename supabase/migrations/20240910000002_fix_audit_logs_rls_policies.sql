-- Disable RLS on audit_logs table to allow all operations
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations on audit_logs" ON audit_logs;

-- Create a policy that allows all operations for all users
CREATE POLICY "Allow all operations on audit_logs"
ON audit_logs
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
