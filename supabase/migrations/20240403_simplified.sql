-- Simplified version of the original migration
-- Use this since you've already run the fix scripts

-- Step 1: Make sure policy_rules.approve permission is added to role_permissions
-- for roles that should have it (Super Admin, Compliance Manager, Compliance Officer)
DO $$
DECLARE
    super_admin_id UUID;
    compliance_manager_id UUID;
    compliance_officer_id UUID;
    owner_id UUID;
BEGIN
    -- Get role IDs
    SELECT id INTO super_admin_id FROM roles WHERE name ILIKE '%super admin%' LIMIT 1;
    SELECT id INTO compliance_manager_id FROM roles WHERE name ILIKE '%compliance manager%' LIMIT 1;
    SELECT id INTO compliance_officer_id FROM roles WHERE name ILIKE '%compliance officer%' LIMIT 1;
    SELECT id INTO owner_id FROM roles WHERE name ILIKE '%owner%' LIMIT 1;
    
    -- Add policy_rules.approve permission if missing
    INSERT INTO role_permissions (role_id, permission_id, effect)
    VALUES
      (super_admin_id, 'policy_rules.approve', 'allow')
    ON CONFLICT (role_id, permission_id) DO NOTHING;
    
    INSERT INTO role_permissions (role_id, permission_id, effect)
    VALUES
      (compliance_manager_id, 'policy_rules.approve', 'allow')
    ON CONFLICT (role_id, permission_id) DO NOTHING;
    
    INSERT INTO role_permissions (role_id, permission_id, effect)
    VALUES
      (compliance_officer_id, 'policy_rules.approve', 'allow')
    ON CONFLICT (role_id, permission_id) DO NOTHING;
    
    -- Add owner permission only if owner_id exists
    IF owner_id IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id, effect)
        VALUES
          (owner_id, 'policy_rules.approve', 'allow')
        ON CONFLICT (role_id, permission_id) DO NOTHING;
    END IF;
END $$;

-- Step 2: Check if tables exist before dropping constraints
DO $$
BEGIN
    -- Check for user_permissions table
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = 'user_permissions'
    ) THEN
        ALTER TABLE user_permissions DROP CONSTRAINT IF EXISTS user_permissions_permission_id_fkey;
    END IF;
    
    -- Check for role_permissions constraint
    IF EXISTS (
        SELECT 1
        FROM information_schema.constraint_column_usage
        WHERE table_name = 'role_permissions' AND constraint_name = 'role_permissions_permission_id_fkey'
    ) THEN
        ALTER TABLE role_permissions DROP CONSTRAINT IF EXISTS role_permissions_permission_id_fkey;
    END IF;
END $$;

-- Step 3: Rename permissions table if it hasn't been done already
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = 'permissions'
    ) THEN
        ALTER TABLE permissions RENAME TO permissions_deprecated;
        
        -- Add a comment to the table so developers know it's deprecated
        COMMENT ON TABLE permissions_deprecated IS 'DEPRECATED: This table is no longer used. Use role_permissions instead for permission checks';
    END IF;
END $$; 