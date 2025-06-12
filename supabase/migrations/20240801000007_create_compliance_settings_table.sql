-- Create compliance settings table

CREATE TABLE IF NOT EXISTS compliance_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id TEXT NOT NULL UNIQUE,
  kyc_status TEXT NOT NULL DEFAULT 'not_started',
  require_accreditation BOOLEAN NOT NULL DEFAULT FALSE,
  minimum_investment INTEGER NOT NULL DEFAULT 0,
  jurisdictions TEXT[] DEFAULT '{}',
  investor_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE compliance_settings;
