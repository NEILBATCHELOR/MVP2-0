-- Drop the existing trigger first
DROP TRIGGER IF EXISTS log_investor_changes ON investors;

-- Check if the log_user_action function exists and recreate it to use investor_id instead of id
CREATE OR REPLACE FUNCTION log_user_action()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_logs (entity_type, entity_id, action, old_data, user_id, ip_address)
        VALUES ('investors', OLD.investor_id, 'DELETE', row_to_json(OLD), auth.uid(), NULL);
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit_logs (entity_type, entity_id, action, old_data, new_data, user_id, ip_address)
        VALUES ('investors', NEW.investor_id, 'UPDATE', row_to_json(OLD), row_to_json(NEW), auth.uid(), NULL);
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_logs (entity_type, entity_id, action, new_data, user_id, ip_address)
        VALUES ('investors', NEW.investor_id, 'INSERT', row_to_json(NEW), auth.uid(), NULL);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger with the fixed function
CREATE TRIGGER log_investor_changes
AFTER INSERT OR UPDATE OR DELETE ON investors
FOR EACH ROW
EXECUTE FUNCTION log_user_action();
