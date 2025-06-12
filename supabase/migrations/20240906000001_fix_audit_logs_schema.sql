-- Check if the audit_logs table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        -- Check if the user column exists
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'user') THEN
            -- Rename user column to user_id if it exists
            ALTER TABLE audit_logs RENAME COLUMN "user" TO user_id;
        END IF;
        
        -- Check if user_email column exists, if not add it
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'user_email') THEN
            ALTER TABLE audit_logs ADD COLUMN user_email TEXT;
        END IF;
    END IF;
END
$$;