-- Disable auth constraints to prevent errors

-- Make user_id column nullable in all tables that reference it
DO $$ 
BEGIN
  -- Check and modify user_roles table
  IF EXISTS (SELECT FROM information_schema.columns 
             WHERE table_name = 'user_roles' AND column_name = 'user_id') THEN
    ALTER TABLE user_roles ALTER COLUMN user_id DROP NOT NULL;
  END IF;

  -- Check and modify notifications table
  IF EXISTS (SELECT FROM information_schema.columns 
             WHERE table_name = 'notifications' AND column_name = 'user_id') THEN
    ALTER TABLE notifications ALTER COLUMN user_id DROP NOT NULL;
  END IF;

  -- Check and modify user_settings table
  IF EXISTS (SELECT FROM information_schema.columns 
             WHERE table_name = 'user_settings' AND column_name = 'user_id') THEN
    ALTER TABLE user_settings ALTER COLUMN user_id DROP NOT NULL;
  END IF;

  -- Check and modify compliance_settings table
  IF EXISTS (SELECT FROM information_schema.columns 
             WHERE table_name = 'compliance_settings' AND column_name = 'user_id') THEN
    ALTER TABLE compliance_settings ALTER COLUMN user_id DROP NOT NULL;
  END IF;

  -- Check and modify documents table
  IF EXISTS (SELECT FROM information_schema.columns 
             WHERE table_name = 'documents' AND column_name = 'user_id') THEN
    ALTER TABLE documents ALTER COLUMN user_id DROP NOT NULL;
  END IF;
END
$$;

-- Add tables to realtime publication if they exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_roles') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_roles;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE users;
  END IF;
END
$$;
