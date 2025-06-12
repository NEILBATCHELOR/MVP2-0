-- Function to delete a project and all its related data in a transaction
CREATE OR REPLACE FUNCTION public.delete_project_cascade(project_id UUID)
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cap_table_id UUID;
  subscription_ids UUID[];
BEGIN
  -- Start a transaction to ensure atomicity
  BEGIN
    -- Find cap table related to the project
    SELECT id INTO cap_table_id FROM cap_tables WHERE project_id = $1;
    
    -- If cap table exists, delete its investors first
    IF cap_table_id IS NOT NULL THEN
      DELETE FROM cap_table_investors WHERE cap_table_id = cap_table_id;
      
      -- Then delete the cap table itself
      DELETE FROM cap_tables WHERE id = cap_table_id;
    END IF;
    
    -- Find subscription IDs for this project
    SELECT array_agg(id) INTO subscription_ids FROM subscriptions WHERE project_id = $1;
    
    -- If there are subscriptions, delete token allocations first
    IF subscription_ids IS NOT NULL THEN
      DELETE FROM token_allocations WHERE subscription_id = ANY(subscription_ids);
      
      -- Then delete the subscriptions
      DELETE FROM subscriptions WHERE project_id = $1;
    END IF;
    
    -- Delete any project documents
    DELETE FROM issuer_detail_documents WHERE project_id = $1;
    
    -- Finally delete the project
    DELETE FROM projects WHERE id = $1;
    
    -- Explicitly commit the transaction
    COMMIT;
  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback the transaction if any error occurs
      ROLLBACK;
      RAISE;
  END;
END;
$$;

-- Set appropriate permissions for the function
GRANT EXECUTE ON FUNCTION public.delete_project_cascade TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_project_cascade TO service_role;

-- Add comment explaining the function
COMMENT ON FUNCTION public.delete_project_cascade IS 'Deletes a project and all related data (cap tables, investors, subscriptions, documents, etc.) in a single transaction';