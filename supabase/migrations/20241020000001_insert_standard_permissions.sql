-- Insert standard permissions defined in the frontend
-- This ensures permissions in the database match what the application expects

BEGIN;

-- Function to check if a permission exists before inserting
CREATE OR REPLACE FUNCTION insert_permission_if_not_exists(p_name TEXT, p_description TEXT) 
RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.permissions WHERE name = p_name) THEN
    INSERT INTO public.permissions (name, description) 
    VALUES (p_name, p_description);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Project permissions
SELECT insert_permission_if_not_exists('project.create', 'Create projects');
SELECT insert_permission_if_not_exists('project.edit', 'Edit projects');
SELECT insert_permission_if_not_exists('project.delete', 'Delete projects');
SELECT insert_permission_if_not_exists('project.view', 'View projects');

-- User permissions
SELECT insert_permission_if_not_exists('user.create', 'Create users');
SELECT insert_permission_if_not_exists('user.edit', 'Edit users');
SELECT insert_permission_if_not_exists('user.delete', 'Delete users');
SELECT insert_permission_if_not_exists('user.view', 'View users');
SELECT insert_permission_if_not_exists('user.assign_role', 'Assign roles to users');
SELECT insert_permission_if_not_exists('user.approve', 'Approve users');

-- Policy Rules permissions
SELECT insert_permission_if_not_exists('policy_rules.create', 'Create policy rules');
SELECT insert_permission_if_not_exists('policy_rules.edit', 'Edit policy rules');
SELECT insert_permission_if_not_exists('policy_rules.delete', 'Delete policy rules');
SELECT insert_permission_if_not_exists('policy_rules.view', 'View policy rules');
SELECT insert_permission_if_not_exists('policy_rules.approve', 'Approve policy rules');

-- Token Design permissions
SELECT insert_permission_if_not_exists('token_design.save_templates', 'Save token templates');
SELECT insert_permission_if_not_exists('token_design.save_tokens', 'Save tokens');
SELECT insert_permission_if_not_exists('token_design.edit', 'Edit token design');
SELECT insert_permission_if_not_exists('token_design.delete', 'Delete token design');
SELECT insert_permission_if_not_exists('token_design.view', 'View token design');

-- Token Lifecycle permissions
SELECT insert_permission_if_not_exists('token_lifecycle.mint', 'Mint tokens');
SELECT insert_permission_if_not_exists('token_lifecycle.burn', 'Burn tokens');
SELECT insert_permission_if_not_exists('token_lifecycle.pause', 'Pause/lock tokens');
-- Add alternative formats for pause permission
SELECT insert_permission_if_not_exists('token_lifecycle.pause___lock', 'Pause/lock tokens (alt format)');
SELECT insert_permission_if_not_exists('token_lifecycle.pause_lock', 'Pause/lock tokens (alt format)');
SELECT insert_permission_if_not_exists('token_lifecycle.block', 'Block/unblock tokens');
-- Add alternative formats for block permission
SELECT insert_permission_if_not_exists('token_lifecycle.block___unblock', 'Block/unblock tokens (alt format)');
SELECT insert_permission_if_not_exists('token_lifecycle.block_unblock', 'Block/unblock tokens (alt format)');
SELECT insert_permission_if_not_exists('token_lifecycle.deploy', 'Deploy tokens');
SELECT insert_permission_if_not_exists('token_lifecycle.approve', 'Approve token lifecycle actions');

-- Investor permissions
SELECT insert_permission_if_not_exists('investor.create', 'Create investors');
SELECT insert_permission_if_not_exists('investor.bulk', 'Bulk manage investors');
SELECT insert_permission_if_not_exists('investor.edit', 'Edit investors');
SELECT insert_permission_if_not_exists('investor.delete', 'Delete investors');
SELECT insert_permission_if_not_exists('investor.view', 'View investors');

-- Subscriptions permissions
SELECT insert_permission_if_not_exists('subscriptions.create', 'Create subscriptions');
SELECT insert_permission_if_not_exists('subscriptions.bulk', 'Bulk manage subscriptions');
SELECT insert_permission_if_not_exists('subscriptions.edit', 'Edit subscriptions');
SELECT insert_permission_if_not_exists('subscriptions.delete', 'Delete subscriptions');
SELECT insert_permission_if_not_exists('subscriptions.view', 'View subscriptions');
SELECT insert_permission_if_not_exists('subscriptions.approve', 'Approve subscriptions');

-- Token Allocations permissions
SELECT insert_permission_if_not_exists('token_allocations.create', 'Create token allocations');
SELECT insert_permission_if_not_exists('token_allocations.bulk', 'Bulk manage token allocations');
SELECT insert_permission_if_not_exists('token_allocations.edit', 'Edit token allocations');
SELECT insert_permission_if_not_exists('token_allocations.delete', 'Delete token allocations');
SELECT insert_permission_if_not_exists('token_allocations.view', 'View token allocations');
SELECT insert_permission_if_not_exists('token_allocations.approve', 'Approve token allocations');

-- Wallet permissions
SELECT insert_permission_if_not_exists('wallet.create', 'Create wallets');
SELECT insert_permission_if_not_exists('wallet.bulk', 'Bulk manage wallets');
SELECT insert_permission_if_not_exists('wallet.edit', 'Edit wallets');
SELECT insert_permission_if_not_exists('wallet.delete', 'Delete wallets');
SELECT insert_permission_if_not_exists('wallet.view', 'View wallets');
SELECT insert_permission_if_not_exists('wallet.approve', 'Approve wallets');

-- Transactions permissions
SELECT insert_permission_if_not_exists('transactions.create', 'Create transactions');
SELECT insert_permission_if_not_exists('transactions.bulk_distribute', 'Bulk distribute transactions');
SELECT insert_permission_if_not_exists('transactions.force_transfer', 'Force transfer transactions');
SELECT insert_permission_if_not_exists('transactions.edit', 'Edit transactions');
SELECT insert_permission_if_not_exists('transactions.delete', 'Delete transactions');
SELECT insert_permission_if_not_exists('transactions.view', 'View transactions');
SELECT insert_permission_if_not_exists('transactions.approve', 'Approve transactions');

-- Redemptions permissions
SELECT insert_permission_if_not_exists('redemptions.create', 'Create redemptions');
SELECT insert_permission_if_not_exists('redemptions.edit', 'Edit redemptions');
SELECT insert_permission_if_not_exists('redemptions.delete', 'Delete redemptions');
SELECT insert_permission_if_not_exists('redemptions.view', 'View redemptions');
SELECT insert_permission_if_not_exists('redemptions.approve', 'Approve redemptions');

-- Compliance KYC/KYB permissions
SELECT insert_permission_if_not_exists('compliance_kyc_kyb.run', 'Run compliance checks');
SELECT insert_permission_if_not_exists('compliance_kyc_kyb.create', 'Create compliance records');
SELECT insert_permission_if_not_exists('compliance_kyc_kyb.upload', 'Upload compliance documents');
SELECT insert_permission_if_not_exists('compliance_kyc_kyb.edit', 'Edit compliance records');
SELECT insert_permission_if_not_exists('compliance_kyc_kyb.delete', 'Delete compliance records');
SELECT insert_permission_if_not_exists('compliance_kyc_kyb.view', 'View compliance records');
SELECT insert_permission_if_not_exists('compliance_kyc_kyb.approve', 'Approve compliance records');
SELECT insert_permission_if_not_exists('compliance_kyc_kyb.reject', 'Reject compliance records');

-- System Admin permissions
SELECT insert_permission_if_not_exists('system.audit', 'View audit and activity monitor');
SELECT insert_permission_if_not_exists('system.configure', 'Configure system settings');
-- Alternative formats for system permissions
SELECT insert_permission_if_not_exists('system.view_audit___activity_monitor', 'View audit/activity monitor (alt format)');

-- Assign all permissions to the Super Admin role
DO $$
DECLARE
  super_admin_id UUID;
  perm_record RECORD;
BEGIN
  -- Get the Super Admin role ID
  SELECT id INTO super_admin_id FROM public.roles WHERE name = 'Super Admin' LIMIT 1;
  
  -- If Super Admin role exists, give it all permissions
  IF super_admin_id IS NOT NULL THEN
    FOR perm_record IN SELECT name FROM public.permissions LOOP
      -- Insert if not exists
      IF NOT EXISTS (
        SELECT 1 FROM public.role_permissions 
        WHERE role_id = super_admin_id AND permission_name = perm_record.name
      ) THEN
        INSERT INTO public.role_permissions (role_id, permission_name)
        VALUES (super_admin_id, perm_record.name);
      END IF;
    END LOOP;
  END IF;
END $$;

-- Clean up
DROP FUNCTION IF EXISTS insert_permission_if_not_exists;

COMMIT;