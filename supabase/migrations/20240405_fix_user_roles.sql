-- Migration to check and fix the user_roles table structure

-- Step 1: Check the columns that exist in user_roles table
DO $$
DECLARE
    role_column_exists BOOLEAN;
    role_id_column_exists BOOLEAN;
BEGIN
    -- Check if the 'role' column exists
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'user_roles'
        AND column_name = 'role'
    ) INTO role_column_exists;
    
    -- Check if the 'role_id' column exists
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'user_roles'
        AND column_name = 'role_id'
    ) INTO role_id_column_exists;
    
    -- If neither column exists, add a 'role' column
    IF NOT role_column_exists AND NOT role_id_column_exists THEN
        ALTER TABLE user_roles ADD COLUMN role UUID REFERENCES roles(id);
        RAISE NOTICE 'Added a new role column to user_roles table';
    
    -- If only role_id exists, rename it to role
    ELSIF NOT role_column_exists AND role_id_column_exists THEN
        ALTER TABLE user_roles RENAME COLUMN role_id TO role;
        RAISE NOTICE 'Renamed role_id column to role in user_roles table';
    
    -- If both columns exist, move values from role_id to role and drop role_id
    ELSIF role_column_exists AND role_id_column_exists THEN
        -- Update role column with role_id values where role is null
        UPDATE user_roles 
        SET role = role_id 
        WHERE role IS NULL AND role_id IS NOT NULL;
        
        -- If there are conflicts where both have values, keep the role column value
        
        -- Drop the role_id column
        ALTER TABLE user_roles DROP COLUMN role_id;
        RAISE NOTICE 'Merged data and dropped role_id column, keeping role column';
    ELSE
        RAISE NOTICE 'The role column already exists in user_roles table';
    END IF;
END $$;

-- Step 2: Fix references in migration scripts
-- Make sure our functions always use role column name
DO $$
BEGIN
    -- Get users with permission function
    DROP FUNCTION IF EXISTS get_users_with_permission(TEXT);
    
    CREATE OR REPLACE FUNCTION get_users_with_permission(p_permission_id TEXT)
    RETURNS TABLE(user_id UUID) 
    AS $func$
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
            JOIN eligible_roles er ON er.role_id = ur.role
            
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
            JOIN eligible_roles er ON er.role_id = r.id
        )
        SELECT DISTINCT user_id
        FROM users_with_eligible_roles;
    END;
    $func$ LANGUAGE plpgsql;
    
    -- Check user permission function
    DROP FUNCTION IF EXISTS check_user_permission(UUID, TEXT);
    
    CREATE OR REPLACE FUNCTION check_user_permission(p_user_id UUID, p_permission_id TEXT)
    RETURNS BOOLEAN
    AS $func$
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
    $func$ LANGUAGE plpgsql;
END $$; 