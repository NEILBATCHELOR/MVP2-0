-- Migration: Create Redemption Approval Configuration Table
-- Description: This migration creates a table to store global redemption approval configuration,
-- including selected approvers and approval thresholds.

-- Create enum type for approval threshold
CREATE TYPE approval_threshold_type AS ENUM (
  'all',     -- All approvers must approve (unanimous)
  'majority', -- Majority of approvers must approve
  'any'      -- Any approver can approve
);

-- Create the redemption approval configuration table
CREATE TABLE IF NOT EXISTS redemption_approval_config (
  id TEXT PRIMARY KEY,  -- Using "global" as a fixed ID for the global config
  approvers JSONB NOT NULL DEFAULT '[]'::JSONB, -- Array of approver objects with id, name, email, role
  threshold approval_threshold_type NOT NULL DEFAULT 'all',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Comment on table and columns for documentation
COMMENT ON TABLE redemption_approval_config IS 'Global configuration for redemption approval workflows';
COMMENT ON COLUMN redemption_approval_config.approvers IS 'JSON array of approver objects containing id, name, email, role';
COMMENT ON COLUMN redemption_approval_config.threshold IS 'Approval threshold setting (all, majority, any)';

-- Insert default global configuration
INSERT INTO redemption_approval_config (id, approvers, threshold)
VALUES ('global', '[]'::JSONB, 'all')
ON CONFLICT (id) DO NOTHING;

-- Add RLS policies
ALTER TABLE redemption_approval_config ENABLE ROW LEVEL SECURITY;

-- Policy for viewing redemption approval config (admins and managers can view)
CREATE POLICY "View redemption approval config" ON redemption_approval_config
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' IN ('admin', 'manager', 'operations')
  );

-- Policy for inserting/updating redemption approval config (only admins can modify)
CREATE POLICY "Modify redemption approval config" ON redemption_approval_config
  FOR ALL
  USING (
    auth.jwt() ->> 'role' IN ('admin')
  );

-- Update the functions to get approvers to include redemption approval permissions
-- This function will return all users who have permission to approve redemption requests
CREATE OR REPLACE FUNCTION get_redemption_approvers()
RETURNS TABLE (
  user_id UUID,
  name TEXT,
  email TEXT,
  role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.raw_user_meta_data->>'full_name' as name,
    u.email,
    r.role_name as role
  FROM auth.users u
  LEFT JOIN user_roles r ON u.id = r.user_id
  WHERE r.role_name IN ('admin', 'manager', 'operations')
  ORDER BY u.raw_user_meta_data->>'full_name';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;