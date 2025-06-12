-- Drop existing foreign key constraints
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;
ALTER TABLE user_sessions DROP CONSTRAINT IF EXISTS user_sessions_user_id_fkey;
ALTER TABLE auth_events DROP CONSTRAINT IF EXISTS auth_events_user_id_fkey;

-- Drop existing triggers
DROP TRIGGER IF EXISTS before_user_delete ON users;
DROP TRIGGER IF EXISTS after_user_delete ON users;
DROP TRIGGER IF EXISTS on_user_delete ON users;

-- Recreate foreign key constraints with proper references and cascade
ALTER TABLE user_roles 
  ADD CONSTRAINT user_roles_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES users(id) 
  ON DELETE CASCADE;

ALTER TABLE user_sessions 
  ADD CONSTRAINT user_sessions_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES users(id) 
  ON DELETE CASCADE;

ALTER TABLE auth_events 
  ADD CONSTRAINT auth_events_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES users(id) 
  ON DELETE SET NULL;

-- Create function to handle user deletion
CREATE OR REPLACE FUNCTION handle_user_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Temporarily disable RLS
  ALTER TABLE users DISABLE ROW LEVEL SECURITY;
  ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
  ALTER TABLE user_sessions DISABLE ROW LEVEL SECURITY;
  
  -- Delete from user_roles first
  DELETE FROM user_roles WHERE user_id = OLD.id;
  
  -- Delete from user_sessions
  DELETE FROM user_sessions WHERE user_id = OLD.id;
  
  -- Set auth_events user_id to null
  UPDATE auth_events SET user_id = NULL WHERE user_id = OLD.id;
  
  -- Re-enable RLS
  ALTER TABLE users ENABLE ROW LEVEL SECURITY;
  ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
  ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user deletion
CREATE TRIGGER before_user_delete
  BEFORE DELETE ON users
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_deletion();

-- Ensure RLS is disabled on user_roles
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY; 