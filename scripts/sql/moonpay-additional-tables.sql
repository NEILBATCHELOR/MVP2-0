-- MoonPay Additional Tables
-- Tables for webhook configuration, compliance alerts, and policy logs
-- Created: 2025-06-12

-- ===== MOONPAY WEBHOOK CONFIG TABLE =====
-- Stores webhook configuration and management settings
CREATE TABLE IF NOT EXISTS moonpay_webhook_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id TEXT UNIQUE,
    url TEXT NOT NULL,
    environment TEXT NOT NULL CHECK (environment IN ('sandbox', 'production')) DEFAULT 'sandbox',
    events TEXT[] NOT NULL DEFAULT '{}',
    status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'suspended', 'failed')) DEFAULT 'active',
    version TEXT DEFAULT 'v1',
    secret_key TEXT,
    description TEXT,
    retry_policy JSONB DEFAULT '{
        "max_attempts": 3,
        "backoff_strategy": "exponential",
        "initial_delay": 1000,
        "max_delay": 30000,
        "timeout": 30000
    }'::jsonb,
    headers JSONB DEFAULT '{}'::jsonb,
    delivery_settings JSONB DEFAULT '{
        "enabled": true,
        "verify_ssl": true,
        "timeout": 30
    }'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    last_delivery_attempt TIMESTAMPTZ,
    last_successful_delivery TIMESTAMPTZ,
    last_failure_reason TEXT,
    delivery_attempts_count INTEGER DEFAULT 0,
    successful_deliveries_count INTEGER DEFAULT 0,
    failed_deliveries_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== MOONPAY COMPLIANCE ALERTS TABLE =====
-- Stores compliance monitoring alerts and violations
CREATE TABLE IF NOT EXISTS moonpay_compliance_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id TEXT UNIQUE,
    alert_type TEXT NOT NULL CHECK (alert_type IN (
        'aml_screening', 'sanctions_check', 'pep_screening', 'transaction_monitoring',
        'kyc_verification', 'suspicious_activity', 'risk_threshold', 'policy_violation',
        'document_verification', 'identity_verification', 'address_verification'
    )),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    status TEXT NOT NULL CHECK (status IN ('open', 'in_review', 'resolved', 'dismissed', 'escalated')) DEFAULT 'open',
    customer_id TEXT,
    transaction_id TEXT,
    entity_type TEXT CHECK (entity_type IN ('customer', 'transaction', 'policy', 'system')),
    entity_id TEXT,
    risk_score NUMERIC CHECK (risk_score >= 0 AND risk_score <= 100),
    risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'extreme')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    screening_results JSONB DEFAULT '{}'::jsonb,
    recommended_actions TEXT[],
    assigned_to TEXT,
    reviewed_by TEXT,
    resolved_by TEXT,
    escalated_to TEXT,
    resolution_notes TEXT,
    auto_generated BOOLEAN DEFAULT false,
    source TEXT DEFAULT 'moonpay_api',
    external_reference TEXT,
    related_alerts TEXT[],
    metadata JSONB DEFAULT '{}'::jsonb,
    triggered_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    escalated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== MOONPAY POLICY LOGS TABLE =====
-- Stores policy execution, violations, and audit trail
CREATE TABLE IF NOT EXISTS moonpay_policy_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    log_id TEXT UNIQUE,
    policy_id TEXT NOT NULL,
    policy_name TEXT NOT NULL,
    policy_type TEXT NOT NULL CHECK (policy_type IN (
        'kyc_policy', 'transaction_limit', 'risk_assessment', 'compliance_rule',
        'aml_policy', 'sanctions_policy', 'geographic_restriction', 'customer_verification'
    )),
    action_type TEXT NOT NULL CHECK (action_type IN (
        'policy_created', 'policy_updated', 'policy_deleted', 'policy_activated', 'policy_deactivated',
        'rule_triggered', 'rule_passed', 'rule_failed', 'violation_detected', 'exception_granted',
        'review_initiated', 'review_completed', 'approval_required', 'approval_granted', 'approval_denied'
    )),
    execution_status TEXT NOT NULL CHECK (execution_status IN ('success', 'failure', 'warning', 'skipped')) DEFAULT 'success',
    entity_type TEXT CHECK (entity_type IN ('customer', 'transaction', 'policy', 'rule', 'system')),
    entity_id TEXT,
    customer_id TEXT,
    transaction_id TEXT,
    rule_conditions JSONB DEFAULT '{}'::jsonb,
    rule_results JSONB DEFAULT '{}'::jsonb,
    violation_details JSONB DEFAULT '{}'::jsonb,
    before_state JSONB DEFAULT '{}'::jsonb,
    after_state JSONB DEFAULT '{}'::jsonb,
    triggered_by TEXT,
    executed_by TEXT,
    approved_by TEXT,
    reason TEXT,
    notes TEXT,
    severity TEXT CHECK (severity IN ('info', 'warning', 'error', 'critical')) DEFAULT 'info',
    compliance_impact TEXT CHECK (compliance_impact IN ('none', 'low', 'medium', 'high', 'critical')),
    requires_action BOOLEAN DEFAULT false,
    action_taken TEXT,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date TIMESTAMPTZ,
    retention_period_days INTEGER DEFAULT 2555, -- 7 years for compliance
    auto_generated BOOLEAN DEFAULT false,
    source TEXT DEFAULT 'moonpay_policy_engine',
    correlation_id TEXT,
    session_id TEXT,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    executed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== INDEXES FOR PERFORMANCE =====

-- Webhook config indexes
CREATE INDEX IF NOT EXISTS idx_moonpay_webhook_config_webhook_id ON moonpay_webhook_config(webhook_id);
CREATE INDEX IF NOT EXISTS idx_moonpay_webhook_config_status ON moonpay_webhook_config(status);
CREATE INDEX IF NOT EXISTS idx_moonpay_webhook_config_environment ON moonpay_webhook_config(environment);
CREATE INDEX IF NOT EXISTS idx_moonpay_webhook_config_events ON moonpay_webhook_config USING GIN(events);
CREATE INDEX IF NOT EXISTS idx_moonpay_webhook_config_created_at ON moonpay_webhook_config(created_at);

-- Compliance alerts indexes
CREATE INDEX IF NOT EXISTS idx_moonpay_compliance_alerts_alert_id ON moonpay_compliance_alerts(alert_id);
CREATE INDEX IF NOT EXISTS idx_moonpay_compliance_alerts_type ON moonpay_compliance_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_moonpay_compliance_alerts_severity ON moonpay_compliance_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_moonpay_compliance_alerts_status ON moonpay_compliance_alerts(status);
CREATE INDEX IF NOT EXISTS idx_moonpay_compliance_alerts_customer_id ON moonpay_compliance_alerts(customer_id);
CREATE INDEX IF NOT EXISTS idx_moonpay_compliance_alerts_transaction_id ON moonpay_compliance_alerts(transaction_id);
CREATE INDEX IF NOT EXISTS idx_moonpay_compliance_alerts_risk_level ON moonpay_compliance_alerts(risk_level);
CREATE INDEX IF NOT EXISTS idx_moonpay_compliance_alerts_triggered_at ON moonpay_compliance_alerts(triggered_at);
CREATE INDEX IF NOT EXISTS idx_moonpay_compliance_alerts_assigned_to ON moonpay_compliance_alerts(assigned_to);
CREATE INDEX IF NOT EXISTS idx_moonpay_compliance_alerts_entity ON moonpay_compliance_alerts(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_moonpay_compliance_alerts_details ON moonpay_compliance_alerts USING GIN(details);

-- Policy logs indexes
CREATE INDEX IF NOT EXISTS idx_moonpay_policy_logs_log_id ON moonpay_policy_logs(log_id);
CREATE INDEX IF NOT EXISTS idx_moonpay_policy_logs_policy_id ON moonpay_policy_logs(policy_id);
CREATE INDEX IF NOT EXISTS idx_moonpay_policy_logs_policy_type ON moonpay_policy_logs(policy_type);
CREATE INDEX IF NOT EXISTS idx_moonpay_policy_logs_action_type ON moonpay_policy_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_moonpay_policy_logs_execution_status ON moonpay_policy_logs(execution_status);
CREATE INDEX IF NOT EXISTS idx_moonpay_policy_logs_customer_id ON moonpay_policy_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_moonpay_policy_logs_transaction_id ON moonpay_policy_logs(transaction_id);
CREATE INDEX IF NOT EXISTS idx_moonpay_policy_logs_severity ON moonpay_policy_logs(severity);
CREATE INDEX IF NOT EXISTS idx_moonpay_policy_logs_executed_at ON moonpay_policy_logs(executed_at);
CREATE INDEX IF NOT EXISTS idx_moonpay_policy_logs_entity ON moonpay_policy_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_moonpay_policy_logs_correlation_id ON moonpay_policy_logs(correlation_id);
CREATE INDEX IF NOT EXISTS idx_moonpay_policy_logs_requires_action ON moonpay_policy_logs(requires_action);
CREATE INDEX IF NOT EXISTS idx_moonpay_policy_logs_metadata ON moonpay_policy_logs USING GIN(metadata);

-- ===== ROW LEVEL SECURITY (RLS) =====

-- Enable RLS on all tables
ALTER TABLE moonpay_webhook_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE moonpay_compliance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE moonpay_policy_logs ENABLE ROW LEVEL SECURITY;

-- ===== TRIGGERS FOR UPDATED_AT =====

-- Apply triggers to update updated_at timestamp
CREATE TRIGGER update_moonpay_webhook_config_updated_at 
    BEFORE UPDATE ON moonpay_webhook_config 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_moonpay_compliance_alerts_updated_at 
    BEFORE UPDATE ON moonpay_compliance_alerts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_moonpay_policy_logs_updated_at 
    BEFORE UPDATE ON moonpay_policy_logs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== ADDITIONAL CONSTRAINTS =====

-- Webhook config constraints
ALTER TABLE moonpay_webhook_config 
ADD CONSTRAINT chk_moonpay_webhook_config_url_format 
CHECK (url ~* '^https?://');

ALTER TABLE moonpay_webhook_config 
ADD CONSTRAINT chk_moonpay_webhook_config_events_not_empty 
CHECK (array_length(events, 1) > 0);

-- Compliance alerts constraints
ALTER TABLE moonpay_compliance_alerts 
ADD CONSTRAINT chk_moonpay_compliance_alerts_risk_score_range 
CHECK (risk_score IS NULL OR (risk_score >= 0 AND risk_score <= 100));

ALTER TABLE moonpay_compliance_alerts 
ADD CONSTRAINT chk_moonpay_compliance_alerts_resolved_logic 
CHECK (
    (status = 'resolved' AND resolved_at IS NOT NULL AND resolved_by IS NOT NULL) OR
    (status != 'resolved')
);

-- Policy logs constraints
ALTER TABLE moonpay_policy_logs 
ADD CONSTRAINT chk_moonpay_policy_logs_retention_period 
CHECK (retention_period_days > 0 AND retention_period_days <= 3650); -- Max 10 years

-- ===== CLEANUP FUNCTIONS =====

-- Function to clean up old policy logs based on retention period
CREATE OR REPLACE FUNCTION cleanup_old_moonpay_policy_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM moonpay_policy_logs 
    WHERE created_at < NOW() - (retention_period_days * INTERVAL '1 day');
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to archive resolved compliance alerts older than 1 year
CREATE OR REPLACE FUNCTION archive_old_moonpay_compliance_alerts()
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    -- This could move old alerts to an archive table or mark them as archived
    UPDATE moonpay_compliance_alerts 
    SET metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{archived}',
        'true'::jsonb
    )
    WHERE status = 'resolved' 
    AND resolved_at < NOW() - INTERVAL '1 year'
    AND NOT COALESCE((metadata->>'archived')::boolean, false);
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get webhook config statistics
CREATE OR REPLACE FUNCTION get_moonpay_webhook_stats()
RETURNS TABLE(
    total_webhooks BIGINT,
    active_webhooks BIGINT,
    failed_webhooks BIGINT,
    avg_success_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_webhooks,
        COUNT(*) FILTER (WHERE status = 'active') as active_webhooks,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_webhooks,
        CASE 
            WHEN SUM(delivery_attempts_count) > 0 THEN
                ROUND(
                    (SUM(successful_deliveries_count)::NUMERIC / SUM(delivery_attempts_count)) * 100,
                    2
                )
            ELSE 0
        END as avg_success_rate
    FROM moonpay_webhook_config;
END;
$$ LANGUAGE plpgsql;

-- ===== COMMENTS FOR DOCUMENTATION =====

COMMENT ON TABLE moonpay_webhook_config IS 'Configuration and management of MoonPay webhooks including delivery settings, retry policies, and monitoring';
COMMENT ON TABLE moonpay_compliance_alerts IS 'Compliance monitoring alerts including AML screening, sanctions checking, and policy violations';
COMMENT ON TABLE moonpay_policy_logs IS 'Audit trail of policy execution, violations, and compliance actions with retention management';

COMMENT ON COLUMN moonpay_webhook_config.retry_policy IS 'JSON configuration for webhook delivery retry logic including backoff strategy and limits';
COMMENT ON COLUMN moonpay_webhook_config.delivery_settings IS 'JSON configuration for webhook delivery including SSL verification and timeout settings';
COMMENT ON COLUMN moonpay_compliance_alerts.screening_results IS 'JSON results from AML/sanctions/PEP screening processes';
COMMENT ON COLUMN moonpay_compliance_alerts.recommended_actions IS 'Array of recommended actions to address the compliance alert';
COMMENT ON COLUMN moonpay_policy_logs.retention_period_days IS 'Number of days to retain this log entry for compliance purposes (default 7 years)';
COMMENT ON COLUMN moonpay_policy_logs.correlation_id IS 'Unique identifier to correlate related policy actions across multiple logs';
