-- Migration to update audit_logs table with standardized fields for activity types

-- Add additional columns to audit_logs table
ALTER TABLE audit_logs
    -- New standardized columns
    ADD COLUMN IF NOT EXISTS category VARCHAR,       -- Activity category
    ADD COLUMN IF NOT EXISTS severity VARCHAR,       -- Activity severity level
    ADD COLUMN IF NOT EXISTS duration INTEGER,       -- Duration in milliseconds
    ADD COLUMN IF NOT EXISTS parent_id UUID,         -- Parent activity ID for hierarchical activities
    ADD COLUMN IF NOT EXISTS correlation_id VARCHAR, -- Correlation ID for tracing related activities
    ADD COLUMN IF NOT EXISTS session_id VARCHAR,     -- User session ID
    ADD COLUMN IF NOT EXISTS ip_address VARCHAR,     -- IP address
    ADD COLUMN IF NOT EXISTS user_agent VARCHAR,     -- User agent
    ADD COLUMN IF NOT EXISTS api_version VARCHAR,    -- API version
    ADD COLUMN IF NOT EXISTS request_id VARCHAR;     -- Unique request ID

-- Rename columns for better standardization (if needed)
-- Keeping original column names for backward compatibility

-- Add indexes for improved query performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON audit_logs(category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_correlation_id ON audit_logs(correlation_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_parent_id ON audit_logs(parent_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_session_id ON audit_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);

-- Create function to extract severity from metadata if not already present
CREATE OR REPLACE FUNCTION extract_severity_from_metadata()
RETURNS TRIGGER AS $$
BEGIN
    -- If severity column is NULL but exists in metadata, extract it
    IF NEW.severity IS NULL AND 
       NEW.metadata IS NOT NULL AND 
       NEW.metadata->>'severity' IS NOT NULL THEN
        NEW.severity := NEW.metadata->>'severity';
    END IF;
    
    -- If category column is NULL but exists in metadata, extract it
    IF NEW.category IS NULL AND 
       NEW.metadata IS NOT NULL AND 
       NEW.metadata->>'category' IS NOT NULL THEN
        NEW.category := NEW.metadata->>'category';
    END IF;
    
    -- If ip_address column is NULL but exists in metadata, extract it
    IF NEW.ip_address IS NULL AND 
       NEW.metadata IS NOT NULL AND 
       NEW.metadata->>'ip_address' IS NOT NULL THEN
        NEW.ip_address := NEW.metadata->>'ip_address';
    END IF;
    
    -- If user_agent column is NULL but exists in metadata, extract it
    IF NEW.user_agent IS NULL AND 
       NEW.metadata IS NOT NULL AND 
       NEW.metadata->>'user_agent' IS NOT NULL THEN
        NEW.user_agent := NEW.metadata->>'user_agent';
    END IF;
    
    -- If duration column is NULL but exists in metadata, extract it
    IF NEW.duration IS NULL AND 
       NEW.metadata IS NOT NULL AND 
       NEW.metadata->>'duration' IS NOT NULL THEN
        BEGIN
            NEW.duration := (NEW.metadata->>'duration')::INTEGER;
        EXCEPTION WHEN OTHERS THEN
            -- If conversion fails, leave as NULL
            NEW.duration := NULL;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically extract values from metadata
DROP TRIGGER IF EXISTS extract_metadata_values_trigger ON audit_logs;
CREATE TRIGGER extract_metadata_values_trigger
BEFORE INSERT OR UPDATE ON audit_logs
FOR EACH ROW
EXECUTE FUNCTION extract_severity_from_metadata();

-- Create view for activity analytics that includes standardized fields
CREATE OR REPLACE VIEW activity_analytics AS
SELECT 
    id,
    action,
    action_type as source,
    category,
    severity,
    timestamp,
    user_id,
    user_email,
    entity_type,
    entity_id,
    status,
    duration,
    system_process_id,
    batch_operation_id,
    project_id,
    correlation_id,
    ip_address,
    session_id
FROM 
    audit_logs;

-- Create materialized view for faster reporting queries
CREATE MATERIALIZED VIEW IF NOT EXISTS activity_summary_daily AS
SELECT 
    date_trunc('day', timestamp) as day,
    action_type as source,
    category,
    status,
    severity,
    COUNT(*) as activity_count,
    COUNT(DISTINCT user_id) as unique_users_count,
    AVG(duration) as avg_duration
FROM 
    audit_logs
GROUP BY 
    date_trunc('day', timestamp),
    action_type,
    category,
    status,
    severity;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_activity_summary_daily ON activity_summary_daily(day, source, category);

-- Create view for user activity summary
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT 
    user_id,
    user_email,
    COUNT(*) as total_activities,
    MAX(timestamp) as last_activity,
    COUNT(DISTINCT date_trunc('day', timestamp)) as active_days,
    COUNT(DISTINCT project_id) as projects_accessed,
    COUNT(DISTINCT session_id) as session_count
FROM 
    audit_logs
WHERE 
    user_id IS NOT NULL
GROUP BY 
    user_id, user_email;

-- Create view for system process activity analysis
CREATE OR REPLACE VIEW system_process_activity AS
SELECT 
    sp.id as process_id,
    sp.process_name,
    sp.status as process_status,
    sp.start_time,
    sp.end_time,
    EXTRACT(EPOCH FROM (sp.end_time - sp.start_time)) as duration_seconds,
    COUNT(al.id) as activity_count,
    COUNT(CASE WHEN al.status = 'failure' OR al.status = 'failed' THEN 1 END) as failed_activities
FROM 
    system_processes sp
LEFT JOIN 
    audit_logs al ON sp.id = al.system_process_id
GROUP BY 
    sp.id, sp.process_name, sp.status, sp.start_time, sp.end_time;

-- Function to generate activity hierarchies (for nested activities)
CREATE OR REPLACE FUNCTION get_activity_hierarchy(root_id UUID)
RETURNS TABLE (
    id UUID,
    action VARCHAR,
    activity_timestamp TIMESTAMP WITH TIME ZONE,
    status VARCHAR,
    level INTEGER
) AS $$
WITH RECURSIVE activity_tree AS (
    -- Base case: start with the root activity
    SELECT 
        id, 
        action, 
        timestamp as activity_timestamp, 
        status, 
        0 as level
    FROM 
        audit_logs
    WHERE 
        id = root_id
    
    UNION ALL
    
    -- Recursive case: add child activities
    SELECT 
        a.id, 
        a.action, 
        a.timestamp as activity_timestamp, 
        a.status, 
        at.level + 1
    FROM 
        audit_logs a
    JOIN 
        activity_tree at ON a.parent_id = at.id
)
SELECT * FROM activity_tree ORDER BY level, activity_timestamp;
$$ LANGUAGE SQL; 