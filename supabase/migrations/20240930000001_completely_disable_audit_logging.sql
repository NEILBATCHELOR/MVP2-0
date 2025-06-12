-- Completely disable all audit logging functionality

-- 1. Make username column nullable in audit_logs table
ALTER TABLE IF EXISTS audit_logs ALTER COLUMN username DROP NOT NULL;

-- 2. Drop all audit log triggers
DROP TRIGGER IF EXISTS audit_log_insert_trigger ON investors;
DROP TRIGGER IF EXISTS audit_log_update_trigger ON investors;
DROP TRIGGER IF EXISTS audit_log_delete_trigger ON investors;

DROP TRIGGER IF EXISTS audit_log_insert_trigger ON subscriptions;
DROP TRIGGER IF EXISTS audit_log_update_trigger ON subscriptions;
DROP TRIGGER IF EXISTS audit_log_delete_trigger ON subscriptions;

DROP TRIGGER IF EXISTS audit_log_insert_trigger ON token_allocations;
DROP TRIGGER IF EXISTS audit_log_update_trigger ON token_allocations;
DROP TRIGGER IF EXISTS audit_log_delete_trigger ON token_allocations;

DROP TRIGGER IF EXISTS audit_log_insert_trigger ON redemption_requests;
DROP TRIGGER IF EXISTS audit_log_update_trigger ON redemption_requests;
DROP TRIGGER IF EXISTS audit_log_delete_trigger ON redemption_requests;

DROP TRIGGER IF EXISTS audit_log_insert_trigger ON users;
DROP TRIGGER IF EXISTS audit_log_update_trigger ON users;
DROP TRIGGER IF EXISTS audit_log_delete_trigger ON users;

DROP TRIGGER IF EXISTS audit_log_insert_trigger ON user_roles;
DROP TRIGGER IF EXISTS audit_log_update_trigger ON user_roles;
DROP TRIGGER IF EXISTS audit_log_delete_trigger ON user_roles;

-- 3. Drop any functions related to audit logging
DROP FUNCTION IF EXISTS process_audit_log();
DROP FUNCTION IF EXISTS audit_log_insert();
DROP FUNCTION IF EXISTS audit_log_update();
DROP FUNCTION IF EXISTS audit_log_delete();

-- 4. Ensure all tables are in realtime publication
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END
$$;

-- Add key tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE IF EXISTS investors;
ALTER PUBLICATION supabase_realtime ADD TABLE IF EXISTS subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE IF EXISTS token_allocations;
ALTER PUBLICATION supabase_realtime ADD TABLE IF EXISTS redemption_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE IF EXISTS users;
ALTER PUBLICATION supabase_realtime ADD TABLE IF EXISTS user_roles;
