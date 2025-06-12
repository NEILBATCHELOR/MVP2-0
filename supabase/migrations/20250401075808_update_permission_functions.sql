-- Update permission functions to work with normalized roles
-- Drop existing functions
DROP FUNCTION IF EXISTS check_user_permission(UUID, TEXT);
DROP FUNCTION IF EXISTS get_users_with_permission(TEXT);

-- This function validates a user's permission based on role
CREATE OR REPLACE FUNCTION check_user_permission(user_id UUID, permission TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  has_permission BOOLEAN := FALSE;
  user_role TEXT;
  normalized_role TEXT;
BEGIN
  -- Normalize role names for the check
  SELECT role INTO user_role FROM user_roles WHERE user_id = $1 LIMIT 1;
  
  -- Normalize the role name using the same logic as the client-side normalizeRole function
  CASE LOWER(user_role)
    -- superAdmin variants
    WHEN 'superadmin' THEN normalized_role := 'superAdmin';
    WHEN 'super_admin' THEN normalized_role := 'superAdmin';
    WHEN 'super admin' THEN normalized_role := 'superAdmin';
    WHEN 'super-admin' THEN normalized_role := 'superAdmin';
    WHEN 'superadmin' THEN normalized_role := 'superAdmin';
    WHEN 'superAdmin' THEN normalized_role := 'superAdmin';
    WHEN 'SUPER_ADMIN' THEN normalized_role := 'superAdmin';
    WHEN 'SUPER ADMIN' THEN normalized_role := 'superAdmin';
    
    -- owner variants
    WHEN 'owner' THEN normalized_role := 'owner';
    WHEN 'OWNER' THEN normalized_role := 'owner';
    WHEN 'Owner' THEN normalized_role := 'owner';
    
    -- complianceManager variants
    WHEN 'compliancemanager' THEN normalized_role := 'complianceManager';
    WHEN 'complianceManager' THEN normalized_role := 'complianceManager';
    WHEN 'compliance_manager' THEN normalized_role := 'complianceManager';
    WHEN 'compliance-manager' THEN normalized_role := 'complianceManager';
    WHEN 'compliance manager' THEN normalized_role := 'complianceManager';
    WHEN 'Compliance Manager' THEN normalized_role := 'complianceManager';
    WHEN 'COMPLIANCE_MANAGER' THEN normalized_role := 'complianceManager';
    WHEN 'COMPLIANCE MANAGER' THEN normalized_role := 'complianceManager';
    
    -- agent variants
    WHEN 'agent' THEN normalized_role := 'agent';
    WHEN 'Agent' THEN normalized_role := 'agent';
    WHEN 'AGENT' THEN normalized_role := 'agent';
    
    -- complianceOfficer variants
    WHEN 'complianceofficer' THEN normalized_role := 'complianceOfficer';
    WHEN 'complianceOfficer' THEN normalized_role := 'complianceOfficer';
    WHEN 'compliance_officer' THEN normalized_role := 'complianceOfficer';
    WHEN 'compliance-officer' THEN normalized_role := 'complianceOfficer';
    WHEN 'compliance officer' THEN normalized_role := 'complianceOfficer';
    WHEN 'Compliance Officer' THEN normalized_role := 'complianceOfficer';
    WHEN 'COMPLIANCE_OFFICER' THEN normalized_role := 'complianceOfficer';
    WHEN 'COMPLIANCE OFFICER' THEN normalized_role := 'complianceOfficer';
    
    -- If none of the above match, keep the original
    ELSE normalized_role := user_role;
  END CASE;
  
  -- Check permissions against normalized role
  SELECT EXISTS (
    SELECT 1
    FROM role_permissions rp
    INNER JOIN permissions p ON rp.permission_id = p.id
    WHERE rp.role_name = normalized_role
    AND p.name = $2
  ) INTO has_permission;
  
  -- Super Admin has all permissions
  IF normalized_role = 'superAdmin' THEN
    has_permission := TRUE;
  END IF;
  
  RETURN has_permission;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error checking permission: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- This function gets all users who have a specific permission
CREATE OR REPLACE FUNCTION get_users_with_permission(permission_name TEXT)
RETURNS TABLE (
  user_id UUID,
  name TEXT,
  email TEXT,
  role TEXT
) AS $$
BEGIN
  -- First get all superAdmin users who have all permissions
  -- Then get users with specific permission based on normalized role
  RETURN QUERY
    SELECT DISTINCT u.id, u.name, u.email, ur.role
    FROM users u
    JOIN user_roles ur ON u.id = ur.user_id
    WHERE (
      -- Normalize role to superAdmin
      LOWER(ur.role) = 'superadmin' OR
      ur.role = 'superAdmin' OR
      ur.role = 'SUPER_ADMIN' OR
      ur.role = 'super_admin' OR
      ur.role = 'SuperAdmin' OR
      ur.role = 'super admin' OR
      ur.role = 'Super Admin' OR
      ur.role = 'SUPER ADMIN'
    )
    OR 
    EXISTS (
      SELECT 1
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE (
        -- Normalize other roles
        CASE LOWER(ur.role)
          -- superAdmin variants
          WHEN 'superadmin' THEN 'superAdmin'
          WHEN 'super_admin' THEN 'superAdmin'
          WHEN 'super admin' THEN 'superAdmin'
          WHEN 'super-admin' THEN 'superAdmin'
          WHEN 'superAdmin' THEN 'superAdmin'
          WHEN 'SUPER_ADMIN' THEN 'superAdmin'
          WHEN 'SUPER ADMIN' THEN 'superAdmin'
          
          -- owner variants
          WHEN 'owner' THEN 'owner'
          WHEN 'OWNER' THEN 'owner'
          WHEN 'Owner' THEN 'owner'
          
          -- complianceManager variants
          WHEN 'compliancemanager' THEN 'complianceManager'
          WHEN 'complianceManager' THEN 'complianceManager'
          WHEN 'compliance_manager' THEN 'complianceManager'
          WHEN 'compliance-manager' THEN 'complianceManager'
          WHEN 'compliance manager' THEN 'complianceManager'
          WHEN 'Compliance Manager' THEN 'complianceManager'
          WHEN 'COMPLIANCE_MANAGER' THEN 'complianceManager'
          WHEN 'COMPLIANCE MANAGER' THEN 'complianceManager'
          
          -- agent variants
          WHEN 'agent' THEN 'agent'
          WHEN 'Agent' THEN 'agent'
          WHEN 'AGENT' THEN 'agent'
          
          -- complianceOfficer variants
          WHEN 'complianceofficer' THEN 'complianceOfficer'
          WHEN 'complianceOfficer' THEN 'complianceOfficer'
          WHEN 'compliance_officer' THEN 'complianceOfficer'
          WHEN 'compliance-officer' THEN 'complianceOfficer'
          WHEN 'compliance officer' THEN 'complianceOfficer'
          WHEN 'Compliance Officer' THEN 'complianceOfficer'
          WHEN 'COMPLIANCE_OFFICER' THEN 'complianceOfficer'
          WHEN 'COMPLIANCE OFFICER' THEN 'complianceOfficer'
          
          -- If none of the above match, keep the original
          ELSE ur.role
        END = rp.role_name
      ) 
      AND p.name = permission_name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
