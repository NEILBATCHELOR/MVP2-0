-- Fix policy_template_approvers foreign key constraint
-- This migration modifies the foreign key constraint to be deferrable and adds cascade delete
--
-- IMPORTANT: After running this migration, the type system has been updated in:
-- 1. src/types/supabase.ts - The generated Supabase types file (updated first)
-- 2. src/types/database.ts - Now imports directly from supabase.ts for policy tables
-- 3. src/types/policyTemplates.ts - Now extends the database types properly
--
-- These changes allow a more robust type system that directly reflects the database schema
-- and ensures type safety throughout the application.

-- Step 1: Drop the existing foreign key constraint
ALTER TABLE policy_template_approvers
DROP CONSTRAINT IF EXISTS policy_template_approvers_template_id_fkey;

-- Step 2: Add a new deferrable foreign key constraint with cascade delete
-- This allows templates and approvers to be created in the same transaction
-- by deferring the constraint check until the end of the transaction
ALTER TABLE policy_template_approvers
ADD CONSTRAINT policy_template_approvers_template_id_fkey
FOREIGN KEY (template_id) REFERENCES policy_templates (template_id)
ON DELETE CASCADE
DEFERRABLE INITIALLY DEFERRED;

-- Step 3: Clean up any orphaned approver records that don't have a valid template
-- This ensures data integrity before we start using the new constraint
DELETE FROM policy_template_approvers
WHERE template_id NOT IN (SELECT template_id FROM policy_templates);

-- Step 4: Add index to improve join performance
CREATE INDEX IF NOT EXISTS idx_policy_template_approvers_template_id 
ON policy_template_approvers(template_id);

-- Step 5: Create a function to safely add approvers without duplicates
-- This function will either insert a new approver record or update an existing one
CREATE OR REPLACE FUNCTION upsert_policy_template_approver(
  p_template_id UUID,
  p_user_id UUID,
  p_created_by TEXT,
  p_status TEXT DEFAULT 'pending'
) RETURNS VOID AS $$
BEGIN
  -- First try to update any existing record
  UPDATE policy_template_approvers
  SET 
    created_by = p_created_by,
    status = p_status,
    timestamp = NOW()
  WHERE 
    template_id = p_template_id AND
    user_id = p_user_id;
    
  -- If no record was updated, insert a new one
  IF NOT FOUND THEN
    INSERT INTO policy_template_approvers (
      template_id, 
      user_id, 
      created_by, 
      status, 
      timestamp
    ) VALUES (
      p_template_id,
      p_user_id,
      p_created_by,
      p_status,
      NOW()
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Documentation comment to explain the changes:
COMMENT ON CONSTRAINT policy_template_approvers_template_id_fkey 
ON policy_template_approvers IS 
'Foreign key to policy_templates with deferred checking to allow templates and approvers to be created in the same transaction. CASCADE DELETE ensures automatic cleanup.';

COMMENT ON FUNCTION upsert_policy_template_approver IS
'Safely adds or updates approvers for a policy template without creating duplicates.';

-- APPLICATION NOTE:
-- The service files have been updated to take advantage of the new deferrable constraint:
-- - Both enhancedPolicyTemplateService.ts and policyTemplateService.ts now use this
-- - The PolicyTemplateDashboard component has been updated to use the new approach
-- - To prevent duplicate key violations, use the upsert_policy_template_approver function
--   instead of direct inserts to the policy_template_approvers table