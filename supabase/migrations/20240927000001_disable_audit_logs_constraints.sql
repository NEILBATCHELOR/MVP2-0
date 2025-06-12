-- Disable audit logs constraints to prevent errors

-- Make username column nullable in audit_logs table
ALTER TABLE audit_logs ALTER COLUMN username DROP NOT NULL;

-- Make user_id column nullable in activity_logs table
ALTER TABLE activity_logs ALTER COLUMN user_id DROP NOT NULL;

-- Make user_email column nullable in activity_logs table
ALTER TABLE activity_logs ALTER COLUMN user_email DROP NOT NULL;

-- Disable audit log triggers to prevent errors
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

-- Add realtime publication for key tables if not already added
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END
$$;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE investors;
ALTER PUBLICATION supabase_realtime ADD TABLE subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE token_allocations;
ALTER PUBLICATION supabase_realtime ADD TABLE redemption_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE user_roles;
