-- Drop existing foreign key constraints
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;
ALTER TABLE user_sessions DROP CONSTRAINT IF EXISTS user_sessions_user_id_fkey;
ALTER TABLE auth_events DROP CONSTRAINT IF EXISTS auth_events_user_id_fkey;

-- Recreate foreign key constraints with CASCADE
ALTER TABLE user_roles 
  ADD CONSTRAINT user_roles_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

ALTER TABLE user_sessions 
  ADD CONSTRAINT user_sessions_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

ALTER TABLE auth_events 
  ADD CONSTRAINT auth_events_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE SET NULL;

-- Disable RLS on critical tables during deletion
CREATE OR REPLACE FUNCTION disable_rls_for_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Temporarily disable RLS
  ALTER TABLE users DISABLE ROW LEVEL SECURITY;
  ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
  ALTER TABLE user_sessions DISABLE ROW LEVEL SECURITY;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION enable_rls_after_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Re-enable RLS
  ALTER TABLE users ENABLE ROW LEVEL SECURITY;
  ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
  ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS before_user_delete ON users;
CREATE TRIGGER before_user_delete
  BEFORE DELETE ON users
  FOR EACH ROW
  EXECUTE FUNCTION disable_rls_for_deletion();

DROP TRIGGER IF EXISTS after_user_delete ON users;
CREATE TRIGGER after_user_delete
  AFTER DELETE ON users
  FOR EACH ROW
  EXECUTE FUNCTION enable_rls_after_deletion(); 