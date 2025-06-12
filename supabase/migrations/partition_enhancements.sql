-- Partition Enhancements Migration
-- Adds partition-specific token balance tracking and additional metadata fields

-- Ensure partitionType is consistently stored in metadata
UPDATE token_erc1400_partitions 
SET metadata = metadata || 
    jsonb_build_object('partitionType', 
                      COALESCE(metadata->>'type', 'equity')) 
WHERE metadata->>'partitionType' IS NULL;

-- Create partition balances table
CREATE TABLE IF NOT EXISTS token_erc1400_partition_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partition_id UUID NOT NULL REFERENCES token_erc1400_partitions(id) ON DELETE CASCADE,
    holder_address TEXT NOT NULL,
    balance TEXT NOT NULL DEFAULT '0',
    last_updated TIMESTAMPTZ DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb,
    
    UNIQUE(partition_id, holder_address)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_partition_balances_holder_address
ON token_erc1400_partition_balances(holder_address);

-- Add index for faster partition queries
CREATE INDEX IF NOT EXISTS idx_partition_balances_partition_id
ON token_erc1400_partition_balances(partition_id);

-- Add total_supply column to token_erc1400_partitions
ALTER TABLE token_erc1400_partitions
ADD COLUMN IF NOT EXISTS total_supply TEXT DEFAULT '0';

-- Update existing partitions to set total_supply from metadata if available
UPDATE token_erc1400_partitions
SET total_supply = COALESCE(metadata->>'amount', '0')
WHERE total_supply = '0';

-- Add transfer_events tracking table for partitions
CREATE TABLE IF NOT EXISTS token_erc1400_partition_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partition_id UUID NOT NULL REFERENCES token_erc1400_partitions(id) ON DELETE CASCADE,
    from_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
    amount TEXT NOT NULL,
    operator_address TEXT,
    timestamp TIMESTAMPTZ DEFAULT now(),
    transaction_hash TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index for faster event queries
CREATE INDEX IF NOT EXISTS idx_partition_transfers_partition_id
ON token_erc1400_partition_transfers(partition_id);

-- Create index for faster holder transfer queries
CREATE INDEX IF NOT EXISTS idx_partition_transfers_from_address
ON token_erc1400_partition_transfers(from_address);

CREATE INDEX IF NOT EXISTS idx_partition_transfers_to_address
ON token_erc1400_partition_transfers(to_address);

-- Add partition operators table
CREATE TABLE IF NOT EXISTS token_erc1400_partition_operators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partition_id UUID NOT NULL REFERENCES token_erc1400_partitions(id) ON DELETE CASCADE,
    holder_address TEXT NOT NULL,
    operator_address TEXT NOT NULL,
    authorized BOOLEAN DEFAULT TRUE,
    last_updated TIMESTAMPTZ DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb,
    
    UNIQUE(partition_id, holder_address, operator_address)
);

-- Create index for faster operator queries
CREATE INDEX IF NOT EXISTS idx_partition_operators_partition_id
ON token_erc1400_partition_operators(partition_id);

-- Enhance partition metadata with default fields for lockup period and restrictions
UPDATE token_erc1400_partitions
SET metadata = metadata || 
    jsonb_build_object(
        'lockupPeriodDays', COALESCE(metadata->>'lockupPeriodDays', '0'),
        'transferRestrictions', COALESCE(metadata->>'transferRestrictions', 'false'),
        'votingRights', COALESCE(metadata->>'votingRights', 'true'),
        'dividendRights', COALESCE(metadata->>'dividendRights', 'true')
    );

-- Add comments for better documentation
COMMENT ON TABLE token_erc1400_partition_balances IS 'Tracks token balances per partition for each holder';
COMMENT ON TABLE token_erc1400_partition_transfers IS 'Records all token transfers within partitions';
COMMENT ON TABLE token_erc1400_partition_operators IS 'Tracks authorized operators for each partition';
COMMENT ON COLUMN token_erc1400_partitions.total_supply IS 'Total token supply in this partition'; 

-- 1. Add missing fields to token_erc1400_properties
ALTER TABLE token_erc1400_properties 
ADD COLUMN IF NOT EXISTS regulation_type text,
ADD COLUMN IF NOT EXISTS is_multi_class boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS tranche_transferability boolean DEFAULT false;

-- 2. Create a new table for token-specific documents that tracks document hashes
CREATE TABLE IF NOT EXISTS token_erc1400_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    token_id uuid REFERENCES tokens(id),
    name text NOT NULL,
    document_uri text NOT NULL,
    document_type text NOT NULL,
    document_hash text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. Update token_erc1400_partitions table to add partition_type column
ALTER TABLE token_erc1400_partitions
ADD COLUMN IF NOT EXISTS partition_type text,
ADD COLUMN IF NOT EXISTS amount text;

-- 4. Create index for performance
CREATE INDEX IF NOT EXISTS idx_token_erc1400_documents_token_id ON token_erc1400_documents(token_id);
CREATE INDEX IF NOT EXISTS idx_token_erc1400_partitions_token_id ON token_erc1400_partitions(token_id);
CREATE INDEX IF NOT EXISTS idx_token_erc1400_controllers_token_id ON token_erc1400_controllers(token_id);