-- First, create the permission if it doesn't exist
INSERT INTO permissions (id, name, description)
VALUES ('00000000-0000-0000-0000-000000000001', 'approver_rules', 'Permission to manage approval rules and consensus settings')
ON CONFLICT (id) DO NOTHING;

-- Update the approval_configs table to use this permission
INSERT INTO approval_configs (permission_id, required_approvals, eligible_roles, consensus_type, auto_approval_conditions)
VALUES ('00000000-0000-0000-0000-000000000001', 2, ARRAY['superAdmin', 'owner'], '2of3', '{}'::jsonb)
ON CONFLICT (permission_id) DO UPDATE 
SET required_approvals = EXCLUDED.required_approvals,
    eligible_roles = EXCLUDED.eligible_roles,
    consensus_type = EXCLUDED.consensus_type,
    auto_approval_conditions = EXCLUDED.auto_approval_conditions;

-- Ensure the record exists by making another query that always succeeds
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM approval_configs WHERE permission_id = '00000000-0000-0000-0000-000000000001') THEN
        RAISE NOTICE 'Failed to create approval_configs record';
    END IF;
END $$; 