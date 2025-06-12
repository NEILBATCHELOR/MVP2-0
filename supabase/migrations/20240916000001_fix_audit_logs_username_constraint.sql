-- Fix the audit_logs table to handle null usernames

-- Option 1: Make username nullable (preferred if username isn't always available)
ALTER TABLE audit_logs ALTER COLUMN username DROP NOT NULL;

-- Option 2: Add a default value for username when it's null
CREATE OR REPLACE FUNCTION set_audit_username()
RETURNS TRIGGER AS $$
BEGIN
  NEW.username = COALESCE(NEW.username, 'system');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_audit_username ON audit_logs;
CREATE TRIGGER ensure_audit_username
BEFORE INSERT ON audit_logs
FOR EACH ROW
EXECUTE FUNCTION set_audit_username();
