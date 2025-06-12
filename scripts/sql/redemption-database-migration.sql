-- Redemption System Database Migration
-- Creates settlement, NAV, and interval fund window tables
-- Compatible with existing Supabase schema

-- =====================================================
-- SETTLEMENT SYSTEM TABLES
-- =====================================================

-- Settlement requests and processing
CREATE TABLE IF NOT EXISTS redemption_settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    redemption_request_id UUID NOT NULL REFERENCES redemption_requests(id) ON DELETE CASCADE,
    settlement_type TEXT NOT NULL CHECK (settlement_type IN ('standard', 'interval_fund', 'emergency')),
    status TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated', 'burning_tokens', 'transferring_funds', 'confirming', 'completed', 'failed', 'cancelled')),
    
    -- Token burning details
    token_contract_address TEXT NOT NULL,
    token_amount DECIMAL(78, 18) NOT NULL,
    burn_transaction_hash TEXT,
    burn_gas_used BIGINT,
    burn_gas_price DECIMAL(78, 18),
    burn_status TEXT DEFAULT 'pending' CHECK (burn_status IN ('pending', 'confirmed', 'failed')),
    burn_confirmed_at TIMESTAMP WITH TIME ZONE,
    
    -- Fund transfer details
    transfer_amount DECIMAL(78, 18) NOT NULL,
    transfer_currency TEXT NOT NULL DEFAULT 'USDC',
    transfer_to_address TEXT NOT NULL,
    transfer_transaction_hash TEXT,
    transfer_gas_used BIGINT,
    transfer_gas_price DECIMAL(78, 18),
    transfer_status TEXT DEFAULT 'pending' CHECK (transfer_status IN ('pending', 'confirmed', 'failed')),
    transfer_confirmed_at TIMESTAMP WITH TIME ZONE,
    
    -- Settlement metadata
    nav_used DECIMAL(18, 6),
    exchange_rate DECIMAL(18, 6),
    settlement_fee DECIMAL(78, 18) DEFAULT 0,
    gas_estimate DECIMAL(78, 18),
    estimated_completion TIMESTAMP WITH TIME ZONE,
    actual_completion TIMESTAMP WITH TIME ZONE,
    
    -- Error handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    last_retry_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Constraints
    CONSTRAINT positive_token_amount CHECK (token_amount > 0),
    CONSTRAINT positive_transfer_amount CHECK (transfer_amount > 0),
    CONSTRAINT valid_retry_count CHECK (retry_count >= 0)
);

-- Settlement metrics and analytics
CREATE TABLE IF NOT EXISTS settlement_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    total_settlements INTEGER DEFAULT 0,
    successful_settlements INTEGER DEFAULT 0,
    failed_settlements INTEGER DEFAULT 0,
    average_processing_time INTERVAL,
    total_tokens_burned DECIMAL(78, 18) DEFAULT 0,
    total_funds_transferred DECIMAL(78, 18) DEFAULT 0,
    total_gas_used DECIMAL(78, 18) DEFAULT 0,
    total_fees_collected DECIMAL(78, 18) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one record per date
    UNIQUE(date)
);

-- =====================================================
-- NAV MANAGEMENT TABLES
-- =====================================================

-- Net Asset Value historical data
CREATE TABLE IF NOT EXISTS fund_nav_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fund_id UUID NOT NULL, -- References tokenized fund
    date DATE NOT NULL,
    nav DECIMAL(18, 6) NOT NULL,
    
    -- NAV calculation components
    total_assets DECIMAL(78, 18) NOT NULL,
    total_liabilities DECIMAL(78, 18) NOT NULL DEFAULT 0,
    outstanding_shares DECIMAL(78, 18) NOT NULL,
    
    -- Previous comparison
    previous_nav DECIMAL(18, 6),
    change_amount DECIMAL(18, 6),
    change_percent DECIMAL(8, 4),
    
    -- Data source and validation
    source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'oracle', 'calculated', 'administrator')),
    validated BOOLEAN DEFAULT FALSE,
    validated_by UUID REFERENCES auth.users(id),
    validated_at TIMESTAMP WITH TIME ZONE,
    
    -- Additional metadata
    notes TEXT,
    calculation_method TEXT,
    market_conditions TEXT,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Constraints
    CONSTRAINT positive_nav CHECK (nav > 0),
    CONSTRAINT positive_assets CHECK (total_assets > 0),
    CONSTRAINT non_negative_liabilities CHECK (total_liabilities >= 0),
    CONSTRAINT positive_shares CHECK (outstanding_shares > 0),
    CONSTRAINT unique_fund_date UNIQUE(fund_id, date)
);

-- Oracle configurations for NAV data feeds
CREATE TABLE IF NOT EXISTS nav_oracle_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fund_id UUID NOT NULL,
    name TEXT NOT NULL,
    
    -- Oracle connection details
    oracle_type TEXT NOT NULL CHECK (oracle_type IN ('chainlink', 'api3', 'custom_api', 'manual')),
    endpoint_url TEXT,
    api_key_encrypted TEXT,
    
    -- Data parsing configuration
    response_path TEXT, -- JSON path to NAV value
    update_frequency INTEGER DEFAULT 3600, -- seconds
    last_update TIMESTAMP WITH TIME ZONE,
    
    -- Validation settings
    min_nav DECIMAL(18, 6),
    max_nav DECIMAL(18, 6),
    max_change_percent DECIMAL(8, 4) DEFAULT 10.0, -- Maximum daily change %
    
    -- Status and reliability
    active BOOLEAN DEFAULT TRUE,
    success_rate DECIMAL(5, 2) DEFAULT 0.0,
    last_error TEXT,
    consecutive_failures INTEGER DEFAULT 0,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Constraints
    CONSTRAINT positive_frequency CHECK (update_frequency > 0),
    CONSTRAINT valid_success_rate CHECK (success_rate >= 0 AND success_rate <= 100),
    CONSTRAINT valid_change_limit CHECK (max_change_percent > 0)
);

-- =====================================================
-- INTERVAL FUND WINDOW TABLES
-- =====================================================

-- Redemption window configurations (templates)
CREATE TABLE IF NOT EXISTS redemption_window_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    fund_id UUID NOT NULL,
    
    -- Window timing configuration
    frequency TEXT NOT NULL CHECK (frequency IN ('monthly', 'quarterly', 'semi_annually', 'annually')),
    submission_window_days INTEGER NOT NULL DEFAULT 14,
    lock_up_period INTEGER NOT NULL DEFAULT 90, -- days
    
    -- Redemption limits
    max_redemption_percentage DECIMAL(5, 2), -- % of fund
    enable_pro_rata_distribution BOOLEAN DEFAULT TRUE,
    queue_unprocessed_requests BOOLEAN DEFAULT TRUE,
    
    -- NAV and pricing
    use_window_nav BOOLEAN DEFAULT TRUE,
    lock_tokens_on_request BOOLEAN DEFAULT TRUE,
    
    -- Administrative controls
    enable_admin_override BOOLEAN DEFAULT FALSE,
    notification_days INTEGER DEFAULT 7,
    auto_process BOOLEAN DEFAULT FALSE,
    
    -- Status
    active BOOLEAN DEFAULT TRUE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Constraints
    CONSTRAINT positive_submission_days CHECK (submission_window_days > 0),
    CONSTRAINT positive_lockup CHECK (lock_up_period >= 0),
    CONSTRAINT valid_redemption_limit CHECK (max_redemption_percentage IS NULL OR (max_redemption_percentage > 0 AND max_redemption_percentage <= 100))
);

-- Specific redemption window instances
CREATE TABLE IF NOT EXISTS redemption_windows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_id UUID NOT NULL REFERENCES redemption_window_configs(id) ON DELETE CASCADE,
    
    -- Window dates
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    submission_start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    submission_end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- NAV for this window
    nav DECIMAL(18, 6),
    nav_date DATE,
    nav_source TEXT CHECK (nav_source IN ('manual', 'oracle', 'calculated')),
    
    -- Window status and metrics
    status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'submission_open', 'submission_closed', 'processing', 'completed', 'cancelled')),
    max_redemption_amount DECIMAL(78, 18),
    current_requests INTEGER DEFAULT 0,
    total_request_value DECIMAL(78, 18) DEFAULT 0,
    
    -- Processing results
    approved_requests INTEGER DEFAULT 0,
    approved_value DECIMAL(78, 18) DEFAULT 0,
    rejected_requests INTEGER DEFAULT 0,
    rejected_value DECIMAL(78, 18) DEFAULT 0,
    queued_requests INTEGER DEFAULT 0,
    queued_value DECIMAL(78, 18) DEFAULT 0,
    
    -- Administrative
    processed_by UUID REFERENCES auth.users(id),
    processed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Constraints
    CONSTRAINT valid_window_dates CHECK (end_date > start_date),
    CONSTRAINT valid_submission_dates CHECK (submission_end_date > submission_start_date),
    CONSTRAINT positive_nav CHECK (nav IS NULL OR nav > 0)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Settlement indexes
CREATE INDEX IF NOT EXISTS idx_redemption_settlements_request_id ON redemption_settlements(redemption_request_id);
CREATE INDEX IF NOT EXISTS idx_redemption_settlements_status ON redemption_settlements(status);
CREATE INDEX IF NOT EXISTS idx_redemption_settlements_created_at ON redemption_settlements(created_at);
CREATE INDEX IF NOT EXISTS idx_redemption_settlements_burn_status ON redemption_settlements(burn_status);
CREATE INDEX IF NOT EXISTS idx_redemption_settlements_transfer_status ON redemption_settlements(transfer_status);

-- NAV indexes
CREATE INDEX IF NOT EXISTS idx_fund_nav_data_fund_date ON fund_nav_data(fund_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_fund_nav_data_validated ON fund_nav_data(validated, date DESC);
CREATE INDEX IF NOT EXISTS idx_nav_oracle_configs_fund_id ON nav_oracle_configs(fund_id);
CREATE INDEX IF NOT EXISTS idx_nav_oracle_configs_active ON nav_oracle_configs(active);

-- Window indexes
CREATE INDEX IF NOT EXISTS idx_redemption_windows_config_id ON redemption_windows(config_id);
CREATE INDEX IF NOT EXISTS idx_redemption_windows_status ON redemption_windows(status);
CREATE INDEX IF NOT EXISTS idx_redemption_windows_dates ON redemption_windows(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_redemption_window_configs_fund_id ON redemption_window_configs(fund_id);
CREATE INDEX IF NOT EXISTS idx_redemption_window_configs_active ON redemption_window_configs(active);

-- Settlement metrics index
CREATE INDEX IF NOT EXISTS idx_settlement_metrics_date ON settlement_metrics(date DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE redemption_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlement_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE fund_nav_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE nav_oracle_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemption_window_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemption_windows ENABLE ROW LEVEL SECURITY;

-- Settlement policies (authenticated users can view, admins can modify)
CREATE POLICY "Users can view settlements"
ON redemption_settlements FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert settlements"
ON redemption_settlements FOR INSERT
WITH CHECK (auth.jwt()->>'role' = 'admin');

CREATE POLICY "Admins can update settlements"
ON redemption_settlements FOR UPDATE
USING (auth.jwt()->>'role' = 'admin');

-- NAV data policies
CREATE POLICY "Users can view NAV data"
ON fund_nav_data FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage NAV data"
ON fund_nav_data FOR ALL
USING (auth.jwt()->>'role' = 'admin');

-- Oracle config policies (admin only)
CREATE POLICY "Admins can manage oracle configs"
ON nav_oracle_configs FOR ALL
USING (auth.jwt()->>'role' = 'admin');

-- Window policies
CREATE POLICY "Users can view redemption windows"
ON redemption_windows FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage redemption windows"
ON redemption_windows FOR ALL
USING (auth.jwt()->>'role' = 'admin');

CREATE POLICY "Admins can manage window configs"
ON redemption_window_configs FOR ALL
USING (auth.jwt()->>'role' = 'admin');

-- Metrics policies (read-only for most users)
CREATE POLICY "Users can view settlement metrics"
ON settlement_metrics FOR SELECT
USING (auth.role() = 'authenticated');

-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert sample NAV data
INSERT INTO fund_nav_data (fund_id, date, nav, total_assets, total_liabilities, outstanding_shares, source, validated, notes)
VALUES 
    ('00000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '1 day', 100.50, 10050000, 50000, 100000, 'manual', true, 'Daily NAV calculation'),
    ('00000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '2 days', 100.25, 10025000, 50000, 100000, 'oracle', true, 'Oracle-based NAV'),
    ('00000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '3 days', 99.98, 9998000, 50000, 100000, 'calculated', true, 'Calculated NAV')
ON CONFLICT (fund_id, date) DO NOTHING;

-- Insert sample window configuration
INSERT INTO redemption_window_configs (name, fund_id, frequency, submission_window_days, lock_up_period, max_redemption_percentage, enable_pro_rata_distribution)
VALUES 
    ('Monthly Redemption Window', '00000000-0000-0000-0000-000000000001', 'monthly', 7, 30, 10.0, true),
    ('Quarterly Redemption Window', '00000000-0000-0000-0000-000000000001', 'quarterly', 14, 90, 25.0, true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update settlement status and timestamps
CREATE OR REPLACE FUNCTION update_settlement_status()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    
    -- Auto-complete settlement when both burn and transfer are confirmed
    IF NEW.burn_status = 'confirmed' AND NEW.transfer_status = 'confirmed' AND NEW.status != 'completed' THEN
        NEW.status = 'completed';
        NEW.actual_completion = NOW();
    END IF;
    
    -- Mark as failed if either operation fails
    IF (NEW.burn_status = 'failed' OR NEW.transfer_status = 'failed') AND NEW.status != 'failed' THEN
        NEW.status = 'failed';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for settlement status updates
CREATE TRIGGER trigger_update_settlement_status
    BEFORE UPDATE ON redemption_settlements
    FOR EACH ROW
    EXECUTE FUNCTION update_settlement_status();

-- Function to update NAV change calculations
CREATE OR REPLACE FUNCTION calculate_nav_change()
RETURNS TRIGGER AS $$
DECLARE
    prev_nav DECIMAL(18, 6);
BEGIN
    -- Get previous NAV for the same fund
    SELECT nav INTO prev_nav
    FROM fund_nav_data
    WHERE fund_id = NEW.fund_id 
    AND date < NEW.date
    ORDER BY date DESC
    LIMIT 1;
    
    IF prev_nav IS NOT NULL THEN
        NEW.previous_nav = prev_nav;
        NEW.change_amount = NEW.nav - prev_nav;
        NEW.change_percent = ((NEW.nav - prev_nav) / prev_nav) * 100;
    END IF;
    
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for NAV change calculations
CREATE TRIGGER trigger_calculate_nav_change
    BEFORE INSERT OR UPDATE ON fund_nav_data
    FOR EACH ROW
    EXECUTE FUNCTION calculate_nav_change();

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- Settlement summary view
CREATE OR REPLACE VIEW settlement_summary AS
SELECT 
    rs.id,
    rs.redemption_request_id,
    rs.settlement_type,
    rs.status,
    rs.token_amount,
    rs.transfer_amount,
    rs.nav_used,
    rs.created_at,
    rs.actual_completion,
    COALESCE(rs.actual_completion, rs.estimated_completion) as completion_time,
    CASE 
        WHEN rs.actual_completion IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (rs.actual_completion - rs.created_at)) 
        ELSE NULL 
    END as processing_time_seconds
FROM redemption_settlements rs;

-- Latest NAV view
CREATE OR REPLACE VIEW latest_nav_by_fund AS
SELECT DISTINCT ON (fund_id)
    fund_id,
    date,
    nav,
    change_amount,
    change_percent,
    source,
    validated,
    created_at
FROM fund_nav_data
ORDER BY fund_id, date DESC;

-- Active redemption windows view
CREATE OR REPLACE VIEW active_redemption_windows AS
SELECT 
    rw.*,
    rwc.name as config_name,
    rwc.frequency,
    rwc.enable_pro_rata_distribution
FROM redemption_windows rw
JOIN redemption_window_configs rwc ON rw.config_id = rwc.id
WHERE rw.status IN ('upcoming', 'submission_open', 'submission_closed', 'processing')
ORDER BY rw.start_date;

COMMENT ON TABLE redemption_settlements IS 'Tracks settlement processing for redemption requests including token burning and fund transfers';
COMMENT ON TABLE fund_nav_data IS 'Historical Net Asset Value data for tokenized funds with validation workflow';
COMMENT ON TABLE redemption_windows IS 'Specific instances of redemption windows for interval funds';
COMMENT ON TABLE redemption_window_configs IS 'Configuration templates for redemption window creation';
COMMENT ON TABLE nav_oracle_configs IS 'Oracle configurations for automated NAV data feeds';
COMMENT ON TABLE settlement_metrics IS 'Daily aggregated metrics for settlement processing performance';
