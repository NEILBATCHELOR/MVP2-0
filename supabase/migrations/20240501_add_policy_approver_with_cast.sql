-- Create new RPC function for adding policy approvers with proper UUID casting
CREATE OR REPLACE FUNCTION add_policy_approver_with_cast(
  policy_id text,
  user_id text,
  created_by_id text
) RETURNS boolean AS $$
BEGIN
  -- Insert with explicit casting to UUID type
  INSERT INTO policy_rule_approvers (policy_rule_id, user_id, created_by, status)
  VALUES (
    policy_id::uuid, 
    user_id::uuid, 
    created_by_id::uuid,
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

-- Create a generic execute_sql function for fallback operations
CREATE OR REPLACE FUNCTION execute_sql(
  sql_query text,
  params text[] DEFAULT '{}'::text[]
) RETURNS json AS $$
DECLARE
  result json;
BEGIN
  EXECUTE sql_query
  USING params[1], params[2], params[3], params[4], params[5], params[6], params[7], params[8], params[9], params[10]
  INTO result;
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('error', SQLERRM, 'detail', SQLSTATE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;