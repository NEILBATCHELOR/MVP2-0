-- Add missing tables for wallet service functionality

-- Wallet signatories table
CREATE TABLE IF NOT EXISTS wallet_signatories (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    role text NOT NULL,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(wallet_address, email)
);

-- Add indexes for wallet_signatories
CREATE INDEX IF NOT EXISTS idx_wallet_signatories_wallet_address ON wallet_signatories(wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallet_signatories_status ON wallet_signatories(status);

-- Whitelist entries table
CREATE TABLE IF NOT EXISTS whitelist_entries (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id text NOT NULL,
    address text NOT NULL,
    label text,
    added_by text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(organization_id, address)
);

-- Add indexes for whitelist_entries
CREATE INDEX IF NOT EXISTS idx_whitelist_entries_organization_id ON whitelist_entries(organization_id);
CREATE INDEX IF NOT EXISTS idx_whitelist_entries_address ON whitelist_entries(address);

-- Add missing columns to multi_sig_wallets if they don't exist
DO $$ 
BEGIN
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'multi_sig_wallets' AND column_name = 'status') THEN
        ALTER TABLE multi_sig_wallets ADD COLUMN status text DEFAULT 'active' CHECK (status IN ('pending', 'active', 'blocked'));
    END IF;
    
    -- Add blocked_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'multi_sig_wallets' AND column_name = 'blocked_at') THEN
        ALTER TABLE multi_sig_wallets ADD COLUMN blocked_at timestamp with time zone;
    END IF;
    
    -- Add block_reason column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'multi_sig_wallets' AND column_name = 'block_reason') THEN
        ALTER TABLE multi_sig_wallets ADD COLUMN block_reason text;
    END IF;
END $$;

-- Add updated_at trigger for wallet_signatories
CREATE OR REPLACE FUNCTION update_wallet_signatories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS wallet_signatories_updated_at ON wallet_signatories;
CREATE TRIGGER wallet_signatories_updated_at
    BEFORE UPDATE ON wallet_signatories
    FOR EACH ROW
    EXECUTE FUNCTION update_wallet_signatories_updated_at();

-- Add updated_at trigger for whitelist_entries
CREATE OR REPLACE FUNCTION update_whitelist_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS whitelist_entries_updated_at ON whitelist_entries;
CREATE TRIGGER whitelist_entries_updated_at
    BEFORE UPDATE ON whitelist_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_whitelist_entries_updated_at();

-- Add RLS policies for wallet_signatories
ALTER TABLE wallet_signatories ENABLE ROW LEVEL SECURITY;

-- Policy for wallet_signatories: users can see signatories for wallets they own or manage
CREATE POLICY wallet_signatories_policy ON wallet_signatories
    FOR ALL USING (
        auth.uid() IS NOT NULL AND (
            -- Users can access if they are listed as a signatory
            EXISTS (
                SELECT 1 FROM wallet_signatories ws2 
                WHERE ws2.wallet_address = wallet_signatories.wallet_address 
                AND ws2.email = (SELECT email FROM auth.users WHERE id = auth.uid())
            )
            -- Or if they have admin privileges
            OR EXISTS (
                SELECT 1 FROM user_roles ur 
                JOIN roles r ON ur.role_id = r.id 
                WHERE ur.user_id = auth.uid() 
                AND r.name IN ('Super Admin', 'admin', 'walletAdmin')
            )
        )
    );

-- Add RLS policies for whitelist_entries
ALTER TABLE whitelist_entries ENABLE ROW LEVEL SECURITY;

-- Policy for whitelist_entries: users can see entries for their organization
CREATE POLICY whitelist_entries_policy ON whitelist_entries
    FOR ALL USING (
        auth.uid() IS NOT NULL AND (
            -- Users can access entries for their organization
            organization_id IN (
                SELECT organization_id FROM user_organizations 
                WHERE user_id = auth.uid()
            )
            -- Or if they have admin privileges
            OR EXISTS (
                SELECT 1 FROM user_roles ur 
                JOIN roles r ON ur.role_id = r.id 
                WHERE ur.user_id = auth.uid() 
                AND r.name IN ('Super Admin', 'admin', 'complianceManager')
            )
        )
    );
