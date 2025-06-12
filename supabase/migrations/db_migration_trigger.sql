-- Migration: Fix add_rule_to_approval_queue trigger function

CREATE OR REPLACE FUNCTION public.add_rule_to_approval_queue()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    approver_id uuid;
BEGIN
    -- When a rule is created or updated
    IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND (OLD.status != 'pending_approval' OR OLD.status IS NULL))) THEN
        -- Get approvers from rule_details
        IF NEW.rule_details->'approvers' IS NOT NULL AND jsonb_array_length(NEW.rule_details->'approvers') > 0 THEN
            -- Set status to pending_approval
            NEW.status := 'pending_approval';
            
            -- For each approver, add to policy_rule_approvers
            FOR approver_id IN 
                SELECT (jsonb_array_elements(NEW.rule_details->'approvers')->>'id')::uuid
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
$function$;
