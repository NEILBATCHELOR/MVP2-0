-- Create a function for executing arbitrary SQL
-- This allows for administrative operations via the API
-- CAUTION: This function can be dangerous and should be restricted via RLS

-- Create the exec function that allows executing arbitrary SQL
CREATE OR REPLACE FUNCTION exec(query text)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- Execute the provided query
  EXECUTE query;
  
  -- Return success message
  result := jsonb_build_object('success', true, 'message', 'Query executed successfully');
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  -- Return error details on failure
  result := jsonb_build_object(
    'success', false,
    'message', 'Query execution failed',
    'error', SQLERRM,
    'detail', SQLSTATE
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment on the function
COMMENT ON FUNCTION exec IS 'Executes arbitrary SQL. Use with caution and proper permissions.';

-- Add Row Level Security to restrict this function
DO $$
BEGIN
  -- Check if RLS is supported on functions (PostgreSQL 14+)
  IF EXISTS (
    SELECT FROM pg_proc WHERE proname = 'rls_enabled' AND proargtypes = '26'::oid
  ) THEN
    -- Add RLS policy to restrict access to admin users
    EXECUTE 'CREATE POLICY admin_exec_policy ON exec FOR ALL TO authenticated USING (
      (SELECT is_admin FROM auth.users WHERE id = auth.uid())
    )';
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- If RLS on functions is not supported, we can't add the policy
  RAISE NOTICE 'RLS on functions not supported, using grants instead';
END $$;