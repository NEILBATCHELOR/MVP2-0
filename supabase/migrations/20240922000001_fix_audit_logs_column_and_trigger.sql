-- First, check if the old_data column exists and add it if it doesn't
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'audit_logs' AND column_name = 'old_data') THEN
        ALTER TABLE public.audit_logs ADD COLUMN old_data JSONB;
    END IF;
END$$;

-- Drop the existing trigger if it exists
DROP TRIGGER IF EXISTS log_investor_changes ON public.investors;

-- Recreate the log_user_action function to use investor_id instead of id
CREATE OR REPLACE FUNCTION public.log_user_action()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_logs (
        entity_type,
        entity_id,
        action,
        user_id,
        old_data,
        new_data,
        timestamp
    ) VALUES (
        TG_TABLE_NAME,
        CASE
            WHEN TG_OP = 'DELETE' THEN OLD.investor_id
            ELSE NEW.investor_id
        END,
        TG_OP,
        auth.uid(),
        CASE
            WHEN TG_OP = 'INSERT' THEN NULL
            ELSE row_to_json(OLD)
        END,
        CASE
            WHEN TG_OP = 'DELETE' THEN NULL
            ELSE row_to_json(NEW)
        END,
        now()
    );
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER log_investor_changes
AFTER INSERT OR UPDATE OR DELETE ON public.investors
FOR EACH ROW EXECUTE FUNCTION public.log_user_action();

-- Add RLS policy for audit_logs if it doesn't exist
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.audit_logs;
CREATE POLICY "Allow all operations for authenticated users"
ON public.audit_logs
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;