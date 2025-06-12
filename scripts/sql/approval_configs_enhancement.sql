-- Migration: Enhanced Approval Configs Schema
-- Purpose: Expand approval_configs to properly reference users and user_roles for displaying configured approvers
-- Date: June 10, 2025

BEGIN;

-- ========================================
-- STEP 1: Create approval_config_approvers junction table
-- ========================================

CREATE TABLE IF NOT EXISTS approval_config_approvers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    approval_config_id uuid NOT NULL REFERENCES approval_configs(id) ON DELETE CASCADE,
    approver_type text NOT NULL CHECK (approver_type IN ('user', 'role')),
    approver_user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    approver_role_id uuid REFERENCES roles(id) ON DELETE CASCADE,
    is_required boolean DEFAULT true,
    order_priority integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES users(id),
    
    -- Ensure either user_id or role_id is set, but not both
    CONSTRAINT check_approver_reference CHECK (
        (approver_type = 'user' AND approver_user_id IS NOT NULL AND approver_role_id IS NULL) OR
        (approver_type = 'role' AND approver_role_id IS NOT NULL AND approver_user_id IS NULL)
    ),
    
    -- Prevent duplicate approvers for same config
    CONSTRAINT unique_config_user_approver UNIQUE (approval_config_id, approver_user_id),
    CONSTRAINT unique_config_role_approver UNIQUE (approval_config_id, approver_role_id)
);

-- Add indexes for performance
CREATE INDEX idx_approval_config_approvers_config_id ON approval_config_approvers(approval_config_id);
CREATE INDEX idx_approval_config_approvers_user_id ON approval_config_approvers(approver_user_id);
CREATE INDEX idx_approval_config_approvers_role_id ON approval_config_approvers(approver_role_id);
CREATE INDEX idx_approval_config_approvers_type ON approval_config_approvers(approver_type);

-- ========================================
-- STEP 2: Enhance approval_configs table with new fields
-- ========================================

-- Add new columns to approval_configs
ALTER TABLE approval_configs 
    ADD COLUMN IF NOT EXISTS config_name text,
    ADD COLUMN IF NOT EXISTS config_description text,
    ADD COLUMN IF NOT EXISTS approval_mode text DEFAULT 'mixed' CHECK (approval_mode IN ('role_based', 'user_specific', 'mixed')),
    ADD COLUMN IF NOT EXISTS requires_all_approvers boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS auto_approve_threshold integer DEFAULT 0,
    ADD COLUMN IF NOT EXISTS escalation_config jsonb,
    ADD COLUMN IF NOT EXISTS notification_config jsonb,
    ADD COLUMN IF NOT EXISTS active boolean DEFAULT true,
    ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS last_modified_by uuid REFERENCES users(id);

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_approval_configs_approval_mode ON approval_configs(approval_mode);
CREATE INDEX IF NOT EXISTS idx_approval_configs_active ON approval_configs(active);
CREATE INDEX IF NOT EXISTS idx_approval_configs_created_by ON approval_configs(created_by);

-- ========================================
-- STEP 3: Create approval_config_history table for audit trail
-- ========================================

CREATE TABLE IF NOT EXISTS approval_config_history (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    approval_config_id uuid NOT NULL REFERENCES approval_configs(id) ON DELETE CASCADE,
    change_type text NOT NULL CHECK (change_type IN ('created', 'updated', 'deleted', 'approver_added', 'approver_removed')),
    old_data jsonb,
    new_data jsonb,
    changed_by uuid REFERENCES users(id),
    change_reason text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX idx_approval_config_history_config_id ON approval_config_history(approval_config_id);
CREATE INDEX idx_approval_config_history_changed_by ON approval_config_history(changed_by);
CREATE INDEX idx_approval_config_history_created_at ON approval_config_history(created_at);

-- ========================================
-- STEP 4: Create redemption_approver_assignments table
-- ========================================

CREATE TABLE IF NOT EXISTS redemption_approver_assignments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    redemption_request_id uuid NOT NULL, -- References redemption_requests(id)
    approval_config_id uuid NOT NULL REFERENCES approval_configs(id),
    approver_user_id uuid NOT NULL REFERENCES users(id),
    assigned_at timestamp with time zone DEFAULT now(),
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'recused')),
    approval_timestamp timestamp with time zone,
    rejection_reason text,
    comments text,
    approval_signature text,
    ip_address inet,
    user_agent text,
    
    -- Prevent duplicate assignments
    CONSTRAINT unique_redemption_approver UNIQUE (redemption_request_id, approver_user_id)
);

CREATE INDEX idx_redemption_approver_assignments_request_id ON redemption_approver_assignments(redemption_request_id);
CREATE INDEX idx_redemption_approver_assignments_approver_id ON redemption_approver_assignments(approver_user_id);
CREATE INDEX idx_redemption_approver_assignments_status ON redemption_approver_assignments(status);
CREATE INDEX idx_redemption_approver_assignments_config_id ON redemption_approver_assignments(approval_config_id);

-- ========================================
-- STEP 5: Create views for easy querying
-- ========================================

-- View to get approval configs with their configured approvers
CREATE OR REPLACE VIEW approval_configs_with_approvers AS
SELECT 
    ac.id,
    ac.permission_id,
    ac.config_name,
    ac.config_description,
    ac.approval_mode,
    ac.required_approvals,
    ac.requires_all_approvers,
    ac.consensus_type,
    ac.eligible_roles,
    ac.auto_approval_conditions,
    ac.auto_approve_threshold,
    ac.escalation_config,
    ac.notification_config,
    ac.active,
    ac.created_at,
    ac.updated_at,
    ac.created_by,
    ac.last_modified_by,
    
    -- Aggregate approver information
    COALESCE(
        JSON_AGG(
            CASE 
                WHEN aca.approver_type = 'user' THEN
                    JSON_BUILD_OBJECT(
                        'type', 'user',
                        'id', aca.approver_user_id,
                        'name', u.name,
                        'email', u.email,
                        'is_required', aca.is_required,
                        'order_priority', aca.order_priority
                    )
                WHEN aca.approver_type = 'role' THEN
                    JSON_BUILD_OBJECT(
                        'type', 'role',
                        'id', aca.approver_role_id,
                        'name', r.name,
                        'description', r.description,
                        'is_required', aca.is_required,
                        'order_priority', aca.order_priority
                    )
                ELSE NULL
            END
            ORDER BY aca.order_priority, aca.created_at
        ) FILTER (WHERE aca.id IS NOT NULL),
        '[]'::json
    ) AS configured_approvers,
    
    -- Count of configured approvers
    COUNT(aca.id) AS approver_count
    
FROM approval_configs ac
LEFT JOIN approval_config_approvers aca ON ac.id = aca.approval_config_id
LEFT JOIN users u ON aca.approver_user_id = u.id
LEFT JOIN roles r ON aca.approver_role_id = r.id
GROUP BY 
    ac.id, ac.permission_id, ac.config_name, ac.config_description, 
    ac.approval_mode, ac.required_approvals, ac.requires_all_approvers,
    ac.consensus_type, ac.eligible_roles, ac.auto_approval_conditions,
    ac.auto_approve_threshold, ac.escalation_config, ac.notification_config,
    ac.active, ac.created_at, ac.updated_at, ac.created_by, ac.last_modified_by;

-- View to get redemption approvals with assignment details
CREATE OR REPLACE VIEW redemption_approval_status AS
SELECT 
    raa.redemption_request_id,
    raa.approval_config_id,
    ac.config_name,
    ac.required_approvals,
    ac.consensus_type,
    
    -- Approval status summary
    COUNT(raa.id) AS total_assigned_approvers,
    COUNT(CASE WHEN raa.status = 'approved' THEN 1 END) AS approved_count,
    COUNT(CASE WHEN raa.status = 'rejected' THEN 1 END) AS rejected_count,
    COUNT(CASE WHEN raa.status = 'pending' THEN 1 END) AS pending_count,
    
    -- Overall status determination
    CASE
        WHEN COUNT(CASE WHEN raa.status = 'rejected' THEN 1 END) > 0 THEN 'rejected'
        WHEN ac.consensus_type = 'all' AND COUNT(CASE WHEN raa.status = 'approved' THEN 1 END) = COUNT(raa.id) THEN 'approved'
        WHEN ac.consensus_type = 'majority' AND COUNT(CASE WHEN raa.status = 'approved' THEN 1 END) > (COUNT(raa.id) / 2) THEN 'approved'
        WHEN ac.consensus_type = 'any' AND COUNT(CASE WHEN raa.status = 'approved' THEN 1 END) > 0 THEN 'approved'
        WHEN COUNT(CASE WHEN raa.status = 'approved' THEN 1 END) >= ac.required_approvals THEN 'approved'
        ELSE 'pending'
    END AS overall_status,
    
    -- Approver details
    JSON_AGG(
        JSON_BUILD_OBJECT(
            'user_id', raa.approver_user_id,
            'user_name', u.name,
            'user_email', u.email,
            'status', raa.status,
            'approval_timestamp', raa.approval_timestamp,
            'comments', raa.comments,
            'assigned_at', raa.assigned_at
        )
        ORDER BY raa.assigned_at
    ) AS approver_details
    
FROM redemption_approver_assignments raa
JOIN approval_configs ac ON raa.approval_config_id = ac.id
JOIN users u ON raa.approver_user_id = u.id
GROUP BY 
    raa.redemption_request_id, raa.approval_config_id, 
    ac.config_name, ac.required_approvals, ac.consensus_type;

-- ========================================
-- STEP 6: Create helper functions
-- ========================================

-- Function to get users by role for approval configuration
CREATE OR REPLACE FUNCTION get_users_by_role_for_approval(role_names text[])
RETURNS TABLE (
    user_id uuid,
    user_name text,
    user_email text,
    role_name text,
    role_id uuid
) 
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        r.name as role_name,
        r.id as role_id
    FROM users u
    JOIN user_roles ur ON u.id = ur.user_id
    JOIN roles r ON ur.role_id = r.id
    WHERE r.name = ANY(role_names)
      AND u.status IS DISTINCT FROM 'inactive'
    ORDER BY u.name;
END;
$$;

-- Function to assign approvers to a redemption request based on approval config
CREATE OR REPLACE FUNCTION assign_redemption_approvers(
    p_redemption_request_id uuid,
    p_approval_config_id uuid
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    approver_record RECORD;
    user_record RECORD;
BEGIN
    -- Clear any existing assignments for this redemption request
    DELETE FROM redemption_approver_assignments 
    WHERE redemption_request_id = p_redemption_request_id;
    
    -- Insert approver assignments based on approval config
    FOR approver_record IN 
        SELECT * FROM approval_config_approvers 
        WHERE approval_config_id = p_approval_config_id
    LOOP
        IF approver_record.approver_type = 'user' THEN
            -- Direct user assignment
            INSERT INTO redemption_approver_assignments (
                redemption_request_id,
                approval_config_id,
                approver_user_id
            ) VALUES (
                p_redemption_request_id,
                p_approval_config_id,
                approver_record.approver_user_id
            );
        ELSIF approver_record.approver_type = 'role' THEN
            -- Assign all users with this role
            FOR user_record IN
                SELECT u.id
                FROM users u
                JOIN user_roles ur ON u.id = ur.user_id
                WHERE ur.role_id = approver_record.approver_role_id
                  AND u.status IS DISTINCT FROM 'inactive'
            LOOP
                INSERT INTO redemption_approver_assignments (
                    redemption_request_id,
                    approval_config_id,
                    approver_user_id
                ) VALUES (
                    p_redemption_request_id,
                    p_approval_config_id,
                    user_record.id
                ) ON CONFLICT (redemption_request_id, approver_user_id) DO NOTHING;
            END LOOP;
        END IF;
    END LOOP;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error assigning redemption approvers: %', SQLERRM;
        RETURN FALSE;
END;
$$;

-- ========================================
-- STEP 7: Create triggers for audit trail
-- ========================================

-- Trigger function for approval config changes
CREATE OR REPLACE FUNCTION log_approval_config_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO approval_config_history (
            approval_config_id,
            change_type,
            new_data,
            changed_by
        ) VALUES (
            NEW.id,
            'created',
            to_jsonb(NEW),
            NEW.created_by
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO approval_config_history (
            approval_config_id,
            change_type,
            old_data,
            new_data,
            changed_by
        ) VALUES (
            NEW.id,
            'updated',
            to_jsonb(OLD),
            to_jsonb(NEW),
            NEW.last_modified_by
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO approval_config_history (
            approval_config_id,
            change_type,
            old_data,
            changed_by
        ) VALUES (
            OLD.id,
            'deleted',
            to_jsonb(OLD),
            NULL
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS approval_config_audit_trigger ON approval_configs;
CREATE TRIGGER approval_config_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON approval_configs
    FOR EACH ROW EXECUTE FUNCTION log_approval_config_changes();

-- Trigger for approver assignments audit
CREATE OR REPLACE FUNCTION log_approver_assignment_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO approval_config_history (
            approval_config_id,
            change_type,
            new_data,
            changed_by
        ) VALUES (
            NEW.approval_config_id,
            'approver_added',
            jsonb_build_object(
                'approver_type', NEW.approver_type,
                'approver_user_id', NEW.approver_user_id,
                'approver_role_id', NEW.approver_role_id
            ),
            NEW.created_by
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO approval_config_history (
            approval_config_id,
            change_type,
            old_data,
            changed_by
        ) VALUES (
            OLD.approval_config_id,
            'approver_removed',
            jsonb_build_object(
                'approver_type', OLD.approver_type,
                'approver_user_id', OLD.approver_user_id,
                'approver_role_id', OLD.approver_role_id
            ),
            NULL
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS approval_config_approvers_audit_trigger ON approval_config_approvers;
CREATE TRIGGER approval_config_approvers_audit_trigger
    AFTER INSERT OR DELETE ON approval_config_approvers
    FOR EACH ROW EXECUTE FUNCTION log_approver_assignment_changes();

-- ========================================
-- STEP 8: Create updated_at triggers
-- ========================================

DROP TRIGGER IF EXISTS update_approval_configs_updated_at ON approval_configs;
CREATE TRIGGER update_approval_configs_updated_at
    BEFORE UPDATE ON approval_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_approval_config_approvers_updated_at ON approval_config_approvers;
CREATE TRIGGER update_approval_config_approvers_updated_at
    BEFORE UPDATE ON approval_config_approvers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- STEP 9: Insert default redemption approval config
-- ========================================

-- Insert a default redemption approval configuration
INSERT INTO approval_configs (
    id,
    permission_id,
    config_name,
    config_description,
    approval_mode,
    required_approvals,
    eligible_roles,
    consensus_type,
    requires_all_approvers,
    auto_approval_conditions,
    active,
    created_at,
    updated_at
) VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
    'Default Redemption Approval Config',
    'Default approval configuration for all redemption requests',
    'mixed',
    1,
    ARRAY['compliance_officer', 'compliance_manager', 'admin', 'owner'],
    'any',
    false,
    '{}'::jsonb,
    true,
    now(),
    now()
) ON CONFLICT (id) DO UPDATE SET
    config_name = EXCLUDED.config_name,
    config_description = EXCLUDED.config_description,
    approval_mode = EXCLUDED.approval_mode,
    updated_at = now();

-- ========================================
-- STEP 10: Add comments for documentation
-- ========================================

COMMENT ON TABLE approval_config_approvers IS 'Junction table linking approval configs to specific users or roles as approvers';
COMMENT ON TABLE approval_config_history IS 'Audit trail for changes to approval configurations';
COMMENT ON TABLE redemption_approver_assignments IS 'Tracks approver assignments and their status for specific redemption requests';

COMMENT ON COLUMN approval_configs.approval_mode IS 'Determines if config uses role-based, user-specific, or mixed approver assignment';
COMMENT ON COLUMN approval_configs.requires_all_approvers IS 'If true, ALL configured approvers must approve; overrides consensus_type';
COMMENT ON COLUMN approval_configs.auto_approve_threshold IS 'Automatic approval if request amount is below this threshold';

COMMENT ON VIEW approval_configs_with_approvers IS 'Consolidated view of approval configs with their configured approvers';
COMMENT ON VIEW redemption_approval_status IS 'Real-time status of redemption request approvals';

-- Commit the migration
COMMIT;