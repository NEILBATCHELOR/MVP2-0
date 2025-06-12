-- Migration: token_deployment_fields
-- Description: Adds fields required for token deployment tracking

-- Add deployment-related fields to tokens table
ALTER TABLE tokens 
ADD COLUMN IF NOT EXISTS address VARCHAR(255),
ADD COLUMN IF NOT EXISTS blockchain VARCHAR(100),
ADD COLUMN IF NOT EXISTS deployment_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS deployment_timestamp TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deployment_transaction VARCHAR(255),
ADD COLUMN IF NOT EXISTS deployment_error TEXT,
ADD COLUMN IF NOT EXISTS deployed_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS deployment_environment VARCHAR(50),
ADD COLUMN IF NOT EXISTS deployment_network VARCHAR(100),
ADD COLUMN IF NOT EXISTS deployment_gas_used BIGINT,
ADD COLUMN IF NOT EXISTS deployment_effective_gas_price BIGINT,
ADD COLUMN IF NOT EXISTS deployment_block_number BIGINT,
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS verification_timestamp TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verification_error TEXT,
ADD COLUMN IF NOT EXISTS explorer_url VARCHAR(255);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_tokens_deployment_status ON tokens(deployment_status);
CREATE INDEX IF NOT EXISTS idx_tokens_blockchain ON tokens(blockchain);
CREATE INDEX IF NOT EXISTS idx_tokens_address ON tokens(address);

-- Create token deployment history table
CREATE TABLE IF NOT EXISTS token_deployment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_id UUID NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
    project_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    blockchain VARCHAR(100),
    network_environment VARCHAR(50),
    transaction_hash VARCHAR(255),
    block_number BIGINT,
    address VARCHAR(255),
    gas_used BIGINT,
    effective_gas_price BIGINT,
    error TEXT,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create index on token_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_token_deployment_history_token_id ON token_deployment_history(token_id);

-- Create RLS policies for token_deployment_history
ALTER TABLE token_deployment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view deployment history for their projects" ON token_deployment_history
    FOR SELECT
    USING (
        project_id IN (
            SELECT project_id FROM project_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert deployment history for their projects" ON token_deployment_history
    FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT project_id FROM project_members 
            WHERE user_id = auth.uid()
        )
    );

-- Function to update token deployment status
CREATE OR REPLACE FUNCTION update_token_deployment_status()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO token_deployment_history (
        token_id,
        project_id,
        status,
        blockchain,
        network_environment,
        transaction_hash,
        block_number,
        address,
        gas_used,
        effective_gas_price,
        error,
        created_by
    ) VALUES (
        NEW.id,
        NEW.project_id,
        NEW.deployment_status,
        NEW.blockchain,
        NEW.deployment_environment,
        NEW.deployment_transaction,
        NEW.deployment_block_number,
        NEW.address,
        NEW.deployment_gas_used,
        NEW.deployment_effective_gas_price,
        NEW.deployment_error,
        auth.uid()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for tracking deployment status changes
DROP TRIGGER IF EXISTS track_token_deployment_status ON tokens;
CREATE TRIGGER track_token_deployment_status
AFTER UPDATE OF deployment_status ON tokens
FOR EACH ROW
WHEN (OLD.deployment_status IS DISTINCT FROM NEW.deployment_status)
EXECUTE FUNCTION update_token_deployment_status();