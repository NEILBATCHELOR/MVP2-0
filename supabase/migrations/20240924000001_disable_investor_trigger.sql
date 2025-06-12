-- Temporarily disable the problematic trigger
DROP TRIGGER IF EXISTS log_investor_changes ON investors;

-- Create a simplified version of the trigger function that doesn't rely on audit_logs
CREATE OR REPLACE FUNCTION public.log_investor_action()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Just return the appropriate record without trying to insert into audit_logs
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$function$;

-- Create a simplified trigger that doesn't cause errors
CREATE TRIGGER log_investor_changes_simple
AFTER INSERT OR UPDATE OR DELETE ON investors
FOR EACH ROW EXECUTE FUNCTION public.log_investor_action();
