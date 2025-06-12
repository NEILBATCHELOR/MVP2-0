-- Guardian API Testing Tables
-- Created: $(date)
-- Purpose: Track Guardian API requests, responses, and operations for testing

-- Main table for Guardian API test records
CREATE TABLE guardian_api_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Test identification
  test_name VARCHAR(100) NOT NULL,
  test_type VARCHAR(50) NOT NULL, -- 'create_wallet', 'get_wallet', 'get_operation', 'list_wallets', 'complete_flow'
  
  -- API request details
  endpoint VARCHAR(200) NOT NULL,
  http_method VARCHAR(10) NOT NULL,
  request_payload JSONB,
  request_headers JSONB,
  
  -- API response details  
  response_status INTEGER,
  response_payload JSONB,
  response_headers JSONB,
  
  -- Guardian-specific data
  guardian_wallet_id VARCHAR(100), -- UUID we send to Guardian
  guardian_operation_id VARCHAR(100), -- Operation ID returned by Guardian
  guardian_wallet_address VARCHAR(100), -- Wallet address from Guardian
  
  -- Execution details
  execution_time_ms INTEGER,
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(100),
  notes TEXT,
  
  -- Indexes
  CONSTRAINT guardian_api_tests_test_type_check 
    CHECK (test_type IN ('create_wallet', 'get_wallet', 'get_operation', 'list_wallets', 'list_operations', 'complete_flow'))
);

-- Table for tracking Guardian wallets specifically
CREATE TABLE guardian_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Guardian identifiers
  guardian_wallet_id VARCHAR(100) UNIQUE NOT NULL, -- UUID we sent to Guardian
  guardian_operation_id VARCHAR(100), -- Operation ID from creation
  guardian_internal_id VARCHAR(100), -- Guardian's internal wallet ID (if different)
  
  -- Wallet details from Guardian
  wallet_name VARCHAR(200),
  wallet_status VARCHAR(50), -- 'pending', 'active', 'failed', etc.
  wallet_addresses JSONB, -- Array of addresses with network info
  wallet_metadata JSONB, -- Additional Guardian metadata
  
  -- Creation tracking
  creation_request_id UUID REFERENCES guardian_api_tests(id),
  operation_check_request_id UUID REFERENCES guardian_api_tests(id),
  wallet_details_request_id UUID REFERENCES guardian_api_tests(id),
  
  -- Timeline
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  operation_completed_at TIMESTAMP WITH TIME ZONE,
  wallet_retrieved_at TIMESTAMP WITH TIME ZONE,
  
  -- Our metadata
  test_notes TEXT,
  created_by VARCHAR(100),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for Guardian operations tracking
CREATE TABLE guardian_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Operation details
  operation_id VARCHAR(100) UNIQUE NOT NULL,
  operation_type VARCHAR(50) NOT NULL, -- 'wallet_creation', etc.
  operation_status VARCHAR(50), -- 'pending', 'processing', 'completed', 'failed'
  
  -- Related entities
  guardian_wallet_id VARCHAR(100),
  related_test_id UUID REFERENCES guardian_api_tests(id),
  
  -- Guardian response data
  operation_result JSONB,
  operation_error JSONB,
  
  -- Timeline tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Tracking metadata
  check_count INTEGER DEFAULT 0,
  notes TEXT
);

-- Indexes for better performance
CREATE INDEX idx_guardian_api_tests_test_type ON guardian_api_tests(test_type);
CREATE INDEX idx_guardian_api_tests_created_at ON guardian_api_tests(created_at);
CREATE INDEX idx_guardian_api_tests_guardian_wallet_id ON guardian_api_tests(guardian_wallet_id);
CREATE INDEX idx_guardian_api_tests_guardian_operation_id ON guardian_api_tests(guardian_operation_id);

CREATE INDEX idx_guardian_wallets_guardian_wallet_id ON guardian_wallets(guardian_wallet_id);
CREATE INDEX idx_guardian_wallets_status ON guardian_wallets(wallet_status);
CREATE INDEX idx_guardian_wallets_requested_at ON guardian_wallets(requested_at);

CREATE INDEX idx_guardian_operations_operation_id ON guardian_operations(operation_id);
CREATE INDEX idx_guardian_operations_status ON guardian_operations(operation_status);
CREATE INDEX idx_guardian_operations_wallet_id ON guardian_operations(guardian_wallet_id);

-- RLS (Row Level Security) policies
ALTER TABLE guardian_api_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardian_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardian_operations ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (adjust as needed)
CREATE POLICY guardian_api_tests_policy ON guardian_api_tests FOR ALL USING (true);
CREATE POLICY guardian_wallets_policy ON guardian_wallets FOR ALL USING (true);
CREATE POLICY guardian_operations_policy ON guardian_operations FOR ALL USING (true);

-- Comments for documentation
COMMENT ON TABLE guardian_api_tests IS 'Records of all Guardian API requests and responses for testing purposes';
COMMENT ON TABLE guardian_wallets IS 'Tracks Guardian wallets through their lifecycle from creation to completion';
COMMENT ON TABLE guardian_operations IS 'Tracks Guardian operations and their status changes over time';

COMMENT ON COLUMN guardian_api_tests.test_type IS 'Type of test: create_wallet, get_wallet, get_operation, list_wallets, complete_flow';
COMMENT ON COLUMN guardian_api_tests.guardian_wallet_id IS 'The UUID we send to Guardian for wallet creation';
COMMENT ON COLUMN guardian_api_tests.guardian_operation_id IS 'Operation ID returned by Guardian for async operations';

COMMENT ON COLUMN guardian_wallets.guardian_wallet_id IS 'The UUID we sent to Guardian (our identifier)';
COMMENT ON COLUMN guardian_wallets.guardian_internal_id IS 'Guardian internal wallet ID if different from our UUID';
COMMENT ON COLUMN guardian_wallets.wallet_addresses IS 'JSON array of wallet addresses from Guardian';

COMMENT ON COLUMN guardian_operations.operation_id IS 'Guardian operation ID for tracking async operations';
COMMENT ON COLUMN guardian_operations.operation_type IS 'Type of operation being tracked';
