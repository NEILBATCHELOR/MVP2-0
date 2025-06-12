-- Migration script to simplify permissions system

-- Step 1: Make sure policy_rules.approve permission is added to role_permissions
-- for roles that should have it (Super Admin, Compliance Manager, Compliance Officer)
DO $$
DECLARE
    super_admin_id UUID;
    compliance_manager_id UUID;
    compliance_officer_id UUID;
    owner_id UUID;
BEGIN
    -- Get role IDs
    SELECT id INTO super_admin_id FROM roles WHERE name ILIKE '%super admin%' LIMIT 1;
    SELECT id INTO compliance_manager_id FROM roles WHERE name ILIKE '%compliance manager%' LIMIT 1;
    SELECT id INTO compliance_officer_id FROM roles WHERE name ILIKE '%compliance officer%' LIMIT 1;
    
    -- Check if we need to add Owner role
    SELECT id INTO owner_id FROM roles WHERE name ILIKE '%owner%' LIMIT 1;
    IF owner_id IS NULL THEN
        -- Create Owner role if it doesn't exist
        INSERT INTO roles (name, description, priority, created_at, updated_at)
        VALUES ('Owner', 'System owner with full access', 0, NOW(), NOW())
        RETURNING id INTO owner_id;
        
        -- Add owner permissions
        INSERT INTO role_permissions (role_id, permission_id, effect)
        SELECT owner_id, permission_id, effect
        FROM role_permissions
        WHERE role_id = super_admin_id;
    END IF;
    
    -- Add policy_rules.approve permission if missing
    INSERT INTO role_permissions (role_id, permission_id, effect)
    VALUES
      (super_admin_id, 'policy_rules.approve', 'allow')
    ON CONFLICT (role_id, permission_id) DO NOTHING;
    
    INSERT INTO role_permissions (role_id, permission_id, effect)
    VALUES
      (compliance_manager_id, 'policy_rules.approve', 'allow')
    ON CONFLICT (role_id, permission_id) DO NOTHING;
    
    INSERT INTO role_permissions (role_id, permission_id, effect)
    VALUES
      (compliance_officer_id, 'policy_rules.approve', 'allow')
    ON CONFLICT (role_id, permission_id) DO NOTHING;
    
    INSERT INTO role_permissions (role_id, permission_id, effect)
    VALUES
      (owner_id, 'policy_rules.approve', 'allow')
    ON CONFLICT (role_id, permission_id) DO NOTHING;
END $$;

-- Create policy_rule_approvers table if it doesn't exist
CREATE TABLE IF NOT EXISTS policy_rule_approvers (
    policy_rule_id UUID NOT NULL,
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    PRIMARY KEY (policy_rule_id, user_id),
    FOREIGN KEY (policy_rule_id) REFERENCES policy_rules (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
);

COMMENT ON TABLE policy_rule_approvers IS 'Stores approvers assigned to specific policy rules';

-- Step 2: Drop constraints that reference permissions table
ALTER TABLE user_permissions DROP CONSTRAINT IF EXISTS user_permissions_permission_id_fkey;
ALTER TABLE role_permissions DROP CONSTRAINT IF EXISTS role_permissions_permission_id_fkey;

-- Step 3: Create a function to get users with a specific permission
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
        -- Join user_roles with eligible_roles
        SELECT DISTINCT ur.user_id
        FROM user_roles ur
        JOIN eligible_roles er ON er.role_id = ur.role_id
        
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
        JOIN eligible_roles er ON er.role_id = r.id
    )
    SELECT DISTINCT user_id
    FROM users_with_eligible_roles;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create a function to check if a user has a specific permission
CREATE OR REPLACE FUNCTION check_user_permission(p_user_id UUID, p_permission_id TEXT)
RETURNS BOOLEAN
AS $$
DECLARE
    user_has_permission BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM get_users_with_permission(p_permission_id) up
        WHERE up.user_id = p_user_id
    ) INTO user_has_permission;
    
    RETURN user_has_permission;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Fix user_roles entries to align with roles table
DO $$
DECLARE 
    role_column_name TEXT;
    role_mappings RECORD;
BEGIN
    -- Check if user_roles has a role column
    SELECT column_name INTO role_column_name
    FROM information_schema.columns
    WHERE table_name = 'user_roles'
    AND column_name IN ('role', 'role_id')
    LIMIT 1;
    
    -- Create temporary table to store mappings
    CREATE TEMP TABLE temp_user_role_mappings (
        user_id UUID,
        role_id UUID
    );
    
    -- Insert data into temp table
    INSERT INTO temp_user_role_mappings (user_id, role_id)
    SELECT 
        u.id AS user_id,
        r.id AS role_id
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
    WHERE u.role IS NOT NULL;
    
    -- Insert using the appropriate column
    IF role_column_name = 'role' THEN
        -- Insert using the 'role' column
        EXECUTE format('
            INSERT INTO user_roles (user_id, role)
            SELECT user_id, role_id
            FROM temp_user_role_mappings
            ON CONFLICT (user_id, role) DO NOTHING
        ');
    ELSIF role_column_name = 'role_id' THEN
        -- Insert using the 'role_id' column
        EXECUTE format('
            INSERT INTO user_roles (user_id, role_id)
            SELECT user_id, role_id
            FROM temp_user_role_mappings
            ON CONFLICT (user_id, role_id) DO NOTHING
        ');
    ELSE
        RAISE EXCEPTION 'Neither "role" nor "role_id" column found in user_roles table';
    END IF;
    
    -- Clean up temp table
    DROP TABLE temp_user_role_mappings;
END $$;

-- Step 6: Rename permissions table instead of dropping it
-- This ensures we don't lose any data while making the transition
ALTER TABLE permissions RENAME TO permissions_deprecated;

-- Add a comment to the table so developers know it's deprecated
COMMENT ON TABLE permissions_deprecated IS 'DEPRECATED: This table is no longer used. Use role_permissions instead for permission checks';