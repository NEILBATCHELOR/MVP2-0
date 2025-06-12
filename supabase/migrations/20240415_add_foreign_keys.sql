-- Migration to add foreign key relationships to policy_rule_approvers table
-- This adds foreign keys to both rules and policy_templates tables

-- First check if the constraints already exist
DO $$
BEGIN
  -- Check if policy_rule_approvers_rule_id_fkey exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'policy_rule_approvers_rule_id_fkey'
  ) THEN
    -- Add foreign key to rules table (if it doesn't exist)
    BEGIN
      ALTER TABLE policy_rule_approvers
      ADD CONSTRAINT policy_rule_approvers_rule_id_fkey
      FOREIGN KEY (policy_rule_id) REFERENCES rules(rule_id)
      ON DELETE CASCADE;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Unable to add foreign key to rules table: %', SQLERRM;
    END;
  END IF;

  -- REMOVED: We're removing the conflicting constraint that caused issues
  -- The policy_rule_approvers_template_id_fkey constraint is redundant since
  -- we should be using rules table for all policy IDs (even templates)

  -- Check if policy_rule_approvers_user_id_fkey exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'policy_rule_approvers_user_id_fkey'
  ) THEN
    -- Add foreign key to users table (if it doesn't exist)
    BEGIN
      ALTER TABLE policy_rule_approvers
      ADD CONSTRAINT policy_rule_approvers_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id)
      ON DELETE CASCADE;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Unable to add foreign key to users table: %', SQLERRM;
    END;
  END IF;
END $$;