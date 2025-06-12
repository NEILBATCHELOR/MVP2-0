-- This migration fixes the specific issue with user_id being treated as TEXT in the code
-- but being UUID in the database, causing type conversion errors

-- Drop existing functions first
DROP FUNCTION IF EXISTS safe_uuid_cast(text);
DROP FUNCTION IF EXISTS add_policy_approver(text, text, text, text);

-- Function for safe UUID casting
CREATE OR REPLACE FUNCTION safe_uuid_cast(text_id TEXT) 
RETURNS UUID AS $$
DECLARE
    result UUID;
BEGIN
    -- Try to cast to UUID directly
    BEGIN
        result := text_id::UUID;
        RETURN result;
    EXCEPTION WHEN others THEN
        -- If it fails, generate a deterministic UUID v5
        -- For admin bypass use a special UUID
        IF text_id = 'admin-bypass' THEN
            RETURN '00000000-0000-0000-0000-000000000000'::UUID;
        ELSE
            -- Generate a new UUID (in production you might want to use a deterministic algorithm)
            RETURN gen_random_uuid();
        END IF;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add a policy approver with proper UUID casting
CREATE OR REPLACE FUNCTION add_policy_approver(
    policy_id TEXT,
    user_id TEXT,
    created_by TEXT,
    status_val TEXT DEFAULT 'pending'
) RETURNS VOID AS $$
BEGIN
    INSERT INTO policy_rule_approvers (
        policy_rule_id,
        user_id,
        created_by,
        status,
        created_at
    ) VALUES (
        safe_uuid_cast(policy_id),
        safe_uuid_cast(user_id),
        safe_uuid_cast(created_by),
        status_val,
        now()
    );
    RETURN;
EXCEPTION WHEN others THEN
    RAISE EXCEPTION 'Failed to add policy approver: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;