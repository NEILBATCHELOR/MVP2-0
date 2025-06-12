-- Complete redesign of the roles and permissions system
-- This migration will reset and rebuild the roles, permissions, and user_roles tables
-- to create a more robust and consistent role-based permission system

-- Start a transaction to ensure all changes are applied or none
BEGIN;

-- Backup existing data before dropping tables
-- This ensures we don't lose any important data

-- Backup users table roles
CREATE TEMP TABLE users_role_backup AS
SELECT id, name, email, role
FROM public.users;

-- Backup user_roles table
CREATE TEMP TABLE user_roles_backup AS
SELECT id, user_id, role
FROM public.user_roles;

-- Backup roles table
CREATE TEMP TABLE roles_backup AS
SELECT id, name, description, priority
FROM public.roles;

-- Backup role_permissions table
CREATE TEMP TABLE role_permissions_backup AS
SELECT id, role_id, permission_id, effect
FROM public.role_permissions;

-- Drop existing constraints and tables
ALTER TABLE IF EXISTS public.role_permissions 
  DROP CONSTRAINT IF EXISTS role_permissions_role_id_fkey;
  
DROP TABLE IF EXISTS public.user_roles;
DROP TABLE IF EXISTS public.role_permissions;

-- Drop and recreate the permissions table
CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(resource, action)
);

-- Ensure roles table has the correct schema
DROP TABLE IF EXISTS public.roles CASCADE;
CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  priority INTEGER NOT NULL,
  is_system_role BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create the user_roles junction table with foreign keys
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

-- Create the role_permissions junction table
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  effect TEXT NOT NULL CHECK (effect IN ('allow', 'deny')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- Create standard system roles
INSERT INTO public.roles (name, description, priority, is_system_role) VALUES
  ('Super Admin', 'Full system access with all permissions', 100, TRUE),
  ('Owner', 'Platform owner with extensive management rights', 90, TRUE),
  ('Compliance Manager', 'Manages compliance policies and procedures', 80, TRUE),
  ('Compliance Officer', 'Reviews and approves compliance-related items', 70, TRUE),
  ('Agent', 'Handles day-to-day operations and support', 60, TRUE),
  ('Admin', 'Administrative access to platform features', 50, TRUE),
  ('Issuer', 'Creates and manages token issuances', 40, TRUE),
  ('Viewer', 'Read-only access to allowed resources', 30, TRUE);

-- Create standard permissions
INSERT INTO public.permissions (name, resource, action, description) VALUES
  ('system.access', 'system', 'access', 'Access the system'),
  ('system.configure', 'system', 'configure', 'Configure system settings'),
  ('system.audit', 'system', 'audit', 'View audit logs'),
  
  ('users.view', 'users', 'view', 'View user profiles'),
  ('users.create', 'users', 'create', 'Create new users'),
  ('users.edit', 'users', 'edit', 'Edit user profiles'),
  ('users.delete', 'users', 'delete', 'Delete users'),
  ('users.manage_roles', 'users', 'manage_roles', 'Assign or remove user roles'),
  
  ('roles.view', 'roles', 'view', 'View roles'),
  ('roles.create', 'roles', 'create', 'Create new roles'),
  ('roles.edit', 'roles', 'edit', 'Edit roles'),
  ('roles.delete', 'roles', 'delete', 'Delete roles'),
  ('roles.assign_permissions', 'roles', 'assign_permissions', 'Assign permissions to roles'),
  
  ('projects.view', 'projects', 'view', 'View projects'),
  ('projects.create', 'projects', 'create', 'Create new projects'),
  ('projects.edit', 'projects', 'edit', 'Edit projects'),
  ('projects.delete', 'projects', 'delete', 'Delete projects'),
  
  ('policies.view', 'policies', 'view', 'View policies'),
  ('policies.create', 'policies', 'create', 'Create new policies'),
  ('policies.edit', 'policies', 'edit', 'Edit policies'),
  ('policies.delete', 'policies', 'delete', 'Delete policies'),
  ('policies.approve', 'policies', 'approve', 'Approve policies'),
  
  ('rules.view', 'rules', 'view', 'View rules'),
  ('rules.create', 'rules', 'create', 'Create new rules'),
  ('rules.edit', 'rules', 'edit', 'Edit rules'),
  ('rules.delete', 'rules', 'delete', 'Delete rules'),
  
  ('templates.view', 'templates', 'view', 'View templates'),
  ('templates.create', 'templates', 'create', 'Create new templates'),
  ('templates.edit', 'templates', 'edit', 'Edit templates'),
  ('templates.delete', 'templates', 'delete', 'Delete templates'),

  ('tokens.view', 'tokens', 'view', 'View tokens'),
  ('tokens.create', 'tokens', 'create', 'Create new tokens'),
  ('tokens.edit', 'tokens', 'edit', 'Edit tokens'),
  ('tokens.delete', 'tokens', 'delete', 'Delete tokens'),
  ('tokens.issue', 'tokens', 'issue', 'Issue tokens'),
  
  ('investors.view', 'investors', 'view', 'View investors'),
  ('investors.approve', 'investors', 'approve', 'Approve investors');

-- Assign permissions to roles
-- Super Admin gets all permissions
INSERT INTO public.role_permissions (role_id, permission_id, effect)
SELECT 
  (SELECT id FROM public.roles WHERE name = 'Super Admin'), 
  id, 
  'allow'
FROM public.permissions;

-- Owner permissions
INSERT INTO public.role_permissions (role_id, permission_id, effect)
SELECT 
  (SELECT id FROM public.roles WHERE name = 'Owner'),
  id,
  'allow'
FROM public.permissions
WHERE 
  name IN (
    'system.access', 'system.audit',
    'users.view', 'users.create', 'users.edit',
    'roles.view',
    'projects.view', 'projects.create', 'projects.edit',
    'policies.view', 'policies.create', 'policies.approve',
    'rules.view', 'rules.create',
    'templates.view',
    'tokens.view', 'tokens.create', 'tokens.edit', 'tokens.issue',
    'investors.view', 'investors.approve'
  );

-- Compliance Manager permissions
INSERT INTO public.role_permissions (role_id, permission_id, effect)
SELECT 
  (SELECT id FROM public.roles WHERE name = 'Compliance Manager'),
  id,
  'allow'
FROM public.permissions
WHERE 
  name IN (
    'system.access', 'system.audit',
    'users.view',
    'policies.view', 'policies.create', 'policies.edit', 'policies.delete', 
    'rules.view', 'rules.create', 'rules.edit', 'rules.delete',
    'templates.view', 'templates.create', 'templates.edit',
    'investors.view', 'investors.approve'
  );

-- Compliance Officer permissions
INSERT INTO public.role_permissions (role_id, permission_id, effect)
SELECT 
  (SELECT id FROM public.roles WHERE name = 'Compliance Officer'),
  id,
  'allow'
FROM public.permissions
WHERE 
  name IN (
    'system.access', 'system.audit',
    'policies.view', 'policies.edit', 'policies.approve',
    'rules.view', 'rules.edit',
    'templates.view',
    'investors.view', 'investors.approve'
  );

-- Agent permissions
INSERT INTO public.role_permissions (role_id, permission_id, effect)
SELECT 
  (SELECT id FROM public.roles WHERE name = 'Agent'),
  id,
  'allow'
FROM public.permissions
WHERE 
  name IN (
    'system.access',
    'users.view',
    'projects.view',
    'policies.view',
    'rules.view',
    'templates.view',
    'tokens.view',
    'investors.view'
  );

-- Admin permissions
INSERT INTO public.role_permissions (role_id, permission_id, effect)
SELECT 
  (SELECT id FROM public.roles WHERE name = 'Admin'),
  id,
  'allow'
FROM public.permissions
WHERE 
  name IN (
    'system.access', 'system.configure',
    'users.view', 'users.create', 'users.edit',
    'roles.view',
    'projects.view', 'projects.edit',
    'policies.view', 'policies.edit',
    'rules.view', 'rules.edit',
    'templates.view'
  );

-- Issuer permissions
INSERT INTO public.role_permissions (role_id, permission_id, effect)
SELECT 
  (SELECT id FROM public.roles WHERE name = 'Issuer'),
  id,
  'allow'
FROM public.permissions
WHERE 
  name IN (
    'system.access',
    'tokens.view', 'tokens.create', 'tokens.edit', 'tokens.issue',
    'investors.view'
  );

-- Viewer permissions
INSERT INTO public.role_permissions (role_id, permission_id, effect)
SELECT 
  (SELECT id FROM public.roles WHERE name = 'Viewer'),
  id,
  'allow'
FROM public.permissions
WHERE 
  name LIKE '%.view';

-- Migrate existing users from the backup
-- First, map old roles to new roles
WITH role_mapping AS (
  SELECT 
    CASE 
      WHEN LOWER(role) LIKE '%super%admin%' OR LOWER(role) = 'superadmin' THEN 'Super Admin'
      WHEN LOWER(role) = 'owner' THEN 'Owner'
      WHEN LOWER(role) LIKE '%compliance%manager%' THEN 'Compliance Manager'
      WHEN LOWER(role) LIKE '%compliance%officer%' THEN 'Compliance Officer'
      WHEN LOWER(role) = 'agent' THEN 'Agent'
      WHEN LOWER(role) = 'admin' THEN 'Admin'
      WHEN LOWER(role) = 'issuer' THEN 'Issuer'
      WHEN LOWER(role) = 'viewer' THEN 'Viewer'
      ELSE 'Viewer' -- Default to Viewer for unrecognized roles
    END AS new_role,
    user_id
  FROM user_roles_backup
)
INSERT INTO public.user_roles (user_id, role_id)
SELECT DISTINCT
  rm.user_id,
  r.id AS role_id
FROM role_mapping rm
JOIN public.roles r ON r.name = rm.new_role
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = rm.user_id AND ur.role_id = r.id
);

-- Create database functions for permission checks
CREATE OR REPLACE FUNCTION check_user_permission(user_id UUID, permission_name TEXT) 
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
    AND p.name = check_user_permission.permission_name
    AND rp.effect = 'allow'
  ) INTO has_permission;
  
  RETURN has_permission;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in check_user_permission: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

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

-- Make sure roles are updated in the users table (for backward compatibility)
UPDATE public.users u
SET role = r.name
FROM public.user_roles ur
JOIN public.roles r ON ur.role_id = r.id
WHERE ur.user_id = u.id;

-- Create helpful views
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

COMMIT;