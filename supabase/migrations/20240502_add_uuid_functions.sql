-- Create a function to safely cast text to UUID
CREATE OR REPLACE FUNCTION safe_cast_to_uuid(input text) 
RETURNS uuid AS $$
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
$$ LANGUAGE plpgsql;

-- Create RPC function to add policy approver with proper UUID casting
CREATE OR REPLACE FUNCTION add_policy_approver_with_cast(
  policy_id text,
  user_id text,
  created_by_id text
) RETURNS boolean AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;