-- Migration to fix the conflicting foreign key constraint issue
-- This removes the problematic constraint that references policy_templates

-- First check if the constraint exists, and drop it if it does
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'policy_rule_approvers_template_id_fkey'
  ) THEN
    -- Drop the conflicting constraint
    ALTER TABLE public.policy_rule_approvers
    DROP CONSTRAINT IF EXISTS policy_rule_approvers_template_id_fkey;
    
    RAISE NOTICE 'Successfully dropped conflicting constraint policy_rule_approvers_template_id_fkey';
  ELSE
    RAISE NOTICE 'Constraint policy_rule_approvers_template_id_fkey does not exist, nothing to drop';
  END IF;
END $$;

-- Ensure we have the correct constraint to rules table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'policy_rule_approvers_rule_id_fkey'
  ) THEN
    -- Add the correct foreign key to rules table if it doesn't exist
    ALTER TABLE public.policy_rule_approvers
    ADD CONSTRAINT policy_rule_approvers_rule_id_fkey
    FOREIGN KEY (policy_rule_id) REFERENCES rules(rule_id)
    ON DELETE CASCADE;
    
    RAISE NOTICE 'Added foreign key constraint to rules table';
  ELSE
    RAISE NOTICE 'Constraint policy_rule_approvers_rule_id_fkey already exists';
  END IF;
END $$;