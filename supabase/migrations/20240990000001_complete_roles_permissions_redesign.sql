-- Complete redesign of the roles and permissions system
-- This migration will create a more robust role-based permission system

-- Start a transaction to ensure all changes are applied or none
BEGIN;

-- Drop existing constraint that causes problems
ALTER TABLE IF EXISTS public.user_roles
DROP CONSTRAINT IF EXISTS user_roles_role_check;

-- Ensure the permissions table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'permissions'
  ) THEN
    CREATE TABLE public.permissions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      resource TEXT NOT NULL,
      action TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(resource, action)
    );
  END IF;
END$$;

-- Add is_system_role column to roles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'roles' AND column_name = 'is_system_role'
  ) THEN
    ALTER TABLE public.roles ADD COLUMN is_system_role BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;
END$$;

-- Add role_id column to user_roles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_roles' AND column_name = 'role_id'
  ) THEN
    ALTER TABLE public.user_roles ADD COLUMN role_id UUID;
  END IF;
END$$;

-- Create a view for easier role management
CREATE OR REPLACE VIEW public.user_roles_view AS
SELECT 
  u.id AS user_id,
  u.name AS user_name,
  u.email,
  r.id AS role_id,
  r.name AS role_name,
  r.description AS role_description,
  r.priority AS role_priority
FROM public.users u
JOIN public.user_roles ur ON u.id = ur.user_id
JOIN public.roles r ON ur.role_id = r.id;

-- Create a view for easier permission management
CREATE OR REPLACE VIEW public.user_permissions_view AS
SELECT
  u.id AS user_id,
  u.name AS user_name,
  r.name AS role_name,
  p.name AS permission_name,
  p.resource,
  p.action,
  rp.effect
FROM
  public.users u
  JOIN public.user_roles ur ON u.id = ur.user_id
  JOIN public.roles r ON ur.role_id = r.id
  JOIN public.role_permissions rp ON r.id = rp.role_id
  JOIN public.permissions p ON rp.permission_id = p.id;

-- Update database functions for permission checks
DROP FUNCTION IF EXISTS check_user_permission(uuid, text);
CREATE OR REPLACE FUNCTION check_user_permission(user_id UUID, permission TEXT) 
RETURNS BOOLEAN AS $$
DECLARE
  has_permission BOOLEAN;
BEGIN
  -- Check if the user has any role with this permission
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role_id = rp.role_id
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = check_user_permission.user_id
    AND p.name = check_user_permission.permission
    AND rp.effect = 'allow'
  ) INTO has_permission;
  
  RETURN has_permission;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in check_user_permission: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS get_users_with_permission(text);
CREATE OR REPLACE FUNCTION get_users_with_permission(permission_name TEXT) 
RETURNS TABLE (
  user_id UUID,
  name TEXT,
  email TEXT,
  role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    u.id,
    u.name,
    u.email,
    r.name AS role
  FROM
    public.users u
    JOIN public.user_roles ur ON u.id = ur.user_id
    JOIN public.roles r ON ur.role_id = r.id
    JOIN public.role_permissions rp ON r.id = rp.role_id
    JOIN public.permissions p ON rp.permission_id = p.id
  WHERE
    p.name = permission_name
    AND rp.effect = 'allow';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in get_users_with_permission: %', SQLERRM;
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Connect user_roles to roles using role_id
DO $$
DECLARE
  user_role RECORD;
  role_id UUID;
BEGIN
  -- For each user_role without a role_id, find the matching role and set the role_id
  FOR user_role IN
    SELECT id, role
    FROM public.user_roles
    WHERE role_id IS NULL
  LOOP
    -- Find matching role (case-insensitive)
    SELECT id INTO role_id
    FROM public.roles
    WHERE LOWER(name) = LOWER(user_role.role)
    LIMIT 1;
    
    -- If found, update the user_role
    IF role_id IS NOT NULL THEN
      UPDATE public.user_roles
      SET role_id = role_id
      WHERE id = user_role.id;
    END IF;
  END LOOP;
END$$;

-- Mark standard roles as system roles
UPDATE public.roles
SET is_system_role = TRUE
WHERE name IN ('Super Admin', 'Owner', 'Compliance Manager', 'Compliance Officer', 'Agent', 'Admin', 'Issuer', 'Viewer')
  OR name IN ('SuperAdmin', 'Owner', 'ComplianceManager', 'ComplianceOfficer', 'Agent', 'Admin', 'Issuer', 'Viewer')
  OR name IN ('superadmin', 'owner', 'compliancemanager', 'complianceofficer', 'agent', 'admin', 'issuer', 'viewer');

-- Create standard permissions if they don't exist
INSERT INTO public.permissions (id, name, resource, action, description)
VALUES
  ('system.access', 'system.access', 'system', 'access', 'Access the system'),
  ('system.configure', 'system.configure', 'system', 'configure', 'Configure system settings'),
  ('system.audit', 'system.audit', 'system', 'audit', 'View audit logs'),
  
  ('users.view', 'users.view', 'users', 'view', 'View user profiles'),
  ('users.create', 'users.create', 'users', 'create', 'Create new users'),
  ('users.edit', 'users.edit', 'users', 'edit', 'Edit user profiles'),
  ('users.delete', 'users.delete', 'users', 'delete', 'Delete users'),
  ('users.manage_roles', 'users.manage_roles', 'users', 'manage_roles', 'Assign or remove user roles'),
  
  ('roles.view', 'roles.view', 'roles', 'view', 'View roles'),
  ('roles.create', 'roles.create', 'roles', 'create', 'Create new roles'),
  ('roles.edit', 'roles.edit', 'roles', 'edit', 'Edit roles'),
  ('roles.delete', 'roles.delete', 'roles', 'delete', 'Delete roles'),
  ('roles.assign_permissions', 'roles.assign_permissions', 'roles', 'assign_permissions', 'Assign permissions to roles')
ON CONFLICT (id) DO NOTHING;

-- Use the role_id for role-based queries
CREATE OR REPLACE FUNCTION normalize_role(role_name TEXT) RETURNS TEXT AS $$
DECLARE
  normalized TEXT;
BEGIN
  -- Handle specific role formats first
  IF role_name = 'Owner' THEN
    RETURN 'Owner';
  ELSIF role_name = 'SuperAdmin' OR role_name = 'Super Admin' OR role_name = 'Super_Admin' THEN
    RETURN 'Super Admin';
  ELSIF role_name = 'Admin' THEN
    RETURN 'Admin';
  ELSIF role_name = 'Agent' THEN
    RETURN 'Agent';
  ELSIF role_name = 'ComplianceManager' OR role_name = 'Compliance Manager' OR role_name = 'Compliance_Manager' THEN
    RETURN 'Compliance Manager';
  ELSIF role_name = 'ComplianceOfficer' OR role_name = 'Compliance Officer' OR role_name = 'Compliance_Officer' THEN
    RETURN 'Compliance Officer';
  ELSIF role_name = 'Issuer' THEN
    RETURN 'Issuer';
  ELSIF role_name = 'Viewer' THEN
    RETURN 'Viewer';
  END IF;

  -- For all other cases, return as is
  RETURN role_name;
END;
$$ LANGUAGE plpgsql;

COMMIT;