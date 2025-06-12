-- Disable RLS on audit_logs table to allow all users to write to it
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

-- Alternatively, if you want to keep RLS but allow all authenticated users to insert:
-- DROP POLICY IF EXISTS "Allow inserts for authenticated users" ON audit_logs;
-- CREATE POLICY "Allow inserts for authenticated users"
--   ON audit_logs
--   FOR INSERT
--   TO authenticated
--   WITH CHECK (true);

-- DROP POLICY IF EXISTS "Allow selects for authenticated users" ON audit_logs;
-- CREATE POLICY "Allow selects for authenticated users"
--   ON audit_logs
--   FOR SELECT
--   TO authenticated
--   USING (true);
