-- Complete Approval Workflow Implementation Script
-- Run this script manually in your Supabase SQL Editor

-- 1. Ensure the policy_rule_approvers table has the necessary columns
ALTER TABLE public.policy_rule_approvers 
ADD COLUMN IF NOT EXISTS comment text,
ADD COLUMN IF NOT EXISTS timestamp timestamp with time zone DEFAULT now();

-- 2. Create or replace the trigger function for rules
CREATE OR REPLACE FUNCTION add_rule_to_approval_queue()
RETURNS TRIGGER AS $$
DECLARE
    approver_id text;
BEGIN
    -- When a rule is created or updated
    IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND (OLD.status != 'pending_approval' OR OLD.status IS NULL))) THEN
        -- Get approvers from rule_details
        IF NEW.rule_details->'approvers' IS NOT NULL AND jsonb_array_length(NEW.rule_details->'approvers') > 0 THEN
            -- Set status to pending_approval
            NEW.status := 'pending_approval';
            
            -- For each approver, add to policy_rule_approvers
            FOR approver_id IN 
                SELECT jsonb_array_elements_text(NEW.rule_details->'approvers')
            LOOP
                INSERT INTO public.policy_rule_approvers
                    (policy_rule_id, user_id, created_by, status)
                VALUES
                    (NEW.rule_id, approver_id, NEW.created_by, 'pending')
                ON CONFLICT (policy_rule_id, user_id) 
                DO UPDATE SET status = 'pending', timestamp = now();
            END LOOP;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create or replace the trigger for rules
DROP TRIGGER IF EXISTS rule_approval_trigger ON public.rules;
CREATE TRIGGER rule_approval_trigger
BEFORE INSERT OR UPDATE ON public.rules
FOR EACH ROW EXECUTE FUNCTION add_rule_to_approval_queue();

-- 4. Create or replace trigger function for policy templates
CREATE OR REPLACE FUNCTION add_template_to_approval_queue()
RETURNS TRIGGER AS $$
DECLARE
    approver_id text;
BEGIN
    -- When a template is created or updated
    IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND (OLD.status != 'pending_approval' OR OLD.status IS NULL))) THEN
        -- Get approvers from template_data
        IF NEW.template_data->'approvers' IS NOT NULL AND jsonb_array_length(NEW.template_data->'approvers') > 0 THEN
            -- Set status to pending_approval
            NEW.status := 'pending_approval';
            
            -- For each approver, add to policy_rule_approvers
            FOR approver_id IN 
                SELECT jsonb_array_elements_text(NEW.template_data->'approvers')
            LOOP
                INSERT INTO public.policy_rule_approvers
                    (policy_rule_id, user_id, created_by, status)
                VALUES
                    (NEW.template_id, approver_id, NEW.created_by, 'pending')
                ON CONFLICT (policy_rule_id, user_id) 
                DO UPDATE SET status = 'pending', timestamp = now();
            END LOOP;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create or replace the trigger for policy templates
DROP TRIGGER IF EXISTS template_approval_trigger ON public.policy_templates;
CREATE TRIGGER template_approval_trigger
BEFORE INSERT OR UPDATE ON public.policy_templates
FOR EACH ROW EXECUTE FUNCTION add_template_to_approval_queue();

-- 6. Create or replace function to automatically update rule/template status when all approvers approve
CREATE OR REPLACE FUNCTION check_all_approvals()
RETURNS TRIGGER AS $$
DECLARE
    total_approvers INT;
    approved_count INT;
    min_required INT;
    rule_record RECORD;
    template_record RECORD;
BEGIN
    -- Count total approvers for this rule/template
    SELECT COUNT(*) INTO total_approvers 
    FROM policy_rule_approvers 
    WHERE policy_rule_id = NEW.policy_rule_id;
    
    -- Count approved approvers
    SELECT COUNT(*) INTO approved_count 
    FROM policy_rule_approvers 
    WHERE policy_rule_id = NEW.policy_rule_id AND status = 'approved';
    
    -- Check what kind of entity this is
    SELECT * INTO rule_record FROM rules WHERE rule_id = NEW.policy_rule_id;
    IF rule_record IS NOT NULL THEN
        -- It's a rule
        -- Get minimum required approvals if specified in rule details
        IF rule_record.rule_details->'requiredApprovals' IS NOT NULL THEN
            min_required := (rule_record.rule_details->>'requiredApprovals')::int;
        ELSE 
            -- Default to all approvers
            min_required := total_approvers;
        END IF;
        
        -- If enough approvals, update rule status
        IF approved_count >= min_required THEN
            UPDATE rules SET status = 'active' WHERE rule_id = NEW.policy_rule_id;
        END IF;
    ELSE
        -- Check if it's a template
        SELECT * INTO template_record FROM policy_templates WHERE template_id = NEW.policy_rule_id;
        IF template_record IS NOT NULL THEN
            -- It's a template
            -- Get minimum required approvals if specified in template data
            IF template_record.template_data->'requiredApprovals' IS NOT NULL THEN
                min_required := (template_record.template_data->>'requiredApprovals')::int;
            ELSE 
                -- Default to all approvers
                min_required := total_approvers;
            END IF;
            
            -- If enough approvals, update template status
            IF approved_count >= min_required THEN
                UPDATE policy_templates SET status = 'active' WHERE template_id = NEW.policy_rule_id;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create or replace trigger for policy_rule_approvers
DROP TRIGGER IF EXISTS check_approvals_trigger ON public.policy_rule_approvers;
CREATE TRIGGER check_approvals_trigger
AFTER UPDATE ON public.policy_rule_approvers
FOR EACH ROW
WHEN (NEW.status = 'approved')
EXECUTE FUNCTION check_all_approvals();

-- 8. Create an index on policy_rule_approvers for better query performance
CREATE INDEX IF NOT EXISTS idx_policy_rule_approvers_policy_rule_id 
ON public.policy_rule_approvers(policy_rule_id);

CREATE INDEX IF NOT EXISTS idx_policy_rule_approvers_user_id 
ON public.policy_rule_approvers(user_id);

CREATE INDEX IF NOT EXISTS idx_policy_rule_approvers_status 
ON public.policy_rule_approvers(status);

-- 9. Create function to handle rejection of rules/templates when any approver rejects
CREATE OR REPLACE FUNCTION handle_rule_rejection()
RETURNS TRIGGER AS $$
BEGIN
    -- If status is changed to rejected
    IF NEW.status = 'rejected' THEN
        -- Check what kind of entity this is
        IF EXISTS (SELECT 1 FROM rules WHERE rule_id = NEW.policy_rule_id) THEN
            -- It's a rule - update its status
            UPDATE rules 
            SET status = 'rejected' 
            WHERE rule_id = NEW.policy_rule_id;
        ELSIF EXISTS (SELECT 1 FROM policy_templates WHERE template_id = NEW.policy_rule_id) THEN
            -- It's a template - update its status
            UPDATE policy_templates 
            SET status = 'rejected' 
            WHERE template_id = NEW.policy_rule_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create a trigger for rejections
DROP TRIGGER IF EXISTS handle_rejection_trigger ON public.policy_rule_approvers;
CREATE TRIGGER handle_rejection_trigger
AFTER UPDATE ON public.policy_rule_approvers
FOR EACH ROW
WHEN (NEW.status = 'rejected')
EXECUTE FUNCTION handle_rule_rejection();

-- 11. Add RLS policies for security (optional, uncomment if needed)
-- ALTER TABLE public.policy_rule_approvers ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "Users can view their own approval requests"
-- ON public.policy_rule_approvers FOR SELECT
-- USING (user_id = auth.uid());
-- 
-- CREATE POLICY "Users can update their own approval decisions"
-- ON public.policy_rule_approvers FOR UPDATE
-- USING (user_id = auth.uid())
-- WITH CHECK (user_id = auth.uid());