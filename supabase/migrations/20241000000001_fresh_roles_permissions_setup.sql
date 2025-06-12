-- Simplified roles and permissions system
-- Starting fresh with a minimal design

BEGIN;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS check_user_permission(uuid, text);
DROP FUNCTION IF EXISTS get_users_with_permission(text);
DROP FUNCTION IF EXISTS normalize_role(text);

-- Drop existing views if they exist
DROP VIEW IF EXISTS public.user_permissions_view;
DROP VIEW IF EXISTS public.user_roles_view;

-- Create users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  public_key TEXT,
  encrypted_private_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create simplified roles table
CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  priority INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_roles table - a user can have only one role for simplicity
CREATE TABLE public.user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create permissions table - simplified to just name and description
CREATE TABLE public.permissions (
  name TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create role_permissions junction table
CREATE TABLE public.role_permissions (
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_name TEXT NOT NULL REFERENCES public.permissions(name) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_name)
);

-- Create convenient view
CREATE VIEW public.user_permissions_view AS
SELECT
  u.id AS user_id,
  u.name AS user_name,
  u.email,
  r.name AS role_name,
  p.name AS permission_name,
  p.description AS permission_description
FROM
  public.users u
  JOIN public.user_roles ur ON u.id = ur.user_id
  JOIN public.roles r ON ur.role_id = r.id
  JOIN public.role_permissions rp ON r.id = rp.role_id
  JOIN public.permissions p ON rp.permission_name = p.name;

-- Create standard roles
INSERT INTO public.roles (name, description, priority)
VALUES 
  ('Super Admin', 'Full system access with all permissions', 100),
  ('Owner', 'Platform owner with management rights', 90),
  ('Compliance Manager', 'Manages compliance policies', 80),
  ('Compliance Officer', 'Reviews compliance items', 70),
  ('Agent', 'Handles day-to-day operations', 60),
  ('Viewer', 'Read-only access', 50);

-- Create standard permissions (simplified format)
INSERT INTO public.permissions (name, description)
VALUES
  -- System permissions
  ('system.access', 'Access the system'),
  ('system.configure', 'Configure system settings'),
  ('system.audit', 'View audit logs and activity monitor'),
  
  -- User permissions
  ('users.view', 'View user profiles'),
  ('users.create', 'Create new users'),
  ('users.edit', 'Edit user profiles'),
  ('users.delete', 'Delete users'),
  ('users.assign_role', 'Assign roles to users'),
  ('users.approve', 'Approve users'),
  
  -- Role permissions
  ('roles.view', 'View roles'),
  ('roles.manage', 'Manage roles and permissions'),
  
  -- Project permissions
  ('projects.view', 'View projects'),
  ('projects.create', 'Create projects'),
  ('projects.edit', 'Edit projects'),
  ('projects.delete', 'Delete projects'),
  
  -- Policy permissions
  ('policies.view', 'View policies'),
  ('policies.create', 'Create policies'),
  ('policies.edit', 'Edit policies'),
  ('policies.delete', 'Delete policies'),
  ('policies.approve', 'Approve policies'),
  
  -- Rules permissions
  ('rules.view', 'View rules'),
  ('rules.create', 'Create rules'),
  ('rules.edit', 'Edit rules'),
  ('rules.delete', 'Delete rules'),
  ('rules.approve', 'Approve rules'),
  
  -- Token Design permissions
  ('token_design.view', 'View token designs'),
  ('token_design.save_templates', 'Save token templates'),
  ('token_design.save_tokens', 'Save tokens'),
  ('token_design.edit', 'Edit token designs'),
  ('token_design.delete', 'Delete token designs'),
  
  -- Token Lifecycle permissions
  ('token_lifecycle.view', 'View token lifecycle'),
  ('token_lifecycle.mint', 'Mint tokens'),
  ('token_lifecycle.burn', 'Burn tokens'),
  ('token_lifecycle.pause', 'Pause/Lock tokens'),
  ('token_lifecycle.block', 'Block/Unblock tokens'),
  ('token_lifecycle.deploy', 'Deploy tokens'),
  ('token_lifecycle.approve', 'Approve token lifecycle actions'),
  
  -- Investor permissions
  ('investors.view', 'View investors'),
  ('investors.create', 'Create investors'),
  ('investors.bulk', 'Bulk create investors'),
  ('investors.edit', 'Edit investors'),
  ('investors.delete', 'Delete investors'),
  
  -- Subscription permissions
  ('subscriptions.view', 'View subscriptions'),
  ('subscriptions.create', 'Create subscriptions'),
  ('subscriptions.bulk', 'Bulk create subscriptions'),
  ('subscriptions.edit', 'Edit subscriptions'),
  ('subscriptions.delete', 'Delete subscriptions'),
  ('subscriptions.approve', 'Approve subscriptions'),
  
  -- Token allocation permissions
  ('token_allocations.view', 'View token allocations'),
  ('token_allocations.create', 'Create token allocations'),
  ('token_allocations.bulk', 'Bulk create token allocations'),
  ('token_allocations.edit', 'Edit token allocations'),
  ('token_allocations.delete', 'Delete token allocations'),
  ('token_allocations.approve', 'Approve token allocations'),
  
  -- Wallet permissions
  ('wallets.view', 'View wallets'),
  ('wallets.create', 'Create wallets'),
  ('wallets.bulk', 'Bulk create wallets'),
  ('wallets.edit', 'Edit wallets'),
  ('wallets.delete', 'Delete wallets'),
  ('wallets.approve', 'Approve wallets'),
  
  -- Transaction permissions
  ('transactions.view', 'View transactions'),
  ('transactions.create', 'Create transactions'),
  ('transactions.bulk_distribute', 'Bulk distribute transactions'),
  ('transactions.force_transfer', 'Force transfer transactions'),
  ('transactions.edit', 'Edit transactions'),
  ('transactions.delete', 'Delete transactions'),
  ('transactions.approve', 'Approve transactions'),
  
  -- Redemption permissions
  ('redemptions.view', 'View redemptions'),
  ('redemptions.create', 'Create redemptions'),
  ('redemptions.edit', 'Edit redemptions'),
  ('redemptions.delete', 'Delete redemptions'),
  ('redemptions.approve', 'Approve redemptions'),
  
  -- Compliance permissions
  ('compliance.view', 'View compliance information'),
  ('compliance.run', 'Run compliance checks'),
  ('compliance.create', 'Create compliance records'),
  ('compliance.upload', 'Upload compliance documents'),
  ('compliance.edit', 'Edit compliance information'),
  ('compliance.delete', 'Delete compliance information'),
  ('compliance.approve', 'Approve compliance status'),
  ('compliance.reject', 'Reject compliance status');

-- Assign all permissions to Super Admin
INSERT INTO public.role_permissions (role_id, permission_name)
SELECT 
  r.id, 
  p.name
FROM 
  public.roles r
  CROSS JOIN public.permissions p
WHERE 
  r.name = 'Super Admin';

-- Assign view permissions to Viewer role
INSERT INTO public.role_permissions (role_id, permission_name)
SELECT 
  r.id, 
  p.name
FROM 
  public.roles r
  CROSS JOIN public.permissions p
WHERE 
  r.name = 'Viewer'
  AND p.name LIKE '%.view';

-- Create permission check function
CREATE OR REPLACE FUNCTION check_user_permission(user_id UUID, permission TEXT) 
RETURNS BOOLEAN AS $$
DECLARE
  has_permission BOOLEAN := FALSE;
  user_role_name TEXT;
BEGIN
  -- Get user's role
  SELECT r.name INTO user_role_name
  FROM public.user_roles ur
  JOIN public.roles r ON ur.role_id = r.id
  WHERE ur.user_id = check_user_permission.user_id;
  
  -- Super Admin has all permissions
  IF user_role_name = 'Super Admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Check specific permission
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role_id = rp.role_id
    WHERE ur.user_id = check_user_permission.user_id
    AND rp.permission_name = check_user_permission.permission
  ) INTO has_permission;
  
  RETURN has_permission;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in check_user_permission: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Create function to get users with permission
CREATE OR REPLACE FUNCTION get_users_with_permission(permission_name TEXT) 
RETURNS TABLE (
  user_id UUID,
  name TEXT,
  email TEXT,
  role TEXT
) AS $$
BEGIN
  RETURN QUERY
  -- Get users with Super Admin role (they have all permissions)
  SELECT 
    u.id,
    u.name,
    u.email,
    r.name AS role
  FROM
    public.users u
    JOIN public.user_roles ur ON u.id = ur.user_id
    JOIN public.roles r ON ur.role_id = r.id
  WHERE
    r.name = 'Super Admin'
  
  UNION
  
  -- Get users with the specific permission
  SELECT
    u.id,
    u.name,
    u.email,
    r.name AS role
  FROM
    public.users u
    JOIN public.user_roles ur ON u.id = ur.user_id
    JOIN public.roles r ON ur.role_id = r.id
    JOIN public.role_permissions rp ON r.id = rp.role_id
  WHERE
    rp.permission_name = permission_name;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in get_users_with_permission: %', SQLERRM;
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Import existing auth users
INSERT INTO public.users (id, email, name)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)) AS name
FROM 
  auth.users
ON CONFLICT (id) DO NOTHING;

-- Assign default Viewer role to all users
INSERT INTO public.user_roles (user_id, role_id)
SELECT 
  u.id AS user_id,
  r.id AS role_id
FROM 
  public.users u
  CROSS JOIN (SELECT id FROM public.roles WHERE name = 'Viewer' LIMIT 1) r
ON CONFLICT (user_id) DO NOTHING;

COMMIT;