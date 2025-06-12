-- Create roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  priority INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create permissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(resource, action)
);

-- Create role_permissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  effect VARCHAR(10) NOT NULL CHECK (effect IN ('allow', 'deny')),
  conditions JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- Create approval_configs table if it doesn't exist
CREATE TABLE IF NOT EXISTS approval_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  required_approvals INTEGER NOT NULL DEFAULT 2,
  eligible_roles TEXT[] NOT NULL,
  auto_approval_conditions JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(permission_id)
);

-- Create approval_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  resource_id VARCHAR(100) NOT NULL,
  requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approvers UUID[] NOT NULL,
  approved_by UUID[] NOT NULL DEFAULT '{}',
  rejected_by UUID[] NOT NULL DEFAULT '{}',
  required_approvals INTEGER NOT NULL DEFAULT 2,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhance audit_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  action VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  username VARCHAR(255),
  details TEXT,
  entity_id VARCHAR(100),
  entity_type VARCHAR(100),
  project_id UUID,
  status VARCHAR(50),
  metadata JSONB,
  old_data JSONB,
  new_data JSONB,
  signature TEXT,
  verified BOOLEAN
);

-- Create index for faster searches
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);

-- Insert default roles
INSERT INTO roles (name, description, priority)
VALUES 
  ('super_admin', 'Full control over all system settings, including security and user management', 1),
  ('owner', 'Manages token settings, issuance configurations, and user invitations', 2),
  ('compliance_manager', 'Oversees regulatory approvals and compliance automation', 3),
  ('agent', 'Manages investor interactions and due diligence', 4),
  ('compliance_officer', 'Approves investor applications', 5)
ON CONFLICT (name) DO NOTHING;

-- Insert default permissions
INSERT INTO permissions (name, description, category, resource, action)
VALUES
  ('View Users', 'View user accounts and profiles', 'USER_MANAGEMENT', 'users', 'view'),
  ('Create User', 'Create new user accounts', 'USER_MANAGEMENT', 'users', 'create'),
  ('Edit User', 'Edit existing user profiles', 'USER_MANAGEMENT', 'users', 'edit'),
  ('Delete User', 'Delete user accounts', 'USER_MANAGEMENT', 'users', 'delete'),
  ('Assign Roles', 'Assign or change roles for users', 'USER_MANAGEMENT', 'users', 'assign_role'),
  
  ('View Tokens', 'View token design and configuration', 'TOKEN_MANAGEMENT', 'tokens', 'view'),
  ('Create Token', 'Create new token designs', 'TOKEN_MANAGEMENT', 'tokens', 'create'),
  ('Edit Token', 'Modify token properties', 'TOKEN_MANAGEMENT', 'tokens', 'edit'),
  ('Deploy Token', 'Deploy tokens to blockchain', 'TOKEN_MANAGEMENT', 'tokens', 'deploy'),
  ('Transfer Token', 'Initiate token transfers', 'TOKEN_MANAGEMENT', 'tokens', 'transfer'),
  
  ('View Investors', 'View investor profiles', 'INVESTOR_MANAGEMENT', 'investors', 'view'),
  ('Approve Investor', 'Approve investor applications', 'INVESTOR_MANAGEMENT', 'investors', 'approve'),
  ('Edit Investor', 'Edit investor information', 'INVESTOR_MANAGEMENT', 'investors', 'edit'),
  ('Whitelist Wallet', 'Whitelist investor wallets', 'INVESTOR_MANAGEMENT', 'wallets', 'whitelist'),
  
  ('View Compliance', 'View compliance rules', 'COMPLIANCE', 'compliance', 'view'),
  ('Edit Compliance Rules', 'Modify compliance rules', 'COMPLIANCE', 'compliance', 'edit'),
  ('Run Compliance Checks', 'Trigger compliance checks', 'COMPLIANCE', 'compliance', 'run_checks'),
  ('Approve Compliance', 'Approve compliance verifications', 'COMPLIANCE', 'compliance', 'approve'),
  
  ('View Audit Logs', 'Access system audit logs', 'SYSTEM', 'audit_logs', 'view'),
  ('Configure System', 'Modify system-wide settings', 'SYSTEM', 'system', 'configure'),
  ('Manage Keys', 'Manage cryptographic keys', 'SYSTEM', 'keys', 'manage'),
  ('Backup System', 'Create and manage backups', 'SYSTEM', 'system', 'backup')
ON CONFLICT (resource, action) DO NOTHING;

-- Get role and permission IDs for default permissions
DO $$ 
DECLARE
  super_admin_id UUID;
  owner_id UUID;
  compliance_manager_id UUID;
  agent_id UUID;
  compliance_officer_id UUID;
  
  view_users_id UUID;
  create_user_id UUID;
  edit_user_id UUID;
  delete_user_id UUID;
  assign_roles_id UUID;
  
  view_tokens_id UUID;
  create_token_id UUID;
  edit_token_id UUID;
  deploy_token_id UUID;
  transfer_token_id UUID;
  
  view_investors_id UUID;
  approve_investor_id UUID;
  edit_investor_id UUID;
  whitelist_wallet_id UUID;
  
  view_compliance_id UUID;
  edit_compliance_rules_id UUID;
  run_compliance_checks_id UUID;
  approve_compliance_id UUID;
  
  view_audit_logs_id UUID;
  configure_system_id UUID;
  manage_keys_id UUID;
  backup_system_id UUID;
BEGIN
  -- Get role IDs
  SELECT id INTO super_admin_id FROM roles WHERE name = 'super_admin';
  SELECT id INTO owner_id FROM roles WHERE name = 'owner';
  SELECT id INTO compliance_manager_id FROM roles WHERE name = 'compliance_manager';
  SELECT id INTO agent_id FROM roles WHERE name = 'agent';
  SELECT id INTO compliance_officer_id FROM roles WHERE name = 'compliance_officer';
  
  -- Get permission IDs - USER_MANAGEMENT
  SELECT id INTO view_users_id FROM permissions WHERE resource = 'users' AND action = 'view';
  SELECT id INTO create_user_id FROM permissions WHERE resource = 'users' AND action = 'create';
  SELECT id INTO edit_user_id FROM permissions WHERE resource = 'users' AND action = 'edit';
  SELECT id INTO delete_user_id FROM permissions WHERE resource = 'users' AND action = 'delete';
  SELECT id INTO assign_roles_id FROM permissions WHERE resource = 'users' AND action = 'assign_role';
  
  -- Get permission IDs - TOKEN_MANAGEMENT
  SELECT id INTO view_tokens_id FROM permissions WHERE resource = 'tokens' AND action = 'view';
  SELECT id INTO create_token_id FROM permissions WHERE resource = 'tokens' AND action = 'create';
  SELECT id INTO edit_token_id FROM permissions WHERE resource = 'tokens' AND action = 'edit';
  SELECT id INTO deploy_token_id FROM permissions WHERE resource = 'tokens' AND action = 'deploy';
  SELECT id INTO transfer_token_id FROM permissions WHERE resource = 'tokens' AND action = 'transfer';
  
  -- Get permission IDs - INVESTOR_MANAGEMENT
  SELECT id INTO view_investors_id FROM permissions WHERE resource = 'investors' AND action = 'view';
  SELECT id INTO approve_investor_id FROM permissions WHERE resource = 'investors' AND action = 'approve';
  SELECT id INTO edit_investor_id FROM permissions WHERE resource = 'investors' AND action = 'edit';
  SELECT id INTO whitelist_wallet_id FROM permissions WHERE resource = 'wallets' AND action = 'whitelist';
  
  -- Get permission IDs - COMPLIANCE
  SELECT id INTO view_compliance_id FROM permissions WHERE resource = 'compliance' AND action = 'view';
  SELECT id INTO edit_compliance_rules_id FROM permissions WHERE resource = 'compliance' AND action = 'edit';
  SELECT id INTO run_compliance_checks_id FROM permissions WHERE resource = 'compliance' AND action = 'run_checks';
  SELECT id INTO approve_compliance_id FROM permissions WHERE resource = 'compliance' AND action = 'approve';
  
  -- Get permission IDs - SYSTEM
  SELECT id INTO view_audit_logs_id FROM permissions WHERE resource = 'audit_logs' AND action = 'view';
  SELECT id INTO configure_system_id FROM permissions WHERE resource = 'system' AND action = 'configure';
  SELECT id INTO manage_keys_id FROM permissions WHERE resource = 'keys' AND action = 'manage';
  SELECT id INTO backup_system_id FROM permissions WHERE resource = 'system' AND action = 'backup';
  
  -- Super Admin permissions (all permissions)
  INSERT INTO role_permissions (role_id, permission_id, effect)
  SELECT super_admin_id, id, 'allow' FROM permissions
  ON CONFLICT (role_id, permission_id) DO NOTHING;
  
  -- Owner permissions
  INSERT INTO role_permissions (role_id, permission_id, effect) VALUES
    (owner_id, view_users_id, 'allow'),
    (owner_id, create_user_id, 'allow'),
    (owner_id, edit_user_id, 'allow'),
    (owner_id, view_tokens_id, 'allow'),
    (owner_id, create_token_id, 'allow'),
    (owner_id, edit_token_id, 'allow'),
    (owner_id, view_investors_id, 'allow'),
    (owner_id, approve_investor_id, 'allow'),
    (owner_id, edit_investor_id, 'allow'),
    (owner_id, whitelist_wallet_id, 'allow'),
    (owner_id, view_compliance_id, 'allow'),
    (owner_id, view_audit_logs_id, 'allow')
  ON CONFLICT (role_id, permission_id) DO NOTHING;
  
  -- Compliance Manager permissions
  INSERT INTO role_permissions (role_id, permission_id, effect) VALUES
    (compliance_manager_id, view_users_id, 'allow'),
    (compliance_manager_id, view_tokens_id, 'allow'),
    (compliance_manager_id, view_investors_id, 'allow'),
    (compliance_manager_id, approve_investor_id, 'allow'),
    (compliance_manager_id, view_compliance_id, 'allow'),
    (compliance_manager_id, edit_compliance_rules_id, 'allow'),
    (compliance_manager_id, run_compliance_checks_id, 'allow'),
    (compliance_manager_id, approve_compliance_id, 'allow'),
    (compliance_manager_id, view_audit_logs_id, 'allow')
  ON CONFLICT (role_id, permission_id) DO NOTHING;
  
  -- Agent permissions
  INSERT INTO role_permissions (role_id, permission_id, effect) VALUES
    (agent_id, view_users_id, 'allow'),
    (agent_id, view_tokens_id, 'allow'),
    (agent_id, view_investors_id, 'allow'),
    (agent_id, edit_investor_id, 'allow')
  ON CONFLICT (role_id, permission_id) DO NOTHING;
  
  -- Compliance Officer permissions
  INSERT INTO role_permissions (role_id, permission_id, effect) VALUES
    (compliance_officer_id, view_investors_id, 'allow'),
    (compliance_officer_id, approve_investor_id, 'allow'),
    (compliance_officer_id, view_compliance_id, 'allow'),
    (compliance_officer_id, run_compliance_checks_id, 'allow')
  ON CONFLICT (role_id, permission_id) DO NOTHING;
  
  -- Setup approval configurations for sensitive operations
  INSERT INTO approval_configs (permission_id, required_approvals, eligible_roles)
  VALUES
    (deploy_token_id, 2, ARRAY['super_admin', 'owner', 'compliance_manager']),
    (delete_user_id, 2, ARRAY['super_admin', 'owner']),
    (assign_roles_id, 2, ARRAY['super_admin', 'owner']),
    (edit_compliance_rules_id, 2, ARRAY['super_admin', 'compliance_manager']),
    (manage_keys_id, 2, ARRAY['super_admin', 'owner'])
  ON CONFLICT (permission_id) DO NOTHING;
END $$;