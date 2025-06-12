-- Update member_count in all investor groups, considering both tables
UPDATE public.investor_groups
SET 
  member_count = (
    WITH combined_investors AS (
      -- Get all investor_ids from investor_groups_investors
      SELECT group_id, investor_id 
      FROM public.investor_groups_investors
      UNION
      -- Get all investor_ids from investor_group_members
      SELECT group_id, investor_id
      FROM public.investor_group_members
    )
    -- Count distinct investor_ids per group_id
    SELECT COUNT(DISTINCT investor_id) 
    FROM combined_investors 
    WHERE combined_investors.group_id = investor_groups.id
  ),
  updated_at = NOW()
WHERE true;

-- Create a trigger function to maintain member_count across both tables
CREATE OR REPLACE FUNCTION public.update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the member count based on both tables
  IF TG_OP = 'INSERT' OR TG_OP = 'DELETE' THEN
    -- Get the relevant group_id based on whether we're processing an insert or delete
    DECLARE
      group_id_val uuid;
    BEGIN
      IF TG_OP = 'INSERT' THEN
        group_id_val := NEW.group_id;
      ELSE -- DELETE
        group_id_val := OLD.group_id;
      END IF;
      
      -- Update the count considering both tables
      UPDATE public.investor_groups
      SET 
        member_count = (
          WITH combined_investors AS (
            -- Get all investor_ids from investor_groups_investors
            SELECT investor_id 
            FROM public.investor_groups_investors
            WHERE group_id = group_id_val
            UNION
            -- Get all investor_ids from investor_group_members
            SELECT investor_id
            FROM public.investor_group_members
            WHERE group_id = group_id_val
          )
          -- Count distinct investor_ids
          SELECT COUNT(DISTINCT investor_id) 
          FROM combined_investors
        ),
        updated_at = NOW()
      WHERE id = group_id_val;
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
$$ LANGUAGE plpgsql;

-- Create triggers for investor_groups_investors
DROP TRIGGER IF EXISTS trigger_update_group_member_count_insert_new ON public.investor_groups_investors;
CREATE TRIGGER trigger_update_group_member_count_insert_new
AFTER INSERT ON public.investor_groups_investors
FOR EACH ROW
EXECUTE FUNCTION public.update_group_member_count();

DROP TRIGGER IF EXISTS trigger_update_group_member_count_delete_new ON public.investor_groups_investors;
CREATE TRIGGER trigger_update_group_member_count_delete_new
AFTER DELETE ON public.investor_groups_investors
FOR EACH ROW
EXECUTE FUNCTION public.update_group_member_count();

-- Create triggers for investor_group_members
DROP TRIGGER IF EXISTS trigger_update_group_member_count_insert_old ON public.investor_group_members;
CREATE TRIGGER trigger_update_group_member_count_insert_old
AFTER INSERT ON public.investor_group_members
FOR EACH ROW
EXECUTE FUNCTION public.update_group_member_count();

DROP TRIGGER IF EXISTS trigger_update_group_member_count_delete_old ON public.investor_group_members;
CREATE TRIGGER trigger_update_group_member_count_delete_old
AFTER DELETE ON public.investor_group_members
FOR EACH ROW
EXECUTE FUNCTION public.update_group_member_count(); 