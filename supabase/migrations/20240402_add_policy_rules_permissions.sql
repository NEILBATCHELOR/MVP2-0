-- Add policy rules permissions
INSERT INTO permissions (name, description, category, resource, action)
VALUES
  ('View Policy Rules', 'View policy rules and settings', 'COMPLIANCE', 'policy_rules', 'view'),
  ('Create Policy Rules', 'Create new policy rules', 'COMPLIANCE', 'policy_rules', 'create'),
  ('Edit Policy Rules', 'Modify existing policy rules', 'COMPLIANCE', 'policy_rules', 'edit'),
  ('Delete Policy Rules', 'Delete policy rules', 'COMPLIANCE', 'policy_rules', 'delete'),
  ('Approve Policy Rules', 'Approve policy rules and changes', 'COMPLIANCE', 'policy_rules', 'approve')
ON CONFLICT (resource, action) DO NOTHING;

-- Get role and permission IDs
DO $$ 
DECLARE
  super_admin_id UUID;
  owner_id UUID;
  compliance_manager_id UUID;
  compliance_officer_id UUID;
  
  view_policy_rules_id UUID;
  create_policy_rules_id UUID;
  edit_policy_rules_id UUID;
  delete_policy_rules_id UUID;
  approve_policy_rules_id UUID;
BEGIN
  -- Get role IDs
  SELECT id INTO super_admin_id FROM roles WHERE name = 'super_admin';
  SELECT id INTO owner_id FROM roles WHERE name = 'owner';
  SELECT id INTO compliance_manager_id FROM roles WHERE name = 'compliance_manager';
  SELECT id INTO compliance_officer_id FROM roles WHERE name = 'compliance_officer';
  
  -- Get permission IDs
  SELECT id INTO view_policy_rules_id FROM permissions WHERE resource = 'policy_rules' AND action = 'view';
  SELECT id INTO create_policy_rules_id FROM permissions WHERE resource = 'policy_rules' AND action = 'create';
  SELECT id INTO edit_policy_rules_id FROM permissions WHERE resource = 'policy_rules' AND action = 'edit';
  SELECT id INTO delete_policy_rules_id FROM permissions WHERE resource = 'policy_rules' AND action = 'delete';
  SELECT id INTO approve_policy_rules_id FROM permissions WHERE resource = 'policy_rules' AND action = 'approve';

  -- Assign permissions to roles
  -- Super Admin already has all permissions
  
  -- Owner permissions
  INSERT INTO role_permissions (role_id, permission_id, effect) VALUES
    (owner_id, view_policy_rules_id, 'allow'),
    (owner_id, create_policy_rules_id, 'allow'),
    (owner_id, edit_policy_rules_id, 'allow'),
    (owner_id, delete_policy_rules_id, 'allow'),
    (owner_id, approve_policy_rules_id, 'allow')
  ON CONFLICT (role_id, permission_id) DO NOTHING;
  
  -- Compliance Manager permissions
  INSERT INTO role_permissions (role_id, permission_id, effect) VALUES
    (compliance_manager_id, view_policy_rules_id, 'allow'),
    (compliance_manager_id, create_policy_rules_id, 'allow'),
    (compliance_manager_id, edit_policy_rules_id, 'allow'),
    (compliance_manager_id, approve_policy_rules_id, 'allow')
  ON CONFLICT (role_id, permission_id) DO NOTHING;
  
  -- Compliance Officer permissions
  INSERT INTO role_permissions (role_id, permission_id, effect) VALUES
    (compliance_officer_id, view_policy_rules_id, 'allow'),
    (compliance_officer_id, approve_policy_rules_id, 'allow')
  ON CONFLICT (role_id, permission_id) DO NOTHING;
  
END $$; 