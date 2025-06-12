-- Migration to fix type mismatch issues in database functions

-- Function to get users with a specific permission (fixed with explicit table aliases for all columns)
CREATE OR REPLACE FUNCTION get_users_with_permission(p_permission_id TEXT)
RETURNS TABLE(user_id UUID) 
AS $$
BEGIN
    RETURN QUERY
    WITH eligible_roles AS (
        SELECT rp.role_id
        FROM role_permissions rp
        WHERE rp.permission_id = p_permission_id
        AND rp.effect = 'allow'
    ),
    users_with_eligible_roles AS (
        -- Join user_roles with eligible_roles using explicit type cast and table aliases
        SELECT DISTINCT ur.user_id
        FROM user_roles ur
        JOIN eligible_roles er ON er.role_id::text = ur.role::text
        
        UNION
        
        -- Also include users based on their role field in the users table
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
            SELECT 1 FROM eligible_roles er WHERE er.role_id::text = r.id::text
        )
    )
    SELECT DISTINCT uwer.user_id
    FROM users_with_eligible_roles uwer;
END;
$$ LANGUAGE plpgsql;

-- Function to check if a user has a specific permission (fixed with explicit table aliases)
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
        JOIN role_permissions rp ON ur.role::text = rp.role_id::text
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
            JOIN role_permissions rp ON r.id::text = rp.role_id::text
            WHERE u.id = p_user_id
            AND rp.permission_id = p_permission_id
            AND rp.effect = 'allow'
        ) INTO user_has_permission;
    END IF;
    
    RETURN user_has_permission;
END;
$$ LANGUAGE plpgsql;

-- Check columns in user_roles and role_permissions tables
DO $$
DECLARE
    user_roles_role_type TEXT;
    role_permissions_role_id_type TEXT;
BEGIN
    -- Get column types
    SELECT data_type INTO user_roles_role_type
    FROM information_schema.columns
    WHERE table_name = 'user_roles' AND column_name = 'role';
    
    SELECT data_type INTO role_permissions_role_id_type
    FROM information_schema.columns
    WHERE table_name = 'role_permissions' AND column_name = 'role_id';
    
    -- Log the column types for debugging
    RAISE NOTICE 'user_roles.role type: %, role_permissions.role_id type: %', 
        user_roles_role_type, role_permissions_role_id_type;
END $$; 