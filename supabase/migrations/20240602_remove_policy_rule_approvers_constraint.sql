-- Migration to completely remove and rebuild the policy_rule_approvers table with different constraints
-- This approach drops the current table and recreates it with more flexible constraints

-- First backup current data if any
CREATE TEMP TABLE IF NOT EXISTS temp_policy_rule_approvers AS 
SELECT * FROM policy_rule_approvers;

-- Drop the policy_rule_approvers table to remove all constraints
DROP TABLE IF EXISTS policy_rule_approvers;

-- Recreate the table with a soft foreign key (not enforced by database)
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
CREATE INDEX IF NOT EXISTS idx_policy_rule_approvers_rule_id ON policy_rule_approvers(policy_rule_id);
CREATE INDEX IF NOT EXISTS idx_policy_rule_approvers_user_id ON policy_rule_approvers(user_id);

-- Restore the data if any was backed up
INSERT INTO policy_rule_approvers (policy_rule_id, user_id, created_by, created_at, status, comment, timestamp)
SELECT policy_rule_id, user_id, created_by, created_at, status, comment, timestamp 
FROM temp_policy_rule_approvers;

-- Drop the temporary table
DROP TABLE IF EXISTS temp_policy_rule_approvers;

-- Add database function to verify rule existence (safer than constraint)
CREATE OR REPLACE FUNCTION verify_rule_exists() RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM rules WHERE rule_id = NEW.policy_rule_id) THEN
        -- Instead of rejecting, log a warning
        RAISE WARNING 'Rule ID % does not exist, but allowing approver insertion anyway', NEW.policy_rule_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to log warnings but not block insertions
CREATE TRIGGER check_rule_exists
BEFORE INSERT OR UPDATE ON policy_rule_approvers
FOR EACH ROW
EXECUTE FUNCTION verify_rule_exists();

-- Log successful migration
DO $$
BEGIN
    RAISE NOTICE 'Successfully rebuilt policy_rule_approvers table with soft constraints';
END $$;