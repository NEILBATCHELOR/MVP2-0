-- investor_group_member_functions.sql
-- This migration adds database functions to handle both investor_groups_investors and investor_group_members tables
-- for deduplication and proper counting of group memberships.

-- Function to get unique group memberships for a list of investors
CREATE OR REPLACE FUNCTION get_unique_group_memberships(investor_ids text[])
RETURNS TABLE (
  group_id text,
  investor_count bigint
) LANGUAGE sql SECURITY DEFINER AS $$
  WITH combined_memberships AS (
    -- Get memberships from the new table
    SELECT group_id, investor_id
    FROM investor_groups_investors
    WHERE investor_id::text = ANY(investor_ids)
    
    UNION
    
    -- Get memberships from the old table
    SELECT group_id, investor_id
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
    -- Get memberships from the new table
    SELECT investor_id
    FROM investor_groups_investors
    WHERE group_id::text = group_id_param
    
    UNION
    
    -- Get memberships from the old table
    SELECT investor_id
    FROM investor_group_members
    WHERE group_id::text = group_id_param
  )
  
  -- Count distinct investors
  SELECT 
    COUNT(DISTINCT investor_id)
  FROM 
    combined_memberships;
$$;

-- Function that adds investors to a group (bypasses RLS)
CREATE OR REPLACE FUNCTION add_investors_to_group(p_group_id text, p_investor_ids text[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  sync_timestamp timestamp with time zone := NOW();
  v_investor_id text;
BEGIN
  -- Validate input
  IF p_group_id IS NULL THEN
    RAISE EXCEPTION 'Group ID cannot be NULL';
  END IF;

  IF p_investor_ids IS NULL OR array_length(p_investor_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'Investor IDs array cannot be NULL or empty';
  END IF;

  -- Add to the investor_group_members table (old)
  FOREACH v_investor_id IN ARRAY p_investor_ids
  LOOP
    INSERT INTO investor_group_members (group_id, investor_id, created_at)
    VALUES (p_group_id, v_investor_id, sync_timestamp)
    ON CONFLICT (group_id, investor_id) DO NOTHING;
  END LOOP;

  -- Try to add to investor_groups_investors table (new)
  -- This might fail due to RLS but we'll continue anyway
  BEGIN
    FOREACH v_investor_id IN ARRAY p_investor_ids
    LOOP
      INSERT INTO investor_groups_investors (id, group_id, investor_id, created_at)
      VALUES (gen_random_uuid()::text, p_group_id, v_investor_id, sync_timestamp)
      ON CONFLICT (group_id, investor_id) DO NOTHING;
    END LOOP;
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but continue - we at least added to the old table
    RAISE NOTICE 'Error adding to investor_groups_investors: %', SQLERRM;
  END;

  -- Update the group member count
  UPDATE investor_groups
  SET 
    member_count = (SELECT get_unique_member_count(p_group_id)),
    updated_at = sync_timestamp
  WHERE id::text = p_group_id;
END;
$$;

-- Function that removes investors from a group (bypasses RLS)
CREATE OR REPLACE FUNCTION remove_investors_from_group(p_group_id text, p_investor_ids text[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  sync_timestamp timestamp with time zone := NOW();
BEGIN
  -- Validate input
  IF p_group_id IS NULL THEN
    RAISE EXCEPTION 'Group ID cannot be NULL';
  END IF;

  IF p_investor_ids IS NULL OR array_length(p_investor_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'Investor IDs array cannot be NULL or empty';
  END IF;

  -- Remove from the investor_group_members table (old)
  DELETE FROM investor_group_members
  WHERE group_id::text = p_group_id
  AND investor_id::text = ANY(p_investor_ids);

  -- Try to remove from investor_groups_investors table (new)
  -- This might fail due to RLS but we'll continue anyway
  BEGIN
    DELETE FROM investor_groups_investors
    WHERE group_id::text = p_group_id
    AND investor_id::text = ANY(p_investor_ids);
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but continue - we at least removed from the old table
    RAISE NOTICE 'Error removing from investor_groups_investors: %', SQLERRM;
  END;

  -- Update the group member count
  UPDATE investor_groups
  SET 
    member_count = (SELECT get_unique_member_count(p_group_id)),
    updated_at = sync_timestamp
  WHERE id::text = p_group_id;
END;
$$;

-- Function to sync memberships between tables
-- Note: This can be used to ensure both tables are synchronized
CREATE OR REPLACE FUNCTION sync_investor_group_memberships()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  sync_timestamp timestamp with time zone := NOW();
  v_group_id text;
  groups_cursor CURSOR FOR SELECT id FROM investor_groups WHERE id IS NOT NULL;
BEGIN
  -- Process one group at a time to avoid timeouts
  OPEN groups_cursor;
  LOOP
    FETCH groups_cursor INTO v_group_id;
    EXIT WHEN NOT FOUND;
    
    -- Call the single group sync function for each group
    PERFORM sync_group_memberships(v_group_id::text);
  END LOOP;
  CLOSE groups_cursor;
END;
$$;

-- Function that can be called with a specific group ID for syncing a single group
CREATE OR REPLACE FUNCTION sync_group_memberships(group_id_param text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  sync_timestamp timestamp with time zone := NOW();
BEGIN
  -- Validate input
  IF group_id_param IS NULL THEN
    RAISE EXCEPTION 'group_id_param cannot be NULL';
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
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but continue with the next step
    RAISE NOTICE 'Error syncing from old to new table: %', SQLERRM;
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
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but continue with the next step
    RAISE NOTICE 'Error syncing from new to old table: %', SQLERRM;
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
    RAISE NOTICE 'Error updating group member count: %', SQLERRM;
  END;
END;
$$;

-- Optional: Create a trigger to keep counts updated automatically
-- Note: This may impact performance if there are many operations
-- CREATE OR REPLACE FUNCTION update_group_member_count_trigger()
-- RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
-- BEGIN
--   -- After any change to either table, update the affected group's count
--   PERFORM get_unique_member_count(
--     CASE 
--       WHEN TG_OP = 'DELETE' THEN OLD.group_id::text
--       ELSE NEW.group_id::text
--     END
--   );
--   
--   RETURN NULL;
-- END;
-- $$;
-- 
-- CREATE TRIGGER update_group_count_after_change_new
-- AFTER INSERT OR UPDATE OR DELETE ON investor_groups_investors
-- FOR EACH ROW EXECUTE FUNCTION update_group_member_count_trigger();
-- 
-- CREATE TRIGGER update_group_count_after_change_old
-- AFTER INSERT OR UPDATE OR DELETE ON investor_group_members
-- FOR EACH ROW EXECUTE FUNCTION update_group_member_count_trigger(); 