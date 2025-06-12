-- Drop existing permissions-related tables
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS roles;

-- Create new roles table
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  priority INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create new role_permissions table
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id TEXT NOT NULL,
  effect TEXT NOT NULL CHECK (effect IN ('allow', 'deny')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_role_permissions_updated_at
  BEFORE UPDATE ON role_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default roles
INSERT INTO roles (name, description, priority) VALUES
  ('Super Admin', 'Full system access', 1),
  ('Compliance Manager', 'Manages compliance and approvals', 2),
  ('Token Manager', 'Manages token lifecycle and operations', 3),
  ('Investor Manager', 'Manages investors and subscriptions', 4),
  ('Compliance Officer', 'Handles KYC/KYB processes', 5),
  ('View Only', 'Read-only access to system', 6);

-- Create RLS policies
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access to authenticated users" ON roles;
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON role_permissions;

CREATE POLICY "Allow full access to authenticated users" ON roles
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow full access to authenticated users" ON role_permissions
  FOR ALL USING (auth.uid() IS NOT NULL); 