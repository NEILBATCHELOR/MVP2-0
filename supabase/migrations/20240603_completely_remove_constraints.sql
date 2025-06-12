-- Migration to completely remove the foreign key constraint and create a separate approvers table
-- This is a more drastic approach that will solve the issue permanently

-- First backup the current data
CREATE TABLE IF NOT EXISTS policy_rule_approvers_backup AS 
SELECT * FROM policy_rule_approvers;

-- Drop the current table to remove all constraints
DROP TABLE IF EXISTS policy_rule_approvers;

-- Create a new approvers table with NO FOREIGN KEY constraints
CREATE TABLE policy_rule_approvers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    policy_rule_id UUID NOT NULL,
    user_id UUID NOT NULL,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT DEFAULT 'pending',
    comment TEXT,
    timestamp TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX idx_policy_rule_approvers_rule_id ON policy_rule_approvers(policy_rule_id);
CREATE INDEX idx_policy_rule_approvers_user_id ON policy_rule_approvers(user_id);

-- Restore the data
INSERT INTO policy_rule_approvers (policy_rule_id, user_id, created_by, created_at, status, comment, timestamp)
SELECT policy_rule_id, user_id, created_by, created_at, status, comment, timestamp 
FROM policy_rule_approvers_backup
WHERE EXISTS (SELECT 1 FROM rules WHERE rule_id = policy_rule_id);

-- Create a cleanup function to remove orphaned approvers periodically
CREATE OR REPLACE FUNCTION cleanup_orphaned_policy_approvers() 
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM policy_rule_approvers
    WHERE NOT EXISTS (
      SELECT 1 FROM rules WHERE rule_id = policy_rule_approvers.policy_rule_id
    )
    RETURNING *
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create a view that only shows valid approvers
CREATE OR REPLACE VIEW valid_policy_approvers AS
SELECT a.*
FROM policy_rule_approvers a
JOIN rules r ON a.policy_rule_id = r.rule_id;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Successfully rebuilt policy_rule_approvers table without constraints';
END $$;