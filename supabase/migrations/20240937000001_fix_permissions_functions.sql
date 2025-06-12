-- Fix missing functions for permission system

-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS get_users_with_permission(TEXT);
DROP FUNCTION IF EXISTS check_user_permission(UUID, TEXT);

-- Create function to get users with a specific permission
CREATE OR REPLACE FUNCTION get_users_with_permission(p_permission_id TEXT)
RETURNS TABLE(user_id UUID) 
AS $$
BEGIN
    RETURN QUERY
    WITH eligible_roles AS (
        SELECT role_id
        FROM role_permissions
        WHERE permission_id = p_permission_id
        AND effect = 'allow'
    ),
    users_with_eligible_roles AS (
        -- Get users from user_roles (using the role column)
        SELECT DISTINCT ur.user_id
        FROM user_roles ur
        WHERE EXISTS (
            SELECT 1 FROM eligible_roles er WHERE er.role_id = ur.role
        )
        
        UNION
        
        -- Get users with roles in auth.users metadata
        SELECT DISTINCT au.id as user_id
        FROM auth.users au
        WHERE EXISTS (
            SELECT 1 
            FROM eligible_roles er
            WHERE er.role_id = au.raw_user_meta_data->>'role'
        )
    )
    SELECT user_id FROM users_with_eligible_roles;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in get_users_with_permission: %', SQLERRM;
        RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if a user has a specific permission
CREATE OR REPLACE FUNCTION check_user_permission(p_user_id UUID, p_permission_id TEXT)
RETURNS BOOLEAN
AS $$
DECLARE
    has_permission BOOLEAN;
BEGIN
    -- First check if the user has any roles assigned in user_roles
    SELECT EXISTS (
        SELECT 1
        FROM user_roles ur
        JOIN role_permissions rp ON ur.role = rp.role_id
        WHERE ur.user_id = p_user_id
        AND rp.permission_id = p_permission_id
        AND rp.effect = 'allow'
    ) INTO has_permission;
    
    -- If not found, check in auth.users metadata
    IF NOT has_permission THEN
        SELECT EXISTS (
            SELECT 1
            FROM auth.users au
            JOIN role_permissions rp ON au.raw_user_meta_data->>'role' = rp.role_id
            WHERE au.id = p_user_id
            AND rp.permission_id = p_permission_id
            AND rp.effect = 'allow'
        ) INTO has_permission;
    END IF;
    
    RETURN has_permission;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in check_user_permission: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_users_with_permission TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_permission TO authenticated;

-- Ensure policy_rule_approvers table exists
CREATE TABLE IF NOT EXISTS policy_rule_approvers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_rule_id UUID NOT NULL,
    approver_id UUID NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_policy_rule_approver UNIQUE (policy_rule_id, approver_id)
);

COMMENT ON TABLE policy_rule_approvers IS 'Stores approvers for policy rules with their approval status';