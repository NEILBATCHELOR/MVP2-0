-- Check if the user column exists before trying to rename it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audit_logs' AND column_name = 'user'
  ) THEN
    ALTER TABLE audit_logs 
      RENAME COLUMN "user" TO user_id;
  END IF;

  -- Add user_email column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audit_logs' AND column_name = 'user_email'
  ) THEN
    ALTER TABLE audit_logs 
      ADD COLUMN user_email TEXT;
  END IF;

  -- Add user_id column if it doesn't exist (in case the rename didn't happen)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audit_logs' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE audit_logs 
      ADD COLUMN user_id TEXT;
  END IF;
END;
$$;
