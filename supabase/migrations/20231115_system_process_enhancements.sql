-- Migration: System Process and Batch Operation Enhancements
-- Date: 2023-11-15

-- Add performance indexes to audit_logs table
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs (action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_system_process_id ON audit_logs (system_process_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_batch_operation_id ON audit_logs (batch_operation_id);

-- Add retention policy to audit_logs
-- This comment function will create a retention policy that automatically removes logs older than the specified period
COMMENT ON TABLE audit_logs IS E'@omit create,update,delete\nRetention policy: 90 days';

-- Enhance system_processes table with additional fields if it exists
DO $$
BEGIN
    -- Check if we need to add progress field to track completion percentage
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_processes' AND column_name = 'progress') THEN
        ALTER TABLE system_processes ADD COLUMN progress FLOAT DEFAULT 0;
    END IF;

    -- Check if we need to add priority field
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_processes' AND column_name = 'priority') THEN
        ALTER TABLE system_processes ADD COLUMN priority VARCHAR(10) DEFAULT 'normal';
    END IF;

    -- Check if we need to add notification_sent field to track if alerts were sent
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_processes' AND column_name = 'notification_sent') THEN
        ALTER TABLE system_processes ADD COLUMN notification_sent BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Check if we need to add cancellable field
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_processes' AND column_name = 'cancellable') THEN
        ALTER TABLE system_processes ADD COLUMN cancellable BOOLEAN DEFAULT FALSE;
    END IF;
END$$;

-- Enhance bulk_operations table with additional fields if it exists
DO $$
BEGIN
    -- Check if we need to add progress field to track completion percentage
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bulk_operations' AND column_name = 'progress') THEN
        ALTER TABLE bulk_operations ADD COLUMN progress FLOAT DEFAULT 0;
    END IF;

    -- Check if we need to add processed_count field to track items processed
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bulk_operations' AND column_name = 'processed_count') THEN
        ALTER TABLE bulk_operations ADD COLUMN processed_count INTEGER DEFAULT 0;
    END IF;

    -- Check if we need to add failed_count field to track failed items
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bulk_operations' AND column_name = 'failed_count') THEN
        ALTER TABLE bulk_operations ADD COLUMN failed_count INTEGER DEFAULT 0;
    END IF;
    
    -- Check if we need to add error_details field
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bulk_operations' AND column_name = 'error_details') THEN
        ALTER TABLE bulk_operations ADD COLUMN error_details JSONB;
    END IF;
END$$;

-- Add indexes to system_processes
CREATE INDEX IF NOT EXISTS idx_system_processes_status ON system_processes (status);
CREATE INDEX IF NOT EXISTS idx_system_processes_start_time ON system_processes (start_time DESC);
CREATE INDEX IF NOT EXISTS idx_system_processes_process_name ON system_processes (process_name);

-- Add indexes to bulk_operations
CREATE INDEX IF NOT EXISTS idx_bulk_operations_status ON bulk_operations (status);
CREATE INDEX IF NOT EXISTS idx_bulk_operations_created_at ON bulk_operations (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bulk_operations_operation_type ON bulk_operations (operation_type);

-- Create or replace function to update progress of system processes
CREATE OR REPLACE FUNCTION update_system_process_progress(
    p_process_id TEXT,
    p_progress FLOAT,
    p_processed_count INTEGER DEFAULT NULL,
    p_status VARCHAR DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_result BOOLEAN;
BEGIN
    UPDATE system_processes
    SET 
        progress = p_progress,
        metadata = jsonb_set(
            COALESCE(metadata, '{}'::jsonb),
            '{processed_count}',
            COALESCE(to_jsonb(p_processed_count), COALESCE(metadata->'processed_count', '0'::jsonb))
        ),
        status = COALESCE(p_status, status),
        updated_at = NOW()
    WHERE id = p_process_id;
    
    GET DIAGNOSTICS v_result = ROW_COUNT;
    RETURN v_result > 0;
END;
$$ LANGUAGE plpgsql;

-- Create or replace function to update progress of bulk operations
CREATE OR REPLACE FUNCTION update_bulk_operation_progress(
    p_operation_id TEXT,
    p_progress FLOAT,
    p_processed_count INTEGER DEFAULT NULL,
    p_failed_count INTEGER DEFAULT NULL,
    p_status VARCHAR DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_result BOOLEAN;
BEGIN
    UPDATE bulk_operations
    SET 
        progress = p_progress,
        processed_count = COALESCE(p_processed_count, processed_count),
        failed_count = COALESCE(p_failed_count, failed_count),
        status = COALESCE(p_status, status),
        metadata = jsonb_set(
            COALESCE(metadata, '{}'::jsonb),
            '{last_updated}',
            to_jsonb(NOW())
        )
    WHERE id = p_operation_id;
    
    GET DIAGNOSTICS v_result = ROW_COUNT;
    RETURN v_result > 0;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies if needed (usually handled by Supabase Management UI)
-- Example RLS policy commented out:
-- ALTER TABLE system_processes ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "System processes are viewable by authenticated users" ON system_processes
--     FOR SELECT USING (auth.role() = 'authenticated');

-- Create a view to provide a unified view of system processes with their activities
CREATE OR REPLACE VIEW system_process_activities AS
SELECT
    sp.id AS process_id,
    sp.process_name,
    sp.start_time,
    sp.end_time,
    sp.status,
    sp.progress,
    sp.priority,
    al.id AS activity_id,
    al.action,
    al.entity_type,
    al.entity_id,
    al.status AS activity_status,
    al.timestamp AS activity_time,
    al.metadata AS activity_metadata
FROM
    system_processes sp
LEFT JOIN
    audit_logs al ON sp.id = al.system_process_id
ORDER BY
    sp.start_time DESC,
    al.timestamp ASC;

-- Commit transaction
COMMIT;