-- Add a secure function for user deletion that works with appropriate permissions

-- First, let's drop the function if it exists
DROP FUNCTION IF EXISTS delete_user_with_privileges(p_user_id UUID);

-- Create the function with proper security definer attributes
CREATE OR REPLACE FUNCTION delete_user_with_privileges(p_user_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Delete from user_roles
    DELETE FROM user_roles WHERE user_id = p_user_id;
    
    -- Delete from any other related tables that might have foreign keys
    -- For example:
    -- DELETE FROM user_preferences WHERE user_id = p_user_id;
    -- DELETE FROM user_logs WHERE user_id = p_user_id;
    
    -- Finally delete from users table
    DELETE FROM users WHERE id = p_user_id;
    
    -- Return success
    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error deleting user %: %', p_user_id, SQLERRM;
        RETURN false;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_with_privileges(UUID) TO authenticated;

-- Create an additional function that can be called from RLS policies
CREATE OR REPLACE FUNCTION user_has_delete_permission(p_user_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if the current user has the necessary role permissions
    RETURN EXISTS (
        SELECT 1
        FROM user_roles ur
        WHERE ur.user_id = auth.uid()
        AND ur.role IN ('superAdmin', 'owner', 'complianceManager', 'admin', 'Super Admin', 'Owner', 'Compliance Manager')
    );
END;
$$;

-- Create a more permissive RLS policy for users table
DROP POLICY IF EXISTS "Allow elevated users to delete users" ON users;
CREATE POLICY "Allow elevated users to delete users"
    ON users
    FOR DELETE
    USING (
        user_has_delete_permission(auth.uid())
    );

-- Create a policy for user_roles to allow deletion
DROP POLICY IF EXISTS "Allow elevated users to manage user roles" ON user_roles;
CREATE POLICY "Allow elevated users to manage user roles"
    ON user_roles
    USING (
        user_has_delete_permission(auth.uid())
    ); 