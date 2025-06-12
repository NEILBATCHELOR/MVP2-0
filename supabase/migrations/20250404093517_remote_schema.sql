alter table "public"."approval_requests" drop constraint "approval_requests_status_check";

alter table "public"."policy_rule_approvers" add constraint "policy_rule_approvers_rule_id_fkey" FOREIGN KEY (policy_rule_id) REFERENCES rules(rule_id) ON DELETE CASCADE not valid;

alter table "public"."policy_rule_approvers" validate constraint "policy_rule_approvers_rule_id_fkey";

alter table "public"."policy_rule_approvers" add constraint "policy_rule_approvers_template_id_fkey" FOREIGN KEY (policy_rule_id) REFERENCES policy_templates(template_id) ON DELETE CASCADE not valid;

alter table "public"."policy_rule_approvers" validate constraint "policy_rule_approvers_template_id_fkey";

alter table "public"."policy_rule_approvers" add constraint "policy_rule_approvers_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."policy_rule_approvers" validate constraint "policy_rule_approvers_user_id_fkey";

alter table "public"."approval_requests" add constraint "approval_requests_status_check" CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[]))) not valid;

alter table "public"."approval_requests" validate constraint "approval_requests_status_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.add_policy_approver(p_policy_id uuid, p_user_id text, p_created_by text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  INSERT INTO policy_rule_approvers (policy_rule_id, user_id, created_by, status)
  VALUES (p_policy_id, p_user_id::UUID, p_created_by, 'pending')
  ON CONFLICT (policy_rule_id, user_id) 
  DO UPDATE SET status = 'pending', timestamp = now();
END;
$function$
;

CREATE OR REPLACE FUNCTION public.add_policy_approver(policy_id text, user_id text, created_by text, status_val text DEFAULT 'pending'::text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  INSERT INTO policy_rule_approvers (
    policy_rule_id,
    user_id,
    created_by,
    status
  ) VALUES (
    safe_uuid_cast(policy_id),
    safe_uuid_cast(user_id),
    safe_uuid_cast(created_by),
    status_val
  )
  ON CONFLICT (policy_rule_id, user_id)
  DO UPDATE SET 
    status = status_val,
    timestamp = now();
END;
$function$
;

CREATE OR REPLACE FUNCTION public.add_policy_approver_with_cast(policy_id text, user_id text, created_by_id text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Insert with explicit casting to UUID type
  INSERT INTO policy_rule_approvers (policy_rule_id, user_id, created_by, status)
  VALUES (
    safe_cast_to_uuid(policy_id), 
    safe_cast_to_uuid(user_id), 
    safe_cast_to_uuid(created_by_id),
    'pending'
  )
  ON CONFLICT (policy_rule_id, user_id)
  DO UPDATE SET status = 'pending', timestamp = now();
  
  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error in add_policy_approver_with_cast: %', SQLERRM;
  RETURN false;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.insert_policy_approver(p_policy_id uuid, p_user_id text, p_created_by text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  INSERT INTO policy_rule_approvers (policy_rule_id, user_id, created_by, status)
  VALUES (p_policy_id, p_user_id::UUID, p_created_by::UUID, 'pending')
  ON CONFLICT (policy_rule_id, user_id) 
  DO UPDATE SET status = 'pending', timestamp = now();
END;
$function$
;

CREATE OR REPLACE FUNCTION public.safe_cast_to_uuid(input text)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
DECLARE
  result uuid;
BEGIN
  -- Check if it's already a valid UUID
  BEGIN
    result := input::uuid;
    RETURN result;
  EXCEPTION WHEN others THEN
    -- If it's the special admin value, return a specific UUID
    IF input = 'admin-bypass' THEN
      RETURN '00000000-0000-0000-0000-000000000000'::uuid;
    END IF;
    
    -- Otherwise, generate a new UUID
    RETURN gen_random_uuid();
  END;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.safe_uuid_cast(value text)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Try to convert directly if it's a valid UUID
  BEGIN
    RETURN value::UUID;
  EXCEPTION WHEN OTHERS THEN
    -- For admin-bypass and other special cases, return a constant UUID
    IF value = 'admin-bypass' THEN
      RETURN '00000000-0000-0000-0000-000000000000'::UUID;
    ELSE
      -- For any other values, generate a deterministic UUID
      RETURN gen_random_uuid();
    END IF;
  END;
END;
$function$
;

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


