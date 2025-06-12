-- Create tables for MFA settings and policies

-- Table for user-specific MFA settings
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mfa_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Table for global system settings
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(key)
);

-- Table for MFA policies
CREATE TABLE IF NOT EXISTS mfa_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  required BOOLEAN NOT NULL DEFAULT true,
  applies_to TEXT[] NOT NULL DEFAULT '{}',
  exceptions TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for MFA exemptions
CREATE TABLE IF NOT EXISTS mfa_exemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  approved_by UUID REFERENCES auth.users(id),
  expiry_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add realtime support for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE user_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE system_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE mfa_policies;
ALTER PUBLICATION supabase_realtime ADD TABLE mfa_exemptions;

-- Insert default global MFA setting (disabled by default)
INSERT INTO system_settings (key, value, description)
VALUES ('mfa_required', 'false', 'Require MFA for all users by default')
ON CONFLICT (key) DO NOTHING;

-- Create a default MFA policy for admins
INSERT INTO mfa_policies (name, description, required, applies_to)
VALUES ('Admin MFA Policy', 'Requires MFA for all admin users', true, ARRAY['admin'])
ON CONFLICT DO NOTHING;
