-- Migration for Phase 5: Enhancing audit_logs and adding comprehensive audit triggers
-- Date: July 1, 2024

-- Verify that audit_logs table has all required fields
-- (The query shows that most of these already exist, but we'll ensure they're all present)
DO $$
BEGIN
    -- Add system_process_id if doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'audit_logs' AND column_name = 'system_process_id') THEN
        ALTER TABLE audit_logs ADD COLUMN system_process_id UUID REFERENCES system_processes(id);
    END IF;

    -- Add batch_operation_id if doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'audit_logs' AND column_name = 'batch_operation_id') THEN
        ALTER TABLE audit_logs ADD COLUMN batch_operation_id UUID REFERENCES bulk_operations(id);
    END IF;

    -- Add severity if doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'audit_logs' AND column_name = 'severity') THEN
        ALTER TABLE audit_logs ADD COLUMN severity TEXT;
    END IF;

    -- Add duration if doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'audit_logs' AND column_name = 'duration') THEN
        ALTER TABLE audit_logs ADD COLUMN duration INTEGER;
    END IF;

    -- Add source if doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'audit_logs' AND column_name = 'source') THEN
        ALTER TABLE audit_logs ADD COLUMN source TEXT;
    END IF;
END $$;

-- Create indexes for the fields we just verified/added
CREATE INDEX IF NOT EXISTS idx_audit_logs_system_process_id ON audit_logs(system_process_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_batch_operation_id ON audit_logs(batch_operation_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_source ON audit_logs(source);

-- Create a function to log audit events
CREATE OR REPLACE FUNCTION log_table_change()
RETURNS TRIGGER AS $$
DECLARE
    record_data JSONB;
    old_data JSONB;
    new_data JSONB;
    change_data JSONB;
    action_type TEXT;
    entity_type TEXT;
    entity_id TEXT;
    action_name TEXT;
BEGIN
    -- Set the entity_type based on the table name
    entity_type := TG_TABLE_NAME;
    
    -- Determine action type
    IF (TG_OP = 'INSERT') THEN
        action_type := 'create';
        action_name := 'create_' || entity_type;
        new_data := row_to_json(NEW)::JSONB;
        old_data := NULL;
        change_data := new_data;
        
        -- Try to get the entity ID from the record
        IF new_data ? 'id' THEN
            entity_id := new_data->>'id';
        ELSE
            entity_id := NULL;
        END IF;
    ELSIF (TG_OP = 'UPDATE') THEN
        action_type := 'update';
        action_name := 'update_' || entity_type;
        old_data := row_to_json(OLD)::JSONB;
        new_data := row_to_json(NEW)::JSONB;
        
        -- Calculate changes between old and new data
        SELECT jsonb_object_agg(key, value) INTO change_data
        FROM jsonb_each(new_data) 
        WHERE new_data->key IS DISTINCT FROM old_data->key;
        
        -- Try to get the entity ID from the record
        IF new_data ? 'id' THEN
            entity_id := new_data->>'id';
        ELSE
            entity_id := NULL;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        action_type := 'delete';
        action_name := 'delete_' || entity_type;
        old_data := row_to_json(OLD)::JSONB;
        new_data := NULL;
        change_data := old_data;
        
        -- Try to get the entity ID from the record
        IF old_data ? 'id' THEN
            entity_id := old_data->>'id';
        ELSE
            entity_id := NULL;
        END IF;
    END IF;
    
    -- Insert into audit_logs
    INSERT INTO audit_logs (
        id,
        timestamp,
        action,
        action_type,
        entity_type,
        entity_id,
        old_data,
        new_data,
        changes,
        status,
        source,
        severity
    ) VALUES (
        uuid_generate_v4(),
        NOW(),
        action_name,
        action_type,
        entity_type,
        entity_id,
        old_data,
        new_data,
        change_data,
        'success', -- Default status
        'database_trigger', -- Source is database trigger
        'info' -- Default severity
    );
    
    RETURN NULL; -- For AFTER triggers
END;
$$ LANGUAGE plpgsql;

-- Function to create audit triggers for a table
CREATE OR REPLACE FUNCTION create_audit_trigger(target_table TEXT)
RETURNS VOID AS $$
DECLARE
    trigger_name TEXT;
BEGIN
    trigger_name := target_table || '_audit_trigger';
    
    -- Drop the trigger if it exists
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', trigger_name, target_table);
    
    -- Create the new trigger
    EXECUTE format('
        CREATE TRIGGER %I
        AFTER INSERT OR UPDATE OR DELETE ON %I
        FOR EACH ROW EXECUTE FUNCTION log_table_change()
    ', trigger_name, target_table);
END;
$$ LANGUAGE plpgsql;

-- List of tables to add audit triggers to
DO $$
DECLARE
    table_list TEXT[] := ARRAY[
        'approval_configs',
        'approval_requests',
        'auth_events',
        'bulk_operations',
        'cap_table_investors',
        'cap_tables',
        'compliance_checks',
        'compliance_reports',
        'compliance_settings',
        'consensus_settings',
        'distribution_redemptions',
        'document_approvals',
        'document_versions',
        'document_workflows',
        'documents',
        'faucet_requests',
        'investor_group_members',
        'investor_groups',
        'investor_groups_investors',
        'invoices',
        'issuer_access_roles',
        'issuer_detail_documents',
        'issuer_documents',
        'kyc_screening_logs',
        'mfa_policies',
        'multi_sig_confirmations',
        'multi_sig_transactions',
        'multi_sig_wallets',
        'notifications',
        'onboarding_restrictions',
        'organizations',
        'permissions',
        'policy_rule_approvers',
        'policy_rule_approvers_backup',
        'policy_template_approvers',
        'redemption_approvers',
        'redemption_rules',
        'role_permissions',
        'roles',
        'security_events',
        'signatures',
        'stage_requirements',
        'system_processes',
        'system_settings',
        'token_deployments',
        'token_designs',
        'token_templates',
        'token_versions',
        'transaction_events',
        'transaction_notifications',
        'transaction_proposals',
        'transaction_signatures',
        'user_mfa_settings',
        'user_roles',
        'user_sessions',
        'users',
        'wallet_details',
        'wallet_transactions',
        'whitelist_settings',
        'whitelist_signatories',
        'workflow_stages'
    ];
    t TEXT;
BEGIN
    -- Skip creating audit triggers for the audit_logs table itself
    -- Create triggers for each table if it exists
    FOREACH t IN ARRAY table_list
    LOOP
        -- Check if the table exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t AND table_schema = 'public') THEN
            -- Skip if the table already has an audit trigger
            IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = t || '_audit_trigger' AND event_object_table = t) THEN
                PERFORM create_audit_trigger(t);
                RAISE NOTICE 'Created audit trigger for table: %', t;
            ELSE
                RAISE NOTICE 'Audit trigger already exists for table: %', t;
            END IF;
        ELSE
            RAISE NOTICE 'Skipping non-existent table: %', t;
        END IF;
    END LOOP;
END $$;

-- Create a view to see audit coverage
CREATE OR REPLACE VIEW audit_coverage AS
SELECT 
    t.table_name,
    CASE WHEN tr.trigger_name IS NOT NULL THEN true ELSE false END AS has_audit_trigger
FROM 
    information_schema.tables t
LEFT JOIN 
    information_schema.triggers tr ON t.table_name = tr.event_object_table AND tr.trigger_name = t.table_name || '_audit_trigger'
WHERE 
    t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
ORDER BY 
    t.table_name;

-- Create a function to add system process monitoring
CREATE OR REPLACE FUNCTION track_system_process(
    process_name TEXT,
    description TEXT DEFAULT NULL,
    metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    process_id UUID;
BEGIN
    -- Create a new system process record
    INSERT INTO system_processes (
        id,
        process_name,
        description,
        status,
        start_time,
        metadata
    ) VALUES (
        uuid_generate_v4(),
        process_name,
        description,
        'running',
        NOW(),
        metadata
    ) RETURNING id INTO process_id;
    
    -- Return the created process ID
    RETURN process_id;
END;
$$ LANGUAGE plpgsql;

-- Create a function to update system process status
CREATE OR REPLACE FUNCTION update_system_process_status(
    process_id UUID,
    new_status TEXT,
    error_details TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    updated_rows INTEGER;
BEGIN
    -- Update the system process status
    UPDATE system_processes
    SET 
        status = new_status,
        end_time = CASE WHEN new_status IN ('completed', 'failed', 'cancelled') THEN NOW() ELSE end_time END,
        error_details = CASE WHEN new_status = 'failed' THEN error_details ELSE NULL END
    WHERE 
        id = process_id
    RETURNING 1 INTO updated_rows;
    
    -- Return true if the update was successful
    RETURN updated_rows = 1;
END;
$$ LANGUAGE plpgsql;

-- Create a materialized view for activity metrics that can be refreshed periodically
CREATE MATERIALIZED VIEW IF NOT EXISTS activity_metrics AS
SELECT
    date_trunc('day', timestamp)::date AS day,
    action_type,
    entity_type,
    source,
    severity,
    status,
    COUNT(*) AS count
FROM
    audit_logs
WHERE
    timestamp >= NOW() - INTERVAL '30 days'
GROUP BY
    date_trunc('day', timestamp)::date,
    action_type,
    entity_type,
    source,
    severity,
    status;

-- Create indexes on the materialized view
CREATE INDEX IF NOT EXISTS idx_activity_metrics_day ON activity_metrics(day);
CREATE INDEX IF NOT EXISTS idx_activity_metrics_action_type ON activity_metrics(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_metrics_entity_type ON activity_metrics(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_metrics_source ON activity_metrics(source);
CREATE INDEX IF NOT EXISTS idx_activity_metrics_severity ON activity_metrics(severity);
CREATE INDEX IF NOT EXISTS idx_activity_metrics_status ON activity_metrics(status);

-- Create a function to refresh the activity metrics
CREATE OR REPLACE FUNCTION refresh_activity_metrics()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW activity_metrics;
END;
$$ LANGUAGE plpgsql;

-- Create a schedule to refresh the activity metrics once a day
-- Note: This requires pg_cron extension, which might not be available in all environments
-- If pg_cron is not available, this can be done through application code
DO $$
BEGIN
    -- Check if pg_cron extension is available
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        -- Schedule the refresh job
        PERFORM cron.schedule('0 0 * * *', 'SELECT refresh_activity_metrics()');
    ELSE
        RAISE NOTICE 'pg_cron extension not available. Please schedule the refresh through application code.';
    END IF;
END $$;

-- Create a view for system process performance
CREATE OR REPLACE VIEW system_process_performance AS
SELECT
    sp.process_name,
    COUNT(*) AS total_executions,
    AVG(EXTRACT(EPOCH FROM (sp.end_time - sp.start_time))) AS avg_duration_seconds,
    MIN(EXTRACT(EPOCH FROM (sp.end_time - sp.start_time))) AS min_duration_seconds,
    MAX(EXTRACT(EPOCH FROM (sp.end_time - sp.start_time))) AS max_duration_seconds,
    COUNT(CASE WHEN sp.status = 'completed' THEN 1 END) AS successful_executions,
    COUNT(CASE WHEN sp.status = 'failed' THEN 1 END) AS failed_executions,
    ROUND(COUNT(CASE WHEN sp.status = 'completed' THEN 1 END)::numeric / COUNT(*) * 100, 2) AS success_rate
FROM
    system_processes sp
WHERE
    sp.end_time IS NOT NULL
GROUP BY
    sp.process_name
ORDER BY
    total_executions DESC;

-- Comment on the tables and views
COMMENT ON TABLE audit_logs IS 'Stores audit logs for all activities in the system';
COMMENT ON TABLE system_processes IS 'Tracks system processes and their execution status';
COMMENT ON TABLE bulk_operations IS 'Tracks bulk operations performed in the system';
COMMENT ON VIEW audit_coverage IS 'Shows which tables have audit triggers configured';
COMMENT ON MATERIALIZED VIEW activity_metrics IS 'Aggregated activity metrics for the last 30 days';
COMMENT ON VIEW system_process_performance IS 'Performance metrics for system processes'; 