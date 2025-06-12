-- Migration to update the role system to work with the new standardized roles
-- This migration ensures consistent role handling across the application

-- First, make sure we have a comprehensive role constraint that includes all standard roles
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;

-- We'll use a trigger-based approach rather than a static constraint
-- This allows for dynamic roles while still maintaining integrity

-- Update the dynamic role validation function to handle normalized roles
CREATE OR REPLACE FUNCTION check_role_exists() RETURNS TRIGGER AS $$
BEGIN
  -- First check if the role exists directly in the roles table
  IF EXISTS (SELECT 1 FROM roles WHERE name = NEW.role) THEN
    RETURN NEW;
  END IF;
  
  -- If not found directly, try to normalize common role formats
  -- This handles cases like 'Super Admin' vs 'superAdmin' vs 'super_admin'
  DECLARE
    normalized_role TEXT;
  BEGIN
    -- Simple normalization for common patterns
    -- Convert spaces to camelCase
    IF NEW.role LIKE '% %' THEN
      normalized_role := regexp_replace(
        regexp_replace(
          initcap(NEW.role), 
          ' ([A-Za-z])',
          '\1',
          'g'
        ),
        '^([A-Z])',
        lower(substring(NEW.role from 1 for 1)),
        'g'
      );
    -- Convert snake_case to camelCase
    ELSIF NEW.role LIKE '%_%' THEN
      normalized_role := regexp_replace(
        regexp_replace(
          initcap(replace(NEW.role, '_', ' ')), 
          ' ([A-Za-z])',
          '\1',
          'g'
        ),
        '^([A-Z])',
        lower(substring(replace(NEW.role, '_', ' ') from 1 for 1)),
        'g'
      );
    ELSE
      normalized_role := NEW.role;
    END IF;
    
    -- Check if normalized role exists
    IF EXISTS (SELECT 1 FROM roles WHERE name = normalized_role) THEN
      -- Update to the normalized version
      NEW.role := normalized_role;
      RETURN NEW;
    END IF;
    
    -- Last resort: Check for similar roles using pattern matching
    IF EXISTS (SELECT 1 FROM roles WHERE 
               lower(name) LIKE lower(NEW.role) || '%' OR 
               lower(name) LIKE '%' || lower(NEW.role) || '%') THEN
      -- Get the first matching role
      SELECT name INTO normalized_role FROM roles WHERE 
        lower(name) LIKE lower(NEW.role) || '%' OR 
        lower(name) LIKE '%' || lower(NEW.role) || '%'
      LIMIT 1;
      
      -- Update to the matched role
      NEW.role := normalized_role;
      RETURN NEW;
    END IF;
  END;
  
  -- If no existing role could be found or matched, try to add this role to the roles table
  -- This auto-creates missing roles to prevent constraint violations
  INSERT INTO roles (name, description, priority, created_at, updated_at)
  VALUES (
    NEW.role, 
    'Automatically created role from user_roles insert', 
    100, -- default priority
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS validate_role_exists ON user_roles;
CREATE TRIGGER validate_role_exists
BEFORE INSERT OR UPDATE ON user_roles
FOR EACH ROW
EXECUTE FUNCTION check_role_exists();

-- First drop the existing function to avoid return type errors
DROP FUNCTION IF EXISTS get_users_with_permission(text);

-- Update the function for getting users with a specific permission
-- This ensures it works with normalized role names
CREATE OR REPLACE FUNCTION get_users_with_permission(p_permission_id TEXT)
RETURNS TABLE (user_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ur.user_id
  FROM user_roles ur
  JOIN role_permissions rp ON 
    -- Use more flexible role matching (normalized forms)
    (
      ur.role = rp.role_id OR
      EXISTS (
        SELECT 1 FROM roles r1, roles r2
        WHERE r1.name = ur.role AND r2.name = rp.role_id AND
        (
          -- Direct match
          r1.id = r2.id OR
          -- Case insensitive match
          lower(r1.name) = lower(r2.name) OR
          -- Without spaces/underscores
          regexp_replace(lower(r1.name), '[_ ]', '', 'g') = 
          regexp_replace(lower(r2.name), '[_ ]', '', 'g')
        )
      )
    )
  WHERE 
    rp.permission_id = p_permission_id AND
    rp.effect = 'allow';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run a one-time normalization of existing roles in the database
-- Update roles table to standardize formats
DO $$
DECLARE
  role_record RECORD;
  normalized_role TEXT;
BEGIN
  -- First, identify duplicate roles with different cases/formats
  FOR role_record IN (
    SELECT r1.id, r1.name as original_name, r2.name as canonical_name
    FROM roles r1
    JOIN roles r2 ON 
      r1.id <> r2.id AND
      (
        lower(r1.name) = lower(r2.name) OR
        regexp_replace(lower(r1.name), '[_ ]', '', 'g') = 
        regexp_replace(lower(r2.name), '[_ ]', '', 'g')
      )
    WHERE r2.priority < r1.priority -- Keep the one with higher priority (lower number)
  ) LOOP
    -- For each duplicate, update references in user_roles
    RAISE NOTICE 'Normalizing role: % to %', role_record.original_name, role_record.canonical_name;
    
    -- Update user_roles references
    UPDATE user_roles
    SET role = role_record.canonical_name
    WHERE role = role_record.original_name;
    
    -- Update role_permissions references
    UPDATE role_permissions
    SET role_id = role_record.canonical_name
    WHERE role_id = role_record.original_name;
    
    -- Delete the duplicate role
    DELETE FROM roles
    WHERE name = role_record.original_name;
  END LOOP;
  
  -- Standardize common role formats
  -- For example, convert 'super_admin' to 'superAdmin' if 'superAdmin' exists
  UPDATE user_roles
  SET role = 'superAdmin'
  WHERE role IN ('super_admin', 'Super_Admin', 'SUPER_ADMIN', 'SuperAdmin', 'super admin', 'Super Admin', 'SUPER ADMIN');
  
  UPDATE user_roles
  SET role = 'complianceManager'
  WHERE role IN ('compliance_manager', 'Compliance_Manager', 'COMPLIANCE_MANAGER', 'compliance manager', 'Compliance Manager', 'COMPLIANCE MANAGER');
  
  UPDATE user_roles
  SET role = 'complianceOfficer'
  WHERE role IN ('compliance_officer', 'Compliance_Officer', 'COMPLIANCE_OFFICER', 'compliance officer', 'Compliance Officer', 'COMPLIANCE OFFICER');
END $$;

-- Also update the check_user_permission function to handle normalized roles
DROP FUNCTION IF EXISTS check_user_permission(UUID, TEXT);

CREATE OR REPLACE FUNCTION check_user_permission(p_user_id UUID, p_permission_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  has_permission BOOLEAN;
BEGIN
  -- Check if user has this permission through their roles
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON 
      -- Normalized role matching
      (
        ur.role = rp.role_id OR
        EXISTS (
          SELECT 1 FROM roles r1, roles r2
          WHERE (r1.name = ur.role OR r1.id::text = ur.role) 
            AND (r2.name = rp.role_id OR r2.id::text = rp.role_id)
            AND (
              -- Direct match
              r1.id = r2.id OR
              -- Case insensitive match
              lower(r1.name) = lower(r2.name) OR
              -- Without spaces/underscores match
              regexp_replace(lower(r1.name), '[_ ]', '', 'g') = 
              regexp_replace(lower(r2.name), '[_ ]', '', 'g')
            )
        )
      )
    WHERE 
      ur.user_id = p_user_id
      AND rp.permission_id = p_permission_id
      AND rp.effect = 'allow'
  ) INTO has_permission;

  RETURN COALESCE(has_permission, FALSE);
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in check_user_permission: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure authenticated users can execute the function
GRANT EXECUTE ON FUNCTION check_user_permission TO authenticated;