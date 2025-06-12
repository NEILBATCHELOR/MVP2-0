-- ONCHAINID Integration Tables

-- Table to store digital identities linked to users
CREATE TABLE IF NOT EXISTS onchain_identities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  identity_address TEXT NOT NULL,
  blockchain TEXT NOT NULL,
  network TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (user_id, blockchain, network),
  UNIQUE (identity_address, blockchain, network)
);

-- Table to store trusted claim issuers
CREATE TABLE IF NOT EXISTS onchain_issuers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issuer_address TEXT NOT NULL,
  issuer_name TEXT NOT NULL,
  blockchain TEXT NOT NULL,
  network TEXT NOT NULL,
  trusted_for_claims INTEGER[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (issuer_address, blockchain, network)
);

-- Table to cache verified claims
CREATE TABLE IF NOT EXISTS onchain_claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identity_id UUID REFERENCES onchain_identities(id) ON DELETE CASCADE,
  issuer_id UUID REFERENCES onchain_issuers(id) ON DELETE CASCADE,
  topic INTEGER NOT NULL,
  data TEXT,
  signature TEXT NOT NULL,
  valid_from TIMESTAMPTZ,
  valid_to TIMESTAMPTZ,
  verification_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL CHECK (status IN ('VALID', 'INVALID', 'EXPIRED', 'REVOKED')),
  UNIQUE (identity_id, issuer_id, topic, signature)
);

-- Table to track verification attempts and results
CREATE TABLE IF NOT EXISTS onchain_verification_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identity_id UUID REFERENCES onchain_identities(id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL,
  required_claims INTEGER[] NOT NULL DEFAULT '{}',
  result BOOLEAN NOT NULL,
  reason TEXT,
  verification_timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE onchain_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE onchain_issuers ENABLE ROW LEVEL SECURITY;
ALTER TABLE onchain_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE onchain_verification_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own identities" 
  ON onchain_identities FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Admin users can view all identities" 
  ON onchain_identities FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'Super Admin'
  ));

CREATE POLICY "Admin users can manage identities" 
  ON onchain_identities FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'Super Admin'
  ));

CREATE POLICY "Admin users can manage issuers" 
  ON onchain_issuers FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'Super Admin'
  ));

CREATE POLICY "Users can view all issuers" 
  ON onchain_issuers FOR SELECT 
  USING (true);

CREATE POLICY "Admin users can manage claims" 
  ON onchain_claims FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'Super Admin'
  ));

CREATE POLICY "Users can view their own claims" 
  ON onchain_claims FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM onchain_identities oi
    WHERE oi.id = identity_id AND oi.user_id = auth.uid()
  ));

CREATE POLICY "Admin users can manage verification history" 
  ON onchain_verification_history FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'Super Admin'
  ));

CREATE POLICY "Users can view their own verification history" 
  ON onchain_verification_history FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM onchain_identities oi
    WHERE oi.id = identity_id AND oi.user_id = auth.uid()
  ));

-- Create indexes for performance
CREATE INDEX idx_onchain_identities_user_id ON onchain_identities(user_id);
CREATE INDEX idx_onchain_identities_identity_address ON onchain_identities(identity_address);
CREATE INDEX idx_onchain_claims_identity_id ON onchain_claims(identity_id);
CREATE INDEX idx_onchain_claims_issuer_id ON onchain_claims(issuer_id);
CREATE INDEX idx_onchain_claims_topic ON onchain_claims(topic);
CREATE INDEX idx_onchain_verification_history_identity_id ON onchain_verification_history(identity_id);

-- Create trigger to update updated_at field
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_onchain_identities_timestamp
BEFORE UPDATE ON onchain_identities
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_onchain_issuers_timestamp
BEFORE UPDATE ON onchain_issuers
FOR EACH ROW
EXECUTE FUNCTION update_timestamp(); 