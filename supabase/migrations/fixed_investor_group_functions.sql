-- fixed_investor_group_functions.sql
-- This migration adds improved database functions to handle both investor_groups_investors 
-- and investor_group_members tables with proper type casting and RLS handling

-- Function to get unique group memberships for a list of investors
CREATE OR REPLACE FUNCTION get_unique_group_memberships(investor_ids text[])
RETURNS TABLE (
  group_id text,
  investor_count bigint
) LANGUAGE sql SECURITY DEFINER AS $$
  WITH combined_memberships AS (
    -- Get memberships from the new table with proper type casting
    SELECT group_id::text, investor_id::text
    FROM investor_groups_investors
    WHERE investor_id::text = ANY(investor_ids)
    
    UNION
    
    -- Get memberships from the old table with proper type casting
    SELECT group_id::text, investor_id::text
    FROM investor_group_members
    WHERE investor_id::text = ANY(investor_ids)
  )
  
  -- Count distinct investors per group
  SELECT 
    group_id,
    COUNT(DISTINCT investor_id) AS investor_count
  FROM 
    combined_memberships
  GROUP BY 
    group_id;
$$;

-- Function to get the total unique count of members in a group
CREATE OR REPLACE FUNCTION get_unique_member_count(group_id_param text)
RETURNS int LANGUAGE sql SECURITY DEFINER AS $$
  WITH combined_memberships AS (
    -- Get memberships from the new table with proper type casting
    SELECT investor_id::text
    FROM investor_groups_investors
    WHERE group_id::text = group_id_param
    
    UNION
    
    -- Get memberships from the old table with proper type casting
    SELECT investor_id::text
    FROM investor_group_members
    WHERE group_id::text = group_id_param
  )
  
  -- Count distinct investors
  SELECT 
    COUNT(DISTINCT investor_id)
  FROM 
    combined_memberships;
$$;

-- Improved function that adds investors to a group with better type handling
CREATE OR REPLACE FUNCTION add_investors_to_group(p_group_id text, p_investor_ids text[])
RETURNS TABLE (
  success boolean,
  old_table_count integer,
  new_table_count integer,
  errors text[]
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  sync_timestamp timestamp with time zone := NOW();
  v_investor_id text;
  v_old_success_count integer := 0;
  v_new_success_count integer := 0;
  v_errors text[] := ARRAY[]::text[];
  v_error text;
BEGIN
  -- Validate input
  IF p_group_id IS NULL THEN
    RAISE EXCEPTION 'Group ID cannot be NULL';
  END IF;

  IF p_investor_ids IS NULL OR array_length(p_investor_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'Investor IDs array cannot be NULL or empty';
  END IF;

  -- Add to the investor_group_members table (old)
  BEGIN
    FOREACH v_investor_id IN ARRAY p_investor_ids
    LOOP
      BEGIN
        INSERT INTO investor_group_members (group_id, investor_id, created_at)
        VALUES (p_group_id::uuid, v_investor_id::uuid, sync_timestamp)
        ON CONFLICT (group_id, investor_id) DO NOTHING;
        v_old_success_count := v_old_success_count + 1;
      EXCEPTION WHEN OTHERS THEN
        v_error := 'Error in old table: ' || SQLERRM;
        v_errors := array_append(v_errors, v_error);
        RAISE NOTICE '%', v_error;
      END;
    END LOOP;
  EXCEPTION WHEN OTHERS THEN
    v_error := 'Error in old table batch: ' || SQLERRM;
    v_errors := array_append(v_errors, v_error);
    RAISE NOTICE '%', v_error;
  END;

  -- Try to add to investor_groups_investors table (new)
  BEGIN
    FOREACH v_investor_id IN ARRAY p_investor_ids
    LOOP
      BEGIN
        INSERT INTO investor_groups_investors (id, group_id, investor_id, created_at)
        VALUES (gen_random_uuid()::text, p_group_id::uuid, v_investor_id::uuid, sync_timestamp)
        ON CONFLICT (group_id, investor_id) DO NOTHING;
        v_new_success_count := v_new_success_count + 1;
      EXCEPTION WHEN OTHERS THEN
        v_error := 'Error in new table: ' || SQLERRM;
        v_errors := array_append(v_errors, v_error);
        RAISE NOTICE '%', v_error;
      END;
    END LOOP;
  EXCEPTION WHEN OTHERS THEN
    v_error := 'Error in new table batch: ' || SQLERRM;
    v_errors := array_append(v_errors, v_error);
    RAISE NOTICE '%', v_error;
  END;

  -- Update the group member count
  BEGIN
    UPDATE investor_groups
    SET 
      member_count = (SELECT get_unique_member_count(p_group_id)),
      updated_at = sync_timestamp
    WHERE id::text = p_group_id;
  EXCEPTION WHEN OTHERS THEN
    v_error := 'Error updating count: ' || SQLERRM;
    v_errors := array_append(v_errors, v_error);
    RAISE NOTICE '%', v_error;
  END;
  
  -- Return success information
  RETURN QUERY SELECT 
    v_old_success_count > 0 OR v_new_success_count > 0, 
    v_old_success_count, 
    v_new_success_count, 
    v_errors;
END;
$$;

-- Improved function that removes investors from a group with better type handling
CREATE OR REPLACE FUNCTION remove_investors_from_group(p_group_id text, p_investor_ids text[])
RETURNS TABLE (
  success boolean,
  old_table_count integer,
  new_table_count integer,
  errors text[]
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  sync_timestamp timestamp with time zone := NOW();
  v_old_success_count integer := 0;
  v_new_success_count integer := 0;
  v_errors text[] := ARRAY[]::text[];
  v_error text;
  v_old_deleted integer;
  v_new_deleted integer;
BEGIN
  -- Validate input
  IF p_group_id IS NULL THEN
    RAISE EXCEPTION 'Group ID cannot be NULL';
  END IF;

  IF p_investor_ids IS NULL OR array_length(p_investor_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'Investor IDs array cannot be NULL or empty';
  END IF;

  -- Remove from the investor_group_members table (old)
  BEGIN
    DELETE FROM investor_group_members
    WHERE group_id::text = p_group_id
    AND investor_id::text = ANY(p_investor_ids)
    RETURNING count(*) INTO v_old_deleted;
    
    v_old_success_count := COALESCE(v_old_deleted, 0);
  EXCEPTION WHEN OTHERS THEN
    v_error := 'Error removing from old table: ' || SQLERRM;
    v_errors := array_append(v_errors, v_error);
    RAISE NOTICE '%', v_error;
  END;

  -- Try to remove from investor_groups_investors table (new)
  BEGIN
    DELETE FROM investor_groups_investors
    WHERE group_id::text = p_group_id
    AND investor_id::text = ANY(p_investor_ids)
    RETURNING count(*) INTO v_new_deleted;
    
    v_new_success_count := COALESCE(v_new_deleted, 0);
  EXCEPTION WHEN OTHERS THEN
    v_error := 'Error removing from new table: ' || SQLERRM;
    v_errors := array_append(v_errors, v_error);
    RAISE NOTICE '%', v_error;
  END;

  -- Update the group member count
  BEGIN
    UPDATE investor_groups
    SET 
      member_count = (SELECT get_unique_member_count(p_group_id)),
      updated_at = sync_timestamp
    WHERE id::text = p_group_id;
  EXCEPTION WHEN OTHERS THEN
    v_error := 'Error updating count: ' || SQLERRM;
    v_errors := array_append(v_errors, v_error);
    RAISE NOTICE '%', v_error;
  END;
  
  -- Return success information
  RETURN QUERY SELECT 
    v_old_success_count > 0 OR v_new_success_count > 0, 
    v_old_success_count, 
    v_new_success_count, 
    v_errors;
END;
$$;

-- Improved function to sync memberships between tables with better cursor handling
CREATE OR REPLACE FUNCTION sync_investor_group_memberships()
RETURNS TABLE (
  group_id text,
  success boolean,
  error text
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_group_id text;
  v_success boolean;
  v_error text;
  v_processed_count integer := 0;
  groups_cursor CURSOR FOR SELECT id::text FROM investor_groups WHERE id IS NOT NULL;
BEGIN
  -- Process one group at a time to avoid timeouts
  OPEN groups_cursor;
  LOOP
    FETCH groups_cursor INTO v_group_id;
    EXIT WHEN NOT FOUND;
    
    -- Call the single group sync function for each group
    BEGIN
      SELECT * FROM sync_group_memberships(v_group_id) INTO v_success, v_error;
      
      -- Return the result for this group
      group_id := v_group_id;
      success := v_success;
      error := v_error;
      RETURN NEXT;
      
      v_processed_count := v_processed_count + 1;
      
      -- Add a small delay every 10 groups to avoid resource exhaustion
      IF v_processed_count % 10 = 0 THEN
        PERFORM pg_sleep(0.1);  -- 100ms delay
      END IF;
    EXCEPTION WHEN OTHERS THEN
      group_id := v_group_id;
      success := FALSE;
      error := 'Exception: ' || SQLERRM;
      RETURN NEXT;
    END;
  END LOOP;
  CLOSE groups_cursor;
  
  -- Return empty row if no groups were processed
  IF v_processed_count = 0 THEN
    group_id := NULL;
    success := FALSE;
    error := 'No groups were processed';
    RETURN NEXT;
  END IF;
END;
$$;

-- Improved function that can be called with a specific group ID for syncing a single group
CREATE OR REPLACE FUNCTION sync_group_memberships(group_id_param text)
RETURNS TABLE (
  success boolean,
  error text
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  sync_timestamp timestamp with time zone := NOW();
  v_old_to_new_count integer := 0;
  v_new_to_old_count integer := 0;
  v_error text;
BEGIN
  -- Validate input
  IF group_id_param IS NULL THEN
    RETURN QUERY SELECT FALSE, 'group_id_param cannot be NULL';
    RETURN;
  END IF;

  -- First sync from old to new table for this group
  BEGIN
    INSERT INTO investor_groups_investors (id, group_id, investor_id, created_at)
    SELECT 
      gen_random_uuid()::text, -- Generate UUID for new records
      old.group_id,
      old.investor_id,
      COALESCE(old.created_at, sync_timestamp)
    FROM 
      investor_group_members old
    WHERE 
      old.group_id::text = group_id_param AND
      old.investor_id IS NOT NULL AND
      NOT EXISTS (
        SELECT 1 
        FROM investor_groups_investors new
        WHERE 
          new.group_id::text = old.group_id::text AND 
          new.investor_id::text = old.investor_id::text
      )
    ON CONFLICT (group_id, investor_id) DO NOTHING;
    
    GET DIAGNOSTICS v_old_to_new_count = ROW_COUNT;
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but continue with the next step
    v_error := 'Error syncing from old to new table: ' || SQLERRM;
    RAISE NOTICE '%', v_error;
  END;
  
  -- Then sync from new to old table for this group
  BEGIN
    INSERT INTO investor_group_members (group_id, investor_id, created_at)
    SELECT 
      new.group_id,
      new.investor_id,
      COALESCE(new.created_at, sync_timestamp)
    FROM 
      investor_groups_investors new
    WHERE 
      new.group_id::text = group_id_param AND
      new.investor_id IS NOT NULL AND
      NOT EXISTS (
        SELECT 1 
        FROM investor_group_members old
        WHERE 
          old.group_id::text = new.group_id::text AND 
          old.investor_id::text = new.investor_id::text
      )
    ON CONFLICT (group_id, investor_id) DO NOTHING;
    
    GET DIAGNOSTICS v_new_to_old_count = ROW_COUNT;
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but continue with the next step
    v_error := COALESCE(v_error || '; ', '') || 'Error syncing from new to old table: ' || SQLERRM;
    RAISE NOTICE '%', SQLERRM;
  END;
  
  -- Update the group member count
  BEGIN
    UPDATE investor_groups g
    SET 
      member_count = (
        SELECT get_unique_member_count(g.id::text)
      ),
      updated_at = sync_timestamp
    WHERE 
      g.id::text = group_id_param;
  EXCEPTION WHEN OTHERS THEN
    -- Log the error
    v_error := COALESCE(v_error || '; ', '') || 'Error updating group member count: ' || SQLERRM;
    RAISE NOTICE '%', SQLERRM;
  END;
  
  -- Return success status and any errors
  RETURN QUERY SELECT 
    (v_error IS NULL), 
    COALESCE(v_error, 'Successfully synced ' || v_old_to_new_count || ' members from old to new and ' || v_new_to_old_count || ' from new to old');
END;
$$;

-- Update the trigger function to ensure proper type casting
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Update the member count based on both tables
  IF TG_OP = 'INSERT' OR TG_OP = 'DELETE' THEN
    -- Get the relevant group_id based on whether we're processing an insert or delete
    DECLARE
      group_id_val text;
    BEGIN
      IF TG_OP = 'INSERT' THEN
        group_id_val := NEW.group_id::text;
      ELSE -- DELETE
        group_id_val := OLD.group_id::text;
      END IF;
      
      -- Update the count using get_unique_member_count function
      UPDATE public.investor_groups
      SET 
        member_count = (SELECT get_unique_member_count(group_id_val)),
        updated_at = NOW()
      WHERE id::text = group_id_val;
    END;
  END IF;
  
  -- Return appropriate record
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$; 