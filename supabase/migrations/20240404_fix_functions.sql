-- Fix functions migration

-- Add description column to roles table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'roles' 
        AND column_name = 'description'
    ) THEN
        ALTER TABLE roles ADD COLUMN description TEXT;
    END IF;
END $$;

-- Fix existing Owner roles with NULL descriptions
UPDATE roles
SET description = 'System owner with full access'
WHERE name ILIKE '%owner%' AND description IS NULL;

-- Check if we need to fix the role_permissions table
DO $$
BEGIN
    -- Check if the role_permissions table has a conditions column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'role_permissions' 
        AND column_name = 'conditions'
    ) THEN
        -- Add a notice for debugging
        RAISE NOTICE 'The conditions column does not exist in role_permissions';
    END IF;
END $$;

-- Create a function to get users with a specific permission
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
        
        -- Also include users based on their role field in the users table
        -- This handles legacy role assignments
        SELECT u.id
        FROM users u
        JOIN roles r ON 
            (r.name ILIKE '%' || u.role || '%') OR
            (LOWER(r.name) = LOWER(u.role)) OR
            (
                -- Special mappings for known role variations
                (u.role = 'superAdmin' AND r.name ILIKE '%super admin%') OR
                (u.role = 'complianceManager' AND r.name ILIKE '%compliance manager%') OR
                (u.role = 'compliance_officer' AND r.name ILIKE '%compliance officer%') OR
                (u.role = 'owner' AND r.name ILIKE '%owner%') OR
                (u.role = 'basic_user' AND r.name ILIKE '%agent%')
            )
        WHERE EXISTS (
            SELECT 1 FROM eligible_roles er WHERE er.role_id = r.id
        )
    )
    SELECT DISTINCT user_id
    FROM users_with_eligible_roles;
END;
$$ LANGUAGE plpgsql;

-- Create a function to check if a user has a specific permission
CREATE OR REPLACE FUNCTION check_user_permission(p_user_id UUID, p_permission_id TEXT)
RETURNS BOOLEAN
AS $$
DECLARE
    user_has_permission BOOLEAN;
BEGIN
    -- First check if the user has any roles assigned in user_roles
    SELECT EXISTS (
        SELECT 1
        FROM user_roles ur
        JOIN role_permissions rp ON ur.role = rp.role_id
        WHERE ur.user_id = p_user_id
        AND rp.permission_id = p_permission_id
        AND rp.effect = 'allow'
    ) INTO user_has_permission;
    
    -- If not, check based on the role field in users table
    IF NOT user_has_permission THEN
        SELECT EXISTS (
            SELECT 1
            FROM users u
            JOIN roles r ON 
                (r.name ILIKE '%' || u.role || '%') OR
                (LOWER(r.name) = LOWER(u.role)) OR
                (
                    -- Special mappings for known role variations
                    (u.role = 'superAdmin' AND r.name ILIKE '%super admin%') OR
                    (u.role = 'complianceManager' AND r.name ILIKE '%compliance manager%') OR
                    (u.role = 'compliance_officer' AND r.name ILIKE '%compliance officer%') OR
                    (u.role = 'owner' AND r.name ILIKE '%owner%') OR
                    (u.role = 'basic_user' AND r.name ILIKE '%agent%')
                )
            JOIN role_permissions rp ON r.id = rp.role_id
            WHERE u.id = p_user_id
            AND rp.permission_id = p_permission_id
            AND rp.effect = 'allow'
        ) INTO user_has_permission;
    END IF;
    
    RETURN user_has_permission;
END;
$$ LANGUAGE plpgsql;

-- Ensure policy_rule_approvers table exists
CREATE TABLE IF NOT EXISTS policy_rule_approvers (
    policy_rule_id UUID NOT NULL,
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    PRIMARY KEY (policy_rule_id, user_id)
);

-- Add comment to policy_rule_approvers table
COMMENT ON TABLE policy_rule_approvers IS 'Stores approvers assigned to specific policy rules'; 