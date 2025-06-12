-- Migration to convert UUID columns to TEXT to allow more flexible input formats
-- This is a pragmatic solution to the type mismatch issues when the application code
-- is sending string values to UUID columns

-- 1. Modify policy_rule_approvers table - change UUID columns to TEXT
ALTER TABLE policy_rule_approvers 
  ALTER COLUMN policy_rule_id TYPE TEXT,
  ALTER COLUMN user_id TYPE TEXT,
  ALTER COLUMN created_by TYPE TEXT;

-- 2. Modify audit_logs table - change UUID columns to TEXT
ALTER TABLE audit_logs
  ALTER COLUMN user_id TYPE TEXT,
  ALTER COLUMN id TYPE TEXT,
  ALTER COLUMN project_id TYPE TEXT;

-- 3. Modify rules table - ensure created_by is TEXT type (it might already be)
ALTER TABLE rules 
  ALTER COLUMN rule_id TYPE TEXT;

-- 4. Create a function to support both UUID and text formats
CREATE OR REPLACE FUNCTION text_or_uuid(input text) 
RETURNS text AS $$
BEGIN
  RETURN input;
END;
$$ LANGUAGE plpgsql;

-- 5. Update RLS policies if needed to handle the text columns
COMMENT ON COLUMN policy_rule_approvers.user_id IS 'User ID in text format for approval requests';
COMMENT ON COLUMN policy_rule_approvers.created_by IS 'Creator ID in text format';
COMMENT ON COLUMN policy_rule_approvers.policy_rule_id IS 'Policy or rule ID in text format';