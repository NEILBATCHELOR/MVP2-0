-- Create a view to simplify querying users with permissions
-- This will make it possible to directly query users with specific permissions

-- First, drop the view if it already exists
DROP VIEW IF EXISTS users_with_permissions;

-- Drop existing functions to avoid return type conflicts
DROP FUNCTION IF EXISTS get_users_with_permission(text);
DROP FUNCTION IF EXISTS get_users_with_permission_simple(text);
DROP FUNCTION IF EXISTS check_user_permission(uuid, text);

-- Create the view that joins roles, permissions, and users
CREATE OR REPLACE VIEW users_with_permissions AS
WITH role_permission_map AS (
    -- Get all role permissions
    SELECT 
        rp.role_id,
        rp.permission_id,
        rp.effect
    FROM 
        role_permissions rp
    WHERE 
        rp.effect = 'allow'
)
SELECT DISTINCT
    u.id AS user_id,
    u.email,
    u.role AS user_role,
    r.name AS role_name,
    rpm.permission_id
FROM 
    users u
LEFT JOIN 
    user_roles ur ON u.id = ur.user_id
LEFT JOIN 
    roles r ON (
        -- Match by direct role_id join
        ur.role::text = r.id::text
        OR
        -- Match by name/pattern
        (r.name ILIKE '%' || u.role || '%')
        OR
        (LOWER(r.name) = LOWER(u.role))
        OR
        -- Special mappings
        (u.role = 'superAdmin' AND r.name ILIKE '%super admin%')
        OR
        (u.role = 'complianceManager' AND r.name ILIKE '%compliance manager%')
        OR
        (u.role = 'compliance_officer' AND r.name ILIKE '%compliance officer%')
        OR
        (u.role = 'owner' AND r.name ILIKE '%owner%')
        OR
        (u.role = 'basic_user' AND r.name ILIKE '%agent%')
    )
JOIN 
    role_permission_map rpm ON r.id::text = rpm.role_id::text;

-- Create the function to handle getting users with a permission
CREATE OR REPLACE FUNCTION get_users_with_permission(p_permission_id TEXT)
RETURNS TABLE(user_id UUID, email TEXT) 
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uwp.user_id,
        uwp.email
    FROM 
        users_with_permissions uwp
    WHERE 
        uwp.permission_id = p_permission_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in get_users_with_permission: %', SQLERRM;
        -- Return empty result set on error
        RETURN;
END;
$$ LANGUAGE plpgsql;

-- Create a simpler function that can be called directly from the app
CREATE OR REPLACE FUNCTION get_users_with_permission_simple(p_permission_id TEXT)
RETURNS SETOF UUID
AS $$
BEGIN
    RETURN QUERY
    SELECT user_id 
    FROM users_with_permissions
    WHERE permission_id = p_permission_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in get_users_with_permission_simple: %', SQLERRM;
        -- Return empty result set on error
        RETURN;
END;
$$ LANGUAGE plpgsql;

-- Recreate the check_user_permission function
CREATE OR REPLACE FUNCTION check_user_permission(p_user_id UUID, p_permission_id TEXT)
RETURNS BOOLEAN
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM users_with_permissions uwp
        WHERE uwp.user_id = p_user_id
        AND uwp.permission_id = p_permission_id
    );
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in check_user_permission: %', SQLERRM;
        -- Return false on error
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql; 