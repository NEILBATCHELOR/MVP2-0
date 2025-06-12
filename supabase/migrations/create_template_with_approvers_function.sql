-- Create a function to handle template and approvers in a single transaction
-- This leverages the existing deferrable constraint properly

CREATE OR REPLACE FUNCTION create_policy_template_with_approvers(
  template_name TEXT, 
  description TEXT,
  template_data JSONB,
  created_by TEXT,
  approver_ids TEXT[]
) RETURNS UUID AS $$
DECLARE
  new_template_id UUID;
BEGIN
  -- Start transaction explicitly
  BEGIN;
    -- Insert the template
    INSERT INTO policy_templates(template_name, description, template_data, created_by)
    VALUES (template_name, description, template_data, created_by)
    RETURNING template_id INTO new_template_id;
    
    -- Add approvers if any were provided
    IF approver_ids IS NOT NULL AND array_length(approver_ids, 1) > 0 THEN
      FOR i IN 1..array_length(approver_ids, 1) LOOP
        -- Use the upsert_policy_template_approver function that was created in the previous migration
        PERFORM upsert_policy_template_approver(
          new_template_id,
          approver_ids[i]::UUID,
          created_by,
          'pending'
        );
      END LOOP;
    END IF;
    
  -- Commit the transaction - this is when the deferred constraint check happens
  COMMIT;
  
  RETURN new_template_id;
EXCEPTION
  WHEN OTHERS THEN
    -- Rollback on any error
    ROLLBACK;
    RAISE EXCEPTION 'Error creating template with approvers: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_policy_template_with_approvers IS 'Creates a policy template and its approvers in a single transaction, ensuring referential integrity';