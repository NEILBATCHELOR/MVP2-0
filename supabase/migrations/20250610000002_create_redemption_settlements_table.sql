-- Create redemption settlements table for token burning and fund transfer operations
-- This table tracks the final settlement process of approved redemptions

CREATE TABLE IF NOT EXISTS redemption_settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Basic settlement info
  redemption_request_id UUID NOT NULL REFERENCES redemption_requests(id) ON DELETE CASCADE,
  settlement_type TEXT NOT NULL DEFAULT 'standard',
  status TEXT NOT NULL DEFAULT 'pending',
  
  -- Token burning info
  token_contract_address TEXT,
  token_amount NUMERIC(78,18) NOT NULL,
  burn_transaction_hash TEXT,
  burn_gas_used INTEGER,
  burn_gas_price NUMERIC(18,6),
  burn_status TEXT DEFAULT 'pending',
  burn_confirmed_at TIMESTAMPTZ,
  
  -- Fund transfer info
  transfer_amount NUMERIC(78,18) NOT NULL,
  transfer_currency TEXT DEFAULT 'USD',
  transfer_to_address TEXT NOT NULL,
  transfer_transaction_hash TEXT,
  transfer_gas_used INTEGER,
  transfer_gas_price NUMERIC(18,6),
  transfer_status TEXT DEFAULT 'pending',
  transfer_confirmed_at TIMESTAMPTZ,
  
  -- Settlement calculations
  nav_used NUMERIC(18,6),
  exchange_rate NUMERIC(18,6) DEFAULT 1,
  settlement_fee NUMERIC(18,6) DEFAULT 0,
  gas_estimate NUMERIC(18,6),
  
  -- Timing
  estimated_completion TIMESTAMPTZ,
  actual_completion TIMESTAMPTZ,
  
  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMPTZ,
  
  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID,
  
  -- Constraints
  CONSTRAINT valid_settlement_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  CONSTRAINT valid_burn_status CHECK (burn_status IN ('pending', 'processing', 'completed', 'failed')),
  CONSTRAINT valid_transfer_status CHECK (transfer_status IN ('pending', 'processing', 'completed', 'failed')),
  CONSTRAINT positive_amounts CHECK (token_amount > 0 AND transfer_amount > 0),
  CONSTRAINT positive_gas_estimate CHECK (gas_estimate IS NULL OR gas_estimate >= 0),
  CONSTRAINT non_negative_retry_count CHECK (retry_count >= 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_redemption_settlements_redemption_request_id ON redemption_settlements(redemption_request_id);
CREATE INDEX IF NOT EXISTS idx_redemption_settlements_status ON redemption_settlements(status);
CREATE INDEX IF NOT EXISTS idx_redemption_settlements_burn_status ON redemption_settlements(burn_status);
CREATE INDEX IF NOT EXISTS idx_redemption_settlements_transfer_status ON redemption_settlements(transfer_status);
CREATE INDEX IF NOT EXISTS idx_redemption_settlements_created_at ON redemption_settlements(created_at);

-- Add trigger for updated_at
CREATE TRIGGER update_redemption_settlements_updated_at
  BEFORE UPDATE ON redemption_settlements
  FOR EACH ROW
  EXECUTE FUNCTION update_settlement_status();

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE redemption_settlements;

-- Insert some descriptive comments
COMMENT ON TABLE redemption_settlements IS 'Tracks the settlement process for approved redemption requests including token burning and fund transfers';
COMMENT ON COLUMN redemption_settlements.settlement_type IS 'Type of settlement process (standard, expedited, manual)';
COMMENT ON COLUMN redemption_settlements.burn_status IS 'Status of token burning operation';
COMMENT ON COLUMN redemption_settlements.transfer_status IS 'Status of fund transfer operation';
COMMENT ON COLUMN redemption_settlements.nav_used IS 'Net Asset Value used for conversion calculations';
COMMENT ON COLUMN redemption_settlements.exchange_rate IS 'Exchange rate applied for currency conversion';
