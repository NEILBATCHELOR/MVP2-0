-- Fix foreign key constraints between UUID and TEXT columns

-- First, drop all foreign key constraints that will cause issues
ALTER TABLE IF EXISTS policy_rule_approvers
  DROP CONSTRAINT IF EXISTS policy_rule_approvers_rule_id_fkey;

ALTER TABLE IF EXISTS policy_rule_approvers
  DROP CONSTRAINT IF EXISTS policy_rule_approvers_template_id_fkey;

ALTER TABLE IF EXISTS policy_rule_approvers
  DROP CONSTRAINT IF EXISTS policy_rule_approvers_user_id_fkey;

-- Ensure all primary key columns are TEXT type
ALTER TABLE IF EXISTS rules
  ALTER COLUMN rule_id TYPE TEXT USING rule_id::TEXT;

ALTER TABLE IF EXISTS policy_templates
  ALTER COLUMN template_id TYPE TEXT USING template_id::TEXT;

ALTER TABLE IF EXISTS users
  ALTER COLUMN id TYPE TEXT USING id::TEXT;

-- Ensure all foreign key columns are TEXT type
ALTER TABLE IF EXISTS policy_rule_approvers
  ALTER COLUMN policy_rule_id TYPE TEXT USING policy_rule_id::TEXT,
  ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT,
  ALTER COLUMN created_by TYPE TEXT USING created_by::TEXT;

-- Recreate all foreign key constraints
ALTER TABLE IF EXISTS policy_rule_approvers
  ADD CONSTRAINT policy_rule_approvers_rule_id_fkey
  FOREIGN KEY (policy_rule_id)
  REFERENCES rules(rule_id)
  ON DELETE CASCADE;

-- If the template_id foreign key is needed, uncomment and adjust as needed
/*
ALTER TABLE IF EXISTS policy_rule_approvers
  ADD CONSTRAINT policy_rule_approvers_template_id_fkey
  FOREIGN KEY (policy_rule_id)
  REFERENCES policy_templates(template_id)
  ON DELETE CASCADE;
*/

-- If the user_id foreign key is needed, uncomment and adjust as needed
/*
ALTER TABLE IF EXISTS policy_rule_approvers
  ADD CONSTRAINT policy_rule_approvers_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES users(id)
  ON DELETE CASCADE;
*/