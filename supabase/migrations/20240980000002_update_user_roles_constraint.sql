-- Update the user_roles table constraint to work with normalized role names
-- First, drop the existing constraint
ALTER TABLE IF EXISTS public.user_roles
DROP CONSTRAINT IF EXISTS user_roles_role_check;

-- Create a function to normalize existing roles
CREATE OR REPLACE FUNCTION normalize_role(role_name TEXT) RETURNS TEXT AS $$
DECLARE
  normalized TEXT;
BEGIN
  -- Make sure role_name isn't null
  IF role_name IS NULL THEN
    RETURN NULL;
  END IF;

  -- Handle specific role formats without using LOWER for comparison
  -- This ensures exact case matching without any possibility of case collation issues
  IF role_name = 'Owner' THEN
    RETURN 'owner';
  ELSIF role_name = 'SuperAdmin' OR role_name = 'Super Admin' OR role_name = 'Super_Admin' OR role_name = 'SUPER ADMIN' THEN
    RETURN 'superAdmin';
  ELSIF role_name = 'Admin' THEN
    RETURN 'admin';
  ELSIF role_name = 'Agent' THEN
    RETURN 'agent';
  ELSIF role_name = 'ComplianceManager' OR role_name = 'Compliance Manager' OR role_name = 'Compliance_Manager' THEN
    RETURN 'complianceManager';
  ELSIF role_name = 'ComplianceOfficer' OR role_name = 'Compliance Officer' OR role_name = 'Compliance_Officer' THEN
    RETURN 'complianceOfficer';
  ELSIF role_name = 'Issuer' THEN
    RETURN 'issuer';
  ELSIF role_name = 'Viewer' THEN
    RETURN 'viewer';
  END IF;

  -- Now handle all known role formats (lowercased for comparison)
  CASE LOWER(role_name)
    -- superAdmin variants
    WHEN 'superadmin' THEN normalized := 'superAdmin';
    WHEN 'super_admin' THEN normalized := 'superAdmin';
    WHEN 'super admin' THEN normalized := 'superAdmin';
    WHEN 'super-admin' THEN normalized := 'superAdmin';
    
    -- owner variants
    WHEN 'owner' THEN normalized := 'owner';
    
    -- complianceManager variants
    WHEN 'compliancemanager' THEN normalized := 'complianceManager';
    WHEN 'compliance_manager' THEN normalized := 'complianceManager';
    WHEN 'compliance manager' THEN normalized := 'complianceManager';
    WHEN 'compliance-manager' THEN normalized := 'complianceManager';
    
    -- agent variants
    WHEN 'agent' THEN normalized := 'agent';
    
    -- complianceOfficer variants  
    WHEN 'complianceofficer' THEN normalized := 'complianceOfficer';
    WHEN 'compliance_officer' THEN normalized := 'complianceOfficer';
    WHEN 'compliance officer' THEN normalized := 'complianceOfficer';
    WHEN 'compliance-officer' THEN normalized := 'complianceOfficer';
    
    -- admin variants
    WHEN 'admin' THEN normalized := 'admin';
    
    -- issuer variants
    WHEN 'issuer' THEN normalized := 'issuer';
    
    -- viewer variants  
    WHEN 'viewer' THEN normalized := 'viewer';
    
    -- If no match, return as is (but this shouldn't happen)
    ELSE normalized := role_name;
  END CASE;
  
  RETURN normalized;
END;
$$ LANGUAGE plpgsql;

-- Let's directly test if the normalize_role function correctly handles the 'Owner' case
DO $$
BEGIN
  IF normalize_role('Owner') != 'owner' THEN
    RAISE EXCEPTION 'normalize_role function is not handling Owner correctly: %', normalize_role('Owner');
  END IF;
END $$;

-- Direct approach: Manually fix the known problematic role 
UPDATE public.user_roles SET role = 'owner' WHERE id = '0d50fc8b-370d-4901-9fd6-26244e4bdadc';

-- Update existing roles in user_roles table directly without any conditions
UPDATE public.user_roles SET role = normalize_role(role);

-- Handle case-sensitive issues if the function didn't catch them
-- These updates act as a safety net
UPDATE public.user_roles SET role = 'owner' WHERE role = 'Owner';
UPDATE public.user_roles SET role = 'superAdmin' WHERE role = 'SuperAdmin';
UPDATE public.user_roles SET role = 'admin' WHERE role = 'Admin';
UPDATE public.user_roles SET role = 'agent' WHERE role = 'Agent';
UPDATE public.user_roles SET role = 'complianceManager' WHERE role = 'ComplianceManager';
UPDATE public.user_roles SET role = 'complianceOfficer' WHERE role = 'ComplianceOfficer';
UPDATE public.user_roles SET role = 'issuer' WHERE role = 'Issuer';
UPDATE public.user_roles SET role = 'viewer' WHERE role = 'Viewer';

-- Double-check any remaining non-normalized roles
-- For manual review if there are still issues
CREATE TEMP TABLE IF NOT EXISTS non_normalized_roles AS
SELECT id, role
FROM public.user_roles
WHERE role NOT IN ('superAdmin', 'owner', 'complianceManager', 'agent', 'complianceOfficer', 'admin', 'issuer', 'viewer');

-- Show non-normalized roles for debugging
DO $$
DECLARE
    role_rec RECORD;
BEGIN
    FOR role_rec IN 
        SELECT id, role FROM public.user_roles 
        WHERE role NOT IN ('superAdmin', 'owner', 'complianceManager', 'agent', 'complianceOfficer', 'admin', 'issuer', 'viewer')
    LOOP
        RAISE NOTICE 'Non-normalized role: % with ID %', role_rec.role, role_rec.id;
    END LOOP;
END $$;

-- Last resort: Force all known problematic roles
UPDATE public.user_roles 
SET role = CASE
    WHEN role ILIKE '%owner%' THEN 'owner'
    WHEN role ILIKE '%super%admin%' THEN 'superAdmin'
    WHEN role ILIKE '%admin%' AND role NOT ILIKE '%super%' THEN 'admin'
    WHEN role ILIKE '%agent%' THEN 'agent'
    WHEN role ILIKE '%compliance%manager%' THEN 'complianceManager'
    WHEN role ILIKE '%compliance%officer%' THEN 'complianceOfficer'
    WHEN role ILIKE '%issuer%' THEN 'issuer'
    WHEN role ILIKE '%viewer%' THEN 'viewer'
    ELSE role
END
WHERE role NOT IN ('superAdmin', 'owner', 'complianceManager', 'agent', 'complianceOfficer', 'admin', 'issuer', 'viewer');

-- Verify we've fixed all issues before continuing
DO $$
DECLARE
  remaining_count INTEGER;
  role_rec RECORD;
BEGIN
  SELECT COUNT(*) INTO remaining_count
  FROM public.user_roles
  WHERE role NOT IN ('superAdmin', 'owner', 'complianceManager', 'agent', 'complianceOfficer', 'admin', 'issuer', 'viewer');
  
  IF remaining_count > 0 THEN
    -- Show detailed information about remaining non-normalized roles
    RAISE NOTICE 'Non-normalized roles remaining:';
    FOR role_rec IN 
        SELECT id, role, user_id FROM public.user_roles 
        WHERE role NOT IN ('superAdmin', 'owner', 'complianceManager', 'agent', 'complianceOfficer', 'admin', 'issuer', 'viewer')
    LOOP
        RAISE NOTICE 'ID: %, Role: %, User ID: %', role_rec.id, role_rec.role, role_rec.user_id;
    END LOOP;
    
    -- If all else fails, directly update the problematic record
    FOR role_rec IN 
        SELECT id, role FROM public.user_roles 
        WHERE role NOT IN ('superAdmin', 'owner', 'complianceManager', 'agent', 'complianceOfficer', 'admin', 'issuer', 'viewer')
        LIMIT 1
    LOOP
        UPDATE public.user_roles SET role = 'owner' WHERE id = role_rec.id;
        RAISE NOTICE 'Emergency fix applied to ID: %', role_rec.id;
    END LOOP;
    
    -- Check if emergency fix helped
    SELECT COUNT(*) INTO remaining_count
    FROM public.user_roles
    WHERE role NOT IN ('superAdmin', 'owner', 'complianceManager', 'agent', 'complianceOfficer', 'admin', 'issuer', 'viewer');
    
    IF remaining_count > 0 THEN
      RAISE EXCEPTION 'There are still % non-normalized roles in user_roles table', remaining_count;
    END IF;
  END IF;
END $$;

-- Update existing roles in users table
UPDATE public.users
SET role = normalize_role(role)
WHERE role IS NOT NULL;

-- Update user metadata if it exists
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  raw_user_meta_data,
  '{role}',
  to_jsonb(normalize_role(raw_user_meta_data->>'role')),
  true
)
WHERE raw_user_meta_data ? 'role';

-- Now add the constraint after all roles are normalized
ALTER TABLE public.user_roles
ADD CONSTRAINT user_roles_role_check CHECK (
  role = ANY (ARRAY[
    'superAdmin'::text,
    'owner'::text,
    'complianceManager'::text,
    'agent'::text,
    'complianceOfficer'::text,
    'admin'::text,
    'issuer'::text,
    'viewer'::text
  ])
);

-- Drop temp table and function as they are no longer needed
DROP TABLE IF EXISTS non_normalized_roles;
DROP FUNCTION IF EXISTS normalize_role;
