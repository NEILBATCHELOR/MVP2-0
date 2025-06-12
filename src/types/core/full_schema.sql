--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 17.5 (Postgres.app)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'Enhanced DFNS RAMP Network Integration - Schema updated on June 11, 2025';


--
-- Name: compliance_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.compliance_status AS ENUM (
    'compliant',
    'non_compliant',
    'pending_review'
);


--
-- Name: document_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.document_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'expired'
);


--
-- Name: document_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.document_type AS ENUM (
    'commercial_register',
    'certificate_incorporation',
    'memorandum_articles',
    'director_list',
    'shareholder_register',
    'financial_statements',
    'regulatory_status',
    'qualification_summary',
    'business_description',
    'organizational_chart',
    'key_people_cv',
    'aml_kyc_description'
);


--
-- Name: issuer_document_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.issuer_document_type AS ENUM (
    'issuer_creditworthiness',
    'project_security_type',
    'offering_details',
    'term_sheet',
    'special_rights',
    'underwriters',
    'use_of_proceeds',
    'financial_highlights',
    'timing',
    'risk_factors'
);


--
-- Name: issuer_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.issuer_role AS ENUM (
    'admin',
    'editor',
    'viewer',
    'compliance_officer'
);


--
-- Name: kyc_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.kyc_status AS ENUM (
    'approved',
    'pending',
    'failed',
    'not_started',
    'expired'
);


--
-- Name: pool_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.pool_type_enum AS ENUM (
    'Total Pool',
    'Tranche'
);


--
-- Name: project_duration; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.project_duration AS ENUM (
    '1_month',
    '3_months',
    '6_months',
    '9_months',
    '12_months',
    'over_12_months'
);


--
-- Name: token_config_mode_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.token_config_mode_enum AS ENUM (
    'min',
    'max',
    'basic',
    'advanced'
);


--
-- Name: token_standard_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.token_standard_enum AS ENUM (
    'ERC-20',
    'ERC-721',
    'ERC-1155',
    'ERC-1400',
    'ERC-3525',
    'ERC-4626'
);


--
-- Name: token_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.token_status_enum AS ENUM (
    'DRAFT',
    'UNDER REVIEW',
    'APPROVED',
    'READY TO MINT',
    'MINTED',
    'DEPLOYED',
    'PAUSED',
    'DISTRIBUTED',
    'REJECTED'
);


--
-- Name: workflow_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.workflow_status AS ENUM (
    'pending',
    'completed',
    'rejected'
);


--
-- Name: add_investors_to_group(text, text[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.add_investors_to_group(p_group_id text, p_investor_ids text[]) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  sync_timestamp timestamp with time zone := NOW();
  v_investor_id text;
BEGIN
  -- Validate input
  IF p_group_id IS NULL THEN
    RAISE EXCEPTION 'Group ID cannot be NULL';
  END IF;

  IF p_investor_ids IS NULL OR array_length(p_investor_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'Investor IDs array cannot be NULL or empty';
  END IF;

  -- Add to the investor_group_members table (old)
  FOREACH v_investor_id IN ARRAY p_investor_ids
  LOOP
    INSERT INTO investor_group_members (group_id, investor_id, created_at)
    VALUES (p_group_id, v_investor_id, sync_timestamp)
    ON CONFLICT (group_id, investor_id) DO NOTHING;
  END LOOP;

  -- Try to add to investor_groups_investors table (new)
  -- This might fail due to RLS but we'll continue anyway
  BEGIN
    FOREACH v_investor_id IN ARRAY p_investor_ids
    LOOP
      INSERT INTO investor_groups_investors (id, group_id, investor_id, created_at)
      VALUES (gen_random_uuid()::text, p_group_id, v_investor_id, sync_timestamp)
      ON CONFLICT (group_id, investor_id) DO NOTHING;
    END LOOP;
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but continue - we at least added to the old table
    RAISE NOTICE 'Error adding to investor_groups_investors: %', SQLERRM;
  END;

  -- Update the group member count
  UPDATE investor_groups
  SET 
    member_count = (SELECT get_unique_member_count(p_group_id)),
    updated_at = sync_timestamp
  WHERE id::text = p_group_id;
END;
$$;


--
-- Name: add_policy_approver(uuid, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.add_policy_approver(p_policy_id uuid, p_user_id text, p_created_by text) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO policy_rule_approvers (policy_rule_id, user_id, created_by, status)
  VALUES (p_policy_id, p_user_id::UUID, p_created_by, 'pending')
  ON CONFLICT (policy_rule_id, user_id) 
  DO UPDATE SET status = 'pending', timestamp = now();
END;
$$;


--
-- Name: add_policy_approver(text, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.add_policy_approver(policy_id text, user_id text, created_by text, status_val text DEFAULT 'pending'::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
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
$$;


--
-- Name: add_policy_approver_with_cast(text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.add_policy_approver_with_cast(policy_id text, user_id text, created_by_id text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- Insert with explicit casting to UUID type
  INSERT INTO policy_rule_approvers (policy_rule_id, user_id, created_by, status)
  VALUES (
    safe_cast_to_uuid(policy_id), 
    safe_cast_to_uuid(user_id), 
    safe_cast_to_uuid(created_by_id),
    'pending'
  )
  ON CONFLICT (policy_rule_id, user_id)
  DO UPDATE SET status = 'pending', timestamp = now();
  
  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error in add_policy_approver_with_cast: %', SQLERRM;
  RETURN false;
END;
$$;


--
-- Name: add_rule_to_approval_queue(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.add_rule_to_approval_queue() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    approver_id uuid;
BEGIN
    -- When a rule is created or updated
    IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND (OLD.status != 'pending_approval' OR OLD.status IS NULL))) THEN
        -- Get approvers from rule_details
        IF NEW.rule_details->'approvers' IS NOT NULL AND jsonb_array_length(NEW.rule_details->'approvers') > 0 THEN
            -- Set status to pending_approval
            NEW.status := 'pending_approval';
            
            -- For each approver, add to policy_rule_approvers
            FOR approver_id IN 
                SELECT (jsonb_array_elements(NEW.rule_details->'approvers')->>'id')::uuid
            LOOP
                INSERT INTO public.policy_rule_approvers
                    (policy_rule_id, user_id, created_by, status)
                VALUES
                    (NEW.rule_id, 
                     approver_id, 
                     NEW.created_by,  -- Now created_by is already UUID
                     'pending')
                ON CONFLICT (policy_rule_id, user_id) 
                DO UPDATE SET status = 'pending', timestamp = now();
            END LOOP;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;


--
-- Name: add_table_to_realtime(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.add_table_to_realtime(table_name text) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- This function is just a placeholder
  -- The actual ALTER PUBLICATION is done in the migration
  RETURN;
END;
$$;


--
-- Name: add_template_to_approval_queue(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.add_template_to_approval_queue() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    approver_id uuid;
BEGIN
    -- When a template is created or updated
    IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND (OLD.status != 'pending_approval' OR OLD.status IS NULL))) THEN
        -- Get approvers from template_data
        IF NEW.template_data->'approvers' IS NOT NULL AND jsonb_array_length(NEW.template_data->'approvers') > 0 THEN
            -- Set status to pending_approval
            NEW.status := 'pending_approval';
            
            -- For each approver, add to policy_template_approvers
            FOR approver_id IN 
                SELECT (jsonb_array_elements(NEW.template_data->'approvers')->>'id')::uuid
            LOOP
                INSERT INTO public.policy_template_approvers
                    (template_id, user_id, created_by, status)
                VALUES
                    (NEW.template_id, 
                     approver_id, 
                     (CASE 
                         WHEN NEW.created_by::text = 'admin-bypass' 
                         THEN 'f3aa3707-c54e-428d-b630-e15088d7b55d'
                         ELSE NEW.created_by::text
                     END)::uuid,
                     'pending')
                ON CONFLICT (template_id, user_id) 
                DO UPDATE SET status = 'pending', timestamp = now();
            END LOOP;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;


--
-- Name: apply_audit_trigger_to_table(text); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.apply_audit_trigger_to_table(IN table_name text)
    LANGUAGE plpgsql
    AS $$
BEGIN
  EXECUTE format('
    DROP TRIGGER IF EXISTS %I_audit_trigger ON %I;
    CREATE TRIGGER %I_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON %I
    FOR EACH ROW EXECUTE FUNCTION log_database_changes();
  ', table_name, table_name, table_name, table_name);
END;
$$;


--
-- Name: archive_old_moonpay_compliance_alerts(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.archive_old_moonpay_compliance_alerts() RETURNS integer
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- Name: assign_redemption_approvers(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.assign_redemption_approvers(p_redemption_request_id uuid, p_approval_config_id uuid) RETURNS boolean
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


--
-- Name: audit_investor_approval_changes(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.audit_investor_approval_changes() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND NEW.status != OLD.status) THEN
        INSERT INTO audit_logs (
            entity_id,
            entity_type,
            action,
            user_id,
            details,
            status,
            created_at
        ) VALUES (
            NEW.id,
            'investor_approval',
            'status_change',
            auth.uid(),
            jsonb_build_object(
                'old_status', OLD.status,
                'new_status', NEW.status,
                'investor_id', NEW.investor_id,
                'approval_type', NEW.approval_type
            ),
            'success',
            now()
        );
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: calculate_nav_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_nav_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- Name: check_all_approvals(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_all_approvals() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    total_approvers INT;
    approved_count INT;
    min_required INT;
    rule_record RECORD;
    template_record RECORD;
BEGIN
    -- Count total approvers for this rule/template
    SELECT COUNT(*) INTO total_approvers 
    FROM policy_rule_approvers 
    WHERE policy_rule_id = NEW.policy_rule_id;
    
    -- Count approved approvers
    SELECT COUNT(*) INTO approved_count 
    FROM policy_rule_approvers 
    WHERE policy_rule_id = NEW.policy_rule_id AND status = 'approved';
    
    -- Check what kind of entity this is
    SELECT * INTO rule_record FROM rules WHERE rule_id = NEW.policy_rule_id;
    IF rule_record IS NOT NULL THEN
        -- It's a rule
        -- Get minimum required approvals if specified in rule details
        IF rule_record.rule_details->'requiredApprovals' IS NOT NULL THEN
            min_required := (rule_record.rule_details->>'requiredApprovals')::int;
        ELSE 
            -- Default to all approvers
            min_required := total_approvers;
        END IF;
        
        -- If enough approvals, update rule status
        IF approved_count >= min_required THEN
            UPDATE rules SET status = 'active' WHERE rule_id = NEW.policy_rule_id;
        END IF;
    ELSE
        -- Check if it's a template
        SELECT * INTO template_record FROM policy_templates WHERE template_id = NEW.policy_rule_id;
        IF template_record IS NOT NULL THEN
            -- It's a template
            -- Get minimum required approvals if specified in template data
            IF template_record.template_data->'requiredApprovals' IS NOT NULL THEN
                min_required := (template_record.template_data->>'requiredApprovals')::int;
            ELSE 
                -- Default to all approvers
                min_required := total_approvers;
            END IF;
            
            -- If enough approvals, update template status
            IF approved_count >= min_required THEN
                UPDATE policy_templates SET status = 'active' WHERE template_id = NEW.policy_rule_id;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;


--
-- Name: check_document_expiry(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_document_expiry() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    IF NEW.expiry_date IS NOT NULL AND NEW.expiry_date <= now() THEN
        UPDATE documents
        SET status = 'expired'
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: check_permission(text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_permission(p_role_name text, p_resource text, p_action text) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_role_id UUID;
  v_permission_id UUID;
  v_has_permission BOOLEAN;
BEGIN
  -- Get the role ID
  SELECT id INTO v_role_id
  FROM roles
  WHERE name = p_role_name;
  
  -- If role doesn't exist, return false
  IF v_role_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get the permission ID
  SELECT id INTO v_permission_id
  FROM permissions
  WHERE resource = p_resource AND action = p_action;
  
  -- If permission doesn't exist, return false
  IF v_permission_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if the role has this permission
  SELECT EXISTS (
    SELECT 1
    FROM role_permissions
    WHERE role_id = v_role_id
      AND permission_id = v_permission_id
      AND effect = 'allow'
  ) INTO v_has_permission;
  
  RETURN v_has_permission;
END;
$$;


--
-- Name: check_role_exists(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_role_exists() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- First check if the role exists directly in the roles table
  IF EXISTS (SELECT 1 FROM roles WHERE name = NEW.role) THEN
    RETURN NEW;
  END IF;
  
  -- If not found directly, try to normalize common role formats
  -- This handles cases like 'Super Admin' vs 'superAdmin' vs 'super_admin'
  DECLARE
    normalized_role TEXT;
  BEGIN
    -- Simple normalization for common patterns
    -- Convert spaces to camelCase
    IF NEW.role LIKE '% %' THEN
      normalized_role := regexp_replace(
        regexp_replace(
          initcap(NEW.role), 
          ' ([A-Za-z])',
          '\1',
          'g'
        ),
        '^([A-Z])',
        lower(substring(NEW.role from 1 for 1)),
        'g'
      );
    -- Convert snake_case to camelCase
    ELSIF NEW.role LIKE '%_%' THEN
      normalized_role := regexp_replace(
        regexp_replace(
          initcap(replace(NEW.role, '_', ' ')), 
          ' ([A-Za-z])',
          '\1',
          'g'
        ),
        '^([A-Z])',
        lower(substring(replace(NEW.role, '_', ' ') from 1 for 1)),
        'g'
      );
    ELSE
      normalized_role := NEW.role;
    END IF;
    
    -- Check if normalized role exists
    IF EXISTS (SELECT 1 FROM roles WHERE name = normalized_role) THEN
      -- Update to the normalized version
      NEW.role := normalized_role;
      RETURN NEW;
    END IF;
    
    -- Last resort: Check for similar roles using pattern matching
    IF EXISTS (SELECT 1 FROM roles WHERE 
               lower(name) LIKE lower(NEW.role) || '%' OR 
               lower(name) LIKE '%' || lower(NEW.role) || '%') THEN
      -- Get the first matching role
      SELECT name INTO normalized_role FROM roles WHERE 
        lower(name) LIKE lower(NEW.role) || '%' OR 
        lower(name) LIKE '%' || lower(NEW.role) || '%'
      LIMIT 1;
      
      -- Update to the matched role
      NEW.role := normalized_role;
      RETURN NEW;
    END IF;
  END;
  
  -- If no existing role could be found or matched, try to add this role to the roles table
  -- This auto-creates missing roles to prevent constraint violations
  INSERT INTO roles (name, description, priority, created_at, updated_at)
  VALUES (
    NEW.role, 
    'Automatically created role from user_roles insert', 
    100, -- default priority
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$;


--
-- Name: check_user_permission(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_user_permission(user_id uuid, permission text) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
  has_permission BOOLEAN := FALSE;
  user_role_name TEXT;
BEGIN
  -- Get user's role
  SELECT r.name INTO user_role_name
  FROM public.user_roles ur
  JOIN public.roles r ON ur.role_id = r.id
  WHERE ur.user_id = check_user_permission.user_id;
  
  -- Super Admin has all permissions
  IF user_role_name = 'Super Admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Check specific permission
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role_id = rp.role_id
    WHERE ur.user_id = check_user_permission.user_id
    AND rp.permission_name = check_user_permission.permission
  ) INTO has_permission;
  
  RETURN has_permission;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in check_user_permission: %', SQLERRM;
    RETURN FALSE;
END;
$$;


--
-- Name: cleanup_expired_asset_cache(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_expired_asset_cache() RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM moonpay_asset_cache WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;


--
-- Name: cleanup_old_moonpay_policy_logs(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_old_moonpay_policy_logs() RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM moonpay_policy_logs 
    WHERE created_at < NOW() - (retention_period_days * INTERVAL '1 day');
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;


--
-- Name: cleanup_old_webhook_events(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_old_webhook_events() RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM moonpay_webhook_events 
    WHERE processed = true 
    AND received_at < NOW() - INTERVAL '30 days';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;


--
-- Name: cleanup_orphaned_policy_approvers(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_orphaned_policy_approvers() RETURNS integer
    LANGUAGE plpgsql
    AS $$
        DECLARE
          deleted_count INTEGER;
        BEGIN
          WITH deleted AS (
            DELETE FROM policy_rule_approvers
            WHERE NOT EXISTS (
              SELECT 1 FROM rules WHERE rule_id = policy_rule_approvers.policy_rule_id
            )
            RETURNING *
          )
          SELECT COUNT(*) INTO deleted_count FROM deleted;
          
          RETURN deleted_count;
        END;
        $$;


--
-- Name: column_exists(text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.column_exists(p_schema_name text, p_table_name text, p_column_name text) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
    DECLARE
      exists boolean;
    BEGIN
      SELECT COUNT(*) > 0 INTO exists
      FROM information_schema.columns
      WHERE table_schema = p_schema_name
      AND table_name = p_table_name
      AND column_name = p_column_name;
      
      RETURN exists;
    END;
    $$;


--
-- Name: create_audit_trigger(text, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_audit_trigger(table_name text, is_high_volume boolean DEFAULT false) RETURNS void
    LANGUAGE plpgsql
    AS $$
    DECLARE
      trigger_name text;
      trigger_condition text;
      has_significance boolean;
      has_importance boolean;
    BEGIN
      trigger_name := 'audit_' || table_name || '_trigger';
      
      -- Check if the table has relevant filtering columns
      has_significance := column_exists('public', table_name, 'is_significant');
      has_importance := column_exists('public', table_name, 'importance');
      
      -- Set up the condition
      IF is_high_volume THEN
        IF has_significance THEN
          trigger_condition := 'WHEN (NEW.is_significant = true OR OLD.is_significant = true)';
        ELSIF has_importance THEN
          trigger_condition := 'WHEN (NEW.importance > 5 OR OLD.importance > 5)';
        ELSE
          trigger_condition := '';
        END IF;
      ELSE
        trigger_condition := '';
      END IF;

      -- Drop the trigger if it exists
      EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_name || ' ON ' || table_name;
      
      -- Create the new trigger
      EXECUTE 'CREATE TRIGGER ' || trigger_name || 
              ' AFTER INSERT OR UPDATE OR DELETE ON ' || table_name || 
              ' FOR EACH ROW ' || trigger_condition || 
              ' EXECUTE FUNCTION log_table_change()';
              
      -- We'll skip logging to avoid circular dependencies
      RAISE NOTICE 'Created audit trigger for %', table_name;
    END;
    $$;


--
-- Name: create_document_version(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_document_version() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND (OLD.file_path != NEW.file_path OR OLD.file_url != NEW.file_url)) THEN
        INSERT INTO document_versions (
            document_id,
            version_number,
            file_path,
            file_url,
            uploaded_by,
            metadata
        ) VALUES (
            NEW.id,
            NEW.version,
            NEW.file_path,
            NEW.file_url,
            NEW.uploaded_by,
            NEW.metadata
        );
        NEW.version = OLD.version + 1;
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: create_project_with_cap_table(jsonb, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_project_with_cap_table(project_data jsonb, cap_table_name text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET statement_timeout TO '60s'
    AS $$
DECLARE
  created_project JSONB;
  project_id UUID;
  duration_value TEXT;
  sub_start_date TEXT;
  sub_end_date TEXT;
  trans_start_date TEXT;
  maturity_date_value TEXT;
BEGIN
  -- Handle the duration field and date fields specially
  duration_value := project_data->>'duration';
  sub_start_date := project_data->>'subscription_start_date';
  sub_end_date := project_data->>'subscription_end_date';
  trans_start_date := project_data->>'transaction_start_date';
  maturity_date_value := project_data->>'maturity_date';
  
  -- Insert the project
  INSERT INTO projects (
    name,
    description,
    project_type,
    token_symbol,
    target_raise,
    authorized_shares,
    share_price,
    company_valuation,
    legal_entity,
    jurisdiction,
    tax_id,
    status,
    is_primary,
    investment_status,
    estimated_yield_percentage,
    duration,
    subscription_start_date,
    subscription_end_date,
    transaction_start_date,
    maturity_date,
    currency,
    minimum_investment,
    total_notional,
    created_at,
    updated_at
  )
  VALUES (
    project_data->>'name',
    project_data->>'description',
    project_data->>'project_type',
    project_data->>'token_symbol',
    (project_data->>'target_raise')::numeric,
    (project_data->>'authorized_shares')::integer,
    (project_data->>'share_price')::numeric,
    (project_data->>'company_valuation')::numeric,
    project_data->>'legal_entity',
    project_data->>'jurisdiction',
    project_data->>'tax_id',
    project_data->>'status',
    (project_data->>'is_primary')::boolean,
    COALESCE(project_data->>'investment_status', 'Open'),
    (project_data->>'estimated_yield_percentage')::numeric,
    CASE
      WHEN duration_value IS NULL OR duration_value = '' THEN NULL
      ELSE duration_value::public.project_duration
    END,
    CASE
      WHEN sub_start_date IS NULL OR sub_start_date = '' THEN NULL
      ELSE sub_start_date::timestamp with time zone
    END,
    CASE
      WHEN sub_end_date IS NULL OR sub_end_date = '' THEN NULL
      ELSE sub_end_date::timestamp with time zone
    END,
    CASE
      WHEN trans_start_date IS NULL OR trans_start_date = '' THEN NULL
      ELSE trans_start_date::timestamp with time zone
    END,
    CASE
      WHEN maturity_date_value IS NULL OR maturity_date_value = '' THEN NULL
      ELSE maturity_date_value::timestamp with time zone
    END,
    COALESCE(project_data->>'currency', 'USD'),
    (project_data->>'minimum_investment')::numeric,
    (project_data->>'total_notional')::numeric,
    COALESCE((project_data->>'created_at')::timestamp with time zone, now()),
    COALESCE((project_data->>'updated_at')::timestamp with time zone, now())
  )
  RETURNING id INTO project_id;

  -- Create a cap table for this project
  INSERT INTO cap_tables (
    project_id,
    name,
    created_at,
    updated_at,
    description
  )
  VALUES (
    project_id,
    cap_table_name,
    COALESCE((project_data->>'created_at')::timestamp with time zone, now()),
    COALESCE((project_data->>'updated_at')::timestamp with time zone, now()),
    NULL
  );

  -- Get the created project to return
  SELECT row_to_json(p)::jsonb INTO created_project
  FROM projects p
  WHERE p.id = project_id;

  RETURN created_project;
END;
$$;


--
-- Name: create_selective_audit_trigger(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_selective_audit_trigger(p_table text, p_condition text DEFAULT NULL::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_trigger_name text;
  v_condition text;
BEGIN
  -- Create simple trigger name
  v_trigger_name := 'audit_' || p_table || '_trigger';
  
  -- Set condition
  IF p_condition IS NULL THEN
    v_condition := '';
  ELSE
    v_condition := ' WHEN ' || p_condition;
  END IF;
  
  -- Drop trigger if exists
  EXECUTE 'DROP TRIGGER IF EXISTS ' || v_trigger_name || ' ON ' || p_table;
  
  -- Create trigger with condition
  EXECUTE 'CREATE TRIGGER ' || v_trigger_name || 
          ' AFTER INSERT OR UPDATE OR DELETE ON ' || p_table || 
          ' FOR EACH ROW' || v_condition || 
          ' EXECUTE FUNCTION log_table_change()';
          
  RAISE NOTICE 'Created selective trigger on high-volume table %', p_table;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating selective trigger for %: %', p_table, SQLERRM;
END;
$$;


--
-- Name: create_token_version(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_token_version() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    last_version INTEGER;
BEGIN
    -- Find the highest version number for this token
    SELECT COALESCE(MAX(version), 0) INTO last_version
    FROM token_versions
    WHERE token_id = NEW.id;

    -- Create a new version record
    INSERT INTO token_versions (
        token_id, 
        version, 
        data, 
        created_at, 
        created_by,
        blocks,
        decimals,
        metadata,
        name,
        standard,
        symbol
    ) VALUES (
        NEW.id,
        last_version + 1,
        to_jsonb(NEW),
        now(),
        current_setting('request.jwt.claims', true)::json->>'sub',
        NEW.blocks,
        NEW.decimals,
        NEW.metadata,
        NEW.name,
        NEW.standard,
        NEW.symbol
    );
    
    RETURN NEW;
END;
$$;


--
-- Name: create_transaction_events_table(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_transaction_events_table() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Table is created in the migration, this is just a placeholder
  -- for the API to call to ensure the table exists
  RETURN;
END;
$$;


--
-- Name: delete_project_cascade(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.delete_project_cascade(project_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
DECLARE
  cap_table_id UUID;
  subscription_ids UUID[];
BEGIN
  -- Start a transaction to ensure atomicity
  BEGIN
    -- Find cap table related to the project
    SELECT id INTO cap_table_id FROM cap_tables WHERE project_id = $1;
    
    -- If cap table exists, delete its investors first
    IF cap_table_id IS NOT NULL THEN
      DELETE FROM cap_table_investors WHERE cap_table_id = cap_table_id;
      
      -- Then delete the cap table itself
      DELETE FROM cap_tables WHERE id = cap_table_id;
    END IF;
    
    -- Find subscription IDs for this project
    SELECT array_agg(id) INTO subscription_ids FROM subscriptions WHERE project_id = $1;
    
    -- If there are subscriptions, delete token allocations first
    IF subscription_ids IS NOT NULL THEN
      DELETE FROM token_allocations WHERE subscription_id = ANY(subscription_ids);
      
      -- Then delete the subscriptions
      DELETE FROM subscriptions WHERE project_id = $1;
    END IF;
    
    -- Delete any project documents
    DELETE FROM issuer_detail_documents WHERE project_id = $1;
    
    -- Finally delete the project
    DELETE FROM projects WHERE id = $1;
    
    -- Explicitly commit the transaction
    COMMIT;
  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback the transaction if any error occurs
      ROLLBACK;
      RAISE;
  END;
END;
$_$;


--
-- Name: FUNCTION delete_project_cascade(project_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.delete_project_cascade(project_id uuid) IS 'Deletes a project and all related data (cap tables, investors, subscriptions, documents, etc.) in a single transaction';


--
-- Name: delete_user_with_privileges(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.delete_user_with_privileges(p_user_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    -- Delete from user_roles
    DELETE FROM user_roles WHERE user_id = p_user_id;
    
    -- Delete from any other related tables that might have foreign keys
    -- For example:
    -- DELETE FROM user_preferences WHERE user_id = p_user_id;
    -- DELETE FROM user_logs WHERE user_id = p_user_id;
    
    -- Finally delete from users table
    DELETE FROM users WHERE id = p_user_id;
    
    -- Return success
    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error deleting user %: %', p_user_id, SQLERRM;
        RETURN false;
END;
$$;


--
-- Name: disable_rls_for_deletion(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.disable_rls_for_deletion() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Temporarily disable RLS
  ALTER TABLE users DISABLE ROW LEVEL SECURITY;
  ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
  ALTER TABLE user_sessions DISABLE ROW LEVEL SECURITY;
  RETURN OLD;
END;
$$;


--
-- Name: enable_rls_after_deletion(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.enable_rls_after_deletion() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Re-enable RLS
  ALTER TABLE users ENABLE ROW LEVEL SECURITY;
  ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
  ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
  RETURN OLD;
END;
$$;


--
-- Name: exec(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.exec(query text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  result JSONB;
BEGIN
  -- Execute the provided query
  EXECUTE query;
  
  -- Return success message
  result := jsonb_build_object('success', true, 'message', 'Query executed successfully');
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  -- Return error details on failure
  result := jsonb_build_object(
    'success', false,
    'message', 'Query execution failed',
    'error', SQLERRM,
    'detail', SQLSTATE
  );
  
  RETURN result;
END;
$$;


--
-- Name: FUNCTION exec(query text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.exec(query text) IS 'Executes arbitrary SQL. Use with caution and proper permissions.';


--
-- Name: execute_safely(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.execute_safely(p_statement text) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
  success BOOLEAN := TRUE;
BEGIN
  BEGIN
    EXECUTE p_statement;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Error executing statement: %', SQLERRM;
      RAISE WARNING 'Statement was: %', p_statement;
      success := FALSE;
  END;
  RETURN success;
END;
$$;


--
-- Name: extract_severity_from_metadata(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.extract_severity_from_metadata() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- Name: get_activity_counts_by_timeframe(timestamp without time zone, timestamp without time zone, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_activity_counts_by_timeframe(p_start_time timestamp without time zone, p_end_time timestamp without time zone, p_interval text DEFAULT 'day'::text) RETURNS TABLE(time_bucket timestamp without time zone, activity_count bigint)
    LANGUAGE plpgsql
    AS $$
    BEGIN
      RETURN QUERY
      SELECT 
        date_trunc(p_interval, timestamp) AS time_bucket,
        COUNT(*) AS activity_count
      FROM 
        audit_logs
      WHERE 
        timestamp BETWEEN p_start_time AND p_end_time
      GROUP BY 
        time_bucket
      ORDER BY 
        time_bucket;
    END;
    $$;


--
-- Name: get_activity_distribution_by_category(timestamp without time zone, timestamp without time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_activity_distribution_by_category(p_start_time timestamp without time zone, p_end_time timestamp without time zone) RETURNS TABLE(category text, activity_count bigint, percentage numeric)
    LANGUAGE plpgsql
    AS $$
    DECLARE
      total_count bigint;
    BEGIN
      -- Get total count for percentage calculation
      SELECT COUNT(*) INTO total_count 
      FROM audit_logs
      WHERE timestamp BETWEEN p_start_time AND p_end_time;
      
      RETURN QUERY
      SELECT 
        COALESCE(category, 'uncategorized') AS category,
        COUNT(*) AS activity_count,
        CASE 
          WHEN total_count > 0 THEN (COUNT(*) * 100.0 / total_count)::numeric 
          ELSE 0 
        END AS percentage
      FROM 
        audit_logs
      WHERE 
        timestamp BETWEEN p_start_time AND p_end_time
      GROUP BY 
        category
      ORDER BY 
        activity_count DESC;
    END;
    $$;


--
-- Name: get_activity_hierarchy(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_activity_hierarchy(root_id uuid) RETURNS TABLE(id uuid, action character varying, activity_timestamp timestamp with time zone, status character varying, level integer)
    LANGUAGE sql
    AS $$
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
$$;


--
-- Name: get_moonpay_webhook_stats(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_moonpay_webhook_stats() RETURNS TABLE(total_webhooks bigint, active_webhooks bigint, failed_webhooks bigint, avg_success_rate numeric)
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- Name: get_token_whitelist_addresses(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_token_whitelist_addresses(p_token_id uuid) RETURNS TABLE(address text, source text, is_active boolean, approved_date timestamp with time zone)
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Return addresses from token_whitelists table
  RETURN QUERY
  SELECT 
    tw.wallet_address as address,
    'whitelist_table'::TEXT as source,
    tw.is_active,
    tw.approval_date as approved_date
  FROM token_whitelists tw
  WHERE tw.token_id = p_token_id AND tw.is_active = true;
  
  -- TODO: Add logic to extract addresses from JSONB whitelist_config fields
  -- This would require knowing the token standard and parsing the appropriate properties table
END;
$$;


--
-- Name: get_unique_group_memberships(text[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_unique_group_memberships(investor_ids text[]) RETURNS TABLE(group_id text, investor_count bigint)
    LANGUAGE sql SECURITY DEFINER
    AS $$
  WITH combined_memberships AS (
    -- Get memberships from the new table
    SELECT group_id, investor_id
    FROM investor_groups_investors
    WHERE investor_id::text = ANY(investor_ids)
    
    UNION
    
    -- Get memberships from the old table
    SELECT group_id, investor_id
    FROM investor_group_members
    WHERE investor_id::text = ANY(investor_ids)
  )
  
  -- Count distinct investors per group
  SELECT 
    group_id,
    COUNT(DISTINCT investor_id) AS investor_count
  FROM 
    combined_memberships
  GROUP BY 
    group_id;
$$;


--
-- Name: get_unique_member_count(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_unique_member_count(group_id_param text) RETURNS integer
    LANGUAGE sql SECURITY DEFINER
    AS $$
  WITH combined_memberships AS (
    -- Get memberships from the new table
    SELECT investor_id
    FROM investor_groups_investors
    WHERE group_id::text = group_id_param
    
    UNION
    
    -- Get memberships from the old table
    SELECT investor_id
    FROM investor_group_members
    WHERE group_id::text = group_id_param
  )
  
  -- Count distinct investors
  SELECT 
    COUNT(DISTINCT investor_id)
  FROM 
    combined_memberships;
$$;


--
-- Name: get_users_by_role_for_approval(text[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_users_by_role_for_approval(role_names text[]) RETURNS TABLE(user_id uuid, user_name text, user_email text, role_name text, role_id uuid)
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


--
-- Name: get_users_with_any_permission(text[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_users_with_any_permission(permission_names text[]) RETURNS TABLE(user_id uuid, name text, email text, role text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    u.id as user_id,
    u.name,
    u.email,
    r.name as role
  FROM auth.users u
  JOIN user_roles ur ON u.id = ur.user_id
  JOIN roles r ON ur.role_id = r.id
  JOIN role_permissions rp ON r.id = rp.role_id
  WHERE 
    rp.permission_name = ANY(permission_names) AND
    u.deleted_at IS NULL
  ORDER BY u.name;
END;
$$;


--
-- Name: get_users_with_permission(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_users_with_permission(permission_name text) RETURNS TABLE(user_id uuid, name text, email text, role text)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  -- Get users with Super Admin role (they have all permissions)
  SELECT 
    u.id,
    u.name,
    u.email,
    r.name AS role
  FROM
    public.users u
    JOIN public.user_roles ur ON u.id = ur.user_id
    JOIN public.roles r ON ur.role_id = r.id
  WHERE
    r.name = 'Super Admin'
  
  UNION
  
  -- Get users with the specific permission
  SELECT
    u.id,
    u.name,
    u.email,
    r.name AS role
  FROM
    public.users u
    JOIN public.user_roles ur ON u.id = ur.user_id
    JOIN public.roles r ON ur.role_id = r.id
    JOIN public.role_permissions rp ON r.id = rp.role_id
  WHERE
    rp.permission_name = permission_name;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in get_users_with_permission: %', SQLERRM;
    RETURN;
END;
$$;


--
-- Name: get_users_with_permission_simple(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_users_with_permission_simple(p_permission_id text) RETURNS SETOF text
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT user_id::text
    FROM users_with_permissions
    WHERE permission_id = p_permission_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in get_users_with_permission_simple: %', SQLERRM;
        -- Return empty result set on error
        RETURN;
END;
$$;


--
-- Name: handle_auth_user_created(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_auth_user_created() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.auth_events (user_id, event_type, metadata)
  VALUES (NEW.id, 'user_created', json_build_object('email', NEW.email));
  RETURN NEW;
END;
$$;


--
-- Name: handle_rule_rejection(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_rule_rejection() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- If status is changed to rejected
    IF NEW.status = 'rejected' THEN
        -- Check what kind of entity this is
        IF EXISTS (SELECT 1 FROM rules WHERE rule_id = NEW.policy_rule_id) THEN
            -- It's a rule - update its status
            UPDATE rules 
            SET status = 'rejected' 
            WHERE rule_id = NEW.policy_rule_id;
        ELSIF EXISTS (SELECT 1 FROM policy_templates WHERE template_id = NEW.policy_rule_id) THEN
            -- It's a template - update its status
            UPDATE policy_templates 
            SET status = 'rejected' 
            WHERE template_id = NEW.policy_rule_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;


--
-- Name: handle_token_allocation_deletion(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_token_allocation_deletion() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- If allocation was already distributed, don't allow deletion
  IF OLD.distributed = true THEN
    RAISE EXCEPTION 'Cannot delete token allocation that has already been distributed';
  END IF;
  
  -- Update the subscriptions table to mark as not allocated
  UPDATE subscriptions 
  SET allocated = false,
      updated_at = NOW()
  WHERE id = OLD.subscription_id;
  
  RETURN OLD;
END;
$$;


--
-- Name: handle_token_distribution(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_token_distribution() RETURNS trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
  tx_proposal transaction_proposals%ROWTYPE;
  investor_wallet text;
BEGIN
  -- Only process when distributed is changed from false to true
  IF (OLD.distributed = false AND NEW.distributed = true) THEN
    -- Find the transaction proposal using distribution_tx_hash if it exists
    IF NEW.distribution_tx_hash IS NOT NULL THEN
      SELECT * INTO tx_proposal 
      FROM transaction_proposals 
      WHERE id::text = NEW.distribution_tx_hash::text
         OR (NEW.distribution_tx_hash ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND id = NEW.distribution_tx_hash::uuid)
      LIMIT 1;
    END IF;
    
    -- Get investor wallet address
    SELECT wallet_address INTO investor_wallet 
    FROM investors 
    WHERE investor_id = NEW.investor_id;
    
    -- Insert record into distributions table
    INSERT INTO distributions (
      token_allocation_id,
      investor_id,
      subscription_id,
      project_id,
      token_type,
      token_amount,
      distribution_date,
      distribution_tx_hash,
      wallet_id,
      blockchain,
      token_address,
      token_symbol,
      to_address,
      notes,
      remaining_amount
    ) VALUES (
      NEW.id,
      NEW.investor_id,
      NEW.subscription_id,
      NEW.project_id,
      NEW.token_type,
      NEW.token_amount,
      COALESCE(NEW.distribution_date, now()),
      COALESCE(NEW.distribution_tx_hash, ''),
      tx_proposal.wallet_id,
      COALESCE(tx_proposal.blockchain, 'ethereum'),
      tx_proposal.token_address,
      COALESCE(NEW.symbol, tx_proposal.token_symbol),
      COALESCE(tx_proposal.to_address, investor_wallet, ''),
      NEW.notes,
      NEW.token_amount
    );
  END IF;
  
  RETURN NEW;
END;
$_$;


--
-- Name: handle_user_deletion(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_user_deletion() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Temporarily disable RLS
  ALTER TABLE users DISABLE ROW LEVEL SECURITY;
  ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
  ALTER TABLE user_sessions DISABLE ROW LEVEL SECURITY;
  
  -- Delete from user_roles first
  DELETE FROM user_roles WHERE user_id = OLD.id;
  
  -- Delete from user_sessions
  DELETE FROM user_sessions WHERE user_id = OLD.id;
  
  -- Set auth_events user_id to null
  UPDATE auth_events SET user_id = NULL WHERE user_id = OLD.id;
  
  -- Re-enable RLS
  ALTER TABLE users ENABLE ROW LEVEL SECURITY;
  ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
  ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
  
  RETURN OLD;
END;
$$;


--
-- Name: insert_policy_approver(uuid, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.insert_policy_approver(p_policy_id uuid, p_user_id text, p_created_by text) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO policy_rule_approvers (policy_rule_id, user_id, created_by, status)
  VALUES (p_policy_id, p_user_id::UUID, p_created_by::UUID, 'pending')
  ON CONFLICT (policy_rule_id, user_id) 
  DO UPDATE SET status = 'pending', timestamp = now();
END;
$$;


--
-- Name: insert_token_properties(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.insert_token_properties() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    CASE NEW.standard
        WHEN 'ERC-20' THEN
            INSERT INTO "public"."token_erc20_properties" ("token_id") 
            VALUES (NEW.id)
            ON CONFLICT ("token_id") DO NOTHING;
        WHEN 'ERC-721' THEN
            INSERT INTO "public"."token_erc721_properties" ("token_id") 
            VALUES (NEW.id)
            ON CONFLICT ("token_id") DO NOTHING;
        WHEN 'ERC-1155' THEN
            INSERT INTO "public"."token_erc1155_properties" ("token_id") 
            VALUES (NEW.id)
            ON CONFLICT ("token_id") DO NOTHING;
        WHEN 'ERC-1400' THEN
            INSERT INTO "public"."token_erc1400_properties" ("token_id") 
            VALUES (NEW.id)
            ON CONFLICT ("token_id") DO NOTHING;
        WHEN 'ERC-3525' THEN
            INSERT INTO "public"."token_erc3525_properties" ("token_id") 
            VALUES (NEW.id)
            ON CONFLICT ("token_id") DO NOTHING;
        WHEN 'ERC-4626' THEN
            INSERT INTO "public"."token_erc4626_properties" ("token_id") 
            VALUES (NEW.id)
            ON CONFLICT ("token_id") DO NOTHING;
        ELSE
            -- Do nothing for unknown standards
    END CASE;
    RETURN NEW;
END;
$$;


--
-- Name: is_address_whitelisted(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_address_whitelisted(p_token_id uuid, p_address text) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
  is_whitelisted BOOLEAN := FALSE;
BEGIN
  -- Check in token_whitelists table
  SELECT EXISTS(
    SELECT 1 FROM token_whitelists 
    WHERE token_id = p_token_id 
    AND wallet_address = p_address 
    AND is_active = true
  ) INTO is_whitelisted;
  
  IF is_whitelisted THEN
    RETURN TRUE;
  END IF;
  
  -- TODO: Add logic to check JSONB whitelist_config fields
  -- This would require joining with the appropriate ERC properties table
  
  RETURN FALSE;
END;
$$;


--
-- Name: list_tables(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.list_tables() RETURNS TABLE(table_name text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT tablename::text
  FROM pg_catalog.pg_tables
  WHERE schemaname = 'public'
  ORDER BY tablename;
END;
$$;


--
-- Name: log_approval_config_changes(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_approval_config_changes() RETURNS trigger
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


--
-- Name: log_approver_assignment_changes(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_approver_assignment_changes() RETURNS trigger
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


--
-- Name: log_audit(text, uuid, text, text, text, text, jsonb, jsonb, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_audit(p_action text, p_user_id uuid, p_entity_type text, p_entity_id text DEFAULT NULL::text, p_details text DEFAULT NULL::text, p_status text DEFAULT 'Success'::text, p_metadata jsonb DEFAULT NULL::jsonb, p_old_data jsonb DEFAULT NULL::jsonb, p_new_data jsonb DEFAULT NULL::jsonb) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_audit_id UUID;
  v_user_email TEXT;
  v_username TEXT;
BEGIN
  -- Get user email and name
  SELECT email, name INTO v_user_email, v_username
  FROM users
  WHERE id = p_user_id;
  
  -- Insert audit log
  INSERT INTO audit_logs (
    action,
    user_id,
    user_email,
    username,
    entity_type,
    entity_id,
    details,
    status,
    metadata,
    old_data,
    new_data
  ) VALUES (
    p_action,
    p_user_id,
    v_user_email,
    v_username,
    p_entity_type,
    p_entity_id,
    p_details,
    p_status,
    p_metadata,
    p_old_data,
    p_new_data
  )
  RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$;


--
-- Name: log_auth_event(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_auth_event() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO auth_events (user_id, event_type, ip_address, user_agent, metadata)
  VALUES (
    NEW.id,
    TG_ARGV[0],
    current_setting('request.headers')::json->>'x-forwarded-for',
    current_setting('request.headers')::json->>'user-agent',
    json_build_object('email', NEW.email, 'created_at', NEW.created_at)
  );
  RETURN NEW;
END;
$$;


--
-- Name: log_database_changes(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_database_changes() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  action_name TEXT;
  entity_name TEXT;
BEGIN
  -- Set the entity name based on the table
  entity_name := TG_TABLE_NAME;
  
  -- Set action based on operation type
  CASE 
    WHEN TG_OP = 'INSERT' THEN action_name := 'create_' || entity_name;
    WHEN TG_OP = 'UPDATE' THEN action_name := 'update_' || entity_name;
    WHEN TG_OP = 'DELETE' THEN action_name := 'delete_' || entity_name;
  END CASE;

  -- Insert audit log entry
  INSERT INTO audit_logs (
    action,
    action_type,
    entity_type,
    entity_id,
    details,
    old_data,
    new_data,
    status,
    is_automated,
    source,
    timestamp
  ) VALUES (
    action_name,
    'system',
    entity_name,
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.id::text
      ELSE NEW.id::text
    END,
    'Automatic system record of data change',
    CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
    'success',
    TRUE,
    'database_trigger',
    NOW()
  );
  
  RETURN NULL;
END;
$$;


--
-- Name: log_table_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_table_change() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
    DECLARE
      old_data jsonb;
      new_data jsonb;
      action_name text;
      entity_name text;
      change_data jsonb;
    BEGIN
      -- Set the action name based on operation type
      IF (TG_OP = 'INSERT') THEN
        action_name := 'create';
        old_data := null;
        new_data := to_jsonb(NEW);
        change_data := new_data;
      ELSIF (TG_OP = 'UPDATE') THEN
        action_name := 'update';
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);
        -- Calculate changes by comparing old and new data
        SELECT jsonb_object_agg(key, value) INTO change_data
        FROM jsonb_each(new_data) 
        WHERE NOT new_data->key = old_data->key OR old_data->key IS NULL;
      ELSIF (TG_OP = 'DELETE') THEN
        action_name := 'delete';
        old_data := to_jsonb(OLD);
        new_data := null;
        change_data := old_data;
      END IF;
      
      -- Extract the entity name from trigger name 
      entity_name := TG_TABLE_NAME;
      
      -- Insert into audit_logs table
      INSERT INTO audit_logs (
        action,
        action_type,
        entity_type,
        entity_id,
        old_data,
        new_data,
        changes,
        details,
        status,
        source,
        timestamp
      ) VALUES (
        entity_name || '_' || action_name,
        'database',
        entity_name,
        CASE 
          WHEN TG_OP = 'DELETE' THEN (old_data->>'id')::text
          ELSE (new_data->>'id')::text
        END,
        old_data,
        new_data,
        change_data,
        'Automated audit log for ' || entity_name || ' ' || action_name,
        'success',
        'database_trigger',
        NOW()
      );
      
      -- Return the appropriate row based on operation
      IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
      ELSE
        RETURN NEW;
      END IF;
    END;
    $$;


--
-- Name: log_user_action(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_user_action() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  entity_id TEXT;
  action_type TEXT;
  table_exists BOOLEAN;
BEGIN
  -- Check if audit_logs table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'audit_logs'
  ) INTO table_exists;
  
  -- If audit_logs table doesn't exist, just return and do nothing
  IF NOT table_exists THEN
    RETURN COALESCE(new, old);
  END IF;

  -- Determine the action type
  IF TG_OP = 'INSERT' THEN
    action_type := 'create';
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := 'update';
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'delete';
  END IF;
  
  -- Get the entity ID based on the table's primary key column
  IF TG_TABLE_NAME = 'policy_templates' THEN
    IF TG_OP = 'DELETE' THEN
      entity_id := old.template_id::text;
    ELSE
      entity_id := new.template_id::text;
    END IF;
  ELSIF TG_TABLE_NAME = 'rules' THEN
    IF TG_OP = 'DELETE' THEN
      entity_id := old.rule_id::text;
    ELSE
      entity_id := new.rule_id::text;
    END IF;
  ELSE
    -- Default fallback for other tables with 'id' column
    IF TG_OP = 'DELETE' THEN
      BEGIN
        entity_id := old.id::text;
      EXCEPTION WHEN undefined_column THEN
        entity_id := 'unknown';
      END;
    ELSE
      BEGIN
        entity_id := new.id::text;
      EXCEPTION WHEN undefined_column THEN
        entity_id := 'unknown';
      END;
    END IF;
  END IF;
  
  -- Use TRY-CATCH to prevent errors during insert
  BEGIN
    -- Insert action into audit_logs table
    INSERT INTO audit_logs (
      action_type,
      entity_type,
      entity_id,
      user_id,
      changes,
      occurred_at
    ) VALUES (
      action_type,
      TG_TABLE_NAME,
      entity_id,
      COALESCE(auth.uid()::text, 'system'),
      CASE
        WHEN TG_OP = 'INSERT' THEN to_jsonb(new)
        WHEN TG_OP = 'UPDATE' THEN jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new))
        WHEN TG_OP = 'DELETE' THEN to_jsonb(old)
        ELSE NULL
      END,
      NOW()
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but continue (don't let trigger failure block main operation)
      RAISE NOTICE 'Failed to log action: %', SQLERRM;
  END;
  
  RETURN COALESCE(new, old);
END;
$$;


--
-- Name: FUNCTION log_user_action(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.log_user_action() IS 'This function handles audit logging for various tables, with special handling for token_templates';


--
-- Name: migrate_token_json_to_tables(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.migrate_token_json_to_tables() RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    token_record RECORD;
BEGIN
    -- Process ERC20 tokens
    FOR token_record IN SELECT * FROM "public"."tokens" WHERE standard = 'ERC-20' LOOP
        INSERT INTO "public"."token_erc20_properties" (
            token_id, 
            initial_supply, 
            cap, 
            is_mintable, 
            is_burnable, 
            is_pausable,
            token_type,
            access_control,
            allow_management,
            permit,
            snapshot,
            fee_on_transfer,
            rebasing,
            governance_features
        ) VALUES (
            token_record.id,
            token_record.total_supply,
            (token_record.blocks->>'cap')::text,
            (token_record.blocks->>'is_mintable')::boolean,
            (token_record.blocks->>'is_burnable')::boolean,
            (token_record.blocks->>'is_pausable')::boolean,
            (token_record.metadata->>'tokenType')::text,
            (token_record.blocks->>'access_control')::text,
            (token_record.blocks->>'allowance_management')::boolean,
            (token_record.blocks->>'permit')::boolean,
            (token_record.blocks->>'snapshot')::boolean,
            token_record.blocks->'fee_on_transfer',
            token_record.blocks->'rebasing',
            token_record.blocks->'governance_features'
        ) ON CONFLICT (token_id) DO UPDATE SET
            initial_supply = EXCLUDED.initial_supply,
            cap = EXCLUDED.cap,
            is_mintable = EXCLUDED.is_mintable,
            is_burnable = EXCLUDED.is_burnable,
            is_pausable = EXCLUDED.is_pausable,
            token_type = EXCLUDED.token_type,
            access_control = EXCLUDED.access_control,
            allow_management = EXCLUDED.allow_management,
            permit = EXCLUDED.permit,
            snapshot = EXCLUDED.snapshot,
            fee_on_transfer = EXCLUDED.fee_on_transfer,
            rebasing = EXCLUDED.rebasing,
            governance_features = EXCLUDED.governance_features;
    END LOOP;
    
    -- Process ERC721 tokens
    FOR token_record IN SELECT * FROM "public"."tokens" WHERE standard = 'ERC-721' LOOP
        INSERT INTO "public"."token_erc721_properties" (
            token_id,
            base_uri,
            metadata_storage,
            max_supply,
            has_royalty,
            royalty_percentage,
            royalty_receiver,
            is_burnable,
            is_pausable,
            asset_type,
            minting_method,
            auto_increment_ids,
            enumerable,
            uri_storage,
            access_control,
            updatable_uris,
            sales_config,
            whitelist_config,
            permission_config
        ) VALUES (
            token_record.id,
            (token_record.blocks->>'base_uri')::text,
            (token_record.blocks->>'metadata_storage')::text,
            (token_record.blocks->>'max_supply')::text,
            (token_record.blocks->>'has_royalty')::boolean,
            (token_record.blocks->>'royalty_percentage')::text,
            (token_record.blocks->>'royalty_receiver')::text,
            (token_record.blocks->>'is_burnable')::boolean,
            (token_record.blocks->>'is_pausable')::boolean,
            (token_record.blocks->>'asset_type')::text,
            (token_record.blocks->>'minting_method')::text,
            (token_record.blocks->>'auto_increment_ids')::boolean,
            (token_record.blocks->>'enumerable')::boolean,
            (token_record.blocks->>'uri_storage')::text,
            (token_record.blocks->>'access_control')::text,
            (token_record.blocks->>'updatable_uris')::boolean,
            token_record.blocks->'sales_config',
            token_record.blocks->'whitelist_config',
            token_record.blocks->'permission_config'
        ) ON CONFLICT (token_id) DO UPDATE SET
            base_uri = EXCLUDED.base_uri,
            metadata_storage = EXCLUDED.metadata_storage,
            max_supply = EXCLUDED.max_supply,
            has_royalty = EXCLUDED.has_royalty,
            royalty_percentage = EXCLUDED.royalty_percentage,
            royalty_receiver = EXCLUDED.royalty_receiver,
            is_burnable = EXCLUDED.is_burnable,
            is_pausable = EXCLUDED.is_pausable,
            asset_type = EXCLUDED.asset_type,
            minting_method = EXCLUDED.minting_method,
            auto_increment_ids = EXCLUDED.auto_increment_ids,
            enumerable = EXCLUDED.enumerable,
            uri_storage = EXCLUDED.uri_storage,
            access_control = EXCLUDED.access_control,
            updatable_uris = EXCLUDED.updatable_uris,
            sales_config = EXCLUDED.sales_config,
            whitelist_config = EXCLUDED.whitelist_config,
            permission_config = EXCLUDED.permission_config;

        -- Migrate token attributes array
        IF token_record.blocks->'token_attributes' IS NOT NULL AND jsonb_array_length(token_record.blocks->'token_attributes') > 0 THEN
            FOR i IN 0..jsonb_array_length(token_record.blocks->'token_attributes')-1 LOOP
                INSERT INTO "public"."token_erc721_attributes" (
                    token_id,
                    trait_type,
                    values
                ) VALUES (
                    token_record.id,
                    (token_record.blocks->'token_attributes'->i->>'trait_type')::text,
                    (SELECT array_agg(v.value) 
                     FROM jsonb_array_elements_text(token_record.blocks->'token_attributes'->i->'values') as v(value))
                );
            END LOOP;
        END IF;
    END LOOP;

    -- Process other token standards similarly...
    -- (Add more token migration logic here - would need similar blocks for each token standard)
END;
$$;


--
-- Name: projects_audit_function(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.projects_audit_function() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_logs (action, entity_type, entity_id, old_data, timestamp)
        VALUES ('DELETE', 'project', OLD.id, row_to_json(OLD), NOW());
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit_logs (action, entity_type, entity_id, old_data, new_data, timestamp)
        VALUES ('UPDATE', 'project', NEW.id, row_to_json(OLD), row_to_json(NEW), NOW());
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_logs (action, entity_type, entity_id, new_data, timestamp)
        VALUES ('INSERT', 'project', NEW.id, row_to_json(NEW), NOW());
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$;


--
-- Name: refresh_activity_metrics(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.refresh_activity_metrics() RETURNS void
    LANGUAGE plpgsql
    AS $$
    BEGIN
      REFRESH MATERIALIZED VIEW activity_metrics;
    END;
    $$;


--
-- Name: remove_investors_from_group(text, text[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.remove_investors_from_group(p_group_id text, p_investor_ids text[]) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  sync_timestamp timestamp with time zone := NOW();
BEGIN
  -- Validate input
  IF p_group_id IS NULL THEN
    RAISE EXCEPTION 'Group ID cannot be NULL';
  END IF;

  IF p_investor_ids IS NULL OR array_length(p_investor_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'Investor IDs array cannot be NULL or empty';
  END IF;

  -- Remove from the investor_group_members table (old)
  DELETE FROM investor_group_members
  WHERE group_id::text = p_group_id
  AND investor_id::text = ANY(p_investor_ids);

  -- Try to remove from investor_groups_investors table (new)
  -- This might fail due to RLS but we'll continue anyway
  BEGIN
    DELETE FROM investor_groups_investors
    WHERE group_id::text = p_group_id
    AND investor_id::text = ANY(p_investor_ids);
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but continue - we at least removed from the old table
    RAISE NOTICE 'Error removing from investor_groups_investors: %', SQLERRM;
  END;

  -- Update the group member count
  UPDATE investor_groups
  SET 
    member_count = (SELECT get_unique_member_count(p_group_id)),
    updated_at = sync_timestamp
  WHERE id::text = p_group_id;
END;
$$;


--
-- Name: safe_cast_to_uuid(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.safe_cast_to_uuid(input text) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
  result uuid;
BEGIN
  -- Check if it's already a valid UUID
  BEGIN
    result := input::uuid;
    RETURN result;
  EXCEPTION WHEN others THEN
    -- If it's the special admin value, return a specific UUID
    IF input = 'admin-bypass' THEN
      RETURN '00000000-0000-0000-0000-000000000000'::uuid;
    END IF;
    
    -- Otherwise, generate a new UUID
    RETURN gen_random_uuid();
  END;
END;
$$;


--
-- Name: safe_uuid_cast(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.safe_uuid_cast(text_id text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
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
$$;


--
-- Name: save_consensus_config(text, integer, text[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.save_consensus_config(p_consensus_type text, p_required_approvals integer, p_eligible_roles text[]) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_config_id UUID;
  v_existing_id UUID;
BEGIN
  -- Check if we already have a config with this consensus type
  SELECT id INTO v_existing_id 
  FROM approval_configs 
  WHERE consensus_type = p_consensus_type;
  
  IF v_existing_id IS NOT NULL THEN
    -- Update existing record
    UPDATE approval_configs
    SET 
      required_approvals = p_required_approvals,
      eligible_roles = p_eligible_roles,
      updated_at = now()
    WHERE id = v_existing_id;
  ELSE
    -- Create a new standalone consensus config entry
    INSERT INTO consensus_settings (
      consensus_type,
      required_approvals,
      eligible_roles
    ) VALUES (
      p_consensus_type,
      p_required_approvals,
      p_eligible_roles
    );
  END IF;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in save_consensus_config: %', SQLERRM;
    RETURN FALSE;
END;
$$;


--
-- Name: set_distribution_standard(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_distribution_standard() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  fallback_standard public.token_standard_enum;
BEGIN
  -- Step 1: Try to get it from token_allocations
  IF NEW.standard IS NULL THEN
    SELECT ta.standard
    INTO NEW.standard
    FROM public.token_allocations ta
    WHERE ta.id = NEW.token_allocation_id;

    -- Step 2: If still null, try to get from tokens via token_id
    IF NEW.standard IS NULL THEN
      SELECT t.standard
      INTO fallback_standard
      FROM public.tokens t
      JOIN public.token_allocations ta ON ta.token_id = t.id
      WHERE ta.id = NEW.token_allocation_id;

      NEW.standard := fallback_standard;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: set_token_allocation_standard(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_token_allocation_standard() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  -- Only attempt to update if token_id is present and standard is null
  if (NEW.token_id is not null and NEW.standard is null) then
    select t.standard into NEW.standard
    from public.tokens t
    where t.id = NEW.token_id;
  end if;
  return NEW;
end;
$$;


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: sync_group_memberships(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_group_memberships(group_id_param text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  sync_timestamp timestamp with time zone := NOW();
BEGIN
  -- Validate input
  IF group_id_param IS NULL THEN
    RAISE EXCEPTION 'group_id_param cannot be NULL';
  END IF;

  -- First sync from old to new table for this group
  BEGIN
    INSERT INTO investor_groups_investors (id, group_id, investor_id, created_at)
    SELECT 
      gen_random_uuid()::text, -- Generate UUID for new records
      old.group_id,
      old.investor_id,
      COALESCE(old.created_at, sync_timestamp)
    FROM 
      investor_group_members old
    WHERE 
      old.group_id::text = group_id_param AND
      old.investor_id IS NOT NULL AND
      NOT EXISTS (
        SELECT 1 
        FROM investor_groups_investors new
        WHERE 
          new.group_id::text = old.group_id::text AND 
          new.investor_id::text = old.investor_id::text
      )
    ON CONFLICT (group_id, investor_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but continue with the next step
    RAISE NOTICE 'Error syncing from old to new table: %', SQLERRM;
  END;
  
  -- Then sync from new to old table for this group
  BEGIN
    INSERT INTO investor_group_members (group_id, investor_id, created_at)
    SELECT 
      new.group_id,
      new.investor_id,
      COALESCE(new.created_at, sync_timestamp)
    FROM 
      investor_groups_investors new
    WHERE 
      new.group_id::text = group_id_param AND
      new.investor_id IS NOT NULL AND
      NOT EXISTS (
        SELECT 1 
        FROM investor_group_members old
        WHERE 
          old.group_id::text = new.group_id::text AND 
          old.investor_id::text = new.investor_id::text
      )
    ON CONFLICT (group_id, investor_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but continue with the next step
    RAISE NOTICE 'Error syncing from new to old table: %', SQLERRM;
  END;
  
  -- Update the group member count
  BEGIN
    UPDATE investor_groups g
    SET 
      member_count = (
        SELECT get_unique_member_count(g.id::text)
      ),
      updated_at = sync_timestamp
    WHERE 
      g.id::text = group_id_param;
  EXCEPTION WHEN OTHERS THEN
    -- Log the error
    RAISE NOTICE 'Error updating group member count: %', SQLERRM;
  END;
END;
$$;


--
-- Name: sync_investor_group_memberships(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_investor_group_memberships() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  sync_timestamp timestamp with time zone := NOW();
  v_group_id text;
  groups_cursor CURSOR FOR SELECT id FROM investor_groups WHERE id IS NOT NULL;
BEGIN
  -- Process one group at a time to avoid timeouts
  OPEN groups_cursor;
  LOOP
    FETCH groups_cursor INTO v_group_id;
    EXIT WHEN NOT FOUND;
    
    -- Call the single group sync function for each group
    PERFORM sync_group_memberships(v_group_id::text);
  END LOOP;
  CLOSE groups_cursor;
END;
$$;


--
-- Name: table_exists(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.table_exists(p_schema_name text, p_table_name text) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
    DECLARE
      exists boolean;
    BEGIN
      SELECT COUNT(*) > 0 INTO exists
      FROM information_schema.tables
      WHERE table_schema = p_schema_name
      AND table_name = p_table_name;
      
      RETURN exists;
    END;
    $$;


--
-- Name: track_system_process(text, text, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.track_system_process(process_name text, description text DEFAULT NULL::text, metadata jsonb DEFAULT NULL::jsonb) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- Name: update_bulk_operation_progress(text, double precision, integer, integer, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_bulk_operation_progress(p_operation_id text, p_progress double precision, p_processed_count integer DEFAULT NULL::integer, p_failed_count integer DEFAULT NULL::integer, p_status character varying DEFAULT NULL::character varying) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- Name: update_consensus_settings_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_consensus_settings_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: update_distribution_remaining_amount(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_distribution_remaining_amount() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Update the remaining amount in the distribution
  UPDATE distributions
  SET 
    remaining_amount = remaining_amount - NEW.amount_redeemed,
    fully_redeemed = CASE WHEN (remaining_amount - NEW.amount_redeemed) <= 0 THEN true ELSE false END,
    updated_at = now()
  WHERE id = NEW.distribution_id;
  
  RETURN NEW;
END;
$$;


--
-- Name: update_group_member_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_group_member_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Update the member count based on both tables
  IF TG_OP = 'INSERT' OR TG_OP = 'DELETE' THEN
    -- Get the relevant group_id based on whether we're processing an insert or delete
    DECLARE
      group_id_val uuid;
    BEGIN
      IF TG_OP = 'INSERT' THEN
        group_id_val := NEW.group_id;
      ELSE -- DELETE
        group_id_val := OLD.group_id;
      END IF;
      
      -- Update the count considering both tables
      UPDATE public.investor_groups
      SET 
        member_count = (
          WITH combined_investors AS (
            -- Get all investor_ids from investor_groups_investors
            SELECT investor_id 
            FROM public.investor_groups_investors
            WHERE group_id = group_id_val
            UNION
            -- Get all investor_ids from investor_group_members
            SELECT investor_id
            FROM public.investor_group_members
            WHERE group_id = group_id_val
          )
          -- Count distinct investor_ids
          SELECT COUNT(DISTINCT investor_id) 
          FROM combined_investors
        ),
        updated_at = NOW()
      WHERE id = group_id_val;
    END;
  END IF;
  
  -- Return appropriate record
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;


--
-- Name: update_modified_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_modified_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;   
END;
$$;


--
-- Name: update_redemption_approvers_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_redemption_approvers_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_rules_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_rules_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: update_security_events_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_security_events_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_settlement_status(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_settlement_status() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- Name: update_system_process_progress(text, double precision, integer, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_system_process_progress(p_process_id text, p_progress double precision, p_processed_count integer DEFAULT NULL::integer, p_status character varying DEFAULT NULL::character varying) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- Name: update_system_process_status(uuid, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_system_process_status(process_id uuid, new_status text, error_details text DEFAULT NULL::text) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- Name: update_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: update_timestamp_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_timestamp_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
   NEW.updated_at = now(); 
   RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: update_user_role(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_user_role(p_user_id uuid, p_role text) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- First check if the role exists in roles table
  IF NOT EXISTS (SELECT 1 FROM roles WHERE name = p_role) THEN
    RAISE EXCEPTION 'Role "%" does not exist in the roles table', p_role;
  END IF;

  -- Delete any existing roles
  DELETE FROM user_roles WHERE user_id = p_user_id;
  
  -- Add the new role
  INSERT INTO user_roles (user_id, role, created_at, updated_at)
  VALUES (p_user_id, p_role, NOW(), NOW());
END;
$$;


--
-- Name: update_wallet_signatories_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_wallet_signatories_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


--
-- Name: update_whitelist_entries_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_whitelist_entries_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


--
-- Name: upsert_policy_template_approver(uuid, uuid, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.upsert_policy_template_approver(p_template_id uuid, p_user_id uuid, p_created_by text, p_status text DEFAULT 'pending'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- First try to update any existing record
  UPDATE policy_template_approvers
  SET 
    created_by = p_created_by,
    status = p_status,
    timestamp = NOW()
  WHERE 
    template_id = p_template_id AND
    user_id = p_user_id;
    
  -- If no record was updated, insert a new one
  IF NOT FOUND THEN
    INSERT INTO policy_template_approvers (
      template_id, 
      user_id, 
      created_by, 
      status, 
      timestamp
    ) VALUES (
      p_template_id,
      p_user_id,
      p_created_by,
      p_status,
      NOW()
    );
  END IF;
END;
$$;


--
-- Name: FUNCTION upsert_policy_template_approver(p_template_id uuid, p_user_id uuid, p_created_by text, p_status text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.upsert_policy_template_approver(p_template_id uuid, p_user_id uuid, p_created_by text, p_status text) IS 'Safely adds or updates approvers for a policy template without creating duplicates.';


--
-- Name: user_has_delete_permission(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.user_has_delete_permission(p_user_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- Check if the current user has the necessary role permissions
    RETURN EXISTS (
        SELECT 1
        FROM user_roles ur
        WHERE ur.user_id = auth.uid()
        AND ur.role IN ('superAdmin', 'owner', 'complianceManager', 'admin', 'Super Admin', 'Owner', 'Compliance Manager')
    );
END;
$$;


--
-- Name: validate_blockchain_address(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_blockchain_address(blockchain text, address text) RETURNS boolean
    LANGUAGE plpgsql
    AS $_$
BEGIN
  -- Ethereum, Polygon, Avalanche, Optimism, Base, ZkSync, Arbitrum, Mantle, Hedera (EVM-compatible)
  IF blockchain IN ('ethereum', 'polygon', 'avalanche', 'optimism', 'base', 'zksync', 'arbitrum', 'mantle', 'hedera') THEN
    RETURN address ~* '^0x[a-fA-F0-9]{40}$';
  -- Bitcoin
  ELSIF blockchain = 'bitcoin' THEN
    RETURN address ~* '^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$';
  -- Ripple (XRP)
  ELSIF blockchain = 'ripple' THEN
    RETURN address ~* '^r[a-zA-Z0-9]{24,34}$';
  -- Solana
  ELSIF blockchain = 'solana' THEN
    RETURN address ~* '^[1-9A-HJ-NP-Za-km-z]{32,44}$';
  -- Aptos
  ELSIF blockchain = 'aptos' THEN
    RETURN address ~* '^0x[a-fA-F0-9]{1,64}$';
  -- Sui
  ELSIF blockchain = 'sui' THEN
    RETURN address ~* '^0x[a-fA-F0-9]{1,64}$';
  -- Stellar
  ELSIF blockchain = 'stellar' THEN
    RETURN address ~* '^G[A-Z0-9]{55}$';
  -- NEAR
  ELSIF blockchain = 'near' THEN
    RETURN address ~* '^[a-z0-9_-]{2,64}(\.near)?$';
  -- Default case for unsupported blockchains
  ELSE
    RETURN TRUE; -- Allow any address format for unsupported blockchains
  END IF;
END;
$_$;


--
-- Name: validate_geographic_restriction(uuid, character, numeric); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_geographic_restriction(p_token_id uuid, p_investor_country_code character, p_investment_amount numeric DEFAULT NULL::numeric) RETURNS TABLE(is_allowed boolean, restriction_type text, max_ownership_percentage numeric, requires_enhanced_dd boolean, blocking_reason text)
    LANGUAGE plpgsql
    AS $$
DECLARE
  restriction_record RECORD;
  token_record RECORD;
  jurisdiction_record RECORD;
BEGIN
  -- Get token settings
  SELECT use_geographic_restrictions, default_restriction_policy 
  INTO token_record
  FROM public.tokens t
  LEFT JOIN public.token_erc20_properties erc20 ON t.id = erc20.token_id AND t.standard = 'ERC-20'
  LEFT JOIN public.token_erc721_properties erc721 ON t.id = erc721.token_id AND t.standard = 'ERC-721'
  LEFT JOIN public.token_erc1155_properties erc1155 ON t.id = erc1155.token_id AND t.standard = 'ERC-1155'
  LEFT JOIN public.token_erc1400_properties erc1400 ON t.id = erc1400.token_id AND t.standard = 'ERC-1400'
  LEFT JOIN public.token_erc3525_properties erc3525 ON t.id = erc3525.token_id AND t.standard = 'ERC-3525'
  LEFT JOIN public.token_erc4626_properties erc4626 ON t.id = erc4626.token_id AND t.standard = 'ERC-4626'
  WHERE t.id = p_token_id;

  -- If geographic restrictions not enabled, use default policy
  IF NOT COALESCE(token_record.use_geographic_restrictions, false) THEN
    RETURN QUERY SELECT 
      CASE WHEN COALESCE(token_record.default_restriction_policy, 'allowed') = 'allowed' THEN true ELSE false END,
      'none'::TEXT,
      NULL::NUMERIC,
      false,
      CASE WHEN COALESCE(token_record.default_restriction_policy, 'allowed') = 'blocked' 
           THEN 'Geographic restrictions not configured' 
           ELSE NULL END;
    RETURN;
  END IF;

  -- Get jurisdiction info
  SELECT sanctions_risk_level, is_ofac_sanctioned, is_eu_sanctioned, is_un_sanctioned
  INTO jurisdiction_record
  FROM public.geographic_jurisdictions
  WHERE country_code = p_investor_country_code;

  -- Check for auto-sanctions blocking
  IF COALESCE(jurisdiction_record.is_ofac_sanctioned, false) OR 
     COALESCE(jurisdiction_record.is_eu_sanctioned, false) OR 
     COALESCE(jurisdiction_record.is_un_sanctioned, false) THEN
    RETURN QUERY SELECT 
      false,
      'blocked'::TEXT,
      NULL::NUMERIC,
      false,
      'Country is subject to international sanctions';
    RETURN;
  END IF;

  -- Check specific restriction rules
  SELECT * INTO restriction_record
  FROM public.token_geographic_restrictions
  WHERE token_id = p_token_id 
    AND country_code = p_investor_country_code
    AND (effective_date IS NULL OR effective_date <= CURRENT_DATE)
    AND (expiry_date IS NULL OR expiry_date > CURRENT_DATE);

  -- If specific rule exists, apply it
  IF FOUND THEN
    CASE restriction_record.restriction_type
      WHEN 'blocked' THEN
        RETURN QUERY SELECT 
          false,
          'blocked'::TEXT,
          restriction_record.max_ownership_percentage,
          false,
          'Country is blocked for this token';
      WHEN 'allowed' THEN
        RETURN QUERY SELECT 
          true,
          'allowed'::TEXT,
          restriction_record.max_ownership_percentage,
          false,
          NULL::TEXT;
      WHEN 'limited' THEN
        RETURN QUERY SELECT 
          true,
          'limited'::TEXT,
          restriction_record.max_ownership_percentage,
          false,
          NULL::TEXT;
      WHEN 'enhanced_dd' THEN
        RETURN QUERY SELECT 
          true,
          'enhanced_dd'::TEXT,
          restriction_record.max_ownership_percentage,
          true,
          NULL::TEXT;
      ELSE
        RETURN QUERY SELECT 
          false,
          'unknown'::TEXT,
          NULL::NUMERIC,
          false,
          'Unknown restriction type';
    END CASE;
  ELSE
    -- No specific rule, use default policy
    RETURN QUERY SELECT 
      CASE WHEN COALESCE(token_record.default_restriction_policy, 'allowed') = 'allowed' THEN true ELSE false END,
      'default'::TEXT,
      NULL::NUMERIC,
      false,
      CASE WHEN COALESCE(token_record.default_restriction_policy, 'allowed') = 'blocked' 
           THEN 'Country not in allowed list' 
           ELSE NULL END;
  END IF;

END;
$$;


--
-- Name: FUNCTION validate_geographic_restriction(p_token_id uuid, p_investor_country_code character, p_investment_amount numeric); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.validate_geographic_restriction(p_token_id uuid, p_investor_country_code character, p_investment_amount numeric) IS 'Validates if an investor from a specific country can invest in a token';


--
-- Name: validate_token_data(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_token_data() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Ensure blocks has required fields based on token standard
    IF NEW.standard = 'ERC-20' AND NOT (NEW.blocks->>'name' IS NOT NULL AND NEW.blocks->>'symbol' IS NOT NULL) THEN
        RAISE EXCEPTION 'ERC-20 tokens require name and symbol in blocks data';
    END IF;
    
    -- Other validations as needed
    
    RETURN NEW;
END;
$$;


--
-- Name: validate_token_exists(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_token_exists() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Check if the token_id exists in tokens table
    IF NOT EXISTS (SELECT 1 FROM tokens WHERE id = NEW.token_id) THEN
        RAISE EXCEPTION 'Token with id % does not exist in tokens table', NEW.token_id;
    END IF;
    
    RETURN NEW;
END;
$$;


--
-- Name: FUNCTION validate_token_exists(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.validate_token_exists() IS 'Validates that token_id exists in tokens table before insert/update operations';


--
-- Name: validate_wallet_address(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_wallet_address() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NOT validate_blockchain_address(NEW.blockchain, NEW.address) THEN
    RAISE EXCEPTION 'Invalid address format for blockchain %', NEW.blockchain;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: validate_whitelist_config_permissive(jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_whitelist_config_permissive(config jsonb) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- If config is NULL, it's valid (optional field)
  IF config IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Must be an object (allow empty objects)
  IF jsonb_typeof(config) != 'object' THEN
    RETURN FALSE;
  END IF;
  
  -- If it's an empty object, it's valid
  IF config = '{}'::jsonb THEN
    RETURN TRUE;
  END IF;
  
  -- If enabled field exists, it must be boolean
  IF config ? 'enabled' AND jsonb_typeof(config->'enabled') != 'boolean' THEN
    RETURN FALSE;
  END IF;
  
  -- If addresses field exists, it must be an array
  IF config ? 'addresses' AND jsonb_typeof(config->'addresses') != 'array' THEN
    RETURN FALSE;
  END IF;
  
  -- If whitelistType field exists, it must be a string
  IF config ? 'whitelistType' AND jsonb_typeof(config->'whitelistType') != 'string' THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;


--
-- Name: FUNCTION validate_whitelist_config_permissive(config jsonb); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.validate_whitelist_config_permissive(config jsonb) IS 'Permissive validation for whitelist configuration JSON structure across all ERC standards - allows empty objects and flexible structure';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: redemption_window_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.redemption_window_configs (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    fund_id uuid NOT NULL,
    frequency text NOT NULL,
    submission_window_days integer DEFAULT 14 NOT NULL,
    lock_up_period integer DEFAULT 90 NOT NULL,
    max_redemption_percentage numeric(5,2),
    enable_pro_rata_distribution boolean DEFAULT true,
    queue_unprocessed_requests boolean DEFAULT true,
    use_window_nav boolean DEFAULT true,
    lock_tokens_on_request boolean DEFAULT true,
    enable_admin_override boolean DEFAULT false,
    notification_days integer DEFAULT 7,
    auto_process boolean DEFAULT false,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    CONSTRAINT positive_lockup CHECK ((lock_up_period >= 0)),
    CONSTRAINT positive_submission_days CHECK ((submission_window_days > 0)),
    CONSTRAINT redemption_window_configs_frequency_check CHECK ((frequency = ANY (ARRAY['monthly'::text, 'quarterly'::text, 'semi_annually'::text, 'annually'::text]))),
    CONSTRAINT valid_redemption_limit CHECK (((max_redemption_percentage IS NULL) OR ((max_redemption_percentage > (0)::numeric) AND (max_redemption_percentage <= (100)::numeric))))
);


--
-- Name: TABLE redemption_window_configs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.redemption_window_configs IS 'Configuration templates for redemption window creation';


--
-- Name: redemption_windows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.redemption_windows (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    config_id uuid NOT NULL,
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone NOT NULL,
    submission_start_date timestamp with time zone NOT NULL,
    submission_end_date timestamp with time zone NOT NULL,
    nav numeric(18,6),
    nav_date date,
    nav_source text,
    status text DEFAULT 'upcoming'::text NOT NULL,
    max_redemption_amount numeric(78,18),
    current_requests integer DEFAULT 0,
    total_request_value numeric(78,18) DEFAULT 0,
    approved_requests integer DEFAULT 0,
    approved_value numeric(78,18) DEFAULT 0,
    rejected_requests integer DEFAULT 0,
    rejected_value numeric(78,18) DEFAULT 0,
    queued_requests integer DEFAULT 0,
    queued_value numeric(78,18) DEFAULT 0,
    processed_by uuid,
    processed_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    CONSTRAINT positive_nav CHECK (((nav IS NULL) OR (nav > (0)::numeric))),
    CONSTRAINT redemption_windows_nav_source_check CHECK ((nav_source = ANY (ARRAY['manual'::text, 'oracle'::text, 'calculated'::text]))),
    CONSTRAINT redemption_windows_status_check CHECK ((status = ANY (ARRAY['upcoming'::text, 'submission_open'::text, 'submission_closed'::text, 'processing'::text, 'completed'::text, 'cancelled'::text]))),
    CONSTRAINT valid_submission_dates CHECK ((submission_end_date > submission_start_date)),
    CONSTRAINT valid_window_dates CHECK ((end_date > start_date))
);


--
-- Name: TABLE redemption_windows; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.redemption_windows IS 'Specific instances of redemption windows for interval funds';


--
-- Name: active_redemption_windows; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.active_redemption_windows AS
 SELECT rw.id,
    rw.config_id,
    rw.start_date,
    rw.end_date,
    rw.submission_start_date,
    rw.submission_end_date,
    rw.nav,
    rw.nav_date,
    rw.nav_source,
    rw.status,
    rw.max_redemption_amount,
    rw.current_requests,
    rw.total_request_value,
    rw.approved_requests,
    rw.approved_value,
    rw.rejected_requests,
    rw.rejected_value,
    rw.queued_requests,
    rw.queued_value,
    rw.processed_by,
    rw.processed_at,
    rw.notes,
    rw.created_at,
    rw.updated_at,
    rw.created_by,
    rwc.name AS config_name,
    rwc.frequency,
    rwc.enable_pro_rata_distribution
   FROM (public.redemption_windows rw
     JOIN public.redemption_window_configs rwc ON ((rw.config_id = rwc.id)))
  WHERE (rw.status = ANY (ARRAY['upcoming'::text, 'submission_open'::text, 'submission_closed'::text, 'processing'::text]))
  ORDER BY rw.start_date;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    action text NOT NULL,
    username text DEFAULT 'system'::text,
    details text DEFAULT 'system action'::text,
    status text DEFAULT 'Success'::text,
    signature text,
    verified boolean DEFAULT false,
    user_email text,
    user_id uuid,
    entity_type text,
    entity_id text,
    old_data jsonb,
    new_data jsonb,
    metadata jsonb,
    project_id uuid,
    action_type text,
    changes jsonb,
    occurred_at timestamp with time zone DEFAULT now(),
    system_process_id uuid,
    batch_operation_id uuid,
    severity text DEFAULT 'info'::text,
    duration integer,
    source text,
    is_automated boolean DEFAULT false,
    category character varying,
    parent_id uuid,
    correlation_id character varying,
    session_id character varying,
    ip_address character varying,
    user_agent character varying,
    api_version character varying,
    request_id character varying,
    importance integer DEFAULT 1
);


--
-- Name: TABLE audit_logs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.audit_logs IS '@omit create,update,delete
Retention policy: 90 days';


--
-- Name: activity_analytics; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.activity_analytics AS
 SELECT audit_logs.id,
    audit_logs.action,
    audit_logs.action_type AS source,
    audit_logs.category,
    audit_logs.severity,
    audit_logs."timestamp",
    audit_logs.user_id,
    audit_logs.user_email,
    audit_logs.entity_type,
    audit_logs.entity_id,
    audit_logs.status,
    audit_logs.duration,
    audit_logs.system_process_id,
    audit_logs.batch_operation_id,
    audit_logs.project_id,
    audit_logs.correlation_id,
    audit_logs.ip_address,
    audit_logs.session_id
   FROM public.audit_logs;


--
-- Name: activity_metrics; Type: MATERIALIZED VIEW; Schema: public; Owner: -
--

CREATE MATERIALIZED VIEW public.activity_metrics AS
 SELECT date_trunc('day'::text, audit_logs."timestamp") AS day,
    audit_logs.action_type,
    audit_logs.entity_type,
    audit_logs.status,
    count(*) AS activity_count,
    count(DISTINCT audit_logs.user_id) AS unique_users,
    avg(audit_logs.duration) AS avg_duration
   FROM public.audit_logs
  GROUP BY (date_trunc('day'::text, audit_logs."timestamp")), audit_logs.action_type, audit_logs.entity_type, audit_logs.status
  ORDER BY (date_trunc('day'::text, audit_logs."timestamp")) DESC, audit_logs.action_type, audit_logs.entity_type, audit_logs.status
  WITH NO DATA;


--
-- Name: activity_summary_daily; Type: MATERIALIZED VIEW; Schema: public; Owner: -
--

CREATE MATERIALIZED VIEW public.activity_summary_daily AS
 SELECT date_trunc('day'::text, audit_logs."timestamp") AS day,
    audit_logs.action_type AS source,
    audit_logs.category,
    audit_logs.status,
    audit_logs.severity,
    count(*) AS activity_count,
    count(DISTINCT audit_logs.user_id) AS unique_users_count,
    avg(audit_logs.duration) AS avg_duration
   FROM public.audit_logs
  GROUP BY (date_trunc('day'::text, audit_logs."timestamp")), audit_logs.action_type, audit_logs.category, audit_logs.status, audit_logs.severity
  WITH NO DATA;


--
-- Name: alerts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alerts (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    severity text NOT NULL,
    service text NOT NULL,
    title text NOT NULL,
    description text,
    status text DEFAULT 'OPEN'::text NOT NULL,
    assignee text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT alerts_severity_check CHECK ((severity = ANY (ARRAY['LOW'::text, 'MEDIUM'::text, 'HIGH'::text, 'CRITICAL'::text]))),
    CONSTRAINT alerts_status_check CHECK ((status = ANY (ARRAY['OPEN'::text, 'ACKNOWLEDGED'::text, 'RESOLVED'::text])))
);


--
-- Name: approval_config_approvers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.approval_config_approvers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    approval_config_id uuid NOT NULL,
    approver_type text NOT NULL,
    approver_user_id uuid,
    approver_role_id uuid,
    is_required boolean DEFAULT true,
    order_priority integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    CONSTRAINT approval_config_approvers_approver_type_check CHECK ((approver_type = ANY (ARRAY['user'::text, 'role'::text]))),
    CONSTRAINT check_approver_reference CHECK ((((approver_type = 'user'::text) AND (approver_user_id IS NOT NULL) AND (approver_role_id IS NULL)) OR ((approver_type = 'role'::text) AND (approver_role_id IS NOT NULL) AND (approver_user_id IS NULL))))
);


--
-- Name: TABLE approval_config_approvers; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.approval_config_approvers IS 'Junction table linking approval configs to specific users or roles as approvers';


--
-- Name: approval_config_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.approval_config_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    approval_config_id uuid NOT NULL,
    change_type text NOT NULL,
    old_data jsonb,
    new_data jsonb,
    changed_by uuid,
    change_reason text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT approval_config_history_change_type_check CHECK ((change_type = ANY (ARRAY['created'::text, 'updated'::text, 'deleted'::text, 'approver_added'::text, 'approver_removed'::text])))
);


--
-- Name: TABLE approval_config_history; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.approval_config_history IS 'Audit trail for changes to approval configurations';


--
-- Name: approval_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.approval_configs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    permission_id uuid NOT NULL,
    required_approvals integer DEFAULT 2 NOT NULL,
    eligible_roles text[] NOT NULL,
    auto_approval_conditions jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    consensus_type text DEFAULT '2of3'::text NOT NULL,
    config_name text,
    config_description text,
    approval_mode text DEFAULT 'mixed'::text,
    requires_all_approvers boolean DEFAULT false,
    auto_approve_threshold integer DEFAULT 0,
    escalation_config jsonb,
    notification_config jsonb,
    active boolean DEFAULT true,
    created_by uuid,
    last_modified_by uuid,
    CONSTRAINT approval_configs_approval_mode_check CHECK ((approval_mode = ANY (ARRAY['role_based'::text, 'user_specific'::text, 'mixed'::text])))
);


--
-- Name: COLUMN approval_configs.approval_mode; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.approval_configs.approval_mode IS 'Determines if config uses role-based, user-specific, or mixed approver assignment';


--
-- Name: COLUMN approval_configs.requires_all_approvers; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.approval_configs.requires_all_approvers IS 'If true, ALL configured approvers must approve; overrides consensus_type';


--
-- Name: COLUMN approval_configs.auto_approve_threshold; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.approval_configs.auto_approve_threshold IS 'Automatic approval if request amount is below this threshold';


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    priority integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    public_key text,
    encrypted_private_key text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: approval_configs_with_approvers; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.approval_configs_with_approvers AS
 SELECT ac.id,
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
    COALESCE(json_agg(
        CASE
            WHEN (aca.approver_type = 'user'::text) THEN json_build_object('type', 'user', 'id', aca.approver_user_id, 'name', u.name, 'email', u.email, 'is_required', aca.is_required, 'order_priority', aca.order_priority)
            WHEN (aca.approver_type = 'role'::text) THEN json_build_object('type', 'role', 'id', aca.approver_role_id, 'name', r.name, 'description', r.description, 'is_required', aca.is_required, 'order_priority', aca.order_priority)
            ELSE NULL::json
        END ORDER BY aca.order_priority, aca.created_at) FILTER (WHERE (aca.id IS NOT NULL)), '[]'::json) AS configured_approvers,
    count(aca.id) AS approver_count
   FROM (((public.approval_configs ac
     LEFT JOIN public.approval_config_approvers aca ON ((ac.id = aca.approval_config_id)))
     LEFT JOIN public.users u ON ((aca.approver_user_id = u.id)))
     LEFT JOIN public.roles r ON ((aca.approver_role_id = r.id)))
  GROUP BY ac.id, ac.permission_id, ac.config_name, ac.config_description, ac.approval_mode, ac.required_approvals, ac.requires_all_approvers, ac.consensus_type, ac.eligible_roles, ac.auto_approval_conditions, ac.auto_approve_threshold, ac.escalation_config, ac.notification_config, ac.active, ac.created_at, ac.updated_at, ac.created_by, ac.last_modified_by;


--
-- Name: VIEW approval_configs_with_approvers; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.approval_configs_with_approvers IS 'Consolidated view of approval configs with their configured approvers';


--
-- Name: approval_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.approval_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    action character varying(100) NOT NULL,
    resource character varying(100) NOT NULL,
    resource_id character varying(100) NOT NULL,
    requested_by uuid NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    approvers uuid[] NOT NULL,
    approved_by uuid[] DEFAULT '{}'::uuid[] NOT NULL,
    rejected_by uuid[] DEFAULT '{}'::uuid[] NOT NULL,
    required_approvals integer DEFAULT 2 NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT approval_requests_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))
);


--
-- Name: audit_coverage; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.audit_coverage AS
 SELECT tgt.tgname AS trigger_name,
    nsp.nspname AS schema_name,
    cls.relname AS table_name,
    p.proname AS function_name
   FROM (((pg_trigger tgt
     JOIN pg_class cls ON ((tgt.tgrelid = cls.oid)))
     JOIN pg_namespace nsp ON ((cls.relnamespace = nsp.oid)))
     JOIN pg_proc p ON ((tgt.tgfoid = p.oid)))
  WHERE ((p.proname = 'log_table_change'::name) AND (nsp.nspname <> ALL (ARRAY['pg_catalog'::name, 'information_schema'::name])))
  ORDER BY nsp.nspname, cls.relname;


--
-- Name: auth_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auth_events (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid,
    event_type text NOT NULL,
    ip_address text,
    user_agent text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: bulk_operations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bulk_operations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    completed_at timestamp with time zone,
    created_by uuid,
    metadata jsonb,
    operation_type text,
    status text,
    tags text[],
    target_ids uuid[],
    created_at timestamp with time zone DEFAULT now(),
    progress double precision DEFAULT 0,
    processed_count integer DEFAULT 0,
    failed_count integer DEFAULT 0,
    error_details jsonb
);


--
-- Name: TABLE bulk_operations; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.bulk_operations IS 'Tracks bulk operations performed in the system';


--
-- Name: cap_table_investors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cap_table_investors (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    cap_table_id uuid,
    investor_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: cap_tables; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cap_tables (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    description text,
    project_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: compliance_checks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.compliance_checks (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    investor_id uuid NOT NULL,
    project_id uuid NOT NULL,
    risk_level text NOT NULL,
    risk_reason text NOT NULL,
    status text NOT NULL,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT compliance_checks_risk_level_check CHECK ((risk_level = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text]))),
    CONSTRAINT compliance_checks_status_check CHECK ((status = ANY (ARRAY['pending_approval'::text, 'approved'::text, 'rejected'::text])))
);


--
-- Name: compliance_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.compliance_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    issuer_id uuid NOT NULL,
    generated_at timestamp with time zone DEFAULT now() NOT NULL,
    status public.compliance_status DEFAULT 'pending_review'::public.compliance_status NOT NULL,
    findings jsonb DEFAULT '[]'::jsonb NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid NOT NULL,
    updated_by uuid NOT NULL
);


--
-- Name: compliance_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.compliance_settings (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    organization_id text NOT NULL,
    kyc_status text DEFAULT 'not_started'::text NOT NULL,
    require_accreditation boolean DEFAULT false NOT NULL,
    minimum_investment integer DEFAULT 0 NOT NULL,
    jurisdictions text[] DEFAULT '{}'::text[],
    investor_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: consensus_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.consensus_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    consensus_type text NOT NULL,
    required_approvals integer NOT NULL,
    eligible_roles text[] NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: credential_usage_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.credential_usage_logs (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    credential_id uuid NOT NULL,
    action_type text NOT NULL,
    action_details jsonb,
    performed_by uuid,
    performed_at timestamp with time zone DEFAULT now(),
    ip_address text,
    user_agent text
);


--
-- Name: deployment_rate_limits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deployment_rate_limits (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    project_id uuid NOT NULL,
    token_id uuid NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    status text NOT NULL,
    network text,
    environment text,
    CONSTRAINT deployment_rate_limits_status_check CHECK ((status = ANY (ARRAY['started'::text, 'completed'::text, 'failed'::text])))
);


--
-- Name: dfns_activity_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dfns_activity_logs (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    activity_type text NOT NULL,
    entity_id text NOT NULL,
    entity_type text NOT NULL,
    description text NOT NULL,
    user_id text,
    status text NOT NULL,
    metadata jsonb,
    ip_address inet,
    user_agent text,
    organization_id text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT dfns_activity_logs_status_check CHECK ((status = ANY (ARRAY['success'::text, 'failed'::text, 'pending'::text])))
);


--
-- Name: dfns_api_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dfns_api_requests (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    endpoint text NOT NULL,
    method text NOT NULL,
    request_id text,
    request_body jsonb,
    response_body jsonb,
    status_code integer NOT NULL,
    response_time_ms integer,
    error_message text,
    user_id text,
    organization_id text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: dfns_applications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dfns_applications (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    app_id text NOT NULL,
    name text NOT NULL,
    description text,
    kind text NOT NULL,
    origin text,
    relying_party text,
    status text DEFAULT 'Active'::text NOT NULL,
    external_id text,
    logo_url text,
    terms_of_service_url text,
    privacy_policy_url text,
    organization_id text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT dfns_applications_kind_check CHECK ((kind = ANY (ARRAY['ClientSide'::text, 'ServerSide'::text]))),
    CONSTRAINT dfns_applications_status_check CHECK ((status = ANY (ARRAY['Active'::text, 'Inactive'::text, 'Archived'::text])))
);


--
-- Name: dfns_broadcast_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dfns_broadcast_transactions (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    broadcast_id text NOT NULL,
    wallet_id text,
    kind text NOT NULL,
    transaction text NOT NULL,
    external_id text,
    status text DEFAULT 'Pending'::text NOT NULL,
    tx_hash text,
    date_created timestamp with time zone DEFAULT now() NOT NULL,
    date_broadcast timestamp with time zone,
    date_confirmed timestamp with time zone,
    error_message text,
    dfns_broadcast_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT dfns_broadcast_transactions_status_check CHECK ((status = ANY (ARRAY['Pending'::text, 'Broadcasted'::text, 'Confirmed'::text, 'Failed'::text, 'Cancelled'::text])))
);


--
-- Name: dfns_credentials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dfns_credentials (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    credential_id text NOT NULL,
    user_id uuid,
    name text,
    kind text NOT NULL,
    status text DEFAULT 'Active'::text NOT NULL,
    public_key text NOT NULL,
    algorithm text NOT NULL,
    attestation_type text,
    authenticator_info jsonb,
    enrolled_at timestamp with time zone DEFAULT now() NOT NULL,
    last_used_at timestamp with time zone,
    dfns_credential_id text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT dfns_credentials_kind_check CHECK ((kind = ANY (ARRAY['Fido2'::text, 'Key'::text, 'Password'::text, 'RecoveryKey'::text]))),
    CONSTRAINT dfns_credentials_status_check CHECK ((status = ANY (ARRAY['Active'::text, 'Inactive'::text])))
);


--
-- Name: dfns_exchange_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dfns_exchange_accounts (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    account_id text NOT NULL,
    exchange_integration_id text,
    account_type text NOT NULL,
    trading_enabled boolean DEFAULT false,
    withdrawal_enabled boolean DEFAULT false,
    last_updated timestamp with time zone DEFAULT now(),
    dfns_account_id text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: dfns_exchange_balances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dfns_exchange_balances (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    account_id text,
    asset text NOT NULL,
    total text DEFAULT '0'::text NOT NULL,
    available text DEFAULT '0'::text NOT NULL,
    locked text DEFAULT '0'::text NOT NULL,
    last_updated timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: dfns_exchange_integrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dfns_exchange_integrations (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    integration_id text NOT NULL,
    name text NOT NULL,
    exchange_kind text NOT NULL,
    credentials jsonb NOT NULL,
    status text DEFAULT 'Active'::text NOT NULL,
    config jsonb,
    last_sync_at timestamp with time zone,
    organization_id text,
    dfns_exchange_id text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT dfns_exchange_integrations_exchange_kind_check CHECK ((exchange_kind = ANY (ARRAY['Kraken'::text, 'Binance'::text, 'CoinbasePrime'::text]))),
    CONSTRAINT dfns_exchange_integrations_status_check CHECK ((status = ANY (ARRAY['Active'::text, 'Inactive'::text, 'Error'::text])))
);


--
-- Name: dfns_fee_sponsors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dfns_fee_sponsors (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    sponsor_id text NOT NULL,
    name text NOT NULL,
    sponsor_address text NOT NULL,
    network text NOT NULL,
    status text DEFAULT 'Active'::text NOT NULL,
    balance text DEFAULT '0'::text NOT NULL,
    spent_amount text DEFAULT '0'::text NOT NULL,
    transaction_count integer DEFAULT 0,
    external_id text,
    organization_id text,
    dfns_sponsor_id text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT dfns_fee_sponsors_status_check CHECK ((status = ANY (ARRAY['Active'::text, 'Inactive'::text, 'Depleted'::text])))
);


--
-- Name: dfns_fiat_activity_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dfns_fiat_activity_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    transaction_id uuid NOT NULL,
    activity_type text NOT NULL,
    status text NOT NULL,
    description text,
    provider_data jsonb,
    error_details jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE dfns_fiat_activity_logs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.dfns_fiat_activity_logs IS 'Activity logs for fiat transaction tracking';


--
-- Name: dfns_fiat_provider_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dfns_fiat_provider_configs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider text NOT NULL,
    configuration jsonb NOT NULL,
    is_enabled boolean DEFAULT true,
    supported_currencies text[] DEFAULT '{}'::text[],
    supported_payment_methods text[] DEFAULT '{}'::text[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT dfns_fiat_provider_configs_provider_check CHECK ((provider = ANY (ARRAY['ramp_network'::text, 'mt_pelerin'::text])))
);


--
-- Name: TABLE dfns_fiat_provider_configs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.dfns_fiat_provider_configs IS 'Configuration for fiat service providers';


--
-- Name: dfns_fiat_quotes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dfns_fiat_quotes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider text NOT NULL,
    type text NOT NULL,
    from_amount numeric(20,8) NOT NULL,
    from_currency text NOT NULL,
    to_amount numeric(20,8) NOT NULL,
    to_currency text NOT NULL,
    exchange_rate numeric(20,8) NOT NULL,
    fees jsonb NOT NULL,
    payment_method text NOT NULL,
    estimated_processing_time text,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT dfns_fiat_quotes_provider_check CHECK ((provider = ANY (ARRAY['ramp_network'::text, 'mt_pelerin'::text]))),
    CONSTRAINT dfns_fiat_quotes_type_check CHECK ((type = ANY (ARRAY['onramp'::text, 'offramp'::text])))
);


--
-- Name: TABLE dfns_fiat_quotes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.dfns_fiat_quotes IS 'Stores temporary fiat conversion quotes with expiration';


--
-- Name: dfns_fiat_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dfns_fiat_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider text NOT NULL,
    provider_transaction_id text NOT NULL,
    type text NOT NULL,
    status text NOT NULL,
    amount numeric(20,8) NOT NULL,
    currency text NOT NULL,
    crypto_asset text NOT NULL,
    wallet_address text NOT NULL,
    wallet_id uuid,
    payment_method text,
    bank_account jsonb,
    payment_url text,
    withdrawal_address text,
    tx_hash text,
    exchange_rate jsonb,
    fees jsonb,
    estimated_completion_time text,
    expires_at timestamp with time zone,
    metadata jsonb DEFAULT '{}'::jsonb,
    user_id uuid,
    project_id uuid,
    organization_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT dfns_fiat_transactions_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT dfns_fiat_transactions_provider_check CHECK ((provider = ANY (ARRAY['ramp_network'::text, 'mt_pelerin'::text]))),
    CONSTRAINT dfns_fiat_transactions_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'waiting_for_payment'::text, 'payment_received'::text, 'completed'::text, 'failed'::text, 'cancelled'::text, 'expired'::text]))),
    CONSTRAINT dfns_fiat_transactions_type_check CHECK ((type = ANY (ARRAY['onramp'::text, 'offramp'::text])))
);


--
-- Name: TABLE dfns_fiat_transactions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.dfns_fiat_transactions IS 'Stores fiat on/off-ramp transactions through DFNS providers';


--
-- Name: COLUMN dfns_fiat_transactions.provider; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.dfns_fiat_transactions.provider IS 'Fiat service provider (ramp_network, mt_pelerin)';


--
-- Name: COLUMN dfns_fiat_transactions.type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.dfns_fiat_transactions.type IS 'Transaction type (onramp = fiat→crypto, offramp = crypto→fiat)';


--
-- Name: COLUMN dfns_fiat_transactions.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.dfns_fiat_transactions.status IS 'Current transaction status';


--
-- Name: COLUMN dfns_fiat_transactions.bank_account; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.dfns_fiat_transactions.bank_account IS 'Bank account information for off-ramp transactions';


--
-- Name: COLUMN dfns_fiat_transactions.payment_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.dfns_fiat_transactions.payment_url IS 'Provider payment URL for completing on-ramp transactions';


--
-- Name: COLUMN dfns_fiat_transactions.withdrawal_address; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.dfns_fiat_transactions.withdrawal_address IS 'Provider address for sending crypto in off-ramp transactions';


--
-- Name: COLUMN dfns_fiat_transactions.exchange_rate; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.dfns_fiat_transactions.exchange_rate IS 'Exchange rate information including rate, timestamp, and provider';


--
-- Name: COLUMN dfns_fiat_transactions.fees; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.dfns_fiat_transactions.fees IS 'Fee breakdown including provider fees, network fees, and total';


--
-- Name: dfns_permission_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dfns_permission_assignments (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    permission_id text,
    identity_id text NOT NULL,
    identity_kind text NOT NULL,
    assigned_by text NOT NULL,
    assigned_at timestamp with time zone DEFAULT now() NOT NULL,
    organization_id text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT dfns_permission_assignments_identity_kind_check CHECK ((identity_kind = ANY (ARRAY['User'::text, 'ServiceAccount'::text, 'PersonalAccessToken'::text])))
);


--
-- Name: dfns_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dfns_permissions (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    permission_id text NOT NULL,
    name text NOT NULL,
    resources text[] NOT NULL,
    operations text[] NOT NULL,
    effect text NOT NULL,
    condition jsonb,
    status text DEFAULT 'Active'::text NOT NULL,
    description text,
    category text,
    organization_id text,
    dfns_permission_id text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT dfns_permissions_effect_check CHECK ((effect = ANY (ARRAY['Allow'::text, 'Deny'::text]))),
    CONSTRAINT dfns_permissions_status_check CHECK ((status = ANY (ARRAY['Active'::text, 'Inactive'::text])))
);


--
-- Name: dfns_personal_access_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dfns_personal_access_tokens (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    status text DEFAULT 'Active'::text NOT NULL,
    expires_at timestamp with time zone,
    last_used_at timestamp with time zone,
    permission_assignments jsonb,
    user_id uuid,
    dfns_token_id text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT dfns_personal_access_tokens_status_check CHECK ((status = ANY (ARRAY['Active'::text, 'Inactive'::text, 'Expired'::text])))
);


--
-- Name: dfns_policies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dfns_policies (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    policy_id text NOT NULL,
    name text NOT NULL,
    description text,
    rule jsonb NOT NULL,
    activity_kind text NOT NULL,
    status text DEFAULT 'Active'::text NOT NULL,
    external_id text,
    organization_id text,
    dfns_policy_id text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT dfns_policies_status_check CHECK ((status = ANY (ARRAY['Active'::text, 'Inactive'::text])))
);


--
-- Name: dfns_policy_approvals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dfns_policy_approvals (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    approval_id text NOT NULL,
    activity_id text NOT NULL,
    policy_id text,
    status text DEFAULT 'Pending'::text NOT NULL,
    reason text,
    approved_by text,
    approved_at timestamp with time zone,
    rejected_by text,
    rejected_at timestamp with time zone,
    metadata jsonb,
    organization_id text,
    dfns_approval_id text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT dfns_policy_approvals_status_check CHECK ((status = ANY (ARRAY['Pending'::text, 'Approved'::text, 'Rejected'::text, 'Failed'::text])))
);


--
-- Name: dfns_service_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dfns_service_accounts (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    status text DEFAULT 'Active'::text NOT NULL,
    external_id text,
    public_key text,
    permission_assignments jsonb,
    organization_id text,
    dfns_service_account_id text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT dfns_service_accounts_status_check CHECK ((status = ANY (ARRAY['Active'::text, 'Inactive'::text])))
);


--
-- Name: dfns_signatures; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dfns_signatures (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    signature_id text NOT NULL,
    key_id text,
    kind text NOT NULL,
    message text NOT NULL,
    external_id text,
    status text DEFAULT 'Pending'::text NOT NULL,
    signature text,
    public_key text NOT NULL,
    date_created timestamp with time zone DEFAULT now() NOT NULL,
    date_completed timestamp with time zone,
    error_message text,
    dfns_signature_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT dfns_signatures_status_check CHECK ((status = ANY (ARRAY['Pending'::text, 'Signed'::text, 'Failed'::text, 'Cancelled'::text])))
);


--
-- Name: dfns_signing_keys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dfns_signing_keys (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    key_id text NOT NULL,
    public_key text NOT NULL,
    network text NOT NULL,
    curve text NOT NULL,
    scheme text NOT NULL,
    status text DEFAULT 'Active'::text NOT NULL,
    delegated boolean DEFAULT false,
    delegated_to text,
    external_id text,
    tags text[],
    imported boolean DEFAULT false,
    exported boolean DEFAULT false,
    date_exported timestamp with time zone,
    organization_id text,
    dfns_key_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT dfns_signing_keys_curve_check CHECK ((curve = ANY (ARRAY['ed25519'::text, 'secp256k1'::text, 'secp256r1'::text]))),
    CONSTRAINT dfns_signing_keys_scheme_check CHECK ((scheme = ANY (ARRAY['EdDSA'::text, 'ECDSA'::text]))),
    CONSTRAINT dfns_signing_keys_status_check CHECK ((status = ANY (ARRAY['Active'::text, 'Inactive'::text])))
);


--
-- Name: dfns_sponsored_fees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dfns_sponsored_fees (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    sponsored_fee_id text NOT NULL,
    fee_sponsor_id text,
    wallet_id text,
    tx_hash text NOT NULL,
    amount text NOT NULL,
    asset text NOT NULL,
    status text DEFAULT 'Pending'::text NOT NULL,
    sponsored_at timestamp with time zone DEFAULT now() NOT NULL,
    error_message text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT dfns_sponsored_fees_status_check CHECK ((status = ANY (ARRAY['Pending'::text, 'Sponsored'::text, 'Failed'::text])))
);


--
-- Name: dfns_staking_integrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dfns_staking_integrations (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    staking_id text NOT NULL,
    wallet_id text,
    network text NOT NULL,
    validator_address text,
    delegation_amount text DEFAULT '0'::text NOT NULL,
    status text NOT NULL,
    total_rewards text DEFAULT '0'::text NOT NULL,
    pending_rewards text DEFAULT '0'::text NOT NULL,
    claimed_rewards text DEFAULT '0'::text NOT NULL,
    last_reward_at timestamp with time zone,
    last_claim_at timestamp with time zone,
    apr text,
    unstaking_period text,
    dfns_staking_id text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT dfns_staking_integrations_status_check CHECK ((status = ANY (ARRAY['Delegated'::text, 'Undelegating'::text, 'Undelegated'::text, 'Slashed'::text])))
);


--
-- Name: dfns_sync_status; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dfns_sync_status (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    entity_type text NOT NULL,
    entity_id text,
    last_sync_at timestamp with time zone DEFAULT now() NOT NULL,
    sync_status text NOT NULL,
    error_message text,
    next_sync_at timestamp with time zone,
    organization_id text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT dfns_sync_status_sync_status_check CHECK ((sync_status = ANY (ARRAY['success'::text, 'failed'::text, 'in_progress'::text])))
);


--
-- Name: dfns_transaction_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dfns_transaction_history (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    wallet_id text,
    tx_hash text NOT NULL,
    direction text NOT NULL,
    status text NOT NULL,
    asset_symbol text NOT NULL,
    asset_name text,
    contract_address text,
    amount text NOT NULL,
    fee text,
    to_address text,
    from_address text,
    block_number bigint,
    block_hash text,
    "timestamp" timestamp with time zone NOT NULL,
    metadata jsonb,
    last_updated timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT dfns_transaction_history_direction_check CHECK ((direction = ANY (ARRAY['Incoming'::text, 'Outgoing'::text]))),
    CONSTRAINT dfns_transaction_history_status_check CHECK ((status = ANY (ARRAY['Pending'::text, 'Confirmed'::text, 'Failed'::text, 'Cancelled'::text])))
);


--
-- Name: dfns_transfers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dfns_transfers (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    transfer_id text NOT NULL,
    wallet_id text,
    to_address text NOT NULL,
    amount text NOT NULL,
    asset text,
    memo text,
    external_id text,
    nonce integer,
    gas_limit text,
    gas_price text,
    max_fee_per_gas text,
    max_priority_fee_per_gas text,
    status text DEFAULT 'Pending'::text NOT NULL,
    tx_hash text,
    fee text,
    date_created timestamp with time zone DEFAULT now() NOT NULL,
    date_broadcast timestamp with time zone,
    date_confirmed timestamp with time zone,
    estimated_confirmation_time text,
    error_message text,
    dfns_transfer_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT dfns_transfers_status_check CHECK ((status = ANY (ARRAY['Pending'::text, 'Broadcasted'::text, 'Confirmed'::text, 'Failed'::text, 'Cancelled'::text])))
);


--
-- Name: dfns_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dfns_users (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    username text NOT NULL,
    email text,
    status text DEFAULT 'Active'::text NOT NULL,
    kind text NOT NULL,
    external_id text,
    public_key text,
    recovery_setup boolean DEFAULT false,
    mfa_enabled boolean DEFAULT false,
    last_login_at timestamp with time zone,
    registered_at timestamp with time zone DEFAULT now() NOT NULL,
    organization_id text,
    dfns_user_id text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT dfns_users_kind_check CHECK ((kind = ANY (ARRAY['EndUser'::text, 'Employee'::text, 'PatientUser'::text]))),
    CONSTRAINT dfns_users_status_check CHECK ((status = ANY (ARRAY['Active'::text, 'Inactive'::text, 'Pending'::text, 'Suspended'::text])))
);


--
-- Name: dfns_validators; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dfns_validators (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    validator_address text NOT NULL,
    network text NOT NULL,
    name text,
    commission text DEFAULT '0'::text NOT NULL,
    delegated_amount text DEFAULT '0'::text NOT NULL,
    status text NOT NULL,
    apr text,
    uptime text,
    rank integer,
    last_updated timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT dfns_validators_status_check CHECK ((status = ANY (ARRAY['Active'::text, 'Inactive'::text, 'Jailed'::text])))
);


--
-- Name: dfns_wallet_balances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dfns_wallet_balances (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    wallet_id text,
    asset_symbol text NOT NULL,
    asset_name text,
    contract_address text,
    balance text DEFAULT '0'::text NOT NULL,
    value_in_usd text,
    decimals integer DEFAULT 18 NOT NULL,
    verified boolean DEFAULT false,
    native_asset boolean DEFAULT false,
    last_updated timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: dfns_wallet_nfts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dfns_wallet_nfts (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    wallet_id text,
    contract text NOT NULL,
    token_id text NOT NULL,
    collection text,
    name text,
    description text,
    image_url text,
    external_url text,
    attributes jsonb,
    last_updated timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: dfns_wallets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dfns_wallets (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    wallet_id text NOT NULL,
    network text NOT NULL,
    name text,
    address text NOT NULL,
    signing_key_id text,
    custodial boolean DEFAULT true,
    imported boolean DEFAULT false,
    exported boolean DEFAULT false,
    date_exported timestamp with time zone,
    external_id text,
    tags text[],
    status text DEFAULT 'Active'::text NOT NULL,
    delegated boolean DEFAULT false,
    delegated_to text,
    organization_id text,
    project_id uuid,
    investor_id uuid,
    dfns_wallet_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT dfns_wallets_status_check CHECK ((status = ANY (ARRAY['Active'::text, 'Inactive'::text])))
);


--
-- Name: dfns_webhook_deliveries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dfns_webhook_deliveries (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    delivery_id text NOT NULL,
    webhook_id text,
    event text NOT NULL,
    payload jsonb NOT NULL,
    status text DEFAULT 'Pending'::text NOT NULL,
    response_code integer,
    response_body text,
    attempts integer DEFAULT 0,
    next_retry_at timestamp with time zone,
    delivered_at timestamp with time zone,
    error_message text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT dfns_webhook_deliveries_status_check CHECK ((status = ANY (ARRAY['Pending'::text, 'Delivered'::text, 'Failed'::text, 'Retrying'::text])))
);


--
-- Name: dfns_webhooks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dfns_webhooks (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    webhook_id text NOT NULL,
    name text NOT NULL,
    url text NOT NULL,
    description text,
    events text[] NOT NULL,
    status text DEFAULT 'Active'::text NOT NULL,
    secret text,
    headers jsonb,
    external_id text,
    organization_id text,
    dfns_webhook_id text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT dfns_webhooks_status_check CHECK ((status = ANY (ARRAY['Active'::text, 'Inactive'::text])))
);


--
-- Name: distribution_redemptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.distribution_redemptions (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    distribution_id uuid NOT NULL,
    redemption_request_id uuid NOT NULL,
    amount_redeemed numeric NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT distribution_redemptions_amount_check CHECK ((amount_redeemed > (0)::numeric))
);


--
-- Name: TABLE distribution_redemptions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.distribution_redemptions IS 'Tracks which distributions have been included in redemption requests';


--
-- Name: distributions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.distributions (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    token_allocation_id uuid NOT NULL,
    investor_id uuid NOT NULL,
    subscription_id uuid NOT NULL,
    project_id uuid,
    token_type text NOT NULL,
    token_amount numeric NOT NULL,
    distribution_date timestamp with time zone NOT NULL,
    distribution_tx_hash text NOT NULL,
    wallet_id uuid,
    blockchain text NOT NULL,
    token_address text,
    token_symbol text,
    to_address text NOT NULL,
    status text DEFAULT 'confirmed'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    remaining_amount numeric NOT NULL,
    fully_redeemed boolean DEFAULT false NOT NULL,
    standard public.token_standard_enum,
    redemption_status text,
    CONSTRAINT distributions_remaining_amount_check CHECK ((remaining_amount >= (0)::numeric)),
    CONSTRAINT distributions_token_amount_check CHECK ((token_amount > (0)::numeric))
);


--
-- Name: TABLE distributions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.distributions IS 'Records of confirmed token distributions with blockchain transaction data';


--
-- Name: document_approvals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_approvals (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    document_id uuid,
    approver_id uuid,
    status text NOT NULL,
    comments text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT document_approvals_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])))
);


--
-- Name: document_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_versions (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    document_id uuid,
    version_number integer NOT NULL,
    file_path text,
    file_url text,
    uploaded_by uuid,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: document_workflows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_workflows (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    document_id uuid NOT NULL,
    required_signers uuid[] NOT NULL,
    completed_signers uuid[] DEFAULT '{}'::uuid[] NOT NULL,
    status public.workflow_status DEFAULT 'pending'::public.workflow_status NOT NULL,
    deadline timestamp with time zone,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid NOT NULL,
    updated_by uuid NOT NULL,
    CONSTRAINT valid_deadline CHECK ((deadline > created_at)),
    CONSTRAINT valid_signers CHECK (((array_length(completed_signers, 1) <= array_length(required_signers, 1)) AND (completed_signers <@ required_signers)))
);


--
-- Name: documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documents (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    file_path text,
    file_url text,
    entity_id uuid NOT NULL,
    entity_type text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    category text,
    project_id uuid,
    uploaded_by uuid,
    expiry_date timestamp with time zone,
    workflow_stage_id text,
    version integer DEFAULT 1
);


--
-- Name: faucet_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.faucet_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    wallet_address text NOT NULL,
    token_address text,
    amount text NOT NULL,
    network text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    transaction_hash text,
    user_id uuid,
    ip_address text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    CONSTRAINT faucet_requests_status_check CHECK ((status = ANY (ARRAY['PENDING'::text, 'COMPLETED'::text, 'FAILED'::text])))
);


--
-- Name: TABLE faucet_requests; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.faucet_requests IS 'Requests for testnet tokens from the faucet';


--
-- Name: COLUMN faucet_requests.wallet_address; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.faucet_requests.wallet_address IS 'Wallet address that requested tokens';


--
-- Name: COLUMN faucet_requests.token_address; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.faucet_requests.token_address IS 'Address of the token requested (null for native tokens)';


--
-- Name: COLUMN faucet_requests.amount; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.faucet_requests.amount IS 'Amount of tokens requested';


--
-- Name: COLUMN faucet_requests.network; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.faucet_requests.network IS 'Network the tokens were requested on (e.g., sepolia, mumbai)';


--
-- Name: COLUMN faucet_requests.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.faucet_requests.status IS 'Status of the request (PENDING, COMPLETED, FAILED)';


--
-- Name: COLUMN faucet_requests.transaction_hash; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.faucet_requests.transaction_hash IS 'Transaction hash for the token transfer';


--
-- Name: COLUMN faucet_requests.user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.faucet_requests.user_id IS 'ID of the user who made the request';


--
-- Name: fiat_quotes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fiat_quotes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider text NOT NULL,
    type text NOT NULL,
    from_amount numeric(20,8) NOT NULL,
    from_currency text NOT NULL,
    to_amount numeric(20,8) NOT NULL,
    to_currency text NOT NULL,
    exchange_rate numeric(20,8) NOT NULL,
    fees jsonb NOT NULL,
    payment_method text NOT NULL,
    estimated_processing_time text,
    expires_at timestamp with time zone NOT NULL,
    user_id uuid,
    session_id text,
    converted_to_transaction_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT fiat_quotes_provider_check CHECK ((provider = ANY (ARRAY['ramp_network'::text, 'mt_pelerin'::text]))),
    CONSTRAINT fiat_quotes_type_check CHECK ((type = ANY (ARRAY['onramp'::text, 'offramp'::text])))
);


--
-- Name: TABLE fiat_quotes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fiat_quotes IS 'Stores fiat transaction quotes with expiration tracking';


--
-- Name: fiat_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fiat_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider text NOT NULL,
    provider_transaction_id text NOT NULL,
    type text NOT NULL,
    status text NOT NULL,
    amount numeric(20,8) NOT NULL,
    currency text NOT NULL,
    crypto_asset text NOT NULL,
    wallet_address text NOT NULL,
    wallet_id uuid,
    payment_method text,
    bank_account jsonb,
    payment_url text,
    withdrawal_address text,
    tx_hash text,
    exchange_rate jsonb,
    fees jsonb,
    estimated_completion_time text,
    expires_at timestamp with time zone,
    metadata jsonb DEFAULT '{}'::jsonb,
    user_id uuid,
    project_id uuid,
    organization_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT fiat_transactions_provider_check CHECK ((provider = ANY (ARRAY['ramp_network'::text, 'mt_pelerin'::text]))),
    CONSTRAINT fiat_transactions_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'waiting_for_payment'::text, 'payment_received'::text, 'completed'::text, 'failed'::text, 'cancelled'::text, 'expired'::text]))),
    CONSTRAINT fiat_transactions_type_check CHECK ((type = ANY (ARRAY['onramp'::text, 'offramp'::text])))
);


--
-- Name: TABLE fiat_transactions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fiat_transactions IS 'Stores fiat on/off-ramp transactions from all providers including RAMP Network';


--
-- Name: fund_nav_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fund_nav_data (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    fund_id uuid NOT NULL,
    date date NOT NULL,
    nav numeric(18,6) NOT NULL,
    total_assets numeric(78,18) NOT NULL,
    total_liabilities numeric(78,18) DEFAULT 0 NOT NULL,
    outstanding_shares numeric(78,18) NOT NULL,
    previous_nav numeric(18,6),
    change_amount numeric(18,6),
    change_percent numeric(8,4),
    source text DEFAULT 'manual'::text NOT NULL,
    validated boolean DEFAULT false,
    validated_by uuid,
    validated_at timestamp with time zone,
    notes text,
    calculation_method text,
    market_conditions text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    CONSTRAINT fund_nav_data_source_check CHECK ((source = ANY (ARRAY['manual'::text, 'oracle'::text, 'calculated'::text, 'administrator'::text]))),
    CONSTRAINT non_negative_liabilities CHECK ((total_liabilities >= (0)::numeric)),
    CONSTRAINT positive_assets CHECK ((total_assets > (0)::numeric)),
    CONSTRAINT positive_nav CHECK ((nav > (0)::numeric)),
    CONSTRAINT positive_shares CHECK ((outstanding_shares > (0)::numeric))
);


--
-- Name: TABLE fund_nav_data; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fund_nav_data IS 'Historical Net Asset Value data for tokenized funds with validation workflow';


--
-- Name: geographic_jurisdictions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.geographic_jurisdictions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    country_code character(2) NOT NULL,
    country_code_3 character(3) NOT NULL,
    country_name text NOT NULL,
    region text NOT NULL,
    regulatory_regime text,
    sanctions_risk_level text DEFAULT 'low'::text,
    fatf_compliance_status text DEFAULT 'compliant'::text,
    tax_treaty_status text,
    kyc_requirements_level text DEFAULT 'standard'::text,
    aml_risk_rating text DEFAULT 'low'::text,
    is_ofac_sanctioned boolean DEFAULT false,
    is_eu_sanctioned boolean DEFAULT false,
    is_un_sanctioned boolean DEFAULT false,
    offshore_financial_center boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE geographic_jurisdictions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.geographic_jurisdictions IS 'Master reference table for countries and their regulatory/compliance characteristics';


--
-- Name: guardian_api_tests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.guardian_api_tests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    test_name character varying(100) NOT NULL,
    test_type character varying(50) NOT NULL,
    endpoint character varying(200) NOT NULL,
    http_method character varying(10) NOT NULL,
    request_payload jsonb,
    request_headers jsonb,
    response_status integer,
    response_payload jsonb,
    response_headers jsonb,
    guardian_wallet_id character varying(100),
    guardian_operation_id character varying(100),
    guardian_wallet_address character varying(100),
    execution_time_ms integer,
    success boolean DEFAULT false NOT NULL,
    error_message text,
    created_at timestamp with time zone DEFAULT now(),
    created_by character varying(100),
    notes text,
    CONSTRAINT guardian_api_tests_test_type_check CHECK (((test_type)::text = ANY ((ARRAY['create_wallet'::character varying, 'get_wallet'::character varying, 'get_operation'::character varying, 'list_wallets'::character varying, 'list_operations'::character varying, 'complete_flow'::character varying])::text[])))
);


--
-- Name: TABLE guardian_api_tests; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.guardian_api_tests IS 'Records of all Guardian API requests and responses for testing purposes';


--
-- Name: COLUMN guardian_api_tests.test_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.guardian_api_tests.test_type IS 'Type of test: create_wallet, get_wallet, get_operation, list_wallets, complete_flow';


--
-- Name: COLUMN guardian_api_tests.guardian_wallet_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.guardian_api_tests.guardian_wallet_id IS 'The UUID we send to Guardian for wallet creation';


--
-- Name: COLUMN guardian_api_tests.guardian_operation_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.guardian_api_tests.guardian_operation_id IS 'Operation ID returned by Guardian for async operations';


--
-- Name: guardian_operations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.guardian_operations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    operation_id character varying(100) NOT NULL,
    operation_type character varying(50) NOT NULL,
    operation_status character varying(50),
    guardian_wallet_id character varying(100),
    related_test_id uuid,
    operation_result jsonb,
    operation_error jsonb,
    created_at timestamp with time zone DEFAULT now(),
    last_checked_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone,
    check_count integer DEFAULT 0,
    notes text
);


--
-- Name: TABLE guardian_operations; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.guardian_operations IS 'Tracks Guardian operations and their status changes over time';


--
-- Name: COLUMN guardian_operations.operation_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.guardian_operations.operation_id IS 'Guardian operation ID for tracking async operations';


--
-- Name: COLUMN guardian_operations.operation_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.guardian_operations.operation_type IS 'Type of operation being tracked';


--
-- Name: guardian_wallets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.guardian_wallets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    guardian_wallet_id character varying(100) NOT NULL,
    guardian_operation_id character varying(100),
    guardian_internal_id character varying(100),
    wallet_name character varying(200),
    wallet_status character varying(50),
    wallet_addresses jsonb,
    wallet_metadata jsonb,
    creation_request_id uuid,
    operation_check_request_id uuid,
    wallet_details_request_id uuid,
    requested_at timestamp with time zone DEFAULT now(),
    operation_completed_at timestamp with time zone,
    wallet_retrieved_at timestamp with time zone,
    test_notes text,
    created_by character varying(100),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE guardian_wallets; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.guardian_wallets IS 'Tracks Guardian wallets through their lifecycle from creation to completion';


--
-- Name: COLUMN guardian_wallets.guardian_wallet_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.guardian_wallets.guardian_wallet_id IS 'The UUID we sent to Guardian (our identifier)';


--
-- Name: COLUMN guardian_wallets.guardian_internal_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.guardian_wallets.guardian_internal_id IS 'Guardian internal wallet ID if different from our UUID';


--
-- Name: COLUMN guardian_wallets.wallet_addresses; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.guardian_wallets.wallet_addresses IS 'JSON array of wallet addresses from Guardian';


--
-- Name: health_checks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.health_checks (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    service text NOT NULL,
    status text NOT NULL,
    response_time integer,
    details jsonb DEFAULT '{}'::jsonb,
    last_check timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT health_checks_status_check CHECK ((status = ANY (ARRAY['HEALTHY'::text, 'DEGRADED'::text, 'UNHEALTHY'::text])))
);


--
-- Name: investor_approvals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.investor_approvals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    investor_id uuid NOT NULL,
    reviewer_id uuid,
    status text DEFAULT 'pending'::text NOT NULL,
    rejection_reason text,
    approval_date timestamp with time zone,
    submission_date timestamp with time zone DEFAULT now(),
    approval_type text NOT NULL,
    required_documents jsonb,
    review_notes text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: investor_group_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.investor_group_members (
    group_id uuid NOT NULL,
    investor_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: investor_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.investor_groups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    project_id uuid,
    description text,
    member_count integer DEFAULT 0 NOT NULL,
    "group" text
);


--
-- Name: investor_groups_investors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.investor_groups_investors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    group_id uuid NOT NULL,
    investor_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: investors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.investors (
    investor_id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    type text NOT NULL,
    wallet_address text,
    kyc_status public.kyc_status NOT NULL,
    "lastUpdated" text,
    verification_details jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    kyc_expiry_date timestamp with time zone,
    company text,
    notes text,
    investor_status text DEFAULT 'pending'::text,
    investor_type text DEFAULT 'individual'::text,
    onboarding_completed boolean DEFAULT false,
    risk_assessment jsonb,
    profile_data jsonb,
    accreditation_status text DEFAULT 'not_started'::text,
    accreditation_expiry_date timestamp with time zone,
    accreditation_type text,
    tax_residency text,
    tax_id_number text,
    investment_preferences jsonb,
    last_compliance_check timestamp with time zone
);


--
-- Name: TABLE investors; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.investors IS 'Investor records with KYC status, expiry dates, and verification details. KYC status is an enum: approved, pending, failed, not_started, expired.';


--
-- Name: investors_backup_pre_kyc_update; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.investors_backup_pre_kyc_update (
    investor_id uuid,
    name text,
    email text,
    type text,
    wallet_address text,
    kyc_status text,
    "lastUpdated" text,
    verification_details jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    kyc_expiry_date timestamp with time zone,
    company text,
    notes text,
    investor_status text,
    investor_type text,
    onboarding_completed boolean,
    risk_assessment jsonb,
    profile_data jsonb,
    accreditation_status text,
    accreditation_expiry_date timestamp with time zone,
    accreditation_type text,
    tax_residency text,
    tax_id_number text,
    investment_preferences jsonb,
    last_compliance_check timestamp with time zone
);


--
-- Name: invoice; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoice (
    invoice_id integer NOT NULL,
    provider_id integer,
    patient_name character varying(255),
    patient_dob date,
    service_dates character varying(255),
    procedure_codes character varying(255),
    diagnosis_codes character varying(255),
    billed_amount numeric(10,2),
    adjustments numeric(10,2),
    net_amount_due numeric(10,2),
    payer_id integer,
    policy_number character varying(50),
    invoice_number character varying(50),
    invoice_date date,
    due_date date,
    factoring_discount_rate numeric(5,2),
    factoring_terms text,
    upload_timestamp timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    pool_id integer,
    CONSTRAINT invoice_net_amount_due_check CHECK ((net_amount_due >= (0)::numeric))
);


--
-- Name: invoice_invoice_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.invoice ALTER COLUMN invoice_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.invoice_invoice_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    amount numeric,
    created_at timestamp with time zone DEFAULT now(),
    currency text,
    due_date date,
    invoice_number text,
    issued_date date,
    paid boolean DEFAULT false,
    subscription_id uuid
);


--
-- Name: issuer_access_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.issuer_access_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    issuer_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role public.issuer_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid NOT NULL,
    updated_by uuid NOT NULL
);


--
-- Name: issuer_detail_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.issuer_detail_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    document_type text NOT NULL,
    document_url text NOT NULL,
    document_name text NOT NULL,
    uploaded_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    uploaded_by uuid,
    status text DEFAULT 'active'::text,
    metadata jsonb,
    is_public boolean DEFAULT false NOT NULL
);


--
-- Name: TABLE issuer_detail_documents; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.issuer_detail_documents IS 'Documents related to issuer details for projects including legal and regulatory compliance';


--
-- Name: COLUMN issuer_detail_documents.document_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.issuer_detail_documents.document_type IS 'Type of issuer document (creditworthiness, term_sheet, legal_regulatory_compliance, etc.)';


--
-- Name: COLUMN issuer_detail_documents.is_public; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.issuer_detail_documents.is_public IS 'Controls whether the document is visible to investors in the investor portal';


--
-- Name: issuer_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.issuer_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    issuer_id uuid NOT NULL,
    document_type public.document_type NOT NULL,
    file_url text NOT NULL,
    status public.document_status DEFAULT 'pending'::public.document_status NOT NULL,
    uploaded_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone,
    last_reviewed_at timestamp with time zone,
    reviewed_by uuid,
    version integer DEFAULT 1 NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid NOT NULL,
    updated_by uuid NOT NULL,
    CONSTRAINT valid_expiry_date CHECK ((expires_at > uploaded_at)),
    CONSTRAINT valid_review_date CHECK ((last_reviewed_at >= uploaded_at))
);


--
-- Name: kyc_screening_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kyc_screening_logs (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    investor_id uuid NOT NULL,
    previous_status text,
    new_status text,
    method text NOT NULL,
    notes text,
    performed_by text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: latest_nav_by_fund; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.latest_nav_by_fund AS
 SELECT DISTINCT ON (fund_nav_data.fund_id) fund_nav_data.fund_id,
    fund_nav_data.date,
    fund_nav_data.nav,
    fund_nav_data.change_amount,
    fund_nav_data.change_percent,
    fund_nav_data.source,
    fund_nav_data.validated,
    fund_nav_data.created_at
   FROM public.fund_nav_data
  ORDER BY fund_nav_data.fund_id, fund_nav_data.date DESC;


--
-- Name: mfa_policies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mfa_policies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    required boolean NOT NULL,
    applies_to uuid[] NOT NULL,
    exceptions uuid[] NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: monitoring_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.monitoring_metrics (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    service text NOT NULL,
    metric_name text NOT NULL,
    value numeric NOT NULL,
    unit text DEFAULT 'count'::text,
    tags jsonb DEFAULT '{}'::jsonb,
    recorded_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: moonpay_asset_cache; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.moonpay_asset_cache (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    contract_address text NOT NULL,
    token_id text NOT NULL,
    asset_data jsonb NOT NULL,
    cached_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone DEFAULT (now() + '24:00:00'::interval)
);


--
-- Name: moonpay_compliance_alerts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.moonpay_compliance_alerts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    alert_id text,
    alert_type text NOT NULL,
    severity text DEFAULT 'medium'::text NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    customer_id text,
    transaction_id text,
    entity_type text,
    entity_id text,
    risk_score numeric,
    risk_level text,
    title text NOT NULL,
    description text NOT NULL,
    details jsonb DEFAULT '{}'::jsonb,
    screening_results jsonb DEFAULT '{}'::jsonb,
    recommended_actions text[],
    assigned_to text,
    reviewed_by text,
    resolved_by text,
    escalated_to text,
    resolution_notes text,
    auto_generated boolean DEFAULT false,
    source text DEFAULT 'moonpay_api'::text,
    external_reference text,
    related_alerts text[],
    metadata jsonb DEFAULT '{}'::jsonb,
    triggered_at timestamp with time zone DEFAULT now(),
    reviewed_at timestamp with time zone,
    resolved_at timestamp with time zone,
    escalated_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_moonpay_compliance_alerts_resolved_logic CHECK ((((status = 'resolved'::text) AND (resolved_at IS NOT NULL) AND (resolved_by IS NOT NULL)) OR (status <> 'resolved'::text))),
    CONSTRAINT chk_moonpay_compliance_alerts_risk_score_range CHECK (((risk_score IS NULL) OR ((risk_score >= (0)::numeric) AND (risk_score <= (100)::numeric)))),
    CONSTRAINT moonpay_compliance_alerts_alert_type_check CHECK ((alert_type = ANY (ARRAY['aml_screening'::text, 'sanctions_check'::text, 'pep_screening'::text, 'transaction_monitoring'::text, 'kyc_verification'::text, 'suspicious_activity'::text, 'risk_threshold'::text, 'policy_violation'::text, 'document_verification'::text, 'identity_verification'::text, 'address_verification'::text]))),
    CONSTRAINT moonpay_compliance_alerts_entity_type_check CHECK ((entity_type = ANY (ARRAY['customer'::text, 'transaction'::text, 'policy'::text, 'system'::text]))),
    CONSTRAINT moonpay_compliance_alerts_risk_level_check CHECK ((risk_level = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'extreme'::text]))),
    CONSTRAINT moonpay_compliance_alerts_risk_score_check CHECK (((risk_score >= (0)::numeric) AND (risk_score <= (100)::numeric))),
    CONSTRAINT moonpay_compliance_alerts_severity_check CHECK ((severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))),
    CONSTRAINT moonpay_compliance_alerts_status_check CHECK ((status = ANY (ARRAY['open'::text, 'in_review'::text, 'resolved'::text, 'dismissed'::text, 'escalated'::text])))
);


--
-- Name: TABLE moonpay_compliance_alerts; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.moonpay_compliance_alerts IS 'Compliance monitoring alerts including AML screening, sanctions checking, and policy violations';


--
-- Name: COLUMN moonpay_compliance_alerts.screening_results; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.moonpay_compliance_alerts.screening_results IS 'JSON results from AML/sanctions/PEP screening processes';


--
-- Name: COLUMN moonpay_compliance_alerts.recommended_actions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.moonpay_compliance_alerts.recommended_actions IS 'Array of recommended actions to address the compliance alert';


--
-- Name: moonpay_customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.moonpay_customers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    external_customer_id text,
    moonpay_customer_id text,
    email text,
    first_name text,
    last_name text,
    date_of_birth date,
    address jsonb,
    kyc_level text DEFAULT 'none'::text,
    identity_verification_status text,
    verification_documents jsonb,
    transaction_limits jsonb,
    preferred_payment_methods text[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT moonpay_customers_identity_verification_status_check CHECK ((identity_verification_status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text]))),
    CONSTRAINT moonpay_customers_kyc_level_check CHECK ((kyc_level = ANY (ARRAY['none'::text, 'basic'::text, 'enhanced'::text, 'premium'::text])))
);


--
-- Name: moonpay_passes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.moonpay_passes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    external_pass_id text,
    project_id text NOT NULL,
    contract_address text NOT NULL,
    token_id text NOT NULL,
    metadata_url text,
    name text NOT NULL,
    description text,
    image text,
    attributes jsonb,
    owner_address text,
    status text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT moonpay_passes_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'minted'::text, 'transferred'::text, 'burned'::text])))
);


--
-- Name: moonpay_policies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.moonpay_policies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    external_policy_id text,
    name text NOT NULL,
    type text NOT NULL,
    rules jsonb NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT moonpay_policies_type_check CHECK ((type = ANY (ARRAY['kyc'::text, 'transaction'::text, 'compliance'::text, 'risk'::text])))
);


--
-- Name: moonpay_policy_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.moonpay_policy_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    log_id text,
    policy_id text NOT NULL,
    policy_name text NOT NULL,
    policy_type text NOT NULL,
    action_type text NOT NULL,
    execution_status text DEFAULT 'success'::text NOT NULL,
    entity_type text,
    entity_id text,
    customer_id text,
    transaction_id text,
    rule_conditions jsonb DEFAULT '{}'::jsonb,
    rule_results jsonb DEFAULT '{}'::jsonb,
    violation_details jsonb DEFAULT '{}'::jsonb,
    before_state jsonb DEFAULT '{}'::jsonb,
    after_state jsonb DEFAULT '{}'::jsonb,
    triggered_by text,
    executed_by text,
    approved_by text,
    reason text,
    notes text,
    severity text DEFAULT 'info'::text,
    compliance_impact text,
    requires_action boolean DEFAULT false,
    action_taken text,
    follow_up_required boolean DEFAULT false,
    follow_up_date timestamp with time zone,
    retention_period_days integer DEFAULT 2555,
    auto_generated boolean DEFAULT false,
    source text DEFAULT 'moonpay_policy_engine'::text,
    correlation_id text,
    session_id text,
    ip_address inet,
    user_agent text,
    metadata jsonb DEFAULT '{}'::jsonb,
    executed_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_moonpay_policy_logs_retention_period CHECK (((retention_period_days > 0) AND (retention_period_days <= 3650))),
    CONSTRAINT moonpay_policy_logs_action_type_check CHECK ((action_type = ANY (ARRAY['policy_created'::text, 'policy_updated'::text, 'policy_deleted'::text, 'policy_activated'::text, 'policy_deactivated'::text, 'rule_triggered'::text, 'rule_passed'::text, 'rule_failed'::text, 'violation_detected'::text, 'exception_granted'::text, 'review_initiated'::text, 'review_completed'::text, 'approval_required'::text, 'approval_granted'::text, 'approval_denied'::text]))),
    CONSTRAINT moonpay_policy_logs_compliance_impact_check CHECK ((compliance_impact = ANY (ARRAY['none'::text, 'low'::text, 'medium'::text, 'high'::text, 'critical'::text]))),
    CONSTRAINT moonpay_policy_logs_entity_type_check CHECK ((entity_type = ANY (ARRAY['customer'::text, 'transaction'::text, 'policy'::text, 'rule'::text, 'system'::text]))),
    CONSTRAINT moonpay_policy_logs_execution_status_check CHECK ((execution_status = ANY (ARRAY['success'::text, 'failure'::text, 'warning'::text, 'skipped'::text]))),
    CONSTRAINT moonpay_policy_logs_policy_type_check CHECK ((policy_type = ANY (ARRAY['kyc_policy'::text, 'transaction_limit'::text, 'risk_assessment'::text, 'compliance_rule'::text, 'aml_policy'::text, 'sanctions_policy'::text, 'geographic_restriction'::text, 'customer_verification'::text]))),
    CONSTRAINT moonpay_policy_logs_severity_check CHECK ((severity = ANY (ARRAY['info'::text, 'warning'::text, 'error'::text, 'critical'::text])))
);


--
-- Name: TABLE moonpay_policy_logs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.moonpay_policy_logs IS 'Audit trail of policy execution, violations, and compliance actions with retention management';


--
-- Name: COLUMN moonpay_policy_logs.retention_period_days; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.moonpay_policy_logs.retention_period_days IS 'Number of days to retain this log entry for compliance purposes (default 7 years)';


--
-- Name: COLUMN moonpay_policy_logs.correlation_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.moonpay_policy_logs.correlation_id IS 'Unique identifier to correlate related policy actions across multiple logs';


--
-- Name: moonpay_projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.moonpay_projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    external_project_id text,
    name text NOT NULL,
    description text,
    contract_address text,
    network text NOT NULL,
    total_supply integer,
    max_supply integer,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: moonpay_swap_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.moonpay_swap_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    external_transaction_id text,
    quote_id text NOT NULL,
    status text NOT NULL,
    base_currency text NOT NULL,
    quote_currency text NOT NULL,
    base_amount numeric NOT NULL,
    quote_amount numeric NOT NULL,
    from_address text NOT NULL,
    to_address text NOT NULL,
    tx_hash text,
    fees jsonb,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT moonpay_swap_transactions_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text, 'expired'::text])))
);


--
-- Name: moonpay_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.moonpay_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    external_transaction_id text,
    type text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    crypto_currency text NOT NULL,
    fiat_currency text NOT NULL,
    crypto_amount numeric,
    fiat_amount numeric NOT NULL,
    wallet_address text,
    payment_method text,
    customer_id text,
    redirect_url text,
    widget_redirect_url text,
    fees jsonb,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT moonpay_transactions_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text, 'waitingPayment'::text, 'waitingAuthorization'::text]))),
    CONSTRAINT moonpay_transactions_type_check CHECK ((type = ANY (ARRAY['buy'::text, 'sell'::text])))
);


--
-- Name: TABLE moonpay_transactions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.moonpay_transactions IS 'Stores Moonpay buy/sell transactions for fiat-to-crypto operations';


--
-- Name: moonpay_webhook_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.moonpay_webhook_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    webhook_id text,
    url text NOT NULL,
    environment text DEFAULT 'sandbox'::text NOT NULL,
    events text[] DEFAULT '{}'::text[] NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    version text DEFAULT 'v1'::text,
    secret_key text,
    description text,
    retry_policy jsonb DEFAULT '{"timeout": 30000, "max_delay": 30000, "max_attempts": 3, "initial_delay": 1000, "backoff_strategy": "exponential"}'::jsonb,
    headers jsonb DEFAULT '{}'::jsonb,
    delivery_settings jsonb DEFAULT '{"enabled": true, "timeout": 30, "verify_ssl": true}'::jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    last_delivery_attempt timestamp with time zone,
    last_successful_delivery timestamp with time zone,
    last_failure_reason text,
    delivery_attempts_count integer DEFAULT 0,
    successful_deliveries_count integer DEFAULT 0,
    failed_deliveries_count integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_by text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_moonpay_webhook_config_events_not_empty CHECK ((array_length(events, 1) > 0)),
    CONSTRAINT chk_moonpay_webhook_config_url_format CHECK ((url ~* '^https?://'::text)),
    CONSTRAINT moonpay_webhook_config_environment_check CHECK ((environment = ANY (ARRAY['sandbox'::text, 'production'::text]))),
    CONSTRAINT moonpay_webhook_config_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'suspended'::text, 'failed'::text])))
);


--
-- Name: TABLE moonpay_webhook_config; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.moonpay_webhook_config IS 'Configuration and management of MoonPay webhooks including delivery settings, retry policies, and monitoring';


--
-- Name: COLUMN moonpay_webhook_config.retry_policy; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.moonpay_webhook_config.retry_policy IS 'JSON configuration for webhook delivery retry logic including backoff strategy and limits';


--
-- Name: COLUMN moonpay_webhook_config.delivery_settings; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.moonpay_webhook_config.delivery_settings IS 'JSON configuration for webhook delivery including SSL verification and timeout settings';


--
-- Name: moonpay_webhook_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.moonpay_webhook_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_type text NOT NULL,
    event_data jsonb NOT NULL,
    signature text NOT NULL,
    processed boolean DEFAULT false,
    processing_attempts integer DEFAULT 0,
    last_processing_error text,
    received_at timestamp with time zone DEFAULT now(),
    processed_at timestamp with time zone
);


--
-- Name: multi_sig_confirmations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.multi_sig_confirmations (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    transaction_id uuid,
    owner text NOT NULL,
    signature text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    confirmed boolean,
    signer text,
    "timestamp" timestamp with time zone
);


--
-- Name: multi_sig_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.multi_sig_transactions (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    wallet_id uuid,
    destination_wallet_address text NOT NULL,
    value text NOT NULL,
    data text DEFAULT '0x'::text NOT NULL,
    nonce integer NOT NULL,
    hash text NOT NULL,
    executed boolean DEFAULT false NOT NULL,
    confirmations integer DEFAULT 0 NOT NULL,
    blockchain text NOT NULL,
    token_address text,
    token_symbol text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    blockchain_specific_data jsonb,
    description text,
    required integer,
    "to" text
);


--
-- Name: multi_sig_wallets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.multi_sig_wallets (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    blockchain text NOT NULL,
    address text NOT NULL,
    owners text[] NOT NULL,
    threshold integer NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    status text DEFAULT 'active'::text,
    blocked_at timestamp with time zone,
    block_reason text,
    CONSTRAINT multi_sig_wallets_blockchain_check CHECK ((blockchain = ANY (ARRAY['ethereum'::text, 'polygon'::text, 'avalanche'::text, 'optimism'::text, 'solana'::text, 'bitcoin'::text, 'ripple'::text, 'aptos'::text, 'sui'::text, 'mantle'::text, 'stellar'::text, 'hedera'::text, 'base'::text, 'zksync'::text, 'arbitrum'::text, 'near'::text]))),
    CONSTRAINT multi_sig_wallets_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'active'::text, 'blocked'::text])))
);


--
-- Name: nav_oracle_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nav_oracle_configs (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    fund_id uuid NOT NULL,
    name text NOT NULL,
    oracle_type text NOT NULL,
    endpoint_url text,
    api_key_encrypted text,
    response_path text,
    update_frequency integer DEFAULT 3600,
    last_update timestamp with time zone,
    min_nav numeric(18,6),
    max_nav numeric(18,6),
    max_change_percent numeric(8,4) DEFAULT 10.0,
    active boolean DEFAULT true,
    success_rate numeric(5,2) DEFAULT 0.0,
    last_error text,
    consecutive_failures integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    CONSTRAINT nav_oracle_configs_oracle_type_check CHECK ((oracle_type = ANY (ARRAY['chainlink'::text, 'api3'::text, 'custom_api'::text, 'manual'::text]))),
    CONSTRAINT positive_frequency CHECK ((update_frequency > 0)),
    CONSTRAINT valid_change_limit CHECK ((max_change_percent > (0)::numeric)),
    CONSTRAINT valid_success_rate CHECK (((success_rate >= (0)::numeric) AND (success_rate <= (100)::numeric)))
);


--
-- Name: TABLE nav_oracle_configs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.nav_oracle_configs IS 'Oracle configurations for automated NAV data feeds';


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id text NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    date timestamp with time zone DEFAULT now() NOT NULL,
    read boolean DEFAULT false NOT NULL,
    action_required boolean DEFAULT false NOT NULL,
    action_url text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: onboarding_restrictions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.onboarding_restrictions (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    type text NOT NULL,
    value text NOT NULL,
    reason text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by text NOT NULL,
    CONSTRAINT onboarding_restrictions_type_check CHECK ((type = ANY (ARRAY['COUNTRY'::text, 'INVESTOR_TYPE'::text])))
);


--
-- Name: onchain_claims; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.onchain_claims (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    identity_id uuid,
    issuer_id uuid,
    topic integer NOT NULL,
    data text,
    signature text NOT NULL,
    valid_from timestamp with time zone,
    valid_to timestamp with time zone,
    verification_timestamp timestamp with time zone DEFAULT now() NOT NULL,
    status text NOT NULL,
    CONSTRAINT onchain_claims_status_check CHECK ((status = ANY (ARRAY['VALID'::text, 'INVALID'::text, 'EXPIRED'::text, 'REVOKED'::text])))
);


--
-- Name: onchain_identities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.onchain_identities (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid,
    identity_address text NOT NULL,
    blockchain text NOT NULL,
    network text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: onchain_issuers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.onchain_issuers (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    issuer_address text NOT NULL,
    issuer_name text NOT NULL,
    blockchain text NOT NULL,
    network text NOT NULL,
    trusted_for_claims integer[] DEFAULT '{}'::integer[] NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: onchain_verification_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.onchain_verification_history (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    identity_id uuid,
    verification_type text NOT NULL,
    required_claims integer[] DEFAULT '{}'::integer[] NOT NULL,
    result boolean NOT NULL,
    reason text,
    verification_timestamp timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: organizations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organizations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    legal_name text,
    registration_number text,
    registration_date timestamp with time zone,
    tax_id text,
    jurisdiction text,
    business_type text,
    status text DEFAULT 'pending'::text,
    contact_email text,
    contact_phone text,
    website text,
    address jsonb,
    legal_representatives jsonb,
    compliance_status text DEFAULT 'pending_review'::text,
    onboarding_completed boolean DEFAULT false,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: payer; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payer (
    payer_id integer NOT NULL,
    name character varying(255)
);


--
-- Name: payer_payer_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.payer ALTER COLUMN payer_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.payer_payer_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    name text NOT NULL,
    description text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: policy_rule_approvers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.policy_rule_approvers (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    policy_rule_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    status text DEFAULT 'pending'::text,
    comment text,
    "timestamp" timestamp with time zone
);


--
-- Name: policy_rule_approvers_backup; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.policy_rule_approvers_backup (
    policy_rule_id uuid,
    user_id uuid,
    created_at timestamp with time zone,
    created_by uuid,
    status text,
    comment text,
    "timestamp" timestamp with time zone
);


--
-- Name: policy_template_approvers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.policy_template_approvers (
    template_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_by uuid,
    status text DEFAULT 'pending'::text,
    "timestamp" timestamp with time zone DEFAULT now()
);


--
-- Name: policy_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.policy_templates (
    template_id uuid DEFAULT gen_random_uuid() NOT NULL,
    template_name text NOT NULL,
    description text,
    template_data jsonb NOT NULL,
    created_by text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    template_type text GENERATED ALWAYS AS (
CASE
    WHEN ((template_data ->> 'type'::text) IS NOT NULL) THEN (template_data ->> 'type'::text)
    ELSE 'general'::text
END) STORED,
    status text DEFAULT 'active'::text NOT NULL
);


--
-- Name: TABLE policy_templates; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.policy_templates IS 'Stores reusable policy templates';


--
-- Name: COLUMN policy_templates.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.policy_templates.status IS 'Status of the template (active, inactive)';


--
-- Name: pool; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pool (
    pool_id integer NOT NULL,
    pool_name character varying(255),
    pool_type public.pool_type_enum,
    creation_timestamp timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: pool_pool_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.pool ALTER COLUMN pool_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.pool_pool_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: project_credentials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_credentials (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    project_id uuid NOT NULL,
    public_key text NOT NULL,
    key_vault_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    revoked_at timestamp with time zone,
    is_active boolean DEFAULT true
);


--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    project_type text,
    token_symbol text,
    target_raise numeric,
    authorized_shares integer,
    share_price numeric,
    company_valuation numeric,
    legal_entity text,
    jurisdiction text,
    tax_id text,
    status text DEFAULT 'active'::text,
    is_primary boolean DEFAULT false,
    investment_status text DEFAULT 'Open'::text NOT NULL,
    estimated_yield_percentage numeric,
    duration public.project_duration,
    subscription_start_date timestamp with time zone,
    subscription_end_date timestamp with time zone,
    transaction_start_date timestamp with time zone,
    maturity_date timestamp with time zone,
    currency character varying(3) DEFAULT 'USD'::character varying,
    minimum_investment numeric,
    total_notional numeric,
    CONSTRAINT projects_investment_status_check CHECK ((investment_status = ANY (ARRAY['Open'::text, 'Closed'::text])))
);


--
-- Name: COLUMN projects.investment_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.projects.investment_status IS 'Indicates whether the project is open or closed for investment';


--
-- Name: COLUMN projects.estimated_yield_percentage; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.projects.estimated_yield_percentage IS 'The estimated yield percentage for the project';


--
-- Name: COLUMN projects.duration; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.projects.duration IS 'The expected duration of the project (1, 3, 6, 9, 12, or >12 months)';


--
-- Name: COLUMN projects.subscription_start_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.projects.subscription_start_date IS 'Date when subscription period begins';


--
-- Name: COLUMN projects.subscription_end_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.projects.subscription_end_date IS 'Date when subscription period ends';


--
-- Name: COLUMN projects.transaction_start_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.projects.transaction_start_date IS 'Date when the transaction/offering officially begins';


--
-- Name: COLUMN projects.maturity_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.projects.maturity_date IS 'Maturity date for the offering';


--
-- Name: provider; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.provider (
    provider_id integer NOT NULL,
    name character varying(255),
    address character varying(255)
);


--
-- Name: provider_provider_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.provider ALTER COLUMN provider_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.provider_provider_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: ramp_network_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ramp_network_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid,
    api_key_encrypted text NOT NULL,
    host_app_name text NOT NULL,
    host_logo_url text NOT NULL,
    enabled_flows text[] DEFAULT ARRAY['ONRAMP'::text, 'OFFRAMP'::text] NOT NULL,
    environment text DEFAULT 'production'::text NOT NULL,
    webhook_secret_encrypted text,
    configuration jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ramp_network_config_environment_check CHECK ((environment = ANY (ARRAY['staging'::text, 'production'::text])))
);


--
-- Name: TABLE ramp_network_config; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.ramp_network_config IS 'RAMP Network API configuration per organization';


--
-- Name: ramp_supported_assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ramp_supported_assets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    symbol text NOT NULL,
    name text NOT NULL,
    chain text NOT NULL,
    type text NOT NULL,
    address text,
    logo_url text,
    enabled boolean DEFAULT true NOT NULL,
    hidden boolean DEFAULT false NOT NULL,
    decimals integer NOT NULL,
    price_data jsonb,
    currency_code text DEFAULT 'USD'::text NOT NULL,
    min_purchase_amount numeric(20,8),
    max_purchase_amount numeric(20,8),
    min_purchase_crypto_amount text,
    network_fee numeric(20,8),
    flow_type text NOT NULL,
    last_updated timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ramp_supported_assets_flow_type_check CHECK ((flow_type = ANY (ARRAY['onramp'::text, 'offramp'::text, 'both'::text])))
);


--
-- Name: TABLE ramp_supported_assets; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.ramp_supported_assets IS 'Cache of RAMP Network supported assets with pricing and limits';


--
-- Name: ramp_transaction_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ramp_transaction_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    transaction_id uuid NOT NULL,
    event_type text NOT NULL,
    event_data jsonb NOT NULL,
    ramp_event_id text,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL,
    session_id text,
    user_agent text,
    ip_address inet
);


--
-- Name: TABLE ramp_transaction_events; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.ramp_transaction_events IS 'Detailed event tracking for RAMP Network transactions';


--
-- Name: ramp_webhook_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ramp_webhook_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id text NOT NULL,
    event_type text NOT NULL,
    flow_type text NOT NULL,
    payload jsonb NOT NULL,
    processing_status text DEFAULT 'pending'::text NOT NULL,
    error_message text,
    processed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ramp_webhook_events_flow_type_check CHECK ((flow_type = ANY (ARRAY['onramp'::text, 'offramp'::text]))),
    CONSTRAINT ramp_webhook_events_processing_status_check CHECK ((processing_status = ANY (ARRAY['pending'::text, 'processed'::text, 'failed'::text])))
);


--
-- Name: TABLE ramp_webhook_events; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.ramp_webhook_events IS 'Stores RAMP Network webhook events for audit and processing tracking';


--
-- Name: redemption_approver_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.redemption_approver_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    redemption_request_id uuid NOT NULL,
    approval_config_id uuid NOT NULL,
    approver_user_id uuid NOT NULL,
    assigned_at timestamp with time zone DEFAULT now(),
    status text DEFAULT 'pending'::text,
    approval_timestamp timestamp with time zone,
    rejection_reason text,
    comments text,
    approval_signature text,
    ip_address inet,
    user_agent text,
    CONSTRAINT redemption_approver_assignments_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'recused'::text])))
);


--
-- Name: TABLE redemption_approver_assignments; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.redemption_approver_assignments IS 'Tracks approver assignments and their status for specific redemption requests';


--
-- Name: redemption_approval_status; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.redemption_approval_status AS
 SELECT raa.redemption_request_id,
    raa.approval_config_id,
    ac.config_name,
    ac.required_approvals,
    ac.consensus_type,
    count(raa.id) AS total_assigned_approvers,
    count(
        CASE
            WHEN (raa.status = 'approved'::text) THEN 1
            ELSE NULL::integer
        END) AS approved_count,
    count(
        CASE
            WHEN (raa.status = 'rejected'::text) THEN 1
            ELSE NULL::integer
        END) AS rejected_count,
    count(
        CASE
            WHEN (raa.status = 'pending'::text) THEN 1
            ELSE NULL::integer
        END) AS pending_count,
        CASE
            WHEN (count(
            CASE
                WHEN (raa.status = 'rejected'::text) THEN 1
                ELSE NULL::integer
            END) > 0) THEN 'rejected'::text
            WHEN ((ac.consensus_type = 'all'::text) AND (count(
            CASE
                WHEN (raa.status = 'approved'::text) THEN 1
                ELSE NULL::integer
            END) = count(raa.id))) THEN 'approved'::text
            WHEN ((ac.consensus_type = 'majority'::text) AND (count(
            CASE
                WHEN (raa.status = 'approved'::text) THEN 1
                ELSE NULL::integer
            END) > (count(raa.id) / 2))) THEN 'approved'::text
            WHEN ((ac.consensus_type = 'any'::text) AND (count(
            CASE
                WHEN (raa.status = 'approved'::text) THEN 1
                ELSE NULL::integer
            END) > 0)) THEN 'approved'::text
            WHEN (count(
            CASE
                WHEN (raa.status = 'approved'::text) THEN 1
                ELSE NULL::integer
            END) >= ac.required_approvals) THEN 'approved'::text
            ELSE 'pending'::text
        END AS overall_status,
    json_agg(json_build_object('user_id', raa.approver_user_id, 'user_name', u.name, 'user_email', u.email, 'status', raa.status, 'approval_timestamp', raa.approval_timestamp, 'comments', raa.comments, 'assigned_at', raa.assigned_at) ORDER BY raa.assigned_at) AS approver_details
   FROM ((public.redemption_approver_assignments raa
     JOIN public.approval_configs ac ON ((raa.approval_config_id = ac.id)))
     JOIN public.users u ON ((raa.approver_user_id = u.id)))
  GROUP BY raa.redemption_request_id, raa.approval_config_id, ac.config_name, ac.required_approvals, ac.consensus_type;


--
-- Name: VIEW redemption_approval_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.redemption_approval_status IS 'Real-time status of redemption request approvals';


--
-- Name: redemption_approvers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.redemption_approvers (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    redemption_id uuid NOT NULL,
    name text NOT NULL,
    role text NOT NULL,
    avatar_url text,
    approved boolean DEFAULT false NOT NULL,
    approved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    approver_id text NOT NULL,
    status text DEFAULT 'pending'::text,
    comments text,
    decision_date timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT redemption_approvers_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'delegated'::text])))
);


--
-- Name: TABLE redemption_approvers; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.redemption_approvers IS 'Comprehensive approval tracking for redemption requests with multi-signature workflow support';


--
-- Name: COLUMN redemption_approvers.approver_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.redemption_approvers.approver_id IS 'ID of the user who needs to approve this request';


--
-- Name: COLUMN redemption_approvers.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.redemption_approvers.status IS 'Current approval status: pending, approved, rejected, delegated';


--
-- Name: COLUMN redemption_approvers.comments; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.redemption_approvers.comments IS 'Optional comments from the approver';


--
-- Name: COLUMN redemption_approvers.decision_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.redemption_approvers.decision_date IS 'When the approval decision was made';


--
-- Name: COLUMN redemption_approvers.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.redemption_approvers.updated_at IS 'Last update timestamp, automatically maintained';


--
-- Name: redemption_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.redemption_requests (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    token_amount numeric NOT NULL,
    token_type text NOT NULL,
    redemption_type text NOT NULL,
    status text NOT NULL,
    source_wallet_address text NOT NULL,
    destination_wallet_address text NOT NULL,
    conversion_rate numeric NOT NULL,
    investor_name text,
    investor_id text,
    required_approvals integer DEFAULT 1 NOT NULL,
    is_bulk_redemption boolean DEFAULT false,
    investor_count integer DEFAULT 1,
    rejection_reason text,
    rejected_by text,
    rejection_timestamp timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: redemption_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.redemption_rules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    rule_id uuid,
    redemption_type text NOT NULL,
    require_multi_sig_approval boolean DEFAULT true,
    required_approvers integer DEFAULT 2,
    total_approvers integer DEFAULT 3,
    notify_investors boolean DEFAULT true,
    settlement_method text DEFAULT 'stablecoin'::text,
    immediate_execution boolean,
    use_latest_nav boolean,
    allow_any_time_redemption boolean,
    repurchase_frequency text,
    lock_up_period integer,
    submission_window_days integer,
    lock_tokens_on_request boolean,
    use_window_nav boolean,
    enable_pro_rata_distribution boolean,
    queue_unprocessed_requests boolean,
    enable_admin_override boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT redemption_rules_redemption_type_check CHECK ((redemption_type = ANY (ARRAY['standard'::text, 'interval'::text]))),
    CONSTRAINT redemption_rules_settlement_method_check CHECK ((settlement_method = ANY (ARRAY['stablecoin'::text, 'fiat'::text, 'hybrid'::text])))
);


--
-- Name: redemption_settlements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.redemption_settlements (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    redemption_request_id uuid NOT NULL,
    settlement_type text NOT NULL,
    status text DEFAULT 'initiated'::text NOT NULL,
    token_contract_address text NOT NULL,
    token_amount numeric(78,18) NOT NULL,
    burn_transaction_hash text,
    burn_gas_used bigint,
    burn_gas_price numeric(78,18),
    burn_status text DEFAULT 'pending'::text,
    burn_confirmed_at timestamp with time zone,
    transfer_amount numeric(78,18) NOT NULL,
    transfer_currency text DEFAULT 'USDC'::text NOT NULL,
    transfer_to_address text NOT NULL,
    transfer_transaction_hash text,
    transfer_gas_used bigint,
    transfer_gas_price numeric(78,18),
    transfer_status text DEFAULT 'pending'::text,
    transfer_confirmed_at timestamp with time zone,
    nav_used numeric(18,6),
    exchange_rate numeric(18,6),
    settlement_fee numeric(78,18) DEFAULT 0,
    gas_estimate numeric(78,18),
    estimated_completion timestamp with time zone,
    actual_completion timestamp with time zone,
    error_message text,
    retry_count integer DEFAULT 0,
    last_retry_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    CONSTRAINT positive_token_amount CHECK ((token_amount > (0)::numeric)),
    CONSTRAINT positive_transfer_amount CHECK ((transfer_amount > (0)::numeric)),
    CONSTRAINT redemption_settlements_burn_status_check CHECK ((burn_status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'failed'::text]))),
    CONSTRAINT redemption_settlements_settlement_type_check CHECK ((settlement_type = ANY (ARRAY['standard'::text, 'interval_fund'::text, 'emergency'::text]))),
    CONSTRAINT redemption_settlements_status_check CHECK ((status = ANY (ARRAY['initiated'::text, 'burning_tokens'::text, 'transferring_funds'::text, 'confirming'::text, 'completed'::text, 'failed'::text, 'cancelled'::text]))),
    CONSTRAINT redemption_settlements_transfer_status_check CHECK ((transfer_status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'failed'::text]))),
    CONSTRAINT valid_retry_count CHECK ((retry_count >= 0))
);


--
-- Name: TABLE redemption_settlements; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.redemption_settlements IS 'Tracks settlement processing for redemption requests including token burning and fund transfers';


--
-- Name: regulatory_equivalence_mapping; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.regulatory_equivalence_mapping (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    home_jurisdiction character(2) NOT NULL,
    equivalent_jurisdiction character(2) NOT NULL,
    equivalence_type text NOT NULL,
    regulatory_framework text NOT NULL,
    recognition_date date NOT NULL,
    expiry_date date,
    mutual_recognition boolean DEFAULT false,
    passport_rights boolean DEFAULT false,
    simplified_procedures boolean DEFAULT false,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: restriction_statistics; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.restriction_statistics AS
 SELECT count(*) AS total_rules,
    count(*) FILTER (WHERE (onboarding_restrictions.active = true)) AS active_rules,
    count(*) FILTER (WHERE ((onboarding_restrictions.type = 'COUNTRY'::text) AND (onboarding_restrictions.active = true))) AS blocked_countries,
    count(*) FILTER (WHERE ((onboarding_restrictions.type = 'INVESTOR_TYPE'::text) AND (onboarding_restrictions.active = true))) AS blocked_investor_types
   FROM public.onboarding_restrictions;


--
-- Name: ripple_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ripple_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    hash text NOT NULL,
    from_account text NOT NULL,
    to_account text NOT NULL,
    amount numeric NOT NULL,
    currency text DEFAULT 'XRP'::text NOT NULL,
    fee numeric DEFAULT 0.000012,
    status text DEFAULT 'pending'::text NOT NULL,
    ledger_index integer,
    sequence_number integer,
    destination_tag integer,
    source_tag integer,
    memo text,
    payment_type text DEFAULT 'standard'::text,
    from_country text,
    to_country text,
    exchange_rate numeric,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT ripple_payments_payment_type_check CHECK ((payment_type = ANY (ARRAY['standard'::text, 'cross_border'::text, 'domestic'::text]))),
    CONSTRAINT ripple_payments_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'validated'::text, 'failed'::text])))
);


--
-- Name: TABLE ripple_payments; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.ripple_payments IS 'Stores Ripple/XRP payment transactions including cross-border payments via ODL';


--
-- Name: risk_assessments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.risk_assessments (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id text,
    wallet_address text,
    assessment_type text NOT NULL,
    risk_level text NOT NULL,
    risk_score numeric,
    factors jsonb DEFAULT '{}'::jsonb,
    recommendations jsonb DEFAULT '{}'::jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT risk_assessments_risk_level_check CHECK ((risk_level = ANY (ARRAY['LOW'::text, 'MEDIUM'::text, 'HIGH'::text, 'CRITICAL'::text])))
);


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    role_id uuid NOT NULL,
    permission_name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rules (
    rule_id uuid DEFAULT gen_random_uuid() NOT NULL,
    rule_name text NOT NULL,
    rule_type text NOT NULL,
    rule_details jsonb,
    created_by uuid NOT NULL,
    status text DEFAULT 'active'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_template boolean DEFAULT false,
    CONSTRAINT rules_created_by_uuid_check CHECK (((created_by)::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'::text))
);


--
-- Name: secure_keys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.secure_keys (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    key_id text NOT NULL,
    encrypted_key text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    last_used_at timestamp with time zone
);


--
-- Name: security_audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.security_audit_logs (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    event_type text NOT NULL,
    severity text NOT NULL,
    user_id text,
    wallet_address text,
    details jsonb DEFAULT '{}'::jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    ip_address text,
    user_agent text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT security_audit_logs_severity_check CHECK ((severity = ANY (ARRAY['LOW'::text, 'MEDIUM'::text, 'HIGH'::text, 'CRITICAL'::text])))
);


--
-- Name: security_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.security_events (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL,
    event_type text NOT NULL,
    severity text NOT NULL,
    user_id uuid,
    wallet_id uuid,
    wallet_address text,
    ip_address text,
    device_info text,
    transaction_hash text,
    contract_address text,
    details text,
    metadata jsonb,
    status text,
    related_events text[],
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone
);


--
-- Name: TABLE security_events; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.security_events IS 'Stores security-related events and incidents across the platform';


--
-- Name: settlement_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.settlement_metrics (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    date date NOT NULL,
    total_settlements integer DEFAULT 0,
    successful_settlements integer DEFAULT 0,
    failed_settlements integer DEFAULT 0,
    average_processing_time interval,
    total_tokens_burned numeric(78,18) DEFAULT 0,
    total_funds_transferred numeric(78,18) DEFAULT 0,
    total_gas_used numeric(78,18) DEFAULT 0,
    total_fees_collected numeric(78,18) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE settlement_metrics; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.settlement_metrics IS 'Daily aggregated metrics for settlement processing performance';


--
-- Name: settlement_summary; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.settlement_summary AS
 SELECT rs.id,
    rs.redemption_request_id,
    rs.settlement_type,
    rs.status,
    rs.token_amount,
    rs.transfer_amount,
    rs.nav_used,
    rs.created_at,
    rs.actual_completion,
    COALESCE(rs.actual_completion, rs.estimated_completion) AS completion_time,
        CASE
            WHEN (rs.actual_completion IS NOT NULL) THEN EXTRACT(epoch FROM (rs.actual_completion - rs.created_at))
            ELSE NULL::numeric
        END AS processing_time_seconds
   FROM public.redemption_settlements rs;


--
-- Name: signatures; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.signatures (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    proposal_id uuid,
    signer text NOT NULL,
    signature text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: stage_requirements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stage_requirements (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    stage_id text NOT NULL,
    name text NOT NULL,
    description text,
    status text DEFAULT 'pending'::text NOT NULL,
    completed_at timestamp with time zone,
    failure_reason text,
    "order" integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscriptions (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    investor_id uuid NOT NULL,
    subscription_id text NOT NULL,
    fiat_amount numeric NOT NULL,
    currency text NOT NULL,
    confirmed boolean DEFAULT false NOT NULL,
    allocated boolean DEFAULT false NOT NULL,
    distributed boolean DEFAULT false NOT NULL,
    notes text,
    subscription_date timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    project_id uuid
);


--
-- Name: system_processes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_processes (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    process_name text NOT NULL,
    start_time timestamp with time zone DEFAULT now(),
    end_time timestamp with time zone,
    status text DEFAULT 'running'::text,
    error_details jsonb,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    progress double precision DEFAULT 0,
    priority character varying(10) DEFAULT 'normal'::character varying,
    notification_sent boolean DEFAULT false,
    cancellable boolean DEFAULT false
);


--
-- Name: TABLE system_processes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.system_processes IS 'Tracks system processes and their execution status';


--
-- Name: system_process_activities; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.system_process_activities AS
 SELECT sp.id AS process_id,
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
    al."timestamp" AS activity_time,
    al.metadata AS activity_metadata
   FROM (public.system_processes sp
     LEFT JOIN public.audit_logs al ON ((sp.id = al.system_process_id)))
  ORDER BY sp.start_time DESC, al."timestamp";


--
-- Name: system_process_activity; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.system_process_activity AS
 SELECT sp.id AS process_id,
    sp.process_name,
    sp.status AS process_status,
    sp.start_time,
    sp.end_time,
    EXTRACT(epoch FROM (sp.end_time - sp.start_time)) AS duration_seconds,
    count(al.id) AS activity_count,
    count(
        CASE
            WHEN ((al.status = 'failure'::text) OR (al.status = 'failed'::text)) THEN 1
            ELSE NULL::integer
        END) AS failed_activities
   FROM (public.system_processes sp
     LEFT JOIN public.audit_logs al ON ((sp.id = al.system_process_id)))
  GROUP BY sp.id, sp.process_name, sp.status, sp.start_time, sp.end_time;


--
-- Name: system_process_performance; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.system_process_performance AS
 SELECT sp.process_name,
    count(*) AS total_executions,
    avg(EXTRACT(epoch FROM (sp.end_time - sp.start_time))) AS avg_duration_seconds,
    min(EXTRACT(epoch FROM (sp.end_time - sp.start_time))) AS min_duration_seconds,
    max(EXTRACT(epoch FROM (sp.end_time - sp.start_time))) AS max_duration_seconds,
    count(
        CASE
            WHEN (sp.status = 'completed'::text) THEN 1
            ELSE NULL::integer
        END) AS successful_executions,
    count(
        CASE
            WHEN (sp.status = 'failed'::text) THEN 1
            ELSE NULL::integer
        END) AS failed_executions,
    round((((count(
        CASE
            WHEN (sp.status = 'completed'::text) THEN 1
            ELSE NULL::integer
        END))::numeric / (count(*))::numeric) * (100)::numeric), 2) AS success_rate
   FROM public.system_processes sp
  WHERE (sp.end_time IS NOT NULL)
  GROUP BY sp.process_name
  ORDER BY (count(*)) DESC;


--
-- Name: VIEW system_process_performance; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.system_process_performance IS 'Performance metrics for system processes';


--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: token_allocations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.token_allocations (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    investor_id uuid NOT NULL,
    subscription_id uuid NOT NULL,
    project_id uuid,
    token_type text NOT NULL,
    token_amount numeric NOT NULL,
    distributed boolean DEFAULT false NOT NULL,
    distribution_date timestamp with time zone,
    distribution_tx_hash text,
    notes text,
    allocation_date timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    minted boolean DEFAULT false NOT NULL,
    minting_date timestamp with time zone,
    minting_tx_hash text,
    standard public.token_standard_enum,
    symbol text,
    token_id uuid,
    CONSTRAINT token_allocations_token_amount_check CHECK ((token_amount > (0)::numeric))
);


--
-- Name: token_deployment_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.token_deployment_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token_id uuid NOT NULL,
    project_id uuid NOT NULL,
    status text NOT NULL,
    transaction_hash text,
    block_number integer,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL,
    error text,
    blockchain text NOT NULL,
    environment text NOT NULL
);


--
-- Name: TABLE token_deployment_history; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.token_deployment_history IS 'Records the history of token deployment attempts and their status';


--
-- Name: token_deployments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.token_deployments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token_id uuid NOT NULL,
    network text NOT NULL,
    contract_address text NOT NULL,
    transaction_hash text NOT NULL,
    deployed_at timestamp with time zone DEFAULT now(),
    deployed_by text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    deployment_data jsonb,
    deployment_strategy text
);


--
-- Name: token_designs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.token_designs (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    name text NOT NULL,
    type text NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    total_supply numeric NOT NULL,
    contract_address text,
    deployment_date timestamp with time zone,
    CONSTRAINT token_designs_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'under review'::text, 'approved'::text, 'rejected'::text, 'ready to mint'::text, 'minted'::text, 'paused'::text, 'distributed'::text]))),
    CONSTRAINT token_designs_type_check CHECK ((type = ANY (ARRAY['ERC-20'::text, 'ERC-721'::text, 'ERC-1155'::text, 'ERC-1400'::text, 'ERC-3525'::text])))
);


--
-- Name: token_erc1155_balances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.token_erc1155_balances (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token_id uuid NOT NULL,
    token_type_id text NOT NULL,
    address text NOT NULL,
    amount text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: token_erc1155_crafting_recipes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.token_erc1155_crafting_recipes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token_id uuid NOT NULL,
    recipe_name text NOT NULL,
    input_tokens jsonb NOT NULL,
    output_token_type_id text NOT NULL,
    output_quantity integer DEFAULT 1,
    success_rate integer DEFAULT 100,
    cooldown_period integer DEFAULT 0,
    required_level integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: token_erc1155_discount_tiers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.token_erc1155_discount_tiers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token_id uuid NOT NULL,
    min_quantity integer NOT NULL,
    max_quantity integer,
    discount_percentage text NOT NULL,
    tier_name text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: token_erc1155_properties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.token_erc1155_properties (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token_id uuid NOT NULL,
    base_uri text,
    metadata_storage text DEFAULT 'ipfs'::text,
    has_royalty boolean DEFAULT false,
    royalty_percentage text,
    royalty_receiver text,
    is_burnable boolean DEFAULT false,
    is_pausable boolean DEFAULT false,
    access_control text DEFAULT 'ownable'::text,
    updatable_uris boolean DEFAULT false,
    supply_tracking boolean DEFAULT true,
    enable_approval_for_all boolean DEFAULT true,
    sales_config jsonb,
    whitelist_config jsonb,
    batch_transfer_limits jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    dynamic_uri_config jsonb,
    batch_minting_config jsonb,
    transfer_restrictions jsonb,
    container_config jsonb,
    dynamic_uris boolean,
    batch_minting_enabled boolean DEFAULT false,
    container_enabled boolean DEFAULT false,
    use_geographic_restrictions boolean DEFAULT false,
    default_restriction_policy text DEFAULT 'allowed'::text,
    mint_roles text[],
    burning_enabled boolean DEFAULT false,
    burn_roles text[],
    updatable_metadata boolean DEFAULT false,
    metadata_update_roles text[],
    supply_tracking_advanced boolean DEFAULT false,
    max_supply_per_type text,
    pricing_model text DEFAULT 'fixed'::text,
    base_price text,
    price_multipliers jsonb,
    bulk_discount_enabled boolean DEFAULT false,
    bulk_discount_tiers jsonb,
    referral_rewards_enabled boolean DEFAULT false,
    referral_percentage text,
    lazy_minting_enabled boolean DEFAULT false,
    airdrop_enabled boolean DEFAULT false,
    airdrop_snapshot_block integer,
    claim_period_enabled boolean DEFAULT false,
    claim_start_time timestamp with time zone,
    claim_end_time timestamp with time zone,
    crafting_enabled boolean DEFAULT false,
    fusion_enabled boolean DEFAULT false,
    token_recipes jsonb,
    experience_points_enabled boolean DEFAULT false,
    leveling_enabled boolean DEFAULT false,
    consumable_tokens boolean DEFAULT false,
    marketplace_fees_enabled boolean DEFAULT false,
    marketplace_fee_percentage text,
    marketplace_fee_recipient text,
    bundle_trading_enabled boolean DEFAULT false,
    atomic_swaps_enabled boolean DEFAULT false,
    cross_collection_trading boolean DEFAULT false,
    voting_power_enabled boolean DEFAULT false,
    voting_weight_per_token jsonb,
    community_treasury_enabled boolean DEFAULT false,
    treasury_percentage text,
    proposal_creation_threshold text,
    bridge_enabled boolean DEFAULT false,
    bridgeable_token_types text[],
    wrapped_versions jsonb,
    layer2_support_enabled boolean DEFAULT false,
    supported_layer2_networks text[],
    CONSTRAINT batch_transfer_limits_structure_check CHECK (((batch_transfer_limits IS NULL) OR (jsonb_typeof(batch_transfer_limits) = 'object'::text))),
    CONSTRAINT check_whitelist_config_valid CHECK (public.validate_whitelist_config_permissive(whitelist_config)),
    CONSTRAINT sales_config_structure_check CHECK (((sales_config IS NULL) OR ((jsonb_typeof(sales_config) = 'object'::text) AND (sales_config ? 'enabled'::text) AND (((sales_config -> 'enabled'::text))::text = ANY (ARRAY['true'::text, 'false'::text]))))),
    CONSTRAINT whitelist_config_structure_check CHECK (((whitelist_config IS NULL) OR ((jsonb_typeof(whitelist_config) = 'object'::text) AND (whitelist_config ? 'enabled'::text) AND (((whitelist_config -> 'enabled'::text))::text = ANY (ARRAY['true'::text, 'false'::text])))))
);


--
-- Name: COLUMN token_erc1155_properties.pricing_model; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc1155_properties.pricing_model IS 'Pricing strategy: fixed, dynamic, or auction-based';


--
-- Name: COLUMN token_erc1155_properties.lazy_minting_enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc1155_properties.lazy_minting_enabled IS 'Whether tokens are minted on-demand rather than pre-minted';


--
-- Name: COLUMN token_erc1155_properties.crafting_enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc1155_properties.crafting_enabled IS 'Whether token types can be combined to create new tokens';


--
-- Name: COLUMN token_erc1155_properties.consumable_tokens; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc1155_properties.consumable_tokens IS 'Whether some token types are consumed on use';


--
-- Name: COLUMN token_erc1155_properties.voting_power_enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc1155_properties.voting_power_enabled IS 'Whether different token types have governance voting power';


--
-- Name: COLUMN token_erc1155_properties.bridge_enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc1155_properties.bridge_enabled IS 'Whether tokens can be bridged to other chains';


--
-- Name: token_erc1155_type_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.token_erc1155_type_configs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token_id uuid NOT NULL,
    token_type_id text NOT NULL,
    supply_cap text,
    mint_price text,
    is_tradeable boolean DEFAULT true,
    is_transferable boolean DEFAULT true,
    utility_type text,
    rarity_tier text,
    experience_value integer DEFAULT 0,
    crafting_materials jsonb,
    burn_rewards jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: token_erc1155_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.token_erc1155_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token_id uuid NOT NULL,
    token_type_id text NOT NULL,
    name text,
    description text,
    max_supply text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now(),
    fungibility_type text DEFAULT 'non-fungible'::text,
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT token_erc1155_types_fungibility_type_check CHECK ((fungibility_type = ANY (ARRAY['fungible'::text, 'non-fungible'::text, 'semi-fungible'::text])))
);


--
-- Name: COLUMN token_erc1155_types.fungibility_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc1155_types.fungibility_type IS 'Type of fungibility: fungible, non-fungible, or semi-fungible';


--
-- Name: token_erc1155_uri_mappings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.token_erc1155_uri_mappings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token_id uuid NOT NULL,
    token_type_id text NOT NULL,
    uri text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    name text NOT NULL,
    symbol text NOT NULL,
    decimals integer DEFAULT 18 NOT NULL,
    standard public.token_standard_enum NOT NULL,
    blocks jsonb NOT NULL,
    metadata jsonb,
    status public.token_status_enum DEFAULT 'DRAFT'::public.token_status_enum NOT NULL,
    reviewers text[] DEFAULT '{}'::text[],
    approvals text[] DEFAULT '{}'::text[],
    contract_preview text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    total_supply text,
    config_mode public.token_config_mode_enum DEFAULT 'min'::public.token_config_mode_enum,
    address character varying(255),
    blockchain character varying(100),
    deployment_status character varying(50) DEFAULT 'pending'::character varying,
    deployment_timestamp timestamp without time zone,
    deployment_transaction character varying(255),
    deployment_error text,
    deployed_by uuid,
    deployment_environment character varying(50),
    description text
);


--
-- Name: COLUMN tokens.config_mode; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tokens.config_mode IS 'Indicates if token uses minimal or maximal configuration (values: min, max)';


--
-- Name: token_erc1155_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.token_erc1155_view AS
 SELECT t.id AS token_id,
    t.name,
    t.symbol,
    t.decimals,
    t.standard,
    t.total_supply,
    t.metadata,
    t.status,
    t.description,
    t.created_at AS token_created_at,
    t.updated_at AS token_updated_at,
    p.id AS erc1155_property_id,
    p.base_uri,
    p.metadata_storage,
    p.has_royalty,
    p.royalty_percentage,
    p.royalty_receiver,
    p.is_burnable,
    p.is_pausable,
    p.access_control,
    p.updatable_uris,
    p.supply_tracking,
    p.enable_approval_for_all,
    p.sales_config,
    p.whitelist_config,
    p.batch_transfer_limits,
    p.dynamic_uri_config,
    p.batch_minting_config,
    p.transfer_restrictions,
    p.container_config,
    p.lazy_minting_enabled,
    p.burning_enabled,
    p.updatable_metadata,
    p.crafting_enabled,
    p.fusion_enabled,
    p.experience_points_enabled,
    p.voting_power_enabled,
    p.marketplace_fees_enabled,
    p.bridge_enabled,
    p.pricing_model,
    p.base_price,
    p.bulk_discount_enabled,
    p.airdrop_enabled,
    p.claim_period_enabled,
    p.claim_start_time,
    p.claim_end_time,
    p.created_at AS property_created_at,
    p.updated_at AS property_updated_at
   FROM (public.tokens t
     LEFT JOIN public.token_erc1155_properties p ON ((t.id = p.token_id)))
  WHERE (t.standard = 'ERC-1155'::public.token_standard_enum);


--
-- Name: token_erc1400_controllers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.token_erc1400_controllers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token_id uuid NOT NULL,
    address text NOT NULL,
    permissions text[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: token_erc1400_corporate_actions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.token_erc1400_corporate_actions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token_id uuid NOT NULL,
    action_type text NOT NULL,
    announcement_date date NOT NULL,
    record_date date,
    effective_date date,
    payment_date date,
    action_details jsonb NOT NULL,
    impact_on_supply text,
    impact_on_price text,
    shareholder_approval_required boolean DEFAULT false,
    voting_deadline date,
    regulatory_approval_required boolean DEFAULT false,
    status text DEFAULT 'announced'::text,
    execution_transaction_hash text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: token_erc1400_custody_providers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.token_erc1400_custody_providers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token_id uuid NOT NULL,
    provider_name text NOT NULL,
    provider_type text NOT NULL,
    provider_address text,
    provider_lei text,
    custody_agreement_hash text,
    is_active boolean DEFAULT true,
    certification_level text,
    jurisdiction text,
    regulatory_approvals text[],
    integration_status text DEFAULT 'pending'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: token_erc1400_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.token_erc1400_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token_id uuid,
    name text NOT NULL,
    document_uri text NOT NULL,
    document_type text,
    document_hash text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: token_erc1400_partition_balances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.token_erc1400_partition_balances (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    partition_id uuid NOT NULL,
    holder_address text NOT NULL,
    balance text DEFAULT '0'::text NOT NULL,
    last_updated timestamp with time zone DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE token_erc1400_partition_balances; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.token_erc1400_partition_balances IS 'Tracks token balances per partition for each holder';


--
-- Name: token_erc1400_partition_operators; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.token_erc1400_partition_operators (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    partition_id uuid NOT NULL,
    holder_address text NOT NULL,
    operator_address text NOT NULL,
    authorized boolean DEFAULT true,
    last_updated timestamp with time zone DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE token_erc1400_partition_operators; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.token_erc1400_partition_operators IS 'Tracks authorized operators for each partition';


--
-- Name: token_erc1400_partition_transfers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.token_erc1400_partition_transfers (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    partition_id uuid NOT NULL,
    from_address text NOT NULL,
    to_address text NOT NULL,
    amount text NOT NULL,
    operator_address text,
    "timestamp" timestamp with time zone DEFAULT now(),
    transaction_hash text,
    metadata jsonb DEFAULT '{}'::jsonb,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE token_erc1400_partition_transfers; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.token_erc1400_partition_transfers IS 'Records all token transfers within partitions';


--
-- Name: token_erc1400_partitions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.token_erc1400_partitions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token_id uuid NOT NULL,
    name text NOT NULL,
    partition_id text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now(),
    total_supply text DEFAULT '0'::text,
    partition_type text,
    amount text,
    updated_at timestamp with time zone DEFAULT now(),
    corporate_actions boolean DEFAULT false,
    custom_features jsonb,
    transferable boolean DEFAULT true
);


--
-- Name: COLUMN token_erc1400_partitions.total_supply; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc1400_partitions.total_supply IS 'Total token supply in this partition';


--
-- Name: token_erc1400_properties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.token_erc1400_properties (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token_id uuid NOT NULL,
    initial_supply text,
    cap text,
    is_mintable boolean DEFAULT false,
    is_burnable boolean DEFAULT false,
    is_pausable boolean DEFAULT false,
    document_uri text,
    document_hash text,
    controller_address text,
    require_kyc boolean DEFAULT true,
    security_type text DEFAULT 'equity'::text,
    issuing_jurisdiction text,
    issuing_entity_name text,
    issuing_entity_lei text,
    transfer_restrictions jsonb,
    kyc_settings jsonb,
    compliance_settings jsonb,
    forced_transfers boolean DEFAULT false,
    issuance_modules boolean DEFAULT false,
    document_management boolean DEFAULT false,
    recovery_mechanism boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    regulation_type text,
    is_multi_class boolean DEFAULT false,
    tranche_transferability boolean DEFAULT false,
    decimals integer DEFAULT 18,
    token_details text,
    legal_terms text,
    prospectus text,
    enforce_kyc boolean DEFAULT false,
    forced_redemption_enabled boolean DEFAULT false,
    whitelist_enabled boolean DEFAULT false,
    holding_period integer,
    max_investor_count integer,
    investor_accreditation boolean DEFAULT false,
    auto_compliance boolean DEFAULT false,
    manual_approvals boolean DEFAULT false,
    compliance_module text,
    is_issuable boolean DEFAULT false,
    granular_control boolean DEFAULT false,
    dividend_distribution boolean DEFAULT false,
    corporate_actions boolean DEFAULT false,
    custom_features jsonb,
    geographic_restrictions jsonb DEFAULT '[]'::jsonb,
    compliance_automation_level text DEFAULT 'manual'::text,
    whitelist_config jsonb,
    investor_whitelist_enabled boolean DEFAULT false,
    accredited_investor_only boolean DEFAULT false,
    jurisdiction_restrictions jsonb DEFAULT '[]'::jsonb,
    investor_limits jsonb DEFAULT '{}'::jsonb,
    use_geographic_restrictions boolean DEFAULT false,
    default_restriction_policy text DEFAULT 'blocked'::text,
    institutional_grade boolean DEFAULT false,
    custody_integration_enabled boolean DEFAULT false,
    prime_brokerage_support boolean DEFAULT false,
    settlement_integration text,
    clearing_house_integration boolean DEFAULT false,
    central_securities_depository_integration boolean DEFAULT false,
    third_party_custody_addresses text[],
    institutional_wallet_support boolean DEFAULT false,
    real_time_compliance_monitoring boolean DEFAULT false,
    automated_sanctions_screening boolean DEFAULT false,
    pep_screening_enabled boolean DEFAULT false,
    aml_monitoring_enabled boolean DEFAULT false,
    transaction_monitoring_rules jsonb,
    suspicious_activity_reporting boolean DEFAULT false,
    compliance_officer_notifications boolean DEFAULT false,
    regulatory_reporting_automation boolean DEFAULT false,
    advanced_corporate_actions boolean DEFAULT false,
    stock_splits_enabled boolean DEFAULT false,
    stock_dividends_enabled boolean DEFAULT false,
    rights_offerings_enabled boolean DEFAULT false,
    spin_offs_enabled boolean DEFAULT false,
    mergers_acquisitions_support boolean DEFAULT false,
    treasury_management_enabled boolean DEFAULT false,
    buyback_programs_enabled boolean DEFAULT false,
    share_repurchase_automation boolean DEFAULT false,
    advanced_governance_enabled boolean DEFAULT false,
    proxy_voting_enabled boolean DEFAULT false,
    cumulative_voting_enabled boolean DEFAULT false,
    weighted_voting_by_class boolean DEFAULT false,
    quorum_requirements jsonb,
    voting_delegation_enabled boolean DEFAULT false,
    institutional_voting_services boolean DEFAULT false,
    board_election_support boolean DEFAULT false,
    cross_border_trading_enabled boolean DEFAULT false,
    multi_jurisdiction_compliance boolean DEFAULT false,
    passport_regime_support boolean DEFAULT false,
    treaty_benefits_enabled boolean DEFAULT false,
    withholding_tax_automation boolean DEFAULT false,
    currency_hedging_enabled boolean DEFAULT false,
    foreign_ownership_restrictions jsonb,
    regulatory_equivalence_mapping jsonb,
    enhanced_reporting_enabled boolean DEFAULT false,
    real_time_shareholder_registry boolean DEFAULT false,
    beneficial_ownership_tracking boolean DEFAULT false,
    position_reconciliation_enabled boolean DEFAULT false,
    regulatory_filing_automation boolean DEFAULT false,
    audit_trail_comprehensive boolean DEFAULT false,
    performance_analytics_enabled boolean DEFAULT false,
    esg_reporting_enabled boolean DEFAULT false,
    traditional_finance_integration boolean DEFAULT false,
    swift_integration_enabled boolean DEFAULT false,
    iso20022_messaging_support boolean DEFAULT false,
    financial_data_vendor_integration boolean DEFAULT false,
    market_data_feeds_enabled boolean DEFAULT false,
    price_discovery_mechanisms jsonb,
    cross_chain_bridge_support boolean DEFAULT false,
    layer2_scaling_support boolean DEFAULT false,
    advanced_risk_management boolean DEFAULT false,
    position_limits_enabled boolean DEFAULT false,
    concentration_limits jsonb,
    stress_testing_enabled boolean DEFAULT false,
    margin_requirements_dynamic boolean DEFAULT false,
    collateral_management_enabled boolean DEFAULT false,
    insurance_coverage_enabled boolean DEFAULT false,
    disaster_recovery_enabled boolean DEFAULT false,
    CONSTRAINT check_whitelist_config_valid CHECK (public.validate_whitelist_config_permissive(whitelist_config))
);


--
-- Name: COLUMN token_erc1400_properties.whitelist_config; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc1400_properties.whitelist_config IS 'JSON configuration for security token whitelist including investor verification, compliance requirements, and transfer restrictions';


--
-- Name: COLUMN token_erc1400_properties.investor_whitelist_enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc1400_properties.investor_whitelist_enabled IS 'Enable whitelist enforcement for all investor interactions';


--
-- Name: COLUMN token_erc1400_properties.accredited_investor_only; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc1400_properties.accredited_investor_only IS 'Restrict token access to accredited investors only';


--
-- Name: COLUMN token_erc1400_properties.jurisdiction_restrictions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc1400_properties.jurisdiction_restrictions IS 'Array of blocked/allowed jurisdictions for investor eligibility';


--
-- Name: COLUMN token_erc1400_properties.investor_limits; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc1400_properties.investor_limits IS 'JSON object defining maximum investors, holding periods, and investment limits';


--
-- Name: COLUMN token_erc1400_properties.institutional_grade; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc1400_properties.institutional_grade IS 'Whether token meets institutional investment standards';


--
-- Name: COLUMN token_erc1400_properties.custody_integration_enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc1400_properties.custody_integration_enabled IS 'Whether token supports institutional custody integration';


--
-- Name: COLUMN token_erc1400_properties.real_time_compliance_monitoring; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc1400_properties.real_time_compliance_monitoring IS 'Whether real-time compliance monitoring is active';


--
-- Name: COLUMN token_erc1400_properties.advanced_corporate_actions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc1400_properties.advanced_corporate_actions IS 'Whether advanced corporate actions are supported';


--
-- Name: COLUMN token_erc1400_properties.cross_border_trading_enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc1400_properties.cross_border_trading_enabled IS 'Whether cross-border trading is enabled';


--
-- Name: COLUMN token_erc1400_properties.traditional_finance_integration; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc1400_properties.traditional_finance_integration IS 'Whether integration with traditional finance systems is enabled';


--
-- Name: token_erc1400_regulatory_filings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.token_erc1400_regulatory_filings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token_id uuid NOT NULL,
    filing_type text NOT NULL,
    filing_date date NOT NULL,
    filing_jurisdiction text NOT NULL,
    filing_reference text,
    document_hash text,
    document_uri text,
    regulatory_body text,
    compliance_status text DEFAULT 'pending'::text,
    due_date date,
    auto_generated boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: token_erc1400_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.token_erc1400_view AS
 SELECT t.id AS token_id,
    t.name,
    t.symbol,
    t.decimals,
    t.standard,
    t.total_supply,
    t.metadata,
    t.status,
    t.description,
    t.created_at AS token_created_at,
    t.updated_at AS token_updated_at,
    p.id AS erc1400_property_id,
    p.initial_supply,
    p.cap,
    p.is_mintable,
    p.is_burnable,
    p.is_pausable,
    p.document_uri,
    p.document_hash,
    p.controller_address,
    p.require_kyc,
    p.security_type,
    p.issuing_jurisdiction,
    p.issuing_entity_name,
    p.issuing_entity_lei,
    p.transfer_restrictions,
    p.kyc_settings,
    p.compliance_settings,
    p.forced_transfers,
    p.issuance_modules,
    p.document_management,
    p.recovery_mechanism,
    p.regulation_type,
    p.is_multi_class,
    p.tranche_transferability,
    p.token_details,
    p.legal_terms,
    p.prospectus,
    p.enforce_kyc,
    p.forced_redemption_enabled,
    p.whitelist_enabled,
    p.holding_period,
    p.max_investor_count,
    p.investor_accreditation,
    p.auto_compliance,
    p.manual_approvals,
    p.compliance_module,
    p.is_issuable,
    p.granular_control,
    p.dividend_distribution,
    p.corporate_actions,
    p.custom_features,
    p.geographic_restrictions,
    p.compliance_automation_level,
    p.institutional_grade,
    p.custody_integration_enabled,
    p.prime_brokerage_support,
    p.settlement_integration,
    p.real_time_compliance_monitoring,
    p.automated_sanctions_screening,
    p.aml_monitoring_enabled,
    p.advanced_corporate_actions,
    p.stock_splits_enabled,
    p.treasury_management_enabled,
    p.advanced_governance_enabled,
    p.proxy_voting_enabled,
    p.cross_border_trading_enabled,
    p.multi_jurisdiction_compliance,
    p.enhanced_reporting_enabled,
    p.beneficial_ownership_tracking,
    p.traditional_finance_integration,
    p.swift_integration_enabled,
    p.iso20022_messaging_support,
    p.advanced_risk_management,
    p.insurance_coverage_enabled,
    p.created_at AS property_created_at,
    p.updated_at AS property_updated_at
   FROM (public.tokens t
     LEFT JOIN public.token_erc1400_properties p ON ((t.id = p.token_id)))
  WHERE (t.standard = 'ERC-1400'::public.token_standard_enum);


--
-- Name: token_erc20_properties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.token_erc20_properties (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token_id uuid NOT NULL,
    initial_supply text,
    cap text,
    is_mintable boolean DEFAULT false,
    is_burnable boolean DEFAULT false,
    is_pausable boolean DEFAULT false,
    token_type text DEFAULT 'utility'::text,
    access_control text DEFAULT 'ownable'::text,
    allow_management boolean DEFAULT false,
    permit boolean DEFAULT false,
    snapshot boolean DEFAULT false,
    fee_on_transfer jsonb,
    rebasing jsonb,
    governance_features jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    transfer_config jsonb,
    gas_config jsonb,
    compliance_config jsonb,
    whitelist_config jsonb,
    governance_enabled boolean DEFAULT false,
    quorum_percentage text,
    proposal_threshold text,
    voting_delay integer,
    voting_period integer,
    timelock_delay integer,
    governance_token_address text,
    pausable_by text,
    mintable_by text,
    burnable_by text,
    max_total_supply text,
    anti_whale_enabled boolean DEFAULT false,
    max_wallet_amount text,
    cooldown_period integer,
    blacklist_enabled boolean DEFAULT false,
    deflation_enabled boolean DEFAULT false,
    deflation_rate text,
    staking_enabled boolean DEFAULT false,
    staking_rewards_rate text,
    buy_fee_enabled boolean DEFAULT false,
    sell_fee_enabled boolean DEFAULT false,
    liquidity_fee_percentage text,
    marketing_fee_percentage text,
    charity_fee_percentage text,
    auto_liquidity_enabled boolean DEFAULT false,
    reflection_enabled boolean DEFAULT false,
    reflection_percentage text,
    burn_on_transfer boolean DEFAULT false,
    burn_percentage text,
    lottery_enabled boolean DEFAULT false,
    lottery_percentage text,
    trading_start_time timestamp with time zone,
    presale_enabled boolean DEFAULT false,
    presale_rate text,
    presale_start_time timestamp with time zone,
    presale_end_time timestamp with time zone,
    vesting_enabled boolean DEFAULT false,
    vesting_cliff_period integer,
    vesting_total_period integer,
    vesting_release_frequency text DEFAULT 'monthly'::text,
    use_geographic_restrictions boolean DEFAULT false,
    default_restriction_policy text DEFAULT 'allowed'::text,
    CONSTRAINT check_whitelist_config_valid CHECK (public.validate_whitelist_config_permissive(whitelist_config)),
    CONSTRAINT compliance_config_reporting_interval_check CHECK (((compliance_config IS NULL) OR (((compliance_config -> 'reportingInterval'::text))::text = ANY (ARRAY['"daily"'::text, '"weekly"'::text, '"monthly"'::text, '"quarterly"'::text, '"annually"'::text]))))
);


--
-- Name: COLUMN token_erc20_properties.governance_enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc20_properties.governance_enabled IS 'Whether DAO governance features are enabled';


--
-- Name: COLUMN token_erc20_properties.quorum_percentage; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc20_properties.quorum_percentage IS 'Minimum percentage of tokens needed for governance proposals';


--
-- Name: COLUMN token_erc20_properties.anti_whale_enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc20_properties.anti_whale_enabled IS 'Whether anti-whale mechanisms are active';


--
-- Name: COLUMN token_erc20_properties.reflection_enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc20_properties.reflection_enabled IS 'Whether reflection rewards are enabled for holders';


--
-- Name: COLUMN token_erc20_properties.vesting_enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc20_properties.vesting_enabled IS 'Whether token vesting schedules are enforced';


--
-- Name: token_erc20_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.token_erc20_view AS
 SELECT t.id AS token_id,
    t.name,
    t.symbol,
    t.decimals,
    t.standard,
    t.total_supply,
    t.metadata,
    t.status,
    t.description,
    t.created_at AS token_created_at,
    t.updated_at AS token_updated_at,
    p.id AS erc20_property_id,
    p.token_type,
    p.cap,
    p.initial_supply,
    p.access_control,
    p.allow_management,
    p.is_mintable,
    p.is_burnable,
    p.is_pausable,
    p.snapshot,
    p.permit,
    p.rebasing,
    p.fee_on_transfer,
    p.governance_features,
    p.compliance_config,
    p.transfer_config,
    p.gas_config,
    p.whitelist_config,
    p.governance_enabled,
    p.quorum_percentage,
    p.proposal_threshold,
    p.voting_delay,
    p.voting_period,
    p.anti_whale_enabled,
    p.max_wallet_amount,
    p.reflection_enabled,
    p.reflection_percentage,
    p.vesting_enabled,
    p.vesting_cliff_period,
    p.presale_enabled,
    p.presale_rate,
    p.trading_start_time,
    p.created_at AS property_created_at,
    p.updated_at AS property_updated_at
   FROM (public.tokens t
     LEFT JOIN public.token_erc20_properties p ON ((t.id = p.token_id)))
  WHERE (t.standard = 'ERC-20'::public.token_standard_enum);


--
-- Name: token_erc3525_allocations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.token_erc3525_allocations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token_id uuid NOT NULL,
    slot_id text NOT NULL,
    token_id_within_slot text NOT NULL,
    value text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    recipient text,
    linked_token_id uuid,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: COLUMN token_erc3525_allocations.linked_token_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc3525_allocations.linked_token_id IS 'Foreign key reference to another token that this allocation is linked to';


--
-- Name: token_erc3525_payment_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.token_erc3525_payment_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token_id uuid NOT NULL,
    slot_id text NOT NULL,
    payment_date timestamp with time zone NOT NULL,
    payment_amount text NOT NULL,
    payment_type text NOT NULL,
    currency text DEFAULT 'USD'::text,
    is_completed boolean DEFAULT false,
    transaction_hash text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: token_erc3525_properties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.token_erc3525_properties (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token_id uuid NOT NULL,
    value_decimals integer DEFAULT 0,
    base_uri text,
    metadata_storage text DEFAULT 'ipfs'::text,
    slot_type text DEFAULT 'generic'::text,
    is_burnable boolean DEFAULT false,
    is_pausable boolean DEFAULT false,
    has_royalty boolean DEFAULT false,
    royalty_percentage text,
    royalty_receiver text,
    slot_approvals boolean DEFAULT true,
    value_approvals boolean DEFAULT true,
    access_control text DEFAULT 'ownable'::text,
    updatable_uris boolean DEFAULT false,
    updatable_slots boolean DEFAULT false,
    value_transfers_enabled boolean DEFAULT true,
    sales_config jsonb,
    mergable boolean DEFAULT false,
    splittable boolean DEFAULT false,
    slot_transfer_validation jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    dynamic_metadata boolean DEFAULT false,
    allows_slot_enumeration boolean DEFAULT true,
    value_aggregation boolean DEFAULT false,
    permissioning_enabled boolean DEFAULT false,
    supply_tracking boolean DEFAULT false,
    updatable_values boolean DEFAULT false,
    custom_extensions text,
    fractionalizable boolean DEFAULT false,
    metadata jsonb,
    fractional_ownership_enabled boolean DEFAULT false,
    auto_unit_calculation boolean DEFAULT false,
    custom_slot_properties jsonb,
    slot_enumeration_enabled boolean DEFAULT true,
    value_aggregation_enabled boolean DEFAULT false,
    permissioning_advanced boolean DEFAULT false,
    slot_transfer_restrictions jsonb,
    value_transfer_restrictions jsonb,
    financial_instrument_type text,
    principal_amount text,
    interest_rate text,
    maturity_date timestamp with time zone,
    coupon_frequency text,
    payment_schedule jsonb,
    early_redemption_enabled boolean DEFAULT false,
    redemption_penalty_rate text,
    derivative_type text,
    underlying_asset text,
    underlying_asset_address text,
    strike_price text,
    expiration_date timestamp with time zone,
    settlement_type text,
    margin_requirements jsonb,
    leverage_ratio text,
    slot_creation_enabled boolean DEFAULT false,
    dynamic_slot_creation boolean DEFAULT false,
    slot_admin_roles text[],
    slot_freeze_enabled boolean DEFAULT false,
    slot_merge_enabled boolean DEFAULT false,
    slot_split_enabled boolean DEFAULT false,
    cross_slot_transfers boolean DEFAULT false,
    value_computation_method text,
    value_oracle_address text,
    value_calculation_formula text,
    accrual_enabled boolean DEFAULT false,
    accrual_rate text,
    accrual_frequency text,
    value_adjustment_enabled boolean DEFAULT false,
    slot_marketplace_enabled boolean DEFAULT false,
    value_marketplace_enabled boolean DEFAULT false,
    partial_value_trading boolean DEFAULT false,
    minimum_trade_value text,
    trading_fees_enabled boolean DEFAULT false,
    trading_fee_percentage text,
    market_maker_enabled boolean DEFAULT false,
    slot_voting_enabled boolean DEFAULT false,
    value_weighted_voting boolean DEFAULT false,
    voting_power_calculation text,
    quorum_calculation_method text,
    proposal_value_threshold text,
    delegate_enabled boolean DEFAULT false,
    yield_farming_enabled boolean DEFAULT false,
    liquidity_provision_enabled boolean DEFAULT false,
    staking_yield_rate text,
    compound_interest_enabled boolean DEFAULT false,
    flash_loan_enabled boolean DEFAULT false,
    collateral_factor text,
    liquidation_threshold text,
    regulatory_compliance_enabled boolean DEFAULT false,
    kyc_required boolean DEFAULT false,
    accredited_investor_only boolean DEFAULT false,
    holding_period_restrictions integer,
    transfer_limits jsonb,
    reporting_requirements jsonb,
    multi_signature_required boolean DEFAULT false,
    approval_workflow_enabled boolean DEFAULT false,
    institutional_custody_support boolean DEFAULT false,
    audit_trail_enhanced boolean DEFAULT false,
    batch_operations_enabled boolean DEFAULT false,
    emergency_pause_enabled boolean DEFAULT false,
    recovery_mechanisms jsonb,
    whitelist_config jsonb,
    use_geographic_restrictions boolean DEFAULT false,
    default_restriction_policy text DEFAULT 'blocked'::text,
    geographic_restrictions text[],
    CONSTRAINT check_whitelist_config_valid CHECK (public.validate_whitelist_config_permissive(whitelist_config)),
    CONSTRAINT sales_config_erc3525_check CHECK (((sales_config IS NULL) OR ((jsonb_typeof(sales_config) = 'object'::text) AND (sales_config ? 'enabled'::text) AND (((sales_config -> 'enabled'::text))::text = ANY (ARRAY['true'::text, 'false'::text]))))),
    CONSTRAINT slot_transfer_validation_enhanced_check CHECK (((slot_transfer_validation IS NULL) OR ((jsonb_typeof(slot_transfer_validation) = 'object'::text) AND (slot_transfer_validation ? 'rules'::text))))
);


--
-- Name: COLUMN token_erc3525_properties.mergable; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc3525_properties.mergable IS 'Whether tokens can be merged';


--
-- Name: COLUMN token_erc3525_properties.splittable; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc3525_properties.splittable IS 'Whether tokens can be split';


--
-- Name: COLUMN token_erc3525_properties.slot_transfer_validation; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc3525_properties.slot_transfer_validation IS 'JSON configuration for slot transfer validation rules';


--
-- Name: COLUMN token_erc3525_properties.dynamic_metadata; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc3525_properties.dynamic_metadata IS 'Whether the token supports dynamic metadata updates';


--
-- Name: COLUMN token_erc3525_properties.allows_slot_enumeration; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc3525_properties.allows_slot_enumeration IS 'Whether slots can be enumerated';


--
-- Name: COLUMN token_erc3525_properties.value_aggregation; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc3525_properties.value_aggregation IS 'Whether token values can be aggregated';


--
-- Name: COLUMN token_erc3525_properties.metadata; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc3525_properties.metadata IS 'JSON metadata for token properties';


--
-- Name: COLUMN token_erc3525_properties.auto_unit_calculation; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc3525_properties.auto_unit_calculation IS 'Whether token values are automatically calculated';


--
-- Name: COLUMN token_erc3525_properties.value_aggregation_enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc3525_properties.value_aggregation_enabled IS 'Whether token values can be aggregated across slots';


--
-- Name: COLUMN token_erc3525_properties.financial_instrument_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc3525_properties.financial_instrument_type IS 'Type of financial instrument: bond, loan, equity, derivative';


--
-- Name: COLUMN token_erc3525_properties.slot_creation_enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc3525_properties.slot_creation_enabled IS 'Whether new slots can be dynamically created';


--
-- Name: COLUMN token_erc3525_properties.partial_value_trading; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc3525_properties.partial_value_trading IS 'Whether partial token values can be traded';


--
-- Name: COLUMN token_erc3525_properties.yield_farming_enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc3525_properties.yield_farming_enabled IS 'Whether tokens can be used for yield farming';


--
-- Name: COLUMN token_erc3525_properties.regulatory_compliance_enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc3525_properties.regulatory_compliance_enabled IS 'Whether tokens are subject to regulatory compliance';


--
-- Name: COLUMN token_erc3525_properties.whitelist_config; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc3525_properties.whitelist_config IS 'JSON configuration for semi-fungible token whitelist controls including slot-specific access, transfer restrictions, and compliance settings';


--
-- Name: token_erc3525_slot_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.token_erc3525_slot_configs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token_id uuid NOT NULL,
    slot_id text NOT NULL,
    slot_name text,
    slot_description text,
    value_units text,
    slot_type text,
    transferable boolean DEFAULT true,
    tradeable boolean DEFAULT true,
    divisible boolean DEFAULT true,
    min_value text,
    max_value text,
    value_precision integer DEFAULT 18,
    slot_properties jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: token_erc3525_slots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.token_erc3525_slots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token_id uuid NOT NULL,
    slot_id text NOT NULL,
    name text,
    description text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now(),
    value_units text,
    updated_at timestamp with time zone DEFAULT now(),
    slot_transferable boolean DEFAULT true
);


--
-- Name: token_erc3525_value_adjustments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.token_erc3525_value_adjustments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token_id uuid NOT NULL,
    slot_id text NOT NULL,
    adjustment_date timestamp with time zone DEFAULT now(),
    adjustment_type text NOT NULL,
    adjustment_amount text NOT NULL,
    adjustment_reason text,
    oracle_price text,
    oracle_source text,
    approved_by text,
    transaction_hash text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: token_erc3525_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.token_erc3525_view AS
 SELECT t.id AS token_id,
    t.name,
    t.symbol,
    t.decimals,
    t.standard,
    t.total_supply,
    t.metadata,
    t.status,
    t.description,
    t.created_at AS token_created_at,
    t.updated_at AS token_updated_at,
    p.id AS erc3525_property_id,
    p.value_decimals,
    p.base_uri,
    p.metadata_storage,
    p.slot_type,
    p.is_burnable,
    p.is_pausable,
    p.has_royalty,
    p.royalty_percentage,
    p.royalty_receiver,
    p.slot_approvals,
    p.value_approvals,
    p.access_control,
    p.updatable_uris,
    p.updatable_slots,
    p.value_transfers_enabled,
    p.sales_config,
    p.mergable,
    p.splittable,
    p.slot_transfer_validation,
    p.dynamic_metadata,
    p.allows_slot_enumeration,
    p.value_aggregation,
    p.permissioning_enabled,
    p.supply_tracking,
    p.updatable_values,
    p.fractional_ownership_enabled,
    p.financial_instrument_type,
    p.principal_amount,
    p.interest_rate,
    p.maturity_date,
    p.coupon_frequency,
    p.early_redemption_enabled,
    p.derivative_type,
    p.underlying_asset,
    p.strike_price,
    p.expiration_date,
    p.settlement_type,
    p.slot_creation_enabled,
    p.dynamic_slot_creation,
    p.cross_slot_transfers,
    p.value_computation_method,
    p.accrual_enabled,
    p.accrual_rate,
    p.partial_value_trading,
    p.minimum_trade_value,
    p.yield_farming_enabled,
    p.liquidity_provision_enabled,
    p.compound_interest_enabled,
    p.flash_loan_enabled,
    p.regulatory_compliance_enabled,
    p.kyc_required,
    p.accredited_investor_only,
    p.created_at AS property_created_at,
    p.updated_at AS property_updated_at
   FROM (public.tokens t
     LEFT JOIN public.token_erc3525_properties p ON ((t.id = p.token_id)))
  WHERE (t.standard = 'ERC-3525'::public.token_standard_enum);


--
-- Name: token_erc4626_asset_allocations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.token_erc4626_asset_allocations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token_id uuid NOT NULL,
    asset text NOT NULL,
    percentage text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    description text,
    protocol text,
    expected_apy text,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: token_erc4626_fee_tiers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.token_erc4626_fee_tiers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token_id uuid NOT NULL,
    tier_name text NOT NULL,
    min_balance text NOT NULL,
    max_balance text,
    management_fee_rate text NOT NULL,
    performance_fee_rate text NOT NULL,
    deposit_fee_rate text DEFAULT '0'::text,
    withdrawal_fee_rate text DEFAULT '0'::text,
    tier_benefits jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: token_erc4626_performance_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.token_erc4626_performance_metrics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token_id uuid NOT NULL,
    metric_date date NOT NULL,
    total_assets text NOT NULL,
    share_price text NOT NULL,
    apy text,
    daily_yield text,
    benchmark_performance text,
    total_fees_collected text,
    new_deposits text,
    withdrawals text,
    net_flow text,
    sharpe_ratio text,
    volatility text,
    max_drawdown text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: token_erc4626_properties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.token_erc4626_properties (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token_id uuid NOT NULL,
    asset_address text,
    asset_name text,
    asset_symbol text,
    asset_decimals integer DEFAULT 18,
    vault_type text DEFAULT 'yield'::text,
    is_mintable boolean DEFAULT false,
    is_burnable boolean DEFAULT false,
    is_pausable boolean DEFAULT false,
    vault_strategy text DEFAULT 'simple'::text,
    custom_strategy boolean DEFAULT false,
    strategy_controller text,
    access_control text DEFAULT 'ownable'::text,
    permit boolean DEFAULT false,
    flash_loans boolean DEFAULT false,
    emergency_shutdown boolean DEFAULT false,
    fee_structure jsonb,
    rebalancing_rules jsonb,
    performance_metrics boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    yield_source text DEFAULT 'external'::text,
    strategy_documentation text,
    rebalance_threshold text,
    liquidity_reserve text DEFAULT '10'::text,
    max_slippage text,
    deposit_limit text,
    withdrawal_limit text,
    min_deposit text,
    max_deposit text,
    min_withdrawal text,
    max_withdrawal text,
    performance_tracking boolean DEFAULT false,
    deposit_fee text,
    withdrawal_fee text,
    management_fee text,
    performance_fee text,
    fee_recipient text,
    withdrawal_rules jsonb,
    yield_optimization_enabled boolean DEFAULT false,
    automated_rebalancing boolean DEFAULT false,
    whitelist_config jsonb,
    use_geographic_restrictions boolean DEFAULT false,
    default_restriction_policy text DEFAULT 'allowed'::text,
    strategy_complexity text DEFAULT 'simple'::text,
    multi_asset_enabled boolean DEFAULT false,
    rebalancing_enabled boolean DEFAULT false,
    auto_compounding_enabled boolean DEFAULT false,
    yield_optimization_strategy text,
    risk_management_enabled boolean DEFAULT false,
    risk_tolerance text,
    diversification_enabled boolean DEFAULT false,
    apy_tracking_enabled boolean DEFAULT false,
    benchmark_tracking_enabled boolean DEFAULT false,
    benchmark_index text,
    performance_history_retention integer DEFAULT 365,
    yield_sources jsonb,
    yield_distribution_schedule text,
    compound_frequency text DEFAULT 'continuous'::text,
    insurance_enabled boolean DEFAULT false,
    insurance_provider text,
    insurance_coverage_amount text,
    emergency_exit_enabled boolean DEFAULT false,
    circuit_breaker_enabled boolean DEFAULT false,
    max_drawdown_threshold text,
    stop_loss_enabled boolean DEFAULT false,
    stop_loss_threshold text,
    governance_token_enabled boolean DEFAULT false,
    governance_token_address text,
    voting_power_per_share text DEFAULT '1'::text,
    strategy_voting_enabled boolean DEFAULT false,
    fee_voting_enabled boolean DEFAULT false,
    manager_performance_threshold text,
    manager_replacement_enabled boolean DEFAULT false,
    dynamic_fees_enabled boolean DEFAULT false,
    performance_fee_high_water_mark boolean DEFAULT false,
    fee_tier_system_enabled boolean DEFAULT false,
    early_withdrawal_penalty text,
    late_withdrawal_penalty text,
    gas_fee_optimization boolean DEFAULT false,
    fee_rebate_enabled boolean DEFAULT false,
    liquidity_mining_enabled boolean DEFAULT false,
    liquidity_incentives_rate text,
    market_making_enabled boolean DEFAULT false,
    arbitrage_enabled boolean DEFAULT false,
    cross_dex_optimization boolean DEFAULT false,
    liquidity_provider_rewards jsonb,
    impermanent_loss_protection boolean DEFAULT false,
    defi_protocol_integrations text[],
    lending_protocol_enabled boolean DEFAULT false,
    borrowing_enabled boolean DEFAULT false,
    leverage_enabled boolean DEFAULT false,
    max_leverage_ratio text,
    cross_chain_yield_enabled boolean DEFAULT false,
    bridge_protocols text[],
    portfolio_analytics_enabled boolean DEFAULT false,
    real_time_pnl_tracking boolean DEFAULT false,
    tax_reporting_enabled boolean DEFAULT false,
    automated_reporting boolean DEFAULT false,
    notification_system_enabled boolean DEFAULT false,
    mobile_app_integration boolean DEFAULT false,
    social_trading_enabled boolean DEFAULT false,
    institutional_grade boolean DEFAULT false,
    custody_integration boolean DEFAULT false,
    audit_trail_comprehensive boolean DEFAULT false,
    compliance_reporting_enabled boolean DEFAULT false,
    regulatory_framework text,
    fund_administration_enabled boolean DEFAULT false,
    third_party_audits_enabled boolean DEFAULT false,
    CONSTRAINT check_whitelist_config_valid CHECK (public.validate_whitelist_config_permissive(whitelist_config)),
    CONSTRAINT rebalancing_rules_validation_check CHECK (((rebalancing_rules IS NULL) OR ((jsonb_typeof(rebalancing_rules) = 'object'::text) AND (rebalancing_rules ? 'frequency'::text))))
);


--
-- Name: COLUMN token_erc4626_properties.whitelist_config; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc4626_properties.whitelist_config IS 'JSON configuration for vault token whitelist controls including depositor restrictions, withdrawal limits, and investor eligibility';


--
-- Name: COLUMN token_erc4626_properties.strategy_complexity; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc4626_properties.strategy_complexity IS 'Complexity level of the vault strategy: simple, moderate, advanced';


--
-- Name: COLUMN token_erc4626_properties.multi_asset_enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc4626_properties.multi_asset_enabled IS 'Whether the vault manages multiple underlying assets';


--
-- Name: COLUMN token_erc4626_properties.auto_compounding_enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc4626_properties.auto_compounding_enabled IS 'Whether yields are automatically reinvested';


--
-- Name: COLUMN token_erc4626_properties.yield_optimization_strategy; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc4626_properties.yield_optimization_strategy IS 'Strategy used to optimize yield generation';


--
-- Name: COLUMN token_erc4626_properties.risk_management_enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc4626_properties.risk_management_enabled IS 'Whether risk management features are active';


--
-- Name: COLUMN token_erc4626_properties.insurance_enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc4626_properties.insurance_enabled IS 'Whether vault deposits are insured';


--
-- Name: COLUMN token_erc4626_properties.governance_token_enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc4626_properties.governance_token_enabled IS 'Whether vault shares have governance rights';


--
-- Name: COLUMN token_erc4626_properties.institutional_grade; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc4626_properties.institutional_grade IS 'Whether vault meets institutional investment standards';


--
-- Name: token_erc4626_strategy_params; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.token_erc4626_strategy_params (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token_id uuid NOT NULL,
    name text NOT NULL,
    value text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    param_type text DEFAULT 'string'::text,
    is_required boolean DEFAULT false,
    default_value text,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: token_erc4626_vault_strategies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.token_erc4626_vault_strategies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token_id uuid NOT NULL,
    strategy_name text NOT NULL,
    strategy_type text NOT NULL,
    protocol_address text,
    protocol_name text,
    allocation_percentage text NOT NULL,
    min_allocation_percentage text,
    max_allocation_percentage text,
    risk_score integer,
    expected_apy text,
    actual_apy text,
    is_active boolean DEFAULT true,
    last_rebalance timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: token_erc4626_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.token_erc4626_view AS
 SELECT t.id AS token_id,
    t.name,
    t.symbol,
    t.decimals,
    t.standard,
    t.total_supply,
    t.metadata,
    t.status,
    t.description,
    t.created_at AS token_created_at,
    t.updated_at AS token_updated_at,
    p.id AS erc4626_property_id,
    p.asset_address,
    p.asset_name,
    p.asset_symbol,
    p.asset_decimals,
    p.vault_type,
    p.is_mintable,
    p.is_burnable,
    p.is_pausable,
    p.vault_strategy,
    p.custom_strategy,
    p.strategy_controller,
    p.access_control,
    p.permit,
    p.flash_loans,
    p.emergency_shutdown,
    p.fee_structure,
    p.rebalancing_rules,
    p.performance_metrics,
    p.yield_source,
    p.automated_rebalancing,
    p.strategy_complexity,
    p.multi_asset_enabled,
    p.rebalancing_enabled,
    p.auto_compounding_enabled,
    p.yield_optimization_enabled,
    p.risk_management_enabled,
    p.risk_tolerance,
    p.apy_tracking_enabled,
    p.benchmark_tracking_enabled,
    p.benchmark_index,
    p.compound_frequency,
    p.governance_token_enabled,
    p.strategy_voting_enabled,
    p.fee_voting_enabled,
    p.insurance_enabled,
    p.emergency_exit_enabled,
    p.circuit_breaker_enabled,
    p.liquidity_mining_enabled,
    p.market_making_enabled,
    p.cross_chain_yield_enabled,
    p.institutional_grade,
    p.compliance_reporting_enabled,
    p.third_party_audits_enabled,
    p.created_at AS property_created_at,
    p.updated_at AS property_updated_at
   FROM (public.tokens t
     LEFT JOIN public.token_erc4626_properties p ON ((t.id = p.token_id)))
  WHERE (t.standard = 'ERC-4626'::public.token_standard_enum);


--
-- Name: token_erc721_attributes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.token_erc721_attributes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token_id uuid NOT NULL,
    trait_type text NOT NULL,
    "values" text[] NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: token_erc721_mint_phases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.token_erc721_mint_phases (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token_id uuid NOT NULL,
    phase_name text NOT NULL,
    phase_order integer NOT NULL,
    start_time timestamp with time zone,
    end_time timestamp with time zone,
    max_supply integer,
    price text,
    max_per_wallet integer,
    whitelist_required boolean DEFAULT false,
    merkle_root text,
    is_active boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: token_erc721_properties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.token_erc721_properties (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token_id uuid NOT NULL,
    base_uri text,
    metadata_storage text DEFAULT 'ipfs'::text,
    max_supply text,
    has_royalty boolean DEFAULT false,
    royalty_percentage text,
    royalty_receiver text,
    is_burnable boolean DEFAULT false,
    is_pausable boolean DEFAULT false,
    asset_type text DEFAULT 'unique_asset'::text,
    minting_method text DEFAULT 'open'::text,
    auto_increment_ids boolean DEFAULT true,
    enumerable boolean DEFAULT true,
    uri_storage text DEFAULT 'tokenId'::text,
    access_control text DEFAULT 'ownable'::text,
    updatable_uris boolean DEFAULT false,
    sales_config jsonb,
    whitelist_config jsonb,
    permission_config jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_mintable boolean,
    dynamic_uri_config jsonb,
    batch_minting_config jsonb,
    transfer_restrictions jsonb,
    supply_validation_enabled boolean DEFAULT true,
    contract_uri text,
    custom_base_uri text,
    revealable boolean DEFAULT false,
    pre_reveal_uri text,
    reserved_tokens integer DEFAULT 0,
    minting_price text,
    max_mints_per_tx integer,
    max_mints_per_wallet integer,
    enable_fractional_ownership boolean DEFAULT false,
    enable_dynamic_metadata boolean DEFAULT false,
    use_safe_transfer boolean DEFAULT true,
    public_sale_enabled boolean DEFAULT false,
    public_sale_price text,
    public_sale_start_time timestamp with time zone,
    public_sale_end_time timestamp with time zone,
    whitelist_sale_enabled boolean DEFAULT false,
    whitelist_sale_price text,
    whitelist_sale_start_time timestamp with time zone,
    whitelist_sale_end_time timestamp with time zone,
    reveal_batch_size integer,
    auto_reveal boolean DEFAULT false,
    reveal_delay integer,
    placeholder_image_uri text,
    metadata_frozen boolean DEFAULT false,
    metadata_provenance_hash text,
    mint_roles text[],
    admin_mint_enabled boolean DEFAULT true,
    public_mint_enabled boolean DEFAULT false,
    burn_roles text[],
    transfer_locked boolean DEFAULT false,
    soulbound boolean DEFAULT false,
    creator_earnings_enabled boolean DEFAULT false,
    creator_earnings_percentage text,
    creator_earnings_address text,
    marketplace_approved text[],
    operator_filter_enabled boolean DEFAULT false,
    custom_operator_filter_address text,
    utility_enabled boolean DEFAULT false,
    utility_type text,
    staking_enabled boolean DEFAULT false,
    staking_rewards_token_address text,
    staking_rewards_rate text,
    breeding_enabled boolean DEFAULT false,
    evolution_enabled boolean DEFAULT false,
    supply_cap_enabled boolean DEFAULT false,
    total_supply_cap text,
    mint_phases_enabled boolean DEFAULT false,
    dutch_auction_enabled boolean DEFAULT false,
    dutch_auction_start_price text,
    dutch_auction_end_price text,
    dutch_auction_duration integer,
    cross_chain_enabled boolean DEFAULT false,
    bridge_contracts jsonb,
    layer2_enabled boolean DEFAULT false,
    layer2_networks text[],
    use_geographic_restrictions boolean DEFAULT false,
    default_restriction_policy text DEFAULT 'allowed'::text,
    CONSTRAINT check_whitelist_config_valid CHECK (public.validate_whitelist_config_permissive(whitelist_config)),
    CONSTRAINT sales_config_structure_check CHECK (((sales_config IS NULL) OR ((jsonb_typeof(sales_config) = 'object'::text) AND (sales_config ? 'enabled'::text) AND (((sales_config -> 'enabled'::text))::text = ANY (ARRAY['true'::text, 'false'::text]))))),
    CONSTRAINT whitelist_config_structure_check CHECK (((whitelist_config IS NULL) OR ((jsonb_typeof(whitelist_config) = 'object'::text) AND (whitelist_config ? 'enabled'::text) AND (((whitelist_config -> 'enabled'::text))::text = ANY (ARRAY['true'::text, 'false'::text])))))
);


--
-- Name: COLUMN token_erc721_properties.contract_uri; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc721_properties.contract_uri IS 'Contract-level metadata URI';


--
-- Name: COLUMN token_erc721_properties.revealable; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc721_properties.revealable IS 'Whether NFTs are revealed in batches';


--
-- Name: COLUMN token_erc721_properties.reserved_tokens; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc721_properties.reserved_tokens IS 'Number of tokens reserved for team/partnerships';


--
-- Name: COLUMN token_erc721_properties.enable_fractional_ownership; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc721_properties.enable_fractional_ownership IS 'Whether NFTs can be fractionalized';


--
-- Name: COLUMN token_erc721_properties.soulbound; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc721_properties.soulbound IS 'Whether tokens are non-transferable after mint';


--
-- Name: COLUMN token_erc721_properties.utility_enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc721_properties.utility_enabled IS 'Whether NFTs have utility beyond collectibility';


--
-- Name: COLUMN token_erc721_properties.staking_enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc721_properties.staking_enabled IS 'Whether NFTs can be staked for rewards';


--
-- Name: COLUMN token_erc721_properties.cross_chain_enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_erc721_properties.cross_chain_enabled IS 'Whether NFTs support cross-chain transfers';


--
-- Name: token_erc721_trait_definitions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.token_erc721_trait_definitions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token_id uuid NOT NULL,
    trait_name text NOT NULL,
    trait_type text NOT NULL,
    possible_values jsonb,
    rarity_weights jsonb,
    is_required boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: token_erc721_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.token_erc721_view AS
 SELECT t.id AS token_id,
    t.name,
    t.symbol,
    t.decimals,
    t.standard,
    t.total_supply,
    t.metadata,
    t.status,
    t.description,
    t.created_at AS token_created_at,
    t.updated_at AS token_updated_at,
    p.id AS erc721_property_id,
    p.base_uri,
    p.metadata_storage,
    p.max_supply,
    p.has_royalty,
    p.royalty_percentage,
    p.royalty_receiver,
    p.is_burnable,
    p.is_pausable,
    p.asset_type,
    p.minting_method,
    p.auto_increment_ids,
    p.enumerable,
    p.uri_storage,
    p.access_control,
    p.updatable_uris,
    p.sales_config,
    p.whitelist_config,
    p.permission_config,
    p.contract_uri,
    p.revealable,
    p.pre_reveal_uri,
    p.reserved_tokens,
    p.minting_price,
    p.max_mints_per_tx,
    p.max_mints_per_wallet,
    p.enable_fractional_ownership,
    p.enable_dynamic_metadata,
    p.public_sale_enabled,
    p.public_sale_price,
    p.public_sale_start_time,
    p.whitelist_sale_enabled,
    p.whitelist_sale_price,
    p.whitelist_sale_start_time,
    p.utility_enabled,
    p.utility_type,
    p.staking_enabled,
    p.soulbound,
    p.cross_chain_enabled,
    p.created_at AS property_created_at,
    p.updated_at AS property_updated_at
   FROM (public.tokens t
     LEFT JOIN public.token_erc721_properties p ON ((t.id = p.token_id)))
  WHERE (t.standard = 'ERC-721'::public.token_standard_enum);


--
-- Name: token_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.token_events (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    token_id uuid NOT NULL,
    event_type text NOT NULL,
    severity text NOT NULL,
    message text NOT NULL,
    data jsonb,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    CONSTRAINT token_events_severity_check CHECK ((severity = ANY (ARRAY['info'::text, 'low'::text, 'medium'::text, 'high'::text, 'critical'::text])))
);


--
-- Name: token_geographic_restrictions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.token_geographic_restrictions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token_id uuid NOT NULL,
    restriction_type text NOT NULL,
    country_code character(2) NOT NULL,
    max_ownership_percentage numeric(5,2),
    min_investment_amount text,
    max_investment_amount text,
    requires_local_custodian boolean DEFAULT false,
    requires_tax_clearance boolean DEFAULT false,
    requires_regulatory_approval boolean DEFAULT false,
    holding_period_restriction integer,
    transfer_restrictions jsonb,
    reporting_requirements jsonb,
    effective_date date DEFAULT CURRENT_DATE NOT NULL,
    expiry_date date,
    notes text,
    created_by text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT valid_ownership_percentage CHECK (((max_ownership_percentage >= (0)::numeric) AND (max_ownership_percentage <= (100)::numeric))),
    CONSTRAINT valid_restriction_type CHECK ((restriction_type = ANY (ARRAY['blocked'::text, 'allowed'::text, 'limited'::text, 'enhanced_dd'::text, 'conditional'::text])))
);


--
-- Name: TABLE token_geographic_restrictions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.token_geographic_restrictions IS 'Token-specific geographic restrictions and compliance rules';


--
-- Name: token_geographic_restrictions_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.token_geographic_restrictions_view AS
 SELECT tgr.token_id,
    t.name AS token_name,
    t.symbol AS token_symbol,
    t.standard,
    tgr.restriction_type,
    gj.country_code,
    gj.country_name,
    gj.region,
    gj.regulatory_regime,
    tgr.max_ownership_percentage,
    tgr.requires_local_custodian,
    tgr.requires_regulatory_approval,
    gj.sanctions_risk_level,
    gj.is_ofac_sanctioned,
    gj.is_eu_sanctioned,
    gj.is_un_sanctioned,
    tgr.effective_date,
    tgr.expiry_date,
    tgr.notes
   FROM ((public.token_geographic_restrictions tgr
     JOIN public.tokens t ON ((tgr.token_id = t.id)))
     JOIN public.geographic_jurisdictions gj ON ((tgr.country_code = gj.country_code)))
  WHERE (((tgr.effective_date IS NULL) OR (tgr.effective_date <= CURRENT_DATE)) AND ((tgr.expiry_date IS NULL) OR (tgr.expiry_date > CURRENT_DATE)));


--
-- Name: token_operations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.token_operations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token_id uuid NOT NULL,
    operation_type text NOT NULL,
    operator text NOT NULL,
    amount numeric,
    recipient text,
    sender text,
    target_address text,
    nft_token_id text,
    token_type_id text,
    slot_id text,
    value numeric,
    partition text,
    asset_token_address text,
    lock_duration integer,
    lock_reason text,
    unlock_time timestamp with time zone,
    lock_id text,
    transaction_hash text,
    "timestamp" timestamp with time zone DEFAULT now(),
    status text DEFAULT 'SUCCESSFUL'::text,
    error_message text,
    blocks jsonb
);


--
-- Name: token_sanctions_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.token_sanctions_rules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token_id uuid NOT NULL,
    sanctions_regime text NOT NULL,
    screening_enabled boolean DEFAULT true,
    auto_block_sanctioned_entities boolean DEFAULT true,
    enhanced_due_diligence_required boolean DEFAULT false,
    manual_review_threshold text,
    screening_frequency text DEFAULT 'real_time'::text,
    whitelist_override_allowed boolean DEFAULT false,
    last_screening_update timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE token_sanctions_rules; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.token_sanctions_rules IS 'Sanctions screening configuration per token';


--
-- Name: token_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.token_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    standard text NOT NULL,
    blocks jsonb NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT token_templates_standard_check CHECK ((standard = ANY (ARRAY['ERC-20'::text, 'ERC-721'::text, 'ERC-1155'::text, 'ERC-1400'::text, 'ERC-3525'::text, 'ERC-4626'::text])))
);


--
-- Name: token_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.token_versions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token_id uuid NOT NULL,
    version integer NOT NULL,
    data jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    created_by text,
    blocks jsonb,
    decimals integer,
    metadata jsonb,
    name text,
    standard text,
    symbol text,
    notes text
);


--
-- Name: token_whitelists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.token_whitelists (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token_id uuid NOT NULL,
    wallet_address text NOT NULL,
    blockchain text NOT NULL,
    approved_by uuid,
    approval_date timestamp with time zone DEFAULT now(),
    is_active boolean DEFAULT true,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    approval_reason text,
    removal_date timestamp with time zone,
    removal_reason text,
    removal_by uuid
);


--
-- Name: COLUMN token_whitelists.created_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_whitelists.created_by IS 'User ID who added the address to whitelist';


--
-- Name: COLUMN token_whitelists.updated_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_whitelists.updated_by IS 'User ID who last modified the whitelist entry';


--
-- Name: COLUMN token_whitelists.approval_reason; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_whitelists.approval_reason IS 'Reason for approving the address';


--
-- Name: COLUMN token_whitelists.removal_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_whitelists.removal_date IS 'Date when address was removed from whitelist';


--
-- Name: COLUMN token_whitelists.removal_reason; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_whitelists.removal_reason IS 'Reason for removing the address';


--
-- Name: COLUMN token_whitelists.removal_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.token_whitelists.removal_by IS 'User ID who removed the address';


--
-- Name: token_whitelist_summary; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.token_whitelist_summary AS
 SELECT t.id AS token_id,
    t.name AS token_name,
    t.symbol AS token_symbol,
    t.standard AS token_standard,
        CASE
            WHEN (t.standard = 'ERC-20'::public.token_standard_enum) THEN COALESCE(((erc20.whitelist_config ->> 'enabled'::text))::boolean, false)
            ELSE NULL::boolean
        END AS erc20_whitelist_enabled,
        CASE
            WHEN (t.standard = 'ERC-721'::public.token_standard_enum) THEN COALESCE(((erc721.whitelist_config ->> 'enabled'::text))::boolean, false)
            ELSE NULL::boolean
        END AS erc721_whitelist_enabled,
        CASE
            WHEN (t.standard = 'ERC-1155'::public.token_standard_enum) THEN COALESCE(((erc1155.whitelist_config ->> 'enabled'::text))::boolean, false)
            ELSE NULL::boolean
        END AS erc1155_whitelist_enabled,
        CASE
            WHEN (t.standard = 'ERC-1400'::public.token_standard_enum) THEN COALESCE(erc1400.investor_whitelist_enabled, false)
            ELSE NULL::boolean
        END AS erc1400_whitelist_enabled,
        CASE
            WHEN (t.standard = 'ERC-3525'::public.token_standard_enum) THEN COALESCE(((erc3525.whitelist_config ->> 'enabled'::text))::boolean, false)
            ELSE NULL::boolean
        END AS erc3525_whitelist_enabled,
        CASE
            WHEN (t.standard = 'ERC-4626'::public.token_standard_enum) THEN COALESCE(((erc4626.whitelist_config ->> 'enabled'::text))::boolean, false)
            ELSE NULL::boolean
        END AS erc4626_whitelist_enabled,
    COALESCE(tw.address_count, (0)::bigint) AS whitelisted_address_count,
    t.created_at,
    t.updated_at
   FROM (((((((public.tokens t
     LEFT JOIN public.token_erc20_properties erc20 ON ((t.id = erc20.token_id)))
     LEFT JOIN public.token_erc721_properties erc721 ON ((t.id = erc721.token_id)))
     LEFT JOIN public.token_erc1155_properties erc1155 ON ((t.id = erc1155.token_id)))
     LEFT JOIN public.token_erc1400_properties erc1400 ON ((t.id = erc1400.token_id)))
     LEFT JOIN public.token_erc3525_properties erc3525 ON ((t.id = erc3525.token_id)))
     LEFT JOIN public.token_erc4626_properties erc4626 ON ((t.id = erc4626.token_id)))
     LEFT JOIN ( SELECT token_whitelists.token_id,
            count(*) AS address_count
           FROM public.token_whitelists
          WHERE (token_whitelists.is_active = true)
          GROUP BY token_whitelists.token_id) tw ON ((t.id = tw.token_id)));


--
-- Name: VIEW token_whitelist_summary; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.token_whitelist_summary IS 'Comprehensive view of whitelist status across all token standards';


--
-- Name: transaction_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transaction_events (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    request_id text NOT NULL,
    event_type text NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL,
    data jsonb NOT NULL,
    actor text,
    actor_role text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: transaction_notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transaction_notifications (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    transaction_id text,
    wallet_address text NOT NULL,
    type text NOT NULL,
    message text NOT NULL,
    read boolean DEFAULT false,
    action_url text,
    data jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: transaction_proposals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transaction_proposals (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    wallet_id uuid,
    title text NOT NULL,
    description text,
    to_address text NOT NULL,
    value text NOT NULL,
    data text DEFAULT '0x'::text,
    nonce integer,
    status text DEFAULT 'pending'::text NOT NULL,
    blockchain text NOT NULL,
    token_address text,
    token_symbol text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: transaction_signatures; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transaction_signatures (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    proposal_id uuid NOT NULL,
    transaction_hash text,
    signer uuid NOT NULL,
    signature text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE transaction_signatures; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.transaction_signatures IS 'Signatures for multi-signature transactions';


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    transaction_hash text NOT NULL,
    from_address text NOT NULL,
    to_address text NOT NULL,
    value numeric DEFAULT 0 NOT NULL,
    token_symbol text,
    token_address text,
    blockchain text DEFAULT 'ethereum'::text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    type text DEFAULT 'transfer'::text NOT NULL,
    gas_used numeric,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    gas_limit numeric,
    gas_price numeric,
    max_fee_per_gas numeric,
    max_priority_fee_per_gas numeric,
    block_number integer,
    block_hash text,
    transaction_index integer,
    confirmations integer DEFAULT 0,
    memo text,
    destination_tag integer,
    transfer_type text DEFAULT 'standard'::text,
    network_fee numeric,
    estimated_confirmation_time interval,
    CONSTRAINT transactions_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'failed'::text]))),
    CONSTRAINT transactions_transfer_type_check CHECK ((transfer_type = ANY (ARRAY['standard'::text, 'token'::text, 'nft'::text, 'multisig'::text]))),
    CONSTRAINT transactions_type_check CHECK ((type = ANY (ARRAY['transfer'::text, 'token_transfer'::text, 'nft_transfer'::text])))
);


--
-- Name: TABLE transactions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.transactions IS 'General blockchain transactions table for tracking transfers and operations';


--
-- Name: transfer_history; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.transfer_history AS
 SELECT t.id,
    t.transaction_hash AS hash,
    t.from_address,
    t.to_address,
    t.value AS amount,
    t.token_symbol AS asset,
    t.blockchain,
    t.status,
    t.type AS transfer_type,
    t.network_fee,
    t.gas_used,
    t.block_number,
    t.confirmations,
    t.memo,
    t.created_at,
    t.updated_at
   FROM public.transactions t
  WHERE (t.type = ANY (ARRAY['transfer'::text, 'token_transfer'::text, 'nft_transfer'::text]))
  ORDER BY t.created_at DESC;


--
-- Name: VIEW transfer_history; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.transfer_history IS 'Unified view of all transfer transactions across different blockchains';


--
-- Name: user_activity_summary; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.user_activity_summary AS
 SELECT audit_logs.user_id,
    audit_logs.user_email,
    count(*) AS total_activities,
    max(audit_logs."timestamp") AS last_activity,
    count(DISTINCT date_trunc('day'::text, audit_logs."timestamp")) AS active_days,
    count(DISTINCT audit_logs.project_id) AS projects_accessed,
    count(DISTINCT audit_logs.session_id) AS session_count
   FROM public.audit_logs
  WHERE (audit_logs.user_id IS NOT NULL)
  GROUP BY audit_logs.user_id, audit_logs.user_email;


--
-- Name: user_mfa_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_mfa_settings (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    verified boolean DEFAULT false NOT NULL,
    secret text,
    backup_codes jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    user_id uuid NOT NULL,
    role_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_permissions_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.user_permissions_view AS
 SELECT u.id AS user_id,
    u.name AS user_name,
    u.email,
    r.name AS role_name,
    p.name AS permission_name,
    p.description AS permission_description
   FROM ((((public.users u
     JOIN public.user_roles ur ON ((u.id = ur.user_id)))
     JOIN public.roles r ON ((ur.role_id = r.id)))
     JOIN public.role_permissions rp ON ((r.id = rp.role_id)))
     JOIN public.permissions p ON ((rp.permission_name = p.name)));


--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_sessions (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid,
    session_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    last_active_at timestamp with time zone DEFAULT now(),
    ip_address text,
    user_agent text,
    device_info jsonb
);


--
-- Name: valid_policy_approvers; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.valid_policy_approvers AS
 SELECT a.id,
    a.policy_rule_id,
    a.user_id,
    a.created_by,
    a.created_at,
    a.status,
    a.comment,
    a."timestamp"
   FROM (public.policy_rule_approvers a
     JOIN public.rules r ON ((a.policy_rule_id = r.rule_id)));


--
-- Name: wallet_details; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wallet_details (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    wallet_id uuid,
    blockchain_specific_data jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: wallet_signatories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wallet_signatories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    wallet_address text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    role text NOT NULL,
    status text DEFAULT 'pending'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT wallet_signatories_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'active'::text, 'suspended'::text])))
);


--
-- Name: wallet_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wallet_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    chain_id text,
    data jsonb,
    from_address text,
    gas_limit numeric,
    gas_price numeric,
    nonce integer,
    to_address text,
    value numeric,
    created_at timestamp with time zone DEFAULT now(),
    tx_hash text,
    status text DEFAULT 'pending'::text,
    token_symbol text,
    token_address text,
    confirmation_count integer DEFAULT 0,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: whitelist_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.whitelist_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id text NOT NULL,
    address text NOT NULL,
    label text,
    added_by text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: whitelist_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.whitelist_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid,
    name text NOT NULL,
    description text,
    rule_id uuid,
    required_approvals integer NOT NULL,
    total_approvers integer NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT whitelist_settings_check CHECK ((total_approvers >= required_approvals)),
    CONSTRAINT whitelist_settings_required_approvals_check CHECK ((required_approvals > 0))
);


--
-- Name: whitelist_signatories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.whitelist_signatories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    whitelist_id uuid,
    user_id uuid,
    approved boolean DEFAULT false,
    approved_at timestamp with time zone
);


--
-- Name: workflow_stages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workflow_stages (
    id text NOT NULL,
    organization_id text NOT NULL,
    name text NOT NULL,
    description text,
    status text NOT NULL,
    completion_percentage integer DEFAULT 0 NOT NULL,
    "order" integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: alerts alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_pkey PRIMARY KEY (id);


--
-- Name: approval_config_approvers approval_config_approvers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_config_approvers
    ADD CONSTRAINT approval_config_approvers_pkey PRIMARY KEY (id);


--
-- Name: approval_config_history approval_config_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_config_history
    ADD CONSTRAINT approval_config_history_pkey PRIMARY KEY (id);


--
-- Name: approval_configs approval_configs_permission_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_configs
    ADD CONSTRAINT approval_configs_permission_id_key UNIQUE (permission_id);


--
-- Name: approval_configs approval_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_configs
    ADD CONSTRAINT approval_configs_pkey PRIMARY KEY (id);


--
-- Name: approval_requests approval_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_requests
    ADD CONSTRAINT approval_requests_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: auth_events auth_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_events
    ADD CONSTRAINT auth_events_pkey PRIMARY KEY (id);


--
-- Name: bulk_operations bulk_operations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bulk_operations
    ADD CONSTRAINT bulk_operations_pkey PRIMARY KEY (id);


--
-- Name: cap_table_investors cap_table_investors_cap_table_id_investor_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cap_table_investors
    ADD CONSTRAINT cap_table_investors_cap_table_id_investor_id_key UNIQUE (cap_table_id, investor_id);


--
-- Name: cap_table_investors cap_table_investors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cap_table_investors
    ADD CONSTRAINT cap_table_investors_pkey PRIMARY KEY (id);


--
-- Name: cap_table_investors cap_table_investors_unique_constraint; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cap_table_investors
    ADD CONSTRAINT cap_table_investors_unique_constraint UNIQUE (cap_table_id, investor_id);


--
-- Name: cap_tables cap_tables_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cap_tables
    ADD CONSTRAINT cap_tables_pkey PRIMARY KEY (id);


--
-- Name: compliance_checks compliance_checks_investor_id_project_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.compliance_checks
    ADD CONSTRAINT compliance_checks_investor_id_project_id_key UNIQUE (investor_id, project_id);


--
-- Name: compliance_checks compliance_checks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.compliance_checks
    ADD CONSTRAINT compliance_checks_pkey PRIMARY KEY (id);


--
-- Name: compliance_reports compliance_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.compliance_reports
    ADD CONSTRAINT compliance_reports_pkey PRIMARY KEY (id);


--
-- Name: compliance_settings compliance_settings_organization_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.compliance_settings
    ADD CONSTRAINT compliance_settings_organization_id_key UNIQUE (organization_id);


--
-- Name: compliance_settings compliance_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.compliance_settings
    ADD CONSTRAINT compliance_settings_pkey PRIMARY KEY (id);


--
-- Name: consensus_settings consensus_settings_consensus_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consensus_settings
    ADD CONSTRAINT consensus_settings_consensus_type_key UNIQUE (consensus_type);


--
-- Name: consensus_settings consensus_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consensus_settings
    ADD CONSTRAINT consensus_settings_pkey PRIMARY KEY (id);


--
-- Name: credential_usage_logs credential_usage_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credential_usage_logs
    ADD CONSTRAINT credential_usage_logs_pkey PRIMARY KEY (id);


--
-- Name: deployment_rate_limits deployment_rate_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deployment_rate_limits
    ADD CONSTRAINT deployment_rate_limits_pkey PRIMARY KEY (id);


--
-- Name: dfns_activity_logs dfns_activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_activity_logs
    ADD CONSTRAINT dfns_activity_logs_pkey PRIMARY KEY (id);


--
-- Name: dfns_api_requests dfns_api_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_api_requests
    ADD CONSTRAINT dfns_api_requests_pkey PRIMARY KEY (id);


--
-- Name: dfns_applications dfns_applications_app_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_applications
    ADD CONSTRAINT dfns_applications_app_id_key UNIQUE (app_id);


--
-- Name: dfns_applications dfns_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_applications
    ADD CONSTRAINT dfns_applications_pkey PRIMARY KEY (id);


--
-- Name: dfns_broadcast_transactions dfns_broadcast_transactions_broadcast_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_broadcast_transactions
    ADD CONSTRAINT dfns_broadcast_transactions_broadcast_id_key UNIQUE (broadcast_id);


--
-- Name: dfns_broadcast_transactions dfns_broadcast_transactions_dfns_broadcast_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_broadcast_transactions
    ADD CONSTRAINT dfns_broadcast_transactions_dfns_broadcast_id_key UNIQUE (dfns_broadcast_id);


--
-- Name: dfns_broadcast_transactions dfns_broadcast_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_broadcast_transactions
    ADD CONSTRAINT dfns_broadcast_transactions_pkey PRIMARY KEY (id);


--
-- Name: dfns_credentials dfns_credentials_credential_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_credentials
    ADD CONSTRAINT dfns_credentials_credential_id_key UNIQUE (credential_id);


--
-- Name: dfns_credentials dfns_credentials_dfns_credential_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_credentials
    ADD CONSTRAINT dfns_credentials_dfns_credential_id_key UNIQUE (dfns_credential_id);


--
-- Name: dfns_credentials dfns_credentials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_credentials
    ADD CONSTRAINT dfns_credentials_pkey PRIMARY KEY (id);


--
-- Name: dfns_exchange_accounts dfns_exchange_accounts_account_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_exchange_accounts
    ADD CONSTRAINT dfns_exchange_accounts_account_id_key UNIQUE (account_id);


--
-- Name: dfns_exchange_accounts dfns_exchange_accounts_dfns_account_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_exchange_accounts
    ADD CONSTRAINT dfns_exchange_accounts_dfns_account_id_key UNIQUE (dfns_account_id);


--
-- Name: dfns_exchange_accounts dfns_exchange_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_exchange_accounts
    ADD CONSTRAINT dfns_exchange_accounts_pkey PRIMARY KEY (id);


--
-- Name: dfns_exchange_balances dfns_exchange_balances_account_id_asset_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_exchange_balances
    ADD CONSTRAINT dfns_exchange_balances_account_id_asset_key UNIQUE (account_id, asset);


--
-- Name: dfns_exchange_balances dfns_exchange_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_exchange_balances
    ADD CONSTRAINT dfns_exchange_balances_pkey PRIMARY KEY (id);


--
-- Name: dfns_exchange_integrations dfns_exchange_integrations_dfns_exchange_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_exchange_integrations
    ADD CONSTRAINT dfns_exchange_integrations_dfns_exchange_id_key UNIQUE (dfns_exchange_id);


--
-- Name: dfns_exchange_integrations dfns_exchange_integrations_integration_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_exchange_integrations
    ADD CONSTRAINT dfns_exchange_integrations_integration_id_key UNIQUE (integration_id);


--
-- Name: dfns_exchange_integrations dfns_exchange_integrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_exchange_integrations
    ADD CONSTRAINT dfns_exchange_integrations_pkey PRIMARY KEY (id);


--
-- Name: dfns_fee_sponsors dfns_fee_sponsors_dfns_sponsor_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_fee_sponsors
    ADD CONSTRAINT dfns_fee_sponsors_dfns_sponsor_id_key UNIQUE (dfns_sponsor_id);


--
-- Name: dfns_fee_sponsors dfns_fee_sponsors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_fee_sponsors
    ADD CONSTRAINT dfns_fee_sponsors_pkey PRIMARY KEY (id);


--
-- Name: dfns_fee_sponsors dfns_fee_sponsors_sponsor_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_fee_sponsors
    ADD CONSTRAINT dfns_fee_sponsors_sponsor_id_key UNIQUE (sponsor_id);


--
-- Name: dfns_fiat_activity_logs dfns_fiat_activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_fiat_activity_logs
    ADD CONSTRAINT dfns_fiat_activity_logs_pkey PRIMARY KEY (id);


--
-- Name: dfns_fiat_provider_configs dfns_fiat_provider_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_fiat_provider_configs
    ADD CONSTRAINT dfns_fiat_provider_configs_pkey PRIMARY KEY (id);


--
-- Name: dfns_fiat_provider_configs dfns_fiat_provider_configs_provider_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_fiat_provider_configs
    ADD CONSTRAINT dfns_fiat_provider_configs_provider_key UNIQUE (provider);


--
-- Name: dfns_fiat_quotes dfns_fiat_quotes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_fiat_quotes
    ADD CONSTRAINT dfns_fiat_quotes_pkey PRIMARY KEY (id);


--
-- Name: dfns_fiat_transactions dfns_fiat_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_fiat_transactions
    ADD CONSTRAINT dfns_fiat_transactions_pkey PRIMARY KEY (id);


--
-- Name: dfns_fiat_transactions dfns_fiat_transactions_provider_provider_transaction_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_fiat_transactions
    ADD CONSTRAINT dfns_fiat_transactions_provider_provider_transaction_id_key UNIQUE (provider, provider_transaction_id);


--
-- Name: dfns_permission_assignments dfns_permission_assignments_permission_id_identity_id_ident_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_permission_assignments
    ADD CONSTRAINT dfns_permission_assignments_permission_id_identity_id_ident_key UNIQUE (permission_id, identity_id, identity_kind);


--
-- Name: dfns_permission_assignments dfns_permission_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_permission_assignments
    ADD CONSTRAINT dfns_permission_assignments_pkey PRIMARY KEY (id);


--
-- Name: dfns_permissions dfns_permissions_dfns_permission_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_permissions
    ADD CONSTRAINT dfns_permissions_dfns_permission_id_key UNIQUE (dfns_permission_id);


--
-- Name: dfns_permissions dfns_permissions_permission_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_permissions
    ADD CONSTRAINT dfns_permissions_permission_id_key UNIQUE (permission_id);


--
-- Name: dfns_permissions dfns_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_permissions
    ADD CONSTRAINT dfns_permissions_pkey PRIMARY KEY (id);


--
-- Name: dfns_personal_access_tokens dfns_personal_access_tokens_dfns_token_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_personal_access_tokens
    ADD CONSTRAINT dfns_personal_access_tokens_dfns_token_id_key UNIQUE (dfns_token_id);


--
-- Name: dfns_personal_access_tokens dfns_personal_access_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_personal_access_tokens
    ADD CONSTRAINT dfns_personal_access_tokens_pkey PRIMARY KEY (id);


--
-- Name: dfns_policies dfns_policies_dfns_policy_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_policies
    ADD CONSTRAINT dfns_policies_dfns_policy_id_key UNIQUE (dfns_policy_id);


--
-- Name: dfns_policies dfns_policies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_policies
    ADD CONSTRAINT dfns_policies_pkey PRIMARY KEY (id);


--
-- Name: dfns_policies dfns_policies_policy_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_policies
    ADD CONSTRAINT dfns_policies_policy_id_key UNIQUE (policy_id);


--
-- Name: dfns_policy_approvals dfns_policy_approvals_approval_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_policy_approvals
    ADD CONSTRAINT dfns_policy_approvals_approval_id_key UNIQUE (approval_id);


--
-- Name: dfns_policy_approvals dfns_policy_approvals_dfns_approval_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_policy_approvals
    ADD CONSTRAINT dfns_policy_approvals_dfns_approval_id_key UNIQUE (dfns_approval_id);


--
-- Name: dfns_policy_approvals dfns_policy_approvals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_policy_approvals
    ADD CONSTRAINT dfns_policy_approvals_pkey PRIMARY KEY (id);


--
-- Name: dfns_service_accounts dfns_service_accounts_dfns_service_account_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_service_accounts
    ADD CONSTRAINT dfns_service_accounts_dfns_service_account_id_key UNIQUE (dfns_service_account_id);


--
-- Name: dfns_service_accounts dfns_service_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_service_accounts
    ADD CONSTRAINT dfns_service_accounts_pkey PRIMARY KEY (id);


--
-- Name: dfns_signatures dfns_signatures_dfns_signature_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_signatures
    ADD CONSTRAINT dfns_signatures_dfns_signature_id_key UNIQUE (dfns_signature_id);


--
-- Name: dfns_signatures dfns_signatures_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_signatures
    ADD CONSTRAINT dfns_signatures_pkey PRIMARY KEY (id);


--
-- Name: dfns_signatures dfns_signatures_signature_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_signatures
    ADD CONSTRAINT dfns_signatures_signature_id_key UNIQUE (signature_id);


--
-- Name: dfns_signing_keys dfns_signing_keys_dfns_key_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_signing_keys
    ADD CONSTRAINT dfns_signing_keys_dfns_key_id_key UNIQUE (dfns_key_id);


--
-- Name: dfns_signing_keys dfns_signing_keys_key_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_signing_keys
    ADD CONSTRAINT dfns_signing_keys_key_id_key UNIQUE (key_id);


--
-- Name: dfns_signing_keys dfns_signing_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_signing_keys
    ADD CONSTRAINT dfns_signing_keys_pkey PRIMARY KEY (id);


--
-- Name: dfns_sponsored_fees dfns_sponsored_fees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_sponsored_fees
    ADD CONSTRAINT dfns_sponsored_fees_pkey PRIMARY KEY (id);


--
-- Name: dfns_sponsored_fees dfns_sponsored_fees_sponsored_fee_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_sponsored_fees
    ADD CONSTRAINT dfns_sponsored_fees_sponsored_fee_id_key UNIQUE (sponsored_fee_id);


--
-- Name: dfns_staking_integrations dfns_staking_integrations_dfns_staking_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_staking_integrations
    ADD CONSTRAINT dfns_staking_integrations_dfns_staking_id_key UNIQUE (dfns_staking_id);


--
-- Name: dfns_staking_integrations dfns_staking_integrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_staking_integrations
    ADD CONSTRAINT dfns_staking_integrations_pkey PRIMARY KEY (id);


--
-- Name: dfns_staking_integrations dfns_staking_integrations_staking_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_staking_integrations
    ADD CONSTRAINT dfns_staking_integrations_staking_id_key UNIQUE (staking_id);


--
-- Name: dfns_sync_status dfns_sync_status_entity_type_entity_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_sync_status
    ADD CONSTRAINT dfns_sync_status_entity_type_entity_id_key UNIQUE (entity_type, entity_id);


--
-- Name: dfns_sync_status dfns_sync_status_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_sync_status
    ADD CONSTRAINT dfns_sync_status_pkey PRIMARY KEY (id);


--
-- Name: dfns_transaction_history dfns_transaction_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_transaction_history
    ADD CONSTRAINT dfns_transaction_history_pkey PRIMARY KEY (id);


--
-- Name: dfns_transaction_history dfns_transaction_history_wallet_id_tx_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_transaction_history
    ADD CONSTRAINT dfns_transaction_history_wallet_id_tx_hash_key UNIQUE (wallet_id, tx_hash);


--
-- Name: dfns_transfers dfns_transfers_dfns_transfer_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_transfers
    ADD CONSTRAINT dfns_transfers_dfns_transfer_id_key UNIQUE (dfns_transfer_id);


--
-- Name: dfns_transfers dfns_transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_transfers
    ADD CONSTRAINT dfns_transfers_pkey PRIMARY KEY (id);


--
-- Name: dfns_transfers dfns_transfers_transfer_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_transfers
    ADD CONSTRAINT dfns_transfers_transfer_id_key UNIQUE (transfer_id);


--
-- Name: dfns_users dfns_users_dfns_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_users
    ADD CONSTRAINT dfns_users_dfns_user_id_key UNIQUE (dfns_user_id);


--
-- Name: dfns_users dfns_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_users
    ADD CONSTRAINT dfns_users_pkey PRIMARY KEY (id);


--
-- Name: dfns_users dfns_users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_users
    ADD CONSTRAINT dfns_users_username_key UNIQUE (username);


--
-- Name: dfns_validators dfns_validators_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_validators
    ADD CONSTRAINT dfns_validators_pkey PRIMARY KEY (id);


--
-- Name: dfns_validators dfns_validators_validator_address_network_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_validators
    ADD CONSTRAINT dfns_validators_validator_address_network_key UNIQUE (validator_address, network);


--
-- Name: dfns_wallet_balances dfns_wallet_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_wallet_balances
    ADD CONSTRAINT dfns_wallet_balances_pkey PRIMARY KEY (id);


--
-- Name: dfns_wallet_balances dfns_wallet_balances_wallet_id_asset_symbol_contract_addres_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_wallet_balances
    ADD CONSTRAINT dfns_wallet_balances_wallet_id_asset_symbol_contract_addres_key UNIQUE (wallet_id, asset_symbol, contract_address);


--
-- Name: dfns_wallet_nfts dfns_wallet_nfts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_wallet_nfts
    ADD CONSTRAINT dfns_wallet_nfts_pkey PRIMARY KEY (id);


--
-- Name: dfns_wallet_nfts dfns_wallet_nfts_wallet_id_contract_token_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_wallet_nfts
    ADD CONSTRAINT dfns_wallet_nfts_wallet_id_contract_token_id_key UNIQUE (wallet_id, contract, token_id);


--
-- Name: dfns_wallets dfns_wallets_dfns_wallet_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_wallets
    ADD CONSTRAINT dfns_wallets_dfns_wallet_id_key UNIQUE (dfns_wallet_id);


--
-- Name: dfns_wallets dfns_wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_wallets
    ADD CONSTRAINT dfns_wallets_pkey PRIMARY KEY (id);


--
-- Name: dfns_wallets dfns_wallets_wallet_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_wallets
    ADD CONSTRAINT dfns_wallets_wallet_id_key UNIQUE (wallet_id);


--
-- Name: dfns_webhook_deliveries dfns_webhook_deliveries_delivery_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_webhook_deliveries
    ADD CONSTRAINT dfns_webhook_deliveries_delivery_id_key UNIQUE (delivery_id);


--
-- Name: dfns_webhook_deliveries dfns_webhook_deliveries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_webhook_deliveries
    ADD CONSTRAINT dfns_webhook_deliveries_pkey PRIMARY KEY (id);


--
-- Name: dfns_webhooks dfns_webhooks_dfns_webhook_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_webhooks
    ADD CONSTRAINT dfns_webhooks_dfns_webhook_id_key UNIQUE (dfns_webhook_id);


--
-- Name: dfns_webhooks dfns_webhooks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_webhooks
    ADD CONSTRAINT dfns_webhooks_pkey PRIMARY KEY (id);


--
-- Name: dfns_webhooks dfns_webhooks_webhook_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_webhooks
    ADD CONSTRAINT dfns_webhooks_webhook_id_key UNIQUE (webhook_id);


--
-- Name: distribution_redemptions distribution_redemptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.distribution_redemptions
    ADD CONSTRAINT distribution_redemptions_pkey PRIMARY KEY (id);


--
-- Name: distribution_redemptions distribution_redemptions_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.distribution_redemptions
    ADD CONSTRAINT distribution_redemptions_unique UNIQUE (distribution_id, redemption_request_id);


--
-- Name: distributions distributions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.distributions
    ADD CONSTRAINT distributions_pkey PRIMARY KEY (id);


--
-- Name: document_approvals document_approvals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_approvals
    ADD CONSTRAINT document_approvals_pkey PRIMARY KEY (id);


--
-- Name: document_versions document_versions_document_id_version_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_versions
    ADD CONSTRAINT document_versions_document_id_version_number_key UNIQUE (document_id, version_number);


--
-- Name: document_versions document_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_versions
    ADD CONSTRAINT document_versions_pkey PRIMARY KEY (id);


--
-- Name: document_workflows document_workflows_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_workflows
    ADD CONSTRAINT document_workflows_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: faucet_requests faucet_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faucet_requests
    ADD CONSTRAINT faucet_requests_pkey PRIMARY KEY (id);


--
-- Name: fiat_quotes fiat_quotes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fiat_quotes
    ADD CONSTRAINT fiat_quotes_pkey PRIMARY KEY (id);


--
-- Name: fiat_transactions fiat_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fiat_transactions
    ADD CONSTRAINT fiat_transactions_pkey PRIMARY KEY (id);


--
-- Name: fiat_transactions fiat_transactions_provider_transaction_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fiat_transactions
    ADD CONSTRAINT fiat_transactions_provider_transaction_unique UNIQUE (provider, provider_transaction_id);


--
-- Name: fund_nav_data fund_nav_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fund_nav_data
    ADD CONSTRAINT fund_nav_data_pkey PRIMARY KEY (id);


--
-- Name: geographic_jurisdictions geographic_jurisdictions_country_code_3_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.geographic_jurisdictions
    ADD CONSTRAINT geographic_jurisdictions_country_code_3_key UNIQUE (country_code_3);


--
-- Name: geographic_jurisdictions geographic_jurisdictions_country_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.geographic_jurisdictions
    ADD CONSTRAINT geographic_jurisdictions_country_code_key UNIQUE (country_code);


--
-- Name: geographic_jurisdictions geographic_jurisdictions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.geographic_jurisdictions
    ADD CONSTRAINT geographic_jurisdictions_pkey PRIMARY KEY (id);


--
-- Name: guardian_api_tests guardian_api_tests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guardian_api_tests
    ADD CONSTRAINT guardian_api_tests_pkey PRIMARY KEY (id);


--
-- Name: guardian_operations guardian_operations_operation_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guardian_operations
    ADD CONSTRAINT guardian_operations_operation_id_key UNIQUE (operation_id);


--
-- Name: guardian_operations guardian_operations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guardian_operations
    ADD CONSTRAINT guardian_operations_pkey PRIMARY KEY (id);


--
-- Name: guardian_wallets guardian_wallets_guardian_wallet_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guardian_wallets
    ADD CONSTRAINT guardian_wallets_guardian_wallet_id_key UNIQUE (guardian_wallet_id);


--
-- Name: guardian_wallets guardian_wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guardian_wallets
    ADD CONSTRAINT guardian_wallets_pkey PRIMARY KEY (id);


--
-- Name: health_checks health_checks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.health_checks
    ADD CONSTRAINT health_checks_pkey PRIMARY KEY (id);


--
-- Name: health_checks health_checks_service_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.health_checks
    ADD CONSTRAINT health_checks_service_key UNIQUE (service);


--
-- Name: investor_approvals investor_approvals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.investor_approvals
    ADD CONSTRAINT investor_approvals_pkey PRIMARY KEY (id);


--
-- Name: investor_group_members investor_group_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.investor_group_members
    ADD CONSTRAINT investor_group_members_pkey PRIMARY KEY (group_id, investor_id);


--
-- Name: investor_groups_investors investor_groups_investors_group_id_investor_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.investor_groups_investors
    ADD CONSTRAINT investor_groups_investors_group_id_investor_id_key UNIQUE (group_id, investor_id);


--
-- Name: investor_groups_investors investor_groups_investors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.investor_groups_investors
    ADD CONSTRAINT investor_groups_investors_pkey PRIMARY KEY (id);


--
-- Name: investor_groups investor_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.investor_groups
    ADD CONSTRAINT investor_groups_pkey PRIMARY KEY (id);


--
-- Name: investors investors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.investors
    ADD CONSTRAINT investors_pkey PRIMARY KEY (investor_id);


--
-- Name: invoice invoice_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT invoice_invoice_number_key UNIQUE (invoice_number);


--
-- Name: invoice invoice_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT invoice_pkey PRIMARY KEY (invoice_id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: issuer_access_roles issuer_access_roles_issuer_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issuer_access_roles
    ADD CONSTRAINT issuer_access_roles_issuer_id_user_id_key UNIQUE (issuer_id, user_id);


--
-- Name: issuer_access_roles issuer_access_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issuer_access_roles
    ADD CONSTRAINT issuer_access_roles_pkey PRIMARY KEY (id);


--
-- Name: issuer_detail_documents issuer_detail_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issuer_detail_documents
    ADD CONSTRAINT issuer_detail_documents_pkey PRIMARY KEY (id);


--
-- Name: issuer_documents issuer_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issuer_documents
    ADD CONSTRAINT issuer_documents_pkey PRIMARY KEY (id);


--
-- Name: kyc_screening_logs kyc_screening_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kyc_screening_logs
    ADD CONSTRAINT kyc_screening_logs_pkey PRIMARY KEY (id);


--
-- Name: mfa_policies mfa_policies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mfa_policies
    ADD CONSTRAINT mfa_policies_pkey PRIMARY KEY (id);


--
-- Name: monitoring_metrics monitoring_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monitoring_metrics
    ADD CONSTRAINT monitoring_metrics_pkey PRIMARY KEY (id);


--
-- Name: moonpay_asset_cache moonpay_asset_cache_contract_address_token_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.moonpay_asset_cache
    ADD CONSTRAINT moonpay_asset_cache_contract_address_token_id_key UNIQUE (contract_address, token_id);


--
-- Name: moonpay_asset_cache moonpay_asset_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.moonpay_asset_cache
    ADD CONSTRAINT moonpay_asset_cache_pkey PRIMARY KEY (id);


--
-- Name: moonpay_compliance_alerts moonpay_compliance_alerts_alert_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.moonpay_compliance_alerts
    ADD CONSTRAINT moonpay_compliance_alerts_alert_id_key UNIQUE (alert_id);


--
-- Name: moonpay_compliance_alerts moonpay_compliance_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.moonpay_compliance_alerts
    ADD CONSTRAINT moonpay_compliance_alerts_pkey PRIMARY KEY (id);


--
-- Name: moonpay_customers moonpay_customers_external_customer_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.moonpay_customers
    ADD CONSTRAINT moonpay_customers_external_customer_id_key UNIQUE (external_customer_id);


--
-- Name: moonpay_customers moonpay_customers_moonpay_customer_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.moonpay_customers
    ADD CONSTRAINT moonpay_customers_moonpay_customer_id_key UNIQUE (moonpay_customer_id);


--
-- Name: moonpay_customers moonpay_customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.moonpay_customers
    ADD CONSTRAINT moonpay_customers_pkey PRIMARY KEY (id);


--
-- Name: moonpay_passes moonpay_passes_external_pass_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.moonpay_passes
    ADD CONSTRAINT moonpay_passes_external_pass_id_key UNIQUE (external_pass_id);


--
-- Name: moonpay_passes moonpay_passes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.moonpay_passes
    ADD CONSTRAINT moonpay_passes_pkey PRIMARY KEY (id);


--
-- Name: moonpay_policies moonpay_policies_external_policy_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.moonpay_policies
    ADD CONSTRAINT moonpay_policies_external_policy_id_key UNIQUE (external_policy_id);


--
-- Name: moonpay_policies moonpay_policies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.moonpay_policies
    ADD CONSTRAINT moonpay_policies_pkey PRIMARY KEY (id);


--
-- Name: moonpay_policy_logs moonpay_policy_logs_log_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.moonpay_policy_logs
    ADD CONSTRAINT moonpay_policy_logs_log_id_key UNIQUE (log_id);


--
-- Name: moonpay_policy_logs moonpay_policy_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.moonpay_policy_logs
    ADD CONSTRAINT moonpay_policy_logs_pkey PRIMARY KEY (id);


--
-- Name: moonpay_projects moonpay_projects_external_project_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.moonpay_projects
    ADD CONSTRAINT moonpay_projects_external_project_id_key UNIQUE (external_project_id);


--
-- Name: moonpay_projects moonpay_projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.moonpay_projects
    ADD CONSTRAINT moonpay_projects_pkey PRIMARY KEY (id);


--
-- Name: moonpay_swap_transactions moonpay_swap_transactions_external_transaction_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.moonpay_swap_transactions
    ADD CONSTRAINT moonpay_swap_transactions_external_transaction_id_key UNIQUE (external_transaction_id);


--
-- Name: moonpay_swap_transactions moonpay_swap_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.moonpay_swap_transactions
    ADD CONSTRAINT moonpay_swap_transactions_pkey PRIMARY KEY (id);


--
-- Name: moonpay_transactions moonpay_transactions_external_transaction_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.moonpay_transactions
    ADD CONSTRAINT moonpay_transactions_external_transaction_id_key UNIQUE (external_transaction_id);


--
-- Name: moonpay_transactions moonpay_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.moonpay_transactions
    ADD CONSTRAINT moonpay_transactions_pkey PRIMARY KEY (id);


--
-- Name: moonpay_webhook_config moonpay_webhook_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.moonpay_webhook_config
    ADD CONSTRAINT moonpay_webhook_config_pkey PRIMARY KEY (id);


--
-- Name: moonpay_webhook_config moonpay_webhook_config_webhook_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.moonpay_webhook_config
    ADD CONSTRAINT moonpay_webhook_config_webhook_id_key UNIQUE (webhook_id);


--
-- Name: moonpay_webhook_events moonpay_webhook_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.moonpay_webhook_events
    ADD CONSTRAINT moonpay_webhook_events_pkey PRIMARY KEY (id);


--
-- Name: multi_sig_confirmations multi_sig_confirmations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.multi_sig_confirmations
    ADD CONSTRAINT multi_sig_confirmations_pkey PRIMARY KEY (id);


--
-- Name: multi_sig_transactions multi_sig_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.multi_sig_transactions
    ADD CONSTRAINT multi_sig_transactions_pkey PRIMARY KEY (id);


--
-- Name: multi_sig_wallets multi_sig_wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.multi_sig_wallets
    ADD CONSTRAINT multi_sig_wallets_pkey PRIMARY KEY (id);


--
-- Name: nav_oracle_configs nav_oracle_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nav_oracle_configs
    ADD CONSTRAINT nav_oracle_configs_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: onboarding_restrictions onboarding_restrictions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onboarding_restrictions
    ADD CONSTRAINT onboarding_restrictions_pkey PRIMARY KEY (id);


--
-- Name: onchain_claims onchain_claims_identity_id_issuer_id_topic_signature_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onchain_claims
    ADD CONSTRAINT onchain_claims_identity_id_issuer_id_topic_signature_key UNIQUE (identity_id, issuer_id, topic, signature);


--
-- Name: onchain_claims onchain_claims_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onchain_claims
    ADD CONSTRAINT onchain_claims_pkey PRIMARY KEY (id);


--
-- Name: onchain_identities onchain_identities_identity_address_blockchain_network_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onchain_identities
    ADD CONSTRAINT onchain_identities_identity_address_blockchain_network_key UNIQUE (identity_address, blockchain, network);


--
-- Name: onchain_identities onchain_identities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onchain_identities
    ADD CONSTRAINT onchain_identities_pkey PRIMARY KEY (id);


--
-- Name: onchain_identities onchain_identities_user_id_blockchain_network_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onchain_identities
    ADD CONSTRAINT onchain_identities_user_id_blockchain_network_key UNIQUE (user_id, blockchain, network);


--
-- Name: onchain_issuers onchain_issuers_issuer_address_blockchain_network_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onchain_issuers
    ADD CONSTRAINT onchain_issuers_issuer_address_blockchain_network_key UNIQUE (issuer_address, blockchain, network);


--
-- Name: onchain_issuers onchain_issuers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onchain_issuers
    ADD CONSTRAINT onchain_issuers_pkey PRIMARY KEY (id);


--
-- Name: onchain_verification_history onchain_verification_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onchain_verification_history
    ADD CONSTRAINT onchain_verification_history_pkey PRIMARY KEY (id);


--
-- Name: token_erc1155_properties one_erc1155_property_per_token; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc1155_properties
    ADD CONSTRAINT one_erc1155_property_per_token UNIQUE (token_id);


--
-- Name: token_erc1400_properties one_erc1400_property_per_token; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc1400_properties
    ADD CONSTRAINT one_erc1400_property_per_token UNIQUE (token_id);


--
-- Name: token_erc3525_properties one_erc3525_property_per_token; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc3525_properties
    ADD CONSTRAINT one_erc3525_property_per_token UNIQUE (token_id);


--
-- Name: token_erc4626_properties one_erc4626_property_per_token; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc4626_properties
    ADD CONSTRAINT one_erc4626_property_per_token UNIQUE (token_id);


--
-- Name: token_erc721_properties one_erc721_property_per_token; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc721_properties
    ADD CONSTRAINT one_erc721_property_per_token UNIQUE (token_id);


--
-- Name: token_erc20_properties one_property_per_token; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc20_properties
    ADD CONSTRAINT one_property_per_token UNIQUE (token_id);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: payer payer_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payer
    ADD CONSTRAINT payer_pkey PRIMARY KEY (payer_id);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (name);


--
-- Name: policy_rule_approvers policy_rule_approvers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.policy_rule_approvers
    ADD CONSTRAINT policy_rule_approvers_pkey PRIMARY KEY (id);


--
-- Name: policy_template_approvers policy_template_approvers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.policy_template_approvers
    ADD CONSTRAINT policy_template_approvers_pkey PRIMARY KEY (template_id, user_id);


--
-- Name: policy_templates policy_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.policy_templates
    ADD CONSTRAINT policy_templates_pkey PRIMARY KEY (template_id);


--
-- Name: pool pool_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pool
    ADD CONSTRAINT pool_pkey PRIMARY KEY (pool_id);


--
-- Name: project_credentials project_credentials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_credentials
    ADD CONSTRAINT project_credentials_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: provider provider_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider
    ADD CONSTRAINT provider_pkey PRIMARY KEY (provider_id);


--
-- Name: ramp_network_config ramp_network_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ramp_network_config
    ADD CONSTRAINT ramp_network_config_pkey PRIMARY KEY (id);


--
-- Name: ramp_supported_assets ramp_supported_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ramp_supported_assets
    ADD CONSTRAINT ramp_supported_assets_pkey PRIMARY KEY (id);


--
-- Name: ramp_supported_assets ramp_supported_assets_symbol_chain_flow_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ramp_supported_assets
    ADD CONSTRAINT ramp_supported_assets_symbol_chain_flow_unique UNIQUE (symbol, chain, flow_type);


--
-- Name: ramp_transaction_events ramp_transaction_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ramp_transaction_events
    ADD CONSTRAINT ramp_transaction_events_pkey PRIMARY KEY (id);


--
-- Name: ramp_webhook_events ramp_webhook_events_event_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ramp_webhook_events
    ADD CONSTRAINT ramp_webhook_events_event_id_key UNIQUE (event_id);


--
-- Name: ramp_webhook_events ramp_webhook_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ramp_webhook_events
    ADD CONSTRAINT ramp_webhook_events_pkey PRIMARY KEY (id);


--
-- Name: redemption_approver_assignments redemption_approver_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.redemption_approver_assignments
    ADD CONSTRAINT redemption_approver_assignments_pkey PRIMARY KEY (id);


--
-- Name: redemption_approvers redemption_approvers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.redemption_approvers
    ADD CONSTRAINT redemption_approvers_pkey PRIMARY KEY (id);


--
-- Name: redemption_requests redemption_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.redemption_requests
    ADD CONSTRAINT redemption_requests_pkey PRIMARY KEY (id);


--
-- Name: redemption_rules redemption_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.redemption_rules
    ADD CONSTRAINT redemption_rules_pkey PRIMARY KEY (id);


--
-- Name: redemption_settlements redemption_settlements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.redemption_settlements
    ADD CONSTRAINT redemption_settlements_pkey PRIMARY KEY (id);


--
-- Name: redemption_window_configs redemption_window_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.redemption_window_configs
    ADD CONSTRAINT redemption_window_configs_pkey PRIMARY KEY (id);


--
-- Name: redemption_windows redemption_windows_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.redemption_windows
    ADD CONSTRAINT redemption_windows_pkey PRIMARY KEY (id);


--
-- Name: regulatory_equivalence_mapping regulatory_equivalence_mappin_home_jurisdiction_equivalent__key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regulatory_equivalence_mapping
    ADD CONSTRAINT regulatory_equivalence_mappin_home_jurisdiction_equivalent__key UNIQUE (home_jurisdiction, equivalent_jurisdiction, regulatory_framework);


--
-- Name: regulatory_equivalence_mapping regulatory_equivalence_mapping_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regulatory_equivalence_mapping
    ADD CONSTRAINT regulatory_equivalence_mapping_pkey PRIMARY KEY (id);


--
-- Name: ripple_payments ripple_payments_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ripple_payments
    ADD CONSTRAINT ripple_payments_hash_key UNIQUE (hash);


--
-- Name: ripple_payments ripple_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ripple_payments
    ADD CONSTRAINT ripple_payments_pkey PRIMARY KEY (id);


--
-- Name: risk_assessments risk_assessments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.risk_assessments
    ADD CONSTRAINT risk_assessments_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_name);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: rules rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rules
    ADD CONSTRAINT rules_pkey PRIMARY KEY (rule_id);


--
-- Name: rules rules_rule_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rules
    ADD CONSTRAINT rules_rule_id_key UNIQUE (rule_id);


--
-- Name: secure_keys secure_keys_key_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.secure_keys
    ADD CONSTRAINT secure_keys_key_id_key UNIQUE (key_id);


--
-- Name: secure_keys secure_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.secure_keys
    ADD CONSTRAINT secure_keys_pkey PRIMARY KEY (id);


--
-- Name: security_audit_logs security_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_audit_logs
    ADD CONSTRAINT security_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: security_events security_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_events
    ADD CONSTRAINT security_events_pkey PRIMARY KEY (id);


--
-- Name: settlement_metrics settlement_metrics_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settlement_metrics
    ADD CONSTRAINT settlement_metrics_date_key UNIQUE (date);


--
-- Name: settlement_metrics settlement_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settlement_metrics
    ADD CONSTRAINT settlement_metrics_pkey PRIMARY KEY (id);


--
-- Name: signatures signatures_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signatures
    ADD CONSTRAINT signatures_pkey PRIMARY KEY (id);


--
-- Name: stage_requirements stage_requirements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stage_requirements
    ADD CONSTRAINT stage_requirements_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: system_processes system_processes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_processes
    ADD CONSTRAINT system_processes_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_key_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_key_unique UNIQUE (key);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: token_allocations token_allocations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_allocations
    ADD CONSTRAINT token_allocations_pkey PRIMARY KEY (id);


--
-- Name: token_deployment_history token_deployment_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_deployment_history
    ADD CONSTRAINT token_deployment_history_pkey PRIMARY KEY (id);


--
-- Name: token_deployments token_deployments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_deployments
    ADD CONSTRAINT token_deployments_pkey PRIMARY KEY (id);


--
-- Name: token_designs token_designs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_designs
    ADD CONSTRAINT token_designs_pkey PRIMARY KEY (id);


--
-- Name: token_erc1155_balances token_erc1155_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc1155_balances
    ADD CONSTRAINT token_erc1155_balances_pkey PRIMARY KEY (id);


--
-- Name: token_erc1155_crafting_recipes token_erc1155_crafting_recipes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc1155_crafting_recipes
    ADD CONSTRAINT token_erc1155_crafting_recipes_pkey PRIMARY KEY (id);


--
-- Name: token_erc1155_discount_tiers token_erc1155_discount_tiers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc1155_discount_tiers
    ADD CONSTRAINT token_erc1155_discount_tiers_pkey PRIMARY KEY (id);


--
-- Name: token_erc1155_properties token_erc1155_properties_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc1155_properties
    ADD CONSTRAINT token_erc1155_properties_pkey PRIMARY KEY (id);


--
-- Name: token_erc1155_type_configs token_erc1155_type_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc1155_type_configs
    ADD CONSTRAINT token_erc1155_type_configs_pkey PRIMARY KEY (id);


--
-- Name: token_erc1155_type_configs token_erc1155_type_configs_token_id_token_type_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc1155_type_configs
    ADD CONSTRAINT token_erc1155_type_configs_token_id_token_type_id_key UNIQUE (token_id, token_type_id);


--
-- Name: token_erc1155_types token_erc1155_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc1155_types
    ADD CONSTRAINT token_erc1155_types_pkey PRIMARY KEY (id);


--
-- Name: token_erc1155_uri_mappings token_erc1155_uri_mappings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc1155_uri_mappings
    ADD CONSTRAINT token_erc1155_uri_mappings_pkey PRIMARY KEY (id);


--
-- Name: token_erc1400_controllers token_erc1400_controllers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc1400_controllers
    ADD CONSTRAINT token_erc1400_controllers_pkey PRIMARY KEY (id);


--
-- Name: token_erc1400_corporate_actions token_erc1400_corporate_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc1400_corporate_actions
    ADD CONSTRAINT token_erc1400_corporate_actions_pkey PRIMARY KEY (id);


--
-- Name: token_erc1400_custody_providers token_erc1400_custody_providers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc1400_custody_providers
    ADD CONSTRAINT token_erc1400_custody_providers_pkey PRIMARY KEY (id);


--
-- Name: token_erc1400_documents token_erc1400_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc1400_documents
    ADD CONSTRAINT token_erc1400_documents_pkey PRIMARY KEY (id);


--
-- Name: token_erc1400_partition_balances token_erc1400_partition_balance_partition_id_holder_address_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc1400_partition_balances
    ADD CONSTRAINT token_erc1400_partition_balance_partition_id_holder_address_key UNIQUE (partition_id, holder_address);


--
-- Name: token_erc1400_partition_balances token_erc1400_partition_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc1400_partition_balances
    ADD CONSTRAINT token_erc1400_partition_balances_pkey PRIMARY KEY (id);


--
-- Name: token_erc1400_partition_operators token_erc1400_partition_opera_partition_id_holder_address_o_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc1400_partition_operators
    ADD CONSTRAINT token_erc1400_partition_opera_partition_id_holder_address_o_key UNIQUE (partition_id, holder_address, operator_address);


--
-- Name: token_erc1400_partition_operators token_erc1400_partition_operators_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc1400_partition_operators
    ADD CONSTRAINT token_erc1400_partition_operators_pkey PRIMARY KEY (id);


--
-- Name: token_erc1400_partition_transfers token_erc1400_partition_transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc1400_partition_transfers
    ADD CONSTRAINT token_erc1400_partition_transfers_pkey PRIMARY KEY (id);


--
-- Name: token_erc1400_partitions token_erc1400_partitions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc1400_partitions
    ADD CONSTRAINT token_erc1400_partitions_pkey PRIMARY KEY (id);


--
-- Name: token_erc1400_properties token_erc1400_properties_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc1400_properties
    ADD CONSTRAINT token_erc1400_properties_pkey PRIMARY KEY (id);


--
-- Name: token_erc1400_regulatory_filings token_erc1400_regulatory_filings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc1400_regulatory_filings
    ADD CONSTRAINT token_erc1400_regulatory_filings_pkey PRIMARY KEY (id);


--
-- Name: token_erc20_properties token_erc20_properties_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc20_properties
    ADD CONSTRAINT token_erc20_properties_pkey PRIMARY KEY (id);


--
-- Name: token_erc3525_allocations token_erc3525_allocations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc3525_allocations
    ADD CONSTRAINT token_erc3525_allocations_pkey PRIMARY KEY (id);


--
-- Name: token_erc3525_payment_schedules token_erc3525_payment_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc3525_payment_schedules
    ADD CONSTRAINT token_erc3525_payment_schedules_pkey PRIMARY KEY (id);


--
-- Name: token_erc3525_properties token_erc3525_properties_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc3525_properties
    ADD CONSTRAINT token_erc3525_properties_pkey PRIMARY KEY (id);


--
-- Name: token_erc3525_slot_configs token_erc3525_slot_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc3525_slot_configs
    ADD CONSTRAINT token_erc3525_slot_configs_pkey PRIMARY KEY (id);


--
-- Name: token_erc3525_slot_configs token_erc3525_slot_configs_token_id_slot_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc3525_slot_configs
    ADD CONSTRAINT token_erc3525_slot_configs_token_id_slot_id_key UNIQUE (token_id, slot_id);


--
-- Name: token_erc3525_slots token_erc3525_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc3525_slots
    ADD CONSTRAINT token_erc3525_slots_pkey PRIMARY KEY (id);


--
-- Name: token_erc3525_value_adjustments token_erc3525_value_adjustments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc3525_value_adjustments
    ADD CONSTRAINT token_erc3525_value_adjustments_pkey PRIMARY KEY (id);


--
-- Name: token_erc4626_asset_allocations token_erc4626_asset_allocations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc4626_asset_allocations
    ADD CONSTRAINT token_erc4626_asset_allocations_pkey PRIMARY KEY (id);


--
-- Name: token_erc4626_fee_tiers token_erc4626_fee_tiers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc4626_fee_tiers
    ADD CONSTRAINT token_erc4626_fee_tiers_pkey PRIMARY KEY (id);


--
-- Name: token_erc4626_performance_metrics token_erc4626_performance_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc4626_performance_metrics
    ADD CONSTRAINT token_erc4626_performance_metrics_pkey PRIMARY KEY (id);


--
-- Name: token_erc4626_performance_metrics token_erc4626_performance_metrics_token_id_metric_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc4626_performance_metrics
    ADD CONSTRAINT token_erc4626_performance_metrics_token_id_metric_date_key UNIQUE (token_id, metric_date);


--
-- Name: token_erc4626_properties token_erc4626_properties_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc4626_properties
    ADD CONSTRAINT token_erc4626_properties_pkey PRIMARY KEY (id);


--
-- Name: token_erc4626_strategy_params token_erc4626_strategy_params_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc4626_strategy_params
    ADD CONSTRAINT token_erc4626_strategy_params_pkey PRIMARY KEY (id);


--
-- Name: token_erc4626_vault_strategies token_erc4626_vault_strategies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc4626_vault_strategies
    ADD CONSTRAINT token_erc4626_vault_strategies_pkey PRIMARY KEY (id);


--
-- Name: token_erc721_attributes token_erc721_attributes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc721_attributes
    ADD CONSTRAINT token_erc721_attributes_pkey PRIMARY KEY (id);


--
-- Name: token_erc721_mint_phases token_erc721_mint_phases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc721_mint_phases
    ADD CONSTRAINT token_erc721_mint_phases_pkey PRIMARY KEY (id);


--
-- Name: token_erc721_mint_phases token_erc721_mint_phases_token_id_phase_order_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc721_mint_phases
    ADD CONSTRAINT token_erc721_mint_phases_token_id_phase_order_key UNIQUE (token_id, phase_order);


--
-- Name: token_erc721_properties token_erc721_properties_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc721_properties
    ADD CONSTRAINT token_erc721_properties_pkey PRIMARY KEY (id);


--
-- Name: token_erc721_trait_definitions token_erc721_trait_definitions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc721_trait_definitions
    ADD CONSTRAINT token_erc721_trait_definitions_pkey PRIMARY KEY (id);


--
-- Name: token_erc721_trait_definitions token_erc721_trait_definitions_token_id_trait_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc721_trait_definitions
    ADD CONSTRAINT token_erc721_trait_definitions_token_id_trait_name_key UNIQUE (token_id, trait_name);


--
-- Name: token_events token_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_events
    ADD CONSTRAINT token_events_pkey PRIMARY KEY (id);


--
-- Name: token_geographic_restrictions token_geographic_restrictions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_geographic_restrictions
    ADD CONSTRAINT token_geographic_restrictions_pkey PRIMARY KEY (id);


--
-- Name: token_geographic_restrictions token_geographic_restrictions_token_id_country_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_geographic_restrictions
    ADD CONSTRAINT token_geographic_restrictions_token_id_country_code_key UNIQUE (token_id, country_code);


--
-- Name: token_operations token_operations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_operations
    ADD CONSTRAINT token_operations_pkey PRIMARY KEY (id);


--
-- Name: token_sanctions_rules token_sanctions_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_sanctions_rules
    ADD CONSTRAINT token_sanctions_rules_pkey PRIMARY KEY (id);


--
-- Name: token_templates token_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_templates
    ADD CONSTRAINT token_templates_pkey PRIMARY KEY (id);


--
-- Name: token_versions token_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_versions
    ADD CONSTRAINT token_versions_pkey PRIMARY KEY (id);


--
-- Name: token_whitelists token_whitelists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_whitelists
    ADD CONSTRAINT token_whitelists_pkey PRIMARY KEY (id);


--
-- Name: tokens tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tokens
    ADD CONSTRAINT tokens_pkey PRIMARY KEY (id);


--
-- Name: transaction_events transaction_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaction_events
    ADD CONSTRAINT transaction_events_pkey PRIMARY KEY (id);


--
-- Name: transaction_notifications transaction_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaction_notifications
    ADD CONSTRAINT transaction_notifications_pkey PRIMARY KEY (id);


--
-- Name: transaction_proposals transaction_proposals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaction_proposals
    ADD CONSTRAINT transaction_proposals_pkey PRIMARY KEY (id);


--
-- Name: transaction_signatures transaction_signatures_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaction_signatures
    ADD CONSTRAINT transaction_signatures_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_transaction_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_transaction_hash_key UNIQUE (transaction_hash);


--
-- Name: approval_config_approvers unique_config_role_approver; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_config_approvers
    ADD CONSTRAINT unique_config_role_approver UNIQUE (approval_config_id, approver_role_id);


--
-- Name: approval_config_approvers unique_config_user_approver; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_config_approvers
    ADD CONSTRAINT unique_config_user_approver UNIQUE (approval_config_id, approver_user_id);


--
-- Name: fund_nav_data unique_fund_date; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fund_nav_data
    ADD CONSTRAINT unique_fund_date UNIQUE (fund_id, date);


--
-- Name: redemption_approver_assignments unique_redemption_approver; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.redemption_approver_assignments
    ADD CONSTRAINT unique_redemption_approver UNIQUE (redemption_request_id, approver_user_id);


--
-- Name: deployment_rate_limits unique_token_deployment; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deployment_rate_limits
    ADD CONSTRAINT unique_token_deployment UNIQUE (token_id, started_at);


--
-- Name: token_whitelists unique_whitelist_token_wallet; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_whitelists
    ADD CONSTRAINT unique_whitelist_token_wallet UNIQUE (token_id, wallet_address);


--
-- Name: user_mfa_settings user_mfa_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_mfa_settings
    ADD CONSTRAINT user_mfa_settings_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: wallet_details wallet_details_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_details
    ADD CONSTRAINT wallet_details_pkey PRIMARY KEY (id);


--
-- Name: wallet_signatories wallet_signatories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_signatories
    ADD CONSTRAINT wallet_signatories_pkey PRIMARY KEY (id);


--
-- Name: wallet_signatories wallet_signatories_wallet_address_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_signatories
    ADD CONSTRAINT wallet_signatories_wallet_address_email_key UNIQUE (wallet_address, email);


--
-- Name: wallet_transactions wallet_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_pkey PRIMARY KEY (id);


--
-- Name: whitelist_entries whitelist_entries_organization_id_address_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whitelist_entries
    ADD CONSTRAINT whitelist_entries_organization_id_address_key UNIQUE (organization_id, address);


--
-- Name: whitelist_entries whitelist_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whitelist_entries
    ADD CONSTRAINT whitelist_entries_pkey PRIMARY KEY (id);


--
-- Name: whitelist_settings whitelist_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whitelist_settings
    ADD CONSTRAINT whitelist_settings_pkey PRIMARY KEY (id);


--
-- Name: whitelist_signatories whitelist_signatories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whitelist_signatories
    ADD CONSTRAINT whitelist_signatories_pkey PRIMARY KEY (id);


--
-- Name: whitelist_signatories whitelist_signatories_whitelist_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whitelist_signatories
    ADD CONSTRAINT whitelist_signatories_whitelist_id_user_id_key UNIQUE (whitelist_id, user_id);


--
-- Name: workflow_stages workflow_stages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_stages
    ADD CONSTRAINT workflow_stages_pkey PRIMARY KEY (id);


--
-- Name: idx_activity_metrics_day; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activity_metrics_day ON public.activity_metrics USING btree (day);


--
-- Name: idx_activity_metrics_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activity_metrics_entity ON public.activity_metrics USING btree (entity_type);


--
-- Name: idx_activity_summary_daily; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activity_summary_daily ON public.activity_summary_daily USING btree (day, source, category);


--
-- Name: idx_alerts_service; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_alerts_service ON public.alerts USING btree (service);


--
-- Name: idx_alerts_severity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_alerts_severity ON public.alerts USING btree (severity);


--
-- Name: idx_alerts_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_alerts_status ON public.alerts USING btree (status);


--
-- Name: idx_approval_config_approvers_config_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_approval_config_approvers_config_id ON public.approval_config_approvers USING btree (approval_config_id);


--
-- Name: idx_approval_config_approvers_role_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_approval_config_approvers_role_id ON public.approval_config_approvers USING btree (approver_role_id);


--
-- Name: idx_approval_config_approvers_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_approval_config_approvers_type ON public.approval_config_approvers USING btree (approver_type);


--
-- Name: idx_approval_config_approvers_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_approval_config_approvers_user_id ON public.approval_config_approvers USING btree (approver_user_id);


--
-- Name: idx_approval_config_history_changed_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_approval_config_history_changed_by ON public.approval_config_history USING btree (changed_by);


--
-- Name: idx_approval_config_history_config_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_approval_config_history_config_id ON public.approval_config_history USING btree (approval_config_id);


--
-- Name: idx_approval_config_history_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_approval_config_history_created_at ON public.approval_config_history USING btree (created_at);


--
-- Name: idx_approval_configs_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_approval_configs_active ON public.approval_configs USING btree (active);


--
-- Name: idx_approval_configs_approval_mode; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_approval_configs_approval_mode ON public.approval_configs USING btree (approval_mode);


--
-- Name: idx_approval_configs_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_approval_configs_created_by ON public.approval_configs USING btree (created_by);


--
-- Name: idx_audit_logs_action; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_action ON public.audit_logs USING btree (action);


--
-- Name: idx_audit_logs_action_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_action_type ON public.audit_logs USING btree (action_type);


--
-- Name: idx_audit_logs_batch_operation; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_batch_operation ON public.audit_logs USING btree (batch_operation_id);


--
-- Name: idx_audit_logs_batch_operation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_batch_operation_id ON public.audit_logs USING btree (batch_operation_id);


--
-- Name: idx_audit_logs_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_category ON public.audit_logs USING btree (category);


--
-- Name: idx_audit_logs_correlation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_correlation_id ON public.audit_logs USING btree (correlation_id);


--
-- Name: idx_audit_logs_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_entity ON public.audit_logs USING btree (entity_type, entity_id);


--
-- Name: idx_audit_logs_entity_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_entity_type ON public.audit_logs USING btree (entity_type);


--
-- Name: idx_audit_logs_is_automated; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_is_automated ON public.audit_logs USING btree (is_automated);


--
-- Name: idx_audit_logs_parent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_parent_id ON public.audit_logs USING btree (parent_id);


--
-- Name: idx_audit_logs_session_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_session_id ON public.audit_logs USING btree (session_id);


--
-- Name: idx_audit_logs_severity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_severity ON public.audit_logs USING btree (severity);


--
-- Name: idx_audit_logs_source; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_source ON public.audit_logs USING btree (source);


--
-- Name: idx_audit_logs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_status ON public.audit_logs USING btree (status);


--
-- Name: idx_audit_logs_system_process; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_system_process ON public.audit_logs USING btree (system_process_id);


--
-- Name: idx_audit_logs_system_process_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_system_process_id ON public.audit_logs USING btree (system_process_id);


--
-- Name: idx_audit_logs_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_timestamp ON public.audit_logs USING btree ("timestamp" DESC);


--
-- Name: idx_audit_logs_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_user ON public.audit_logs USING btree (username);


--
-- Name: idx_audit_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);


--
-- Name: idx_bulk_operations_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bulk_operations_created_at ON public.bulk_operations USING btree (created_at DESC);


--
-- Name: idx_bulk_operations_operation_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bulk_operations_operation_type ON public.bulk_operations USING btree (operation_type);


--
-- Name: idx_bulk_operations_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bulk_operations_status ON public.bulk_operations USING btree (status);


--
-- Name: idx_compliance_checks_project_risk; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_compliance_checks_project_risk ON public.compliance_checks USING btree (project_id, risk_level);


--
-- Name: idx_compliance_reports_generated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_compliance_reports_generated_at ON public.compliance_reports USING btree (generated_at);


--
-- Name: idx_compliance_reports_issuer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_compliance_reports_issuer_id ON public.compliance_reports USING btree (issuer_id);


--
-- Name: idx_compliance_reports_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_compliance_reports_status ON public.compliance_reports USING btree (status);


--
-- Name: idx_credential_usage_logs_credential_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_credential_usage_logs_credential_id ON public.credential_usage_logs USING btree (credential_id);


--
-- Name: idx_deployment_rate_limits_started_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_deployment_rate_limits_started_at ON public.deployment_rate_limits USING btree (started_at);


--
-- Name: idx_deployment_rate_limits_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_deployment_rate_limits_status ON public.deployment_rate_limits USING btree (status);


--
-- Name: idx_deployment_rate_limits_user_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_deployment_rate_limits_user_project ON public.deployment_rate_limits USING btree (user_id, project_id);


--
-- Name: idx_dfns_activity_logs_activity_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_activity_logs_activity_type ON public.dfns_activity_logs USING btree (activity_type);


--
-- Name: idx_dfns_activity_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_activity_logs_created_at ON public.dfns_activity_logs USING btree (created_at);


--
-- Name: idx_dfns_activity_logs_entity_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_activity_logs_entity_id ON public.dfns_activity_logs USING btree (entity_id);


--
-- Name: idx_dfns_activity_logs_entity_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_activity_logs_entity_type ON public.dfns_activity_logs USING btree (entity_type);


--
-- Name: idx_dfns_api_requests_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_api_requests_created_at ON public.dfns_api_requests USING btree (created_at);


--
-- Name: idx_dfns_api_requests_endpoint; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_api_requests_endpoint ON public.dfns_api_requests USING btree (endpoint);


--
-- Name: idx_dfns_api_requests_status_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_api_requests_status_code ON public.dfns_api_requests USING btree (status_code);


--
-- Name: idx_dfns_applications_app_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_applications_app_id ON public.dfns_applications USING btree (app_id);


--
-- Name: idx_dfns_applications_organization_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_applications_organization_id ON public.dfns_applications USING btree (organization_id);


--
-- Name: idx_dfns_applications_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_applications_status ON public.dfns_applications USING btree (status);


--
-- Name: idx_dfns_credentials_credential_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_credentials_credential_id ON public.dfns_credentials USING btree (credential_id);


--
-- Name: idx_dfns_credentials_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_credentials_status ON public.dfns_credentials USING btree (status);


--
-- Name: idx_dfns_credentials_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_credentials_user_id ON public.dfns_credentials USING btree (user_id);


--
-- Name: idx_dfns_fiat_activity_logs_activity_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_fiat_activity_logs_activity_type ON public.dfns_fiat_activity_logs USING btree (activity_type);


--
-- Name: idx_dfns_fiat_activity_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_fiat_activity_logs_created_at ON public.dfns_fiat_activity_logs USING btree (created_at);


--
-- Name: idx_dfns_fiat_activity_logs_transaction_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_fiat_activity_logs_transaction_id ON public.dfns_fiat_activity_logs USING btree (transaction_id);


--
-- Name: idx_dfns_fiat_quotes_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_fiat_quotes_created_at ON public.dfns_fiat_quotes USING btree (created_at);


--
-- Name: idx_dfns_fiat_quotes_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_fiat_quotes_expires_at ON public.dfns_fiat_quotes USING btree (expires_at);


--
-- Name: idx_dfns_fiat_quotes_provider; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_fiat_quotes_provider ON public.dfns_fiat_quotes USING btree (provider);


--
-- Name: idx_dfns_fiat_quotes_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_fiat_quotes_type ON public.dfns_fiat_quotes USING btree (type);


--
-- Name: idx_dfns_fiat_transactions_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_fiat_transactions_created_at ON public.dfns_fiat_transactions USING btree (created_at);


--
-- Name: idx_dfns_fiat_transactions_crypto_asset; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_fiat_transactions_crypto_asset ON public.dfns_fiat_transactions USING btree (crypto_asset);


--
-- Name: idx_dfns_fiat_transactions_currency; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_fiat_transactions_currency ON public.dfns_fiat_transactions USING btree (currency);


--
-- Name: idx_dfns_fiat_transactions_organization_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_fiat_transactions_organization_id ON public.dfns_fiat_transactions USING btree (organization_id);


--
-- Name: idx_dfns_fiat_transactions_project_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_fiat_transactions_project_id ON public.dfns_fiat_transactions USING btree (project_id);


--
-- Name: idx_dfns_fiat_transactions_provider; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_fiat_transactions_provider ON public.dfns_fiat_transactions USING btree (provider);


--
-- Name: idx_dfns_fiat_transactions_provider_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_fiat_transactions_provider_status ON public.dfns_fiat_transactions USING btree (provider, status);


--
-- Name: idx_dfns_fiat_transactions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_fiat_transactions_status ON public.dfns_fiat_transactions USING btree (status);


--
-- Name: idx_dfns_fiat_transactions_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_fiat_transactions_type ON public.dfns_fiat_transactions USING btree (type);


--
-- Name: idx_dfns_fiat_transactions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_fiat_transactions_user_id ON public.dfns_fiat_transactions USING btree (user_id);


--
-- Name: idx_dfns_fiat_transactions_user_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_fiat_transactions_user_status ON public.dfns_fiat_transactions USING btree (user_id, status);


--
-- Name: idx_dfns_fiat_transactions_wallet_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_fiat_transactions_wallet_id ON public.dfns_fiat_transactions USING btree (wallet_id);


--
-- Name: idx_dfns_fiat_transactions_wallet_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_fiat_transactions_wallet_type ON public.dfns_fiat_transactions USING btree (wallet_id, type);


--
-- Name: idx_dfns_policies_activity_kind; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_policies_activity_kind ON public.dfns_policies USING btree (activity_kind);


--
-- Name: idx_dfns_policies_policy_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_policies_policy_id ON public.dfns_policies USING btree (policy_id);


--
-- Name: idx_dfns_policies_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_policies_status ON public.dfns_policies USING btree (status);


--
-- Name: idx_dfns_signing_keys_key_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_signing_keys_key_id ON public.dfns_signing_keys USING btree (key_id);


--
-- Name: idx_dfns_signing_keys_network; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_signing_keys_network ON public.dfns_signing_keys USING btree (network);


--
-- Name: idx_dfns_signing_keys_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_signing_keys_status ON public.dfns_signing_keys USING btree (status);


--
-- Name: idx_dfns_sync_status_entity_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_sync_status_entity_type ON public.dfns_sync_status USING btree (entity_type);


--
-- Name: idx_dfns_sync_status_last_sync_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_sync_status_last_sync_at ON public.dfns_sync_status USING btree (last_sync_at);


--
-- Name: idx_dfns_sync_status_sync_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_sync_status_sync_status ON public.dfns_sync_status USING btree (sync_status);


--
-- Name: idx_dfns_transaction_history_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_transaction_history_timestamp ON public.dfns_transaction_history USING btree ("timestamp");


--
-- Name: idx_dfns_transaction_history_tx_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_transaction_history_tx_hash ON public.dfns_transaction_history USING btree (tx_hash);


--
-- Name: idx_dfns_transaction_history_wallet_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_transaction_history_wallet_id ON public.dfns_transaction_history USING btree (wallet_id);


--
-- Name: idx_dfns_transfers_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_transfers_status ON public.dfns_transfers USING btree (status);


--
-- Name: idx_dfns_transfers_transfer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_transfers_transfer_id ON public.dfns_transfers USING btree (transfer_id);


--
-- Name: idx_dfns_transfers_tx_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_transfers_tx_hash ON public.dfns_transfers USING btree (tx_hash);


--
-- Name: idx_dfns_transfers_wallet_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_transfers_wallet_id ON public.dfns_transfers USING btree (wallet_id);


--
-- Name: idx_dfns_users_dfns_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_users_dfns_user_id ON public.dfns_users USING btree (dfns_user_id);


--
-- Name: idx_dfns_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_users_email ON public.dfns_users USING btree (email);


--
-- Name: idx_dfns_users_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_users_status ON public.dfns_users USING btree (status);


--
-- Name: idx_dfns_users_username; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_users_username ON public.dfns_users USING btree (username);


--
-- Name: idx_dfns_wallet_balances_asset_symbol; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_wallet_balances_asset_symbol ON public.dfns_wallet_balances USING btree (asset_symbol);


--
-- Name: idx_dfns_wallet_balances_wallet_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_wallet_balances_wallet_id ON public.dfns_wallet_balances USING btree (wallet_id);


--
-- Name: idx_dfns_wallets_address; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_wallets_address ON public.dfns_wallets USING btree (address);


--
-- Name: idx_dfns_wallets_investor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_wallets_investor_id ON public.dfns_wallets USING btree (investor_id);


--
-- Name: idx_dfns_wallets_network; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_wallets_network ON public.dfns_wallets USING btree (network);


--
-- Name: idx_dfns_wallets_project_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_wallets_project_id ON public.dfns_wallets USING btree (project_id);


--
-- Name: idx_dfns_wallets_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_wallets_status ON public.dfns_wallets USING btree (status);


--
-- Name: idx_dfns_wallets_wallet_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dfns_wallets_wallet_id ON public.dfns_wallets USING btree (wallet_id);


--
-- Name: idx_distributions_distribution_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_distributions_distribution_date ON public.distributions USING btree (distribution_date);


--
-- Name: idx_distributions_investor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_distributions_investor_id ON public.distributions USING btree (investor_id);


--
-- Name: idx_distributions_token_allocation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_distributions_token_allocation_id ON public.distributions USING btree (token_allocation_id);


--
-- Name: idx_document_approvals_document_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_document_approvals_document_id ON public.document_approvals USING btree (document_id);


--
-- Name: idx_document_versions_document_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_document_versions_document_id ON public.document_versions USING btree (document_id);


--
-- Name: idx_document_workflows_document_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_document_workflows_document_id ON public.document_workflows USING btree (document_id);


--
-- Name: idx_document_workflows_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_document_workflows_status ON public.document_workflows USING btree (status);


--
-- Name: idx_documents_entity_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_documents_entity_id ON public.documents USING btree (entity_id);


--
-- Name: idx_documents_entity_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_documents_entity_type ON public.documents USING btree (entity_type);


--
-- Name: idx_documents_expiry_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_documents_expiry_date ON public.documents USING btree (expiry_date);


--
-- Name: idx_documents_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_documents_status ON public.documents USING btree (status);


--
-- Name: idx_documents_workflow_stage; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_documents_workflow_stage ON public.documents USING btree (workflow_stage_id);


--
-- Name: idx_erc1155_bridge; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_erc1155_bridge ON public.token_erc1155_properties USING btree (bridge_enabled);


--
-- Name: idx_erc1155_crafting; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_erc1155_crafting ON public.token_erc1155_properties USING btree (crafting_enabled);


--
-- Name: idx_erc1155_lazy_minting; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_erc1155_lazy_minting ON public.token_erc1155_properties USING btree (lazy_minting_enabled);


--
-- Name: idx_erc1155_pricing_model; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_erc1155_pricing_model ON public.token_erc1155_properties USING btree (pricing_model);


--
-- Name: idx_erc1155_voting_power; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_erc1155_voting_power ON public.token_erc1155_properties USING btree (voting_power_enabled);


--
-- Name: idx_erc1400_advanced_governance; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_erc1400_advanced_governance ON public.token_erc1400_properties USING btree (advanced_governance_enabled);


--
-- Name: idx_erc1400_compliance_monitoring; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_erc1400_compliance_monitoring ON public.token_erc1400_properties USING btree (real_time_compliance_monitoring);


--
-- Name: idx_erc1400_cross_border; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_erc1400_cross_border ON public.token_erc1400_properties USING btree (cross_border_trading_enabled);


--
-- Name: idx_erc1400_custody_integration; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_erc1400_custody_integration ON public.token_erc1400_properties USING btree (custody_integration_enabled);


--
-- Name: idx_erc1400_institutional_grade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_erc1400_institutional_grade ON public.token_erc1400_properties USING btree (institutional_grade);


--
-- Name: idx_erc1400_traditional_finance; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_erc1400_traditional_finance ON public.token_erc1400_properties USING btree (traditional_finance_integration);


--
-- Name: idx_erc20_governance_enabled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_erc20_governance_enabled ON public.token_erc20_properties USING btree (governance_enabled);


--
-- Name: idx_erc20_presale_enabled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_erc20_presale_enabled ON public.token_erc20_properties USING btree (presale_enabled);


--
-- Name: idx_erc20_trading_start; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_erc20_trading_start ON public.token_erc20_properties USING btree (trading_start_time);


--
-- Name: idx_erc3525_compliance; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_erc3525_compliance ON public.token_erc3525_properties USING btree (regulatory_compliance_enabled);


--
-- Name: idx_erc3525_derivative_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_erc3525_derivative_type ON public.token_erc3525_properties USING btree (derivative_type);


--
-- Name: idx_erc3525_expiration_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_erc3525_expiration_date ON public.token_erc3525_properties USING btree (expiration_date);


--
-- Name: idx_erc3525_financial_instrument; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_erc3525_financial_instrument ON public.token_erc3525_properties USING btree (financial_instrument_type);


--
-- Name: idx_erc3525_maturity_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_erc3525_maturity_date ON public.token_erc3525_properties USING btree (maturity_date);


--
-- Name: idx_erc3525_slot_marketplace; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_erc3525_slot_marketplace ON public.token_erc3525_properties USING btree (slot_marketplace_enabled);


--
-- Name: idx_erc3525_yield_farming; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_erc3525_yield_farming ON public.token_erc3525_properties USING btree (yield_farming_enabled);


--
-- Name: idx_erc4626_compound_frequency; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_erc4626_compound_frequency ON public.token_erc4626_properties USING btree (compound_frequency);


--
-- Name: idx_erc4626_governance; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_erc4626_governance ON public.token_erc4626_properties USING btree (governance_token_enabled);


--
-- Name: idx_erc4626_institutional; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_erc4626_institutional ON public.token_erc4626_properties USING btree (institutional_grade);


--
-- Name: idx_erc4626_multi_asset; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_erc4626_multi_asset ON public.token_erc4626_properties USING btree (multi_asset_enabled);


--
-- Name: idx_erc4626_rebalancing; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_erc4626_rebalancing ON public.token_erc4626_properties USING btree (rebalancing_enabled);


--
-- Name: idx_erc4626_strategy_complexity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_erc4626_strategy_complexity ON public.token_erc4626_properties USING btree (strategy_complexity);


--
-- Name: idx_erc4626_yield_optimization; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_erc4626_yield_optimization ON public.token_erc4626_properties USING btree (yield_optimization_enabled);


--
-- Name: idx_erc721_public_sale; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_erc721_public_sale ON public.token_erc721_properties USING btree (public_sale_enabled, public_sale_start_time);


--
-- Name: idx_erc721_revealable; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_erc721_revealable ON public.token_erc721_properties USING btree (revealable);


--
-- Name: idx_erc721_staking; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_erc721_staking ON public.token_erc721_properties USING btree (staking_enabled);


--
-- Name: idx_erc721_utility; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_erc721_utility ON public.token_erc721_properties USING btree (utility_enabled, utility_type);


--
-- Name: idx_erc721_whitelist_sale; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_erc721_whitelist_sale ON public.token_erc721_properties USING btree (whitelist_sale_enabled, whitelist_sale_start_time);


--
-- Name: idx_faucet_requests_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_faucet_requests_created_at ON public.faucet_requests USING btree (created_at);


--
-- Name: idx_faucet_requests_network; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_faucet_requests_network ON public.faucet_requests USING btree (network);


--
-- Name: idx_faucet_requests_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_faucet_requests_status ON public.faucet_requests USING btree (status);


--
-- Name: idx_faucet_requests_wallet_address; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_faucet_requests_wallet_address ON public.faucet_requests USING btree (wallet_address);


--
-- Name: idx_fiat_quotes_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fiat_quotes_created_at ON public.fiat_quotes USING btree (created_at DESC);


--
-- Name: idx_fiat_quotes_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fiat_quotes_expires_at ON public.fiat_quotes USING btree (expires_at);


--
-- Name: idx_fiat_quotes_provider; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fiat_quotes_provider ON public.fiat_quotes USING btree (provider);


--
-- Name: idx_fiat_quotes_session_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fiat_quotes_session_id ON public.fiat_quotes USING btree (session_id);


--
-- Name: idx_fiat_quotes_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fiat_quotes_type ON public.fiat_quotes USING btree (type);


--
-- Name: idx_fiat_quotes_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fiat_quotes_user_id ON public.fiat_quotes USING btree (user_id);


--
-- Name: idx_fiat_transactions_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fiat_transactions_created_at ON public.fiat_transactions USING btree (created_at DESC);


--
-- Name: idx_fiat_transactions_provider; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fiat_transactions_provider ON public.fiat_transactions USING btree (provider);


--
-- Name: idx_fiat_transactions_provider_transaction_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fiat_transactions_provider_transaction_id ON public.fiat_transactions USING btree (provider_transaction_id);


--
-- Name: idx_fiat_transactions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fiat_transactions_status ON public.fiat_transactions USING btree (status);


--
-- Name: idx_fiat_transactions_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fiat_transactions_type ON public.fiat_transactions USING btree (type);


--
-- Name: idx_fiat_transactions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fiat_transactions_user_id ON public.fiat_transactions USING btree (user_id);


--
-- Name: idx_fiat_transactions_wallet_address; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fiat_transactions_wallet_address ON public.fiat_transactions USING btree (wallet_address);


--
-- Name: idx_fund_nav_data_fund_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fund_nav_data_fund_date ON public.fund_nav_data USING btree (fund_id, date DESC);


--
-- Name: idx_fund_nav_data_validated; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fund_nav_data_validated ON public.fund_nav_data USING btree (validated, date DESC);


--
-- Name: idx_geographic_restrictions_effective; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_geographic_restrictions_effective ON public.token_geographic_restrictions USING btree (effective_date, expiry_date);


--
-- Name: idx_geographic_restrictions_token_country; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_geographic_restrictions_token_country ON public.token_geographic_restrictions USING btree (token_id, country_code);


--
-- Name: idx_geographic_restrictions_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_geographic_restrictions_type ON public.token_geographic_restrictions USING btree (restriction_type);


--
-- Name: idx_guardian_api_tests_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_guardian_api_tests_created_at ON public.guardian_api_tests USING btree (created_at);


--
-- Name: idx_guardian_api_tests_guardian_operation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_guardian_api_tests_guardian_operation_id ON public.guardian_api_tests USING btree (guardian_operation_id);


--
-- Name: idx_guardian_api_tests_guardian_wallet_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_guardian_api_tests_guardian_wallet_id ON public.guardian_api_tests USING btree (guardian_wallet_id);


--
-- Name: idx_guardian_api_tests_test_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_guardian_api_tests_test_type ON public.guardian_api_tests USING btree (test_type);


--
-- Name: idx_guardian_operations_operation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_guardian_operations_operation_id ON public.guardian_operations USING btree (operation_id);


--
-- Name: idx_guardian_operations_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_guardian_operations_status ON public.guardian_operations USING btree (operation_status);


--
-- Name: idx_guardian_operations_wallet_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_guardian_operations_wallet_id ON public.guardian_operations USING btree (guardian_wallet_id);


--
-- Name: idx_guardian_wallets_guardian_wallet_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_guardian_wallets_guardian_wallet_id ON public.guardian_wallets USING btree (guardian_wallet_id);


--
-- Name: idx_guardian_wallets_requested_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_guardian_wallets_requested_at ON public.guardian_wallets USING btree (requested_at);


--
-- Name: idx_guardian_wallets_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_guardian_wallets_status ON public.guardian_wallets USING btree (wallet_status);


--
-- Name: idx_health_checks_service; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_health_checks_service ON public.health_checks USING btree (service);


--
-- Name: idx_investor_approvals_approval_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_investor_approvals_approval_type ON public.investor_approvals USING btree (approval_type);


--
-- Name: idx_investor_approvals_investor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_investor_approvals_investor_id ON public.investor_approvals USING btree (investor_id);


--
-- Name: idx_investor_approvals_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_investor_approvals_status ON public.investor_approvals USING btree (status);


--
-- Name: idx_investor_groups_investors_group_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_investor_groups_investors_group_id ON public.investor_groups_investors USING btree (group_id);


--
-- Name: idx_investor_groups_investors_investor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_investor_groups_investors_investor_id ON public.investor_groups_investors USING btree (investor_id);


--
-- Name: idx_investors_kyc_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_investors_kyc_status ON public.investors USING btree (kyc_status);


--
-- Name: idx_investors_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_investors_type ON public.investors USING btree (type);


--
-- Name: idx_invoice_payer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoice_payer_id ON public.invoice USING btree (payer_id);


--
-- Name: idx_invoice_pool_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoice_pool_id ON public.invoice USING btree (pool_id);


--
-- Name: idx_invoice_provider_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoice_provider_id ON public.invoice USING btree (provider_id);


--
-- Name: idx_issuer_access_roles_issuer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_issuer_access_roles_issuer_id ON public.issuer_access_roles USING btree (issuer_id);


--
-- Name: idx_issuer_access_roles_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_issuer_access_roles_role ON public.issuer_access_roles USING btree (role);


--
-- Name: idx_issuer_access_roles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_issuer_access_roles_user_id ON public.issuer_access_roles USING btree (user_id);


--
-- Name: idx_issuer_documents_issuer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_issuer_documents_issuer_id ON public.issuer_documents USING btree (issuer_id);


--
-- Name: idx_issuer_documents_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_issuer_documents_status ON public.issuer_documents USING btree (status);


--
-- Name: idx_issuer_documents_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_issuer_documents_type ON public.issuer_documents USING btree (document_type);


--
-- Name: idx_jurisdictions_region; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_jurisdictions_region ON public.geographic_jurisdictions USING btree (region, regulatory_regime);


--
-- Name: idx_jurisdictions_sanctions; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_jurisdictions_sanctions ON public.geographic_jurisdictions USING btree (is_ofac_sanctioned, is_eu_sanctioned, is_un_sanctioned);


--
-- Name: idx_monitoring_metrics_metric_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_monitoring_metrics_metric_name ON public.monitoring_metrics USING btree (metric_name);


--
-- Name: idx_monitoring_metrics_service_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_monitoring_metrics_service_time ON public.monitoring_metrics USING btree (service, recorded_at);


--
-- Name: idx_moonpay_asset_cache_contract_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moonpay_asset_cache_contract_token ON public.moonpay_asset_cache USING btree (contract_address, token_id);


--
-- Name: idx_moonpay_asset_cache_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moonpay_asset_cache_expires_at ON public.moonpay_asset_cache USING btree (expires_at);


--
-- Name: idx_moonpay_compliance_alerts_alert_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moonpay_compliance_alerts_alert_id ON public.moonpay_compliance_alerts USING btree (alert_id);


--
-- Name: idx_moonpay_compliance_alerts_assigned_to; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moonpay_compliance_alerts_assigned_to ON public.moonpay_compliance_alerts USING btree (assigned_to);


--
-- Name: idx_moonpay_compliance_alerts_customer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moonpay_compliance_alerts_customer_id ON public.moonpay_compliance_alerts USING btree (customer_id);


--
-- Name: idx_moonpay_compliance_alerts_details; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moonpay_compliance_alerts_details ON public.moonpay_compliance_alerts USING gin (details);


--
-- Name: idx_moonpay_compliance_alerts_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moonpay_compliance_alerts_entity ON public.moonpay_compliance_alerts USING btree (entity_type, entity_id);


--
-- Name: idx_moonpay_compliance_alerts_risk_level; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moonpay_compliance_alerts_risk_level ON public.moonpay_compliance_alerts USING btree (risk_level);


--
-- Name: idx_moonpay_compliance_alerts_severity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moonpay_compliance_alerts_severity ON public.moonpay_compliance_alerts USING btree (severity);


--
-- Name: idx_moonpay_compliance_alerts_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moonpay_compliance_alerts_status ON public.moonpay_compliance_alerts USING btree (status);


--
-- Name: idx_moonpay_compliance_alerts_transaction_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moonpay_compliance_alerts_transaction_id ON public.moonpay_compliance_alerts USING btree (transaction_id);


--
-- Name: idx_moonpay_compliance_alerts_triggered_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moonpay_compliance_alerts_triggered_at ON public.moonpay_compliance_alerts USING btree (triggered_at);


--
-- Name: idx_moonpay_compliance_alerts_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moonpay_compliance_alerts_type ON public.moonpay_compliance_alerts USING btree (alert_type);


--
-- Name: idx_moonpay_customers_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moonpay_customers_email ON public.moonpay_customers USING btree (email);


--
-- Name: idx_moonpay_customers_external_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moonpay_customers_external_id ON public.moonpay_customers USING btree (external_customer_id);


--
-- Name: idx_moonpay_customers_moonpay_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moonpay_customers_moonpay_id ON public.moonpay_customers USING btree (moonpay_customer_id);


--
-- Name: idx_moonpay_passes_contract_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moonpay_passes_contract_token ON public.moonpay_passes USING btree (contract_address, token_id);


--
-- Name: idx_moonpay_passes_owner; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moonpay_passes_owner ON public.moonpay_passes USING btree (owner_address);


--
-- Name: idx_moonpay_passes_project_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moonpay_passes_project_id ON public.moonpay_passes USING btree (project_id);


--
-- Name: idx_moonpay_passes_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moonpay_passes_status ON public.moonpay_passes USING btree (status);


--
-- Name: idx_moonpay_policy_logs_action_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moonpay_policy_logs_action_type ON public.moonpay_policy_logs USING btree (action_type);


--
-- Name: idx_moonpay_policy_logs_correlation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moonpay_policy_logs_correlation_id ON public.moonpay_policy_logs USING btree (correlation_id);


--
-- Name: idx_moonpay_policy_logs_customer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moonpay_policy_logs_customer_id ON public.moonpay_policy_logs USING btree (customer_id);


--
-- Name: idx_moonpay_policy_logs_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moonpay_policy_logs_entity ON public.moonpay_policy_logs USING btree (entity_type, entity_id);


--
-- Name: idx_moonpay_policy_logs_executed_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moonpay_policy_logs_executed_at ON public.moonpay_policy_logs USING btree (executed_at);


--
-- Name: idx_moonpay_policy_logs_execution_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moonpay_policy_logs_execution_status ON public.moonpay_policy_logs USING btree (execution_status);


--
-- Name: idx_moonpay_policy_logs_log_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moonpay_policy_logs_log_id ON public.moonpay_policy_logs USING btree (log_id);


--
-- Name: idx_moonpay_policy_logs_metadata; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moonpay_policy_logs_metadata ON public.moonpay_policy_logs USING gin (metadata);


--
-- Name: idx_moonpay_policy_logs_policy_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moonpay_policy_logs_policy_id ON public.moonpay_policy_logs USING btree (policy_id);


--
-- Name: idx_moonpay_policy_logs_policy_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moonpay_policy_logs_policy_type ON public.moonpay_policy_logs USING btree (policy_type);


--
-- Name: idx_moonpay_policy_logs_requires_action; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moonpay_policy_logs_requires_action ON public.moonpay_policy_logs USING btree (requires_action);


--
-- Name: idx_moonpay_policy_logs_severity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moonpay_policy_logs_severity ON public.moonpay_policy_logs USING btree (severity);


--
-- Name: idx_moonpay_policy_logs_transaction_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moonpay_policy_logs_transaction_id ON public.moonpay_policy_logs USING btree (transaction_id);


--
-- Name: idx_moonpay_swap_transactions_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moonpay_swap_transactions_created_at ON public.moonpay_swap_transactions USING btree (created_at);


--
-- Name: idx_moonpay_swap_transactions_external_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moonpay_swap_transactions_external_id ON public.moonpay_swap_transactions USING btree (external_transaction_id);


--
-- Name: idx_moonpay_swap_transactions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moonpay_swap_transactions_status ON public.moonpay_swap_transactions USING btree (status);


--
-- Name: idx_moonpay_transactions_composite; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moonpay_transactions_composite ON public.moonpay_transactions USING btree (wallet_address, type, status, created_at);


--
-- Name: idx_moonpay_transactions_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moonpay_transactions_created_at ON public.moonpay_transactions USING btree (created_at);


--
-- Name: idx_moonpay_transactions_customer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moonpay_transactions_customer_id ON public.moonpay_transactions USING btree (customer_id);


--
-- Name: idx_moonpay_transactions_external_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moonpay_transactions_external_id ON public.moonpay_transactions USING btree (external_transaction_id);


--
-- Name: idx_moonpay_transactions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moonpay_transactions_status ON public.moonpay_transactions USING btree (status);


--
-- Name: idx_moonpay_transactions_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moonpay_transactions_type ON public.moonpay_transactions USING btree (type);


--
-- Name: idx_moonpay_transactions_wallet_address; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moonpay_transactions_wallet_address ON public.moonpay_transactions USING btree (wallet_address);


--
-- Name: idx_moonpay_webhook_config_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moonpay_webhook_config_created_at ON public.moonpay_webhook_config USING btree (created_at);


--
-- Name: idx_moonpay_webhook_config_environment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moonpay_webhook_config_environment ON public.moonpay_webhook_config USING btree (environment);


--
-- Name: idx_moonpay_webhook_config_events; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moonpay_webhook_config_events ON public.moonpay_webhook_config USING gin (events);


--
-- Name: idx_moonpay_webhook_config_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moonpay_webhook_config_status ON public.moonpay_webhook_config USING btree (status);


--
-- Name: idx_moonpay_webhook_config_webhook_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moonpay_webhook_config_webhook_id ON public.moonpay_webhook_config USING btree (webhook_id);


--
-- Name: idx_moonpay_webhook_events_processed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moonpay_webhook_events_processed ON public.moonpay_webhook_events USING btree (processed);


--
-- Name: idx_moonpay_webhook_events_received_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moonpay_webhook_events_received_at ON public.moonpay_webhook_events USING btree (received_at);


--
-- Name: idx_moonpay_webhook_events_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moonpay_webhook_events_type ON public.moonpay_webhook_events USING btree (event_type);


--
-- Name: idx_nav_oracle_configs_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nav_oracle_configs_active ON public.nav_oracle_configs USING btree (active);


--
-- Name: idx_nav_oracle_configs_fund_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nav_oracle_configs_fund_id ON public.nav_oracle_configs USING btree (fund_id);


--
-- Name: idx_onchain_claims_identity_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_onchain_claims_identity_id ON public.onchain_claims USING btree (identity_id);


--
-- Name: idx_onchain_claims_issuer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_onchain_claims_issuer_id ON public.onchain_claims USING btree (issuer_id);


--
-- Name: idx_onchain_claims_topic; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_onchain_claims_topic ON public.onchain_claims USING btree (topic);


--
-- Name: idx_onchain_identities_identity_address; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_onchain_identities_identity_address ON public.onchain_identities USING btree (identity_address);


--
-- Name: idx_onchain_identities_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_onchain_identities_user_id ON public.onchain_identities USING btree (user_id);


--
-- Name: idx_onchain_verification_history_identity_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_onchain_verification_history_identity_id ON public.onchain_verification_history USING btree (identity_id);


--
-- Name: idx_partition_balances_holder_address; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partition_balances_holder_address ON public.token_erc1400_partition_balances USING btree (holder_address);


--
-- Name: idx_partition_balances_partition_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partition_balances_partition_id ON public.token_erc1400_partition_balances USING btree (partition_id);


--
-- Name: idx_partition_operators_partition_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partition_operators_partition_id ON public.token_erc1400_partition_operators USING btree (partition_id);


--
-- Name: idx_partition_transfers_from_address; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partition_transfers_from_address ON public.token_erc1400_partition_transfers USING btree (from_address);


--
-- Name: idx_partition_transfers_partition_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partition_transfers_partition_id ON public.token_erc1400_partition_transfers USING btree (partition_id);


--
-- Name: idx_partition_transfers_to_address; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partition_transfers_to_address ON public.token_erc1400_partition_transfers USING btree (to_address);


--
-- Name: idx_policy_rule_approvers_rule_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_policy_rule_approvers_rule_id ON public.policy_rule_approvers USING btree (policy_rule_id);


--
-- Name: idx_policy_rule_approvers_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_policy_rule_approvers_user_id ON public.policy_rule_approvers USING btree (user_id);


--
-- Name: idx_policy_template_approvers_template_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_policy_template_approvers_template_id ON public.policy_template_approvers USING btree (template_id);


--
-- Name: idx_policy_templates_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_policy_templates_created_at ON public.policy_templates USING btree (created_at DESC);


--
-- Name: idx_policy_templates_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_policy_templates_name ON public.policy_templates USING btree (template_name);


--
-- Name: idx_policy_templates_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_policy_templates_status ON public.policy_templates USING btree (status);


--
-- Name: idx_policy_templates_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_policy_templates_type ON public.policy_templates USING btree (template_type);


--
-- Name: idx_project_credentials_project_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_project_credentials_project_id ON public.project_credentials USING btree (project_id);


--
-- Name: idx_project_is_primary; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_project_is_primary ON public.projects USING btree (is_primary);


--
-- Name: idx_ramp_network_config_environment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ramp_network_config_environment ON public.ramp_network_config USING btree (environment);


--
-- Name: idx_ramp_network_config_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ramp_network_config_is_active ON public.ramp_network_config USING btree (is_active);


--
-- Name: idx_ramp_network_config_organization_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ramp_network_config_organization_id ON public.ramp_network_config USING btree (organization_id);


--
-- Name: idx_ramp_supported_assets_chain; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ramp_supported_assets_chain ON public.ramp_supported_assets USING btree (chain);


--
-- Name: idx_ramp_supported_assets_enabled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ramp_supported_assets_enabled ON public.ramp_supported_assets USING btree (enabled);


--
-- Name: idx_ramp_supported_assets_flow_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ramp_supported_assets_flow_type ON public.ramp_supported_assets USING btree (flow_type);


--
-- Name: idx_ramp_supported_assets_last_updated; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ramp_supported_assets_last_updated ON public.ramp_supported_assets USING btree (last_updated DESC);


--
-- Name: idx_ramp_supported_assets_symbol; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ramp_supported_assets_symbol ON public.ramp_supported_assets USING btree (symbol);


--
-- Name: idx_ramp_transaction_events_event_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ramp_transaction_events_event_type ON public.ramp_transaction_events USING btree (event_type);


--
-- Name: idx_ramp_transaction_events_session_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ramp_transaction_events_session_id ON public.ramp_transaction_events USING btree (session_id);


--
-- Name: idx_ramp_transaction_events_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ramp_transaction_events_timestamp ON public.ramp_transaction_events USING btree ("timestamp" DESC);


--
-- Name: idx_ramp_transaction_events_transaction_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ramp_transaction_events_transaction_id ON public.ramp_transaction_events USING btree (transaction_id);


--
-- Name: idx_ramp_webhook_events_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ramp_webhook_events_created_at ON public.ramp_webhook_events USING btree (created_at DESC);


--
-- Name: idx_ramp_webhook_events_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ramp_webhook_events_event_id ON public.ramp_webhook_events USING btree (event_id);


--
-- Name: idx_ramp_webhook_events_flow_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ramp_webhook_events_flow_type ON public.ramp_webhook_events USING btree (flow_type);


--
-- Name: idx_ramp_webhook_events_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ramp_webhook_events_type ON public.ramp_webhook_events USING btree (event_type);


--
-- Name: idx_redemption_approver_assignments_approver_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_redemption_approver_assignments_approver_id ON public.redemption_approver_assignments USING btree (approver_user_id);


--
-- Name: idx_redemption_approver_assignments_config_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_redemption_approver_assignments_config_id ON public.redemption_approver_assignments USING btree (approval_config_id);


--
-- Name: idx_redemption_approver_assignments_request_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_redemption_approver_assignments_request_id ON public.redemption_approver_assignments USING btree (redemption_request_id);


--
-- Name: idx_redemption_approver_assignments_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_redemption_approver_assignments_status ON public.redemption_approver_assignments USING btree (status);


--
-- Name: idx_redemption_approvers_approver_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_redemption_approvers_approver_id ON public.redemption_approvers USING btree (approver_id);


--
-- Name: idx_redemption_approvers_redemption_id_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_redemption_approvers_redemption_id_status ON public.redemption_approvers USING btree (redemption_id, status);


--
-- Name: idx_redemption_approvers_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_redemption_approvers_status ON public.redemption_approvers USING btree (status);


--
-- Name: idx_redemption_rules_rule_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_redemption_rules_rule_id ON public.redemption_rules USING btree (rule_id);


--
-- Name: idx_redemption_settlements_burn_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_redemption_settlements_burn_status ON public.redemption_settlements USING btree (burn_status);


--
-- Name: idx_redemption_settlements_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_redemption_settlements_created_at ON public.redemption_settlements USING btree (created_at);


--
-- Name: idx_redemption_settlements_request_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_redemption_settlements_request_id ON public.redemption_settlements USING btree (redemption_request_id);


--
-- Name: idx_redemption_settlements_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_redemption_settlements_status ON public.redemption_settlements USING btree (status);


--
-- Name: idx_redemption_settlements_transfer_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_redemption_settlements_transfer_status ON public.redemption_settlements USING btree (transfer_status);


--
-- Name: idx_redemption_window_configs_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_redemption_window_configs_active ON public.redemption_window_configs USING btree (active);


--
-- Name: idx_redemption_window_configs_fund_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_redemption_window_configs_fund_id ON public.redemption_window_configs USING btree (fund_id);


--
-- Name: idx_redemption_windows_config_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_redemption_windows_config_id ON public.redemption_windows USING btree (config_id);


--
-- Name: idx_redemption_windows_dates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_redemption_windows_dates ON public.redemption_windows USING btree (start_date, end_date);


--
-- Name: idx_redemption_windows_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_redemption_windows_status ON public.redemption_windows USING btree (status);


--
-- Name: idx_ripple_payments_composite; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ripple_payments_composite ON public.ripple_payments USING btree (from_account, status, created_at);


--
-- Name: idx_ripple_payments_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ripple_payments_created_at ON public.ripple_payments USING btree (created_at);


--
-- Name: idx_ripple_payments_from_account; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ripple_payments_from_account ON public.ripple_payments USING btree (from_account);


--
-- Name: idx_ripple_payments_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ripple_payments_hash ON public.ripple_payments USING btree (hash);


--
-- Name: idx_ripple_payments_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ripple_payments_status ON public.ripple_payments USING btree (status);


--
-- Name: idx_ripple_payments_to_account; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ripple_payments_to_account ON public.ripple_payments USING btree (to_account);


--
-- Name: idx_risk_assessments_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_risk_assessments_user_id ON public.risk_assessments USING btree (user_id);


--
-- Name: idx_risk_assessments_wallet_address; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_risk_assessments_wallet_address ON public.risk_assessments USING btree (wallet_address);


--
-- Name: idx_rules_is_template; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rules_is_template ON public.rules USING btree (is_template);


--
-- Name: idx_rules_rule_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rules_rule_id ON public.rules USING btree (rule_id);


--
-- Name: idx_security_audit_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_security_audit_logs_user_id ON public.security_audit_logs USING btree (user_id);


--
-- Name: idx_security_audit_logs_wallet_address; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_security_audit_logs_wallet_address ON public.security_audit_logs USING btree (wallet_address);


--
-- Name: idx_security_events_event_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_security_events_event_type ON public.security_events USING btree (event_type);


--
-- Name: idx_security_events_severity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_security_events_severity ON public.security_events USING btree (severity);


--
-- Name: idx_security_events_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_security_events_timestamp ON public.security_events USING btree ("timestamp" DESC);


--
-- Name: idx_security_events_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_security_events_user_id ON public.security_events USING btree (user_id);


--
-- Name: idx_security_events_wallet_address; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_security_events_wallet_address ON public.security_events USING btree (wallet_address);


--
-- Name: idx_security_events_wallet_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_security_events_wallet_id ON public.security_events USING btree (wallet_id);


--
-- Name: idx_settlement_metrics_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_settlement_metrics_date ON public.settlement_metrics USING btree (date DESC);


--
-- Name: idx_system_processes_process_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_system_processes_process_name ON public.system_processes USING btree (process_name);


--
-- Name: idx_system_processes_start_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_system_processes_start_time ON public.system_processes USING btree (start_time DESC);


--
-- Name: idx_system_processes_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_system_processes_status ON public.system_processes USING btree (status);


--
-- Name: idx_token_allocations_token_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_token_allocations_token_id ON public.token_allocations USING btree (token_id);


--
-- Name: idx_token_deployment_history_project_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_token_deployment_history_project_id ON public.token_deployment_history USING btree (project_id);


--
-- Name: idx_token_deployment_history_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_token_deployment_history_status ON public.token_deployment_history USING btree (status);


--
-- Name: idx_token_deployment_history_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_token_deployment_history_timestamp ON public.token_deployment_history USING btree ("timestamp");


--
-- Name: idx_token_deployment_history_token_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_token_deployment_history_token_id ON public.token_deployment_history USING btree (token_id);


--
-- Name: idx_token_deployments_token_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_token_deployments_token_id ON public.token_deployments USING btree (token_id);


--
-- Name: idx_token_erc1155_types_fungibility_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_token_erc1155_types_fungibility_type ON public.token_erc1155_types USING btree (fungibility_type);


--
-- Name: idx_token_erc1155_whitelist_enabled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_token_erc1155_whitelist_enabled ON public.token_erc1155_properties USING gin (((whitelist_config -> 'enabled'::text))) WHERE ((whitelist_config -> 'enabled'::text) = 'true'::jsonb);


--
-- Name: idx_token_erc1400_controllers_token_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_token_erc1400_controllers_token_id ON public.token_erc1400_controllers USING btree (token_id);


--
-- Name: idx_token_erc1400_documents_token_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_token_erc1400_documents_token_id ON public.token_erc1400_documents USING btree (token_id);


--
-- Name: idx_token_erc1400_partitions_token_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_token_erc1400_partitions_token_id ON public.token_erc1400_partitions USING btree (token_id);


--
-- Name: idx_token_erc1400_whitelist_enabled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_token_erc1400_whitelist_enabled ON public.token_erc1400_properties USING btree (investor_whitelist_enabled) WHERE (investor_whitelist_enabled = true);


--
-- Name: idx_token_erc20_whitelist_enabled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_token_erc20_whitelist_enabled ON public.token_erc20_properties USING gin (((whitelist_config -> 'enabled'::text))) WHERE ((whitelist_config -> 'enabled'::text) = 'true'::jsonb);


--
-- Name: idx_token_erc3525_allocations_token_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_token_erc3525_allocations_token_id ON public.token_erc3525_allocations USING btree (token_id);


--
-- Name: idx_token_erc3525_properties_token_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_token_erc3525_properties_token_id ON public.token_erc3525_properties USING btree (token_id);


--
-- Name: idx_token_erc3525_slots_token_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_token_erc3525_slots_token_id ON public.token_erc3525_slots USING btree (token_id);


--
-- Name: idx_token_erc3525_whitelist_enabled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_token_erc3525_whitelist_enabled ON public.token_erc3525_properties USING gin (((whitelist_config -> 'enabled'::text))) WHERE ((whitelist_config -> 'enabled'::text) = 'true'::jsonb);


--
-- Name: idx_token_erc4626_whitelist_enabled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_token_erc4626_whitelist_enabled ON public.token_erc4626_properties USING gin (((whitelist_config -> 'enabled'::text))) WHERE ((whitelist_config -> 'enabled'::text) = 'true'::jsonb);


--
-- Name: idx_token_erc721_whitelist_enabled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_token_erc721_whitelist_enabled ON public.token_erc721_properties USING gin (((whitelist_config -> 'enabled'::text))) WHERE ((whitelist_config -> 'enabled'::text) = 'true'::jsonb);


--
-- Name: idx_token_events_event_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_token_events_event_type ON public.token_events USING btree (event_type);


--
-- Name: idx_token_events_is_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_token_events_is_read ON public.token_events USING btree (is_read);


--
-- Name: idx_token_events_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_token_events_timestamp ON public.token_events USING btree ("timestamp");


--
-- Name: idx_token_events_token_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_token_events_token_id ON public.token_events USING btree (token_id);


--
-- Name: idx_token_operations_token_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_token_operations_token_id ON public.token_operations USING btree (token_id);


--
-- Name: idx_token_versions_token_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_token_versions_token_id ON public.token_versions USING btree (token_id);


--
-- Name: idx_token_versions_token_id_version; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_token_versions_token_id_version ON public.token_versions USING btree (token_id, version);


--
-- Name: idx_token_whitelists_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_token_whitelists_active ON public.token_whitelists USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_token_whitelists_blockchain; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_token_whitelists_blockchain ON public.token_whitelists USING btree (blockchain);


--
-- Name: idx_token_whitelists_token_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_token_whitelists_token_id ON public.token_whitelists USING btree (token_id);


--
-- Name: idx_token_whitelists_wallet_address; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_token_whitelists_wallet_address ON public.token_whitelists USING btree (wallet_address);


--
-- Name: idx_tokens_blockchain; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tokens_blockchain ON public.tokens USING btree (blockchain);


--
-- Name: idx_tokens_deployment_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tokens_deployment_status ON public.tokens USING btree (deployment_status);


--
-- Name: idx_tokens_project_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tokens_project_id ON public.tokens USING btree (project_id);


--
-- Name: idx_tokens_standard; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tokens_standard ON public.tokens USING btree (standard);


--
-- Name: idx_tokens_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tokens_status ON public.tokens USING btree (status);


--
-- Name: idx_transaction_events_actor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transaction_events_actor ON public.transaction_events USING btree (actor);


--
-- Name: idx_transaction_events_event_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transaction_events_event_type ON public.transaction_events USING btree (event_type);


--
-- Name: idx_transaction_events_request_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transaction_events_request_id ON public.transaction_events USING btree (request_id);


--
-- Name: idx_transaction_events_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transaction_events_timestamp ON public.transaction_events USING btree ("timestamp");


--
-- Name: idx_transaction_notifications_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transaction_notifications_read ON public.transaction_notifications USING btree (read);


--
-- Name: idx_transaction_notifications_transaction; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transaction_notifications_transaction ON public.transaction_notifications USING btree (transaction_id);


--
-- Name: idx_transaction_notifications_wallet; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transaction_notifications_wallet ON public.transaction_notifications USING btree (wallet_address);


--
-- Name: idx_transactions_blockchain; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_blockchain ON public.transactions USING btree (blockchain);


--
-- Name: idx_transactions_composite; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_composite ON public.transactions USING btree (from_address, status, created_at);


--
-- Name: idx_transactions_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_created_at ON public.transactions USING btree (created_at);


--
-- Name: idx_transactions_from_address; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_from_address ON public.transactions USING btree (from_address);


--
-- Name: idx_transactions_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_hash ON public.transactions USING btree (transaction_hash);


--
-- Name: idx_transactions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_status ON public.transactions USING btree (status);


--
-- Name: idx_transactions_to_address; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_to_address ON public.transactions USING btree (to_address);


--
-- Name: idx_user_mfa_settings_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_mfa_settings_user_id ON public.user_mfa_settings USING btree (user_id);


--
-- Name: idx_wallet_signatories_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wallet_signatories_status ON public.wallet_signatories USING btree (status);


--
-- Name: idx_wallet_signatories_wallet_address; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wallet_signatories_wallet_address ON public.wallet_signatories USING btree (wallet_address);


--
-- Name: idx_wallet_transactions_from_address; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wallet_transactions_from_address ON public.wallet_transactions USING btree (from_address);


--
-- Name: idx_wallet_transactions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wallet_transactions_status ON public.wallet_transactions USING btree (status);


--
-- Name: idx_wallet_transactions_tx_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wallet_transactions_tx_hash ON public.wallet_transactions USING btree (tx_hash);


--
-- Name: idx_whitelist_entries_address; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_whitelist_entries_address ON public.whitelist_entries USING btree (address);


--
-- Name: idx_whitelist_entries_organization_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_whitelist_entries_organization_id ON public.whitelist_entries USING btree (organization_id);


--
-- Name: multi_sig_transactions_blockchain_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX multi_sig_transactions_blockchain_idx ON public.multi_sig_transactions USING btree (blockchain);


--
-- Name: multi_sig_wallets_blockchain_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX multi_sig_wallets_blockchain_idx ON public.multi_sig_wallets USING btree (blockchain);


--
-- Name: distribution_redemptions after_distribution_redemption_insert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER after_distribution_redemption_insert AFTER INSERT ON public.distribution_redemptions FOR EACH ROW EXECUTE FUNCTION public.update_distribution_remaining_amount();


--
-- Name: token_allocations after_token_allocation_distributed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER after_token_allocation_distributed AFTER UPDATE ON public.token_allocations FOR EACH ROW WHEN (((old.distributed = false) AND (new.distributed = true))) EXECUTE FUNCTION public.handle_token_distribution();


--
-- Name: approval_config_approvers approval_config_approvers_audit_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER approval_config_approvers_audit_trigger AFTER INSERT OR DELETE ON public.approval_config_approvers FOR EACH ROW EXECUTE FUNCTION public.log_approver_assignment_changes();


--
-- Name: approval_configs approval_config_audit_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER approval_config_audit_trigger AFTER INSERT OR DELETE OR UPDATE ON public.approval_configs FOR EACH ROW EXECUTE FUNCTION public.log_approval_config_changes();


--
-- Name: audit_logs audit_audit_logs_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_audit_logs_trigger AFTER INSERT OR DELETE OR UPDATE ON public.audit_logs FOR EACH ROW EXECUTE FUNCTION public.log_table_change();

ALTER TABLE public.audit_logs DISABLE TRIGGER audit_audit_logs_trigger;


--
-- Name: bulk_operations audit_bulk_operations_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_bulk_operations_trigger AFTER INSERT OR DELETE OR UPDATE ON public.bulk_operations FOR EACH ROW EXECUTE FUNCTION public.log_table_change();

ALTER TABLE public.bulk_operations DISABLE TRIGGER audit_bulk_operations_trigger;


--
-- Name: notifications audit_notifications_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_notifications_trigger AFTER INSERT OR DELETE OR UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.log_table_change();

ALTER TABLE public.notifications DISABLE TRIGGER audit_notifications_trigger;


--
-- Name: projects audit_projects_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_projects_trigger AFTER INSERT OR DELETE OR UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.log_table_change();

ALTER TABLE public.projects DISABLE TRIGGER audit_projects_trigger;


--
-- Name: users audit_users_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_users_trigger AFTER INSERT OR DELETE OR UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.log_table_change();

ALTER TABLE public.users DISABLE TRIGGER audit_users_trigger;


--
-- Name: token_allocations before_token_allocation_delete; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER before_token_allocation_delete BEFORE DELETE ON public.token_allocations FOR EACH ROW EXECUTE FUNCTION public.handle_token_allocation_deletion();


--
-- Name: tokens create_token_version_on_insert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER create_token_version_on_insert AFTER INSERT ON public.tokens FOR EACH ROW EXECUTE FUNCTION public.create_token_version();


--
-- Name: tokens create_token_version_on_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER create_token_version_on_update AFTER UPDATE ON public.tokens FOR EACH ROW WHEN ((old.* IS DISTINCT FROM new.*)) EXECUTE FUNCTION public.create_token_version();


--
-- Name: distributions distributions_audit_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER distributions_audit_trigger AFTER INSERT OR DELETE OR UPDATE ON public.distributions FOR EACH ROW EXECUTE FUNCTION public.log_database_changes();

ALTER TABLE public.distributions DISABLE TRIGGER distributions_audit_trigger;


--
-- Name: documents document_expiry_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER document_expiry_trigger AFTER INSERT OR UPDATE OF expiry_date ON public.documents FOR EACH ROW EXECUTE FUNCTION public.check_document_expiry();


--
-- Name: documents document_version_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER document_version_trigger BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.create_document_version();


--
-- Name: audit_logs extract_metadata_values_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER extract_metadata_values_trigger BEFORE INSERT OR UPDATE ON public.audit_logs FOR EACH ROW EXECUTE FUNCTION public.extract_severity_from_metadata();


--
-- Name: investor_approvals investor_approval_audit_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER investor_approval_audit_trigger AFTER UPDATE ON public.investor_approvals FOR EACH ROW EXECUTE FUNCTION public.audit_investor_approval_changes();

ALTER TABLE public.investor_approvals DISABLE TRIGGER investor_approval_audit_trigger;


--
-- Name: investors investors_audit_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER investors_audit_trigger AFTER INSERT OR DELETE OR UPDATE ON public.investors FOR EACH ROW EXECUTE FUNCTION public.log_database_changes();

ALTER TABLE public.investors DISABLE TRIGGER investors_audit_trigger;


--
-- Name: distributions log_distribution_changes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER log_distribution_changes AFTER INSERT OR DELETE OR UPDATE ON public.distributions FOR EACH ROW EXECUTE FUNCTION public.log_user_action();


--
-- Name: distribution_redemptions log_distribution_redemption_changes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER log_distribution_redemption_changes AFTER INSERT OR DELETE OR UPDATE ON public.distribution_redemptions FOR EACH ROW EXECUTE FUNCTION public.log_user_action();


--
-- Name: investors log_investor_changes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER log_investor_changes AFTER INSERT OR DELETE OR UPDATE ON public.investors FOR EACH ROW EXECUTE FUNCTION public.log_user_action();


--
-- Name: redemption_requests log_redemption_request_changes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER log_redemption_request_changes AFTER INSERT OR DELETE OR UPDATE ON public.redemption_requests FOR EACH ROW EXECUTE FUNCTION public.log_user_action();


--
-- Name: subscriptions log_subscription_changes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER log_subscription_changes AFTER INSERT OR DELETE OR UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.log_user_action();


--
-- Name: token_allocations log_token_allocation_changes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER log_token_allocation_changes AFTER INSERT OR DELETE OR UPDATE ON public.token_allocations FOR EACH ROW EXECUTE FUNCTION public.log_user_action();


--
-- Name: tokens log_token_changes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER log_token_changes AFTER INSERT OR DELETE OR UPDATE ON public.tokens FOR EACH ROW EXECUTE FUNCTION public.log_user_action();


--
-- Name: token_templates log_token_template_changes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER log_token_template_changes AFTER INSERT OR DELETE OR UPDATE ON public.token_templates FOR EACH ROW EXECUTE FUNCTION public.log_user_action();


--
-- Name: policy_templates policy_templates_audit_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER policy_templates_audit_trigger AFTER INSERT OR DELETE OR UPDATE ON public.policy_templates FOR EACH ROW EXECUTE FUNCTION public.log_user_action();

ALTER TABLE public.policy_templates DISABLE TRIGGER policy_templates_audit_trigger;


--
-- Name: projects projects_audit_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER projects_audit_trigger AFTER INSERT OR DELETE OR UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.log_database_changes();

ALTER TABLE public.projects DISABLE TRIGGER projects_audit_trigger;


--
-- Name: redemption_approvers redemption_approvers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER redemption_approvers_updated_at BEFORE UPDATE ON public.redemption_approvers FOR EACH ROW EXECUTE FUNCTION public.update_redemption_approvers_updated_at();


--
-- Name: redemption_requests redemption_requests_audit_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER redemption_requests_audit_trigger AFTER INSERT OR DELETE OR UPDATE ON public.redemption_requests FOR EACH ROW EXECUTE FUNCTION public.log_database_changes();

ALTER TABLE public.redemption_requests DISABLE TRIGGER redemption_requests_audit_trigger;


--
-- Name: rules rule_approval_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER rule_approval_trigger BEFORE INSERT OR UPDATE ON public.rules FOR EACH ROW EXECUTE FUNCTION public.add_rule_to_approval_queue();


--
-- Name: rules rules_audit_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER rules_audit_trigger AFTER INSERT OR DELETE OR UPDATE ON public.rules FOR EACH ROW EXECUTE FUNCTION public.log_user_action();

ALTER TABLE public.rules DISABLE TRIGGER rules_audit_trigger;


--
-- Name: rules rules_update_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER rules_update_timestamp BEFORE UPDATE ON public.rules FOR EACH ROW EXECUTE FUNCTION public.update_rules_updated_at();


--
-- Name: distributions set_standard_on_distribution_insert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_standard_on_distribution_insert BEFORE INSERT ON public.distributions FOR EACH ROW EXECUTE FUNCTION public.set_distribution_standard();


--
-- Name: distributions set_standard_on_distribution_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_standard_on_distribution_update BEFORE UPDATE ON public.distributions FOR EACH ROW WHEN (((old.standard IS DISTINCT FROM new.standard) AND (new.standard IS NULL))) EXECUTE FUNCTION public.set_distribution_standard();


--
-- Name: token_allocations set_standard_on_token_allocation_insert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_standard_on_token_allocation_insert BEFORE INSERT ON public.token_allocations FOR EACH ROW EXECUTE FUNCTION public.set_token_allocation_standard();


--
-- Name: token_allocations set_standard_on_token_allocation_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_standard_on_token_allocation_update BEFORE UPDATE ON public.token_allocations FOR EACH ROW WHEN (((old.token_id IS DISTINCT FROM new.token_id) OR (new.standard IS NULL))) EXECUTE FUNCTION public.set_token_allocation_standard();


--
-- Name: token_whitelists set_token_whitelists_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_token_whitelists_updated_at BEFORE UPDATE ON public.token_whitelists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: security_events set_updated_at_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at_timestamp BEFORE UPDATE ON public.security_events FOR EACH ROW EXECUTE FUNCTION public.update_security_events_updated_at();


--
-- Name: token_erc1155_balances set_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at_trigger BEFORE UPDATE ON public.token_erc1155_balances FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: token_erc1155_properties set_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at_trigger BEFORE UPDATE ON public.token_erc1155_properties FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: token_erc1155_types set_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at_trigger BEFORE UPDATE ON public.token_erc1155_types FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: token_erc1155_uri_mappings set_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at_trigger BEFORE UPDATE ON public.token_erc1155_uri_mappings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: token_erc1400_controllers set_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at_trigger BEFORE UPDATE ON public.token_erc1400_controllers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: token_erc1400_documents set_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at_trigger BEFORE UPDATE ON public.token_erc1400_documents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: token_erc1400_partition_balances set_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at_trigger BEFORE UPDATE ON public.token_erc1400_partition_balances FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: token_erc1400_partition_operators set_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at_trigger BEFORE UPDATE ON public.token_erc1400_partition_operators FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: token_erc1400_partition_transfers set_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at_trigger BEFORE UPDATE ON public.token_erc1400_partition_transfers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: token_erc1400_partitions set_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at_trigger BEFORE UPDATE ON public.token_erc1400_partitions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: token_erc1400_properties set_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at_trigger BEFORE UPDATE ON public.token_erc1400_properties FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: token_erc3525_allocations set_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at_trigger BEFORE UPDATE ON public.token_erc3525_allocations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: token_erc3525_properties set_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at_trigger BEFORE UPDATE ON public.token_erc3525_properties FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: token_erc3525_slots set_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at_trigger BEFORE UPDATE ON public.token_erc3525_slots FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: token_erc4626_asset_allocations set_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at_trigger BEFORE UPDATE ON public.token_erc4626_asset_allocations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: token_erc4626_properties set_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at_trigger BEFORE UPDATE ON public.token_erc4626_properties FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: token_erc4626_strategy_params set_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at_trigger BEFORE UPDATE ON public.token_erc4626_strategy_params FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: token_erc721_attributes set_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at_trigger BEFORE UPDATE ON public.token_erc721_attributes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: subscriptions subscriptions_audit_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER subscriptions_audit_trigger AFTER INSERT OR DELETE OR UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.log_database_changes();

ALTER TABLE public.subscriptions DISABLE TRIGGER subscriptions_audit_trigger;


--
-- Name: policy_templates template_approval_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER template_approval_trigger BEFORE INSERT OR UPDATE ON public.policy_templates FOR EACH ROW EXECUTE FUNCTION public.add_template_to_approval_queue();


--
-- Name: token_allocations token_allocations_audit_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER token_allocations_audit_trigger AFTER INSERT OR DELETE OR UPDATE ON public.token_allocations FOR EACH ROW EXECUTE FUNCTION public.log_database_changes();

ALTER TABLE public.token_allocations DISABLE TRIGGER token_allocations_audit_trigger;


--
-- Name: tokens token_insert_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER token_insert_trigger AFTER INSERT ON public.tokens FOR EACH ROW EXECUTE FUNCTION public.insert_token_properties();


--
-- Name: tokens tokens_audit_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tokens_audit_trigger AFTER INSERT OR DELETE OR UPDATE ON public.tokens FOR EACH ROW EXECUTE FUNCTION public.log_database_changes();

ALTER TABLE public.tokens DISABLE TRIGGER tokens_audit_trigger;


--
-- Name: fund_nav_data trigger_calculate_nav_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_calculate_nav_change BEFORE INSERT OR UPDATE ON public.fund_nav_data FOR EACH ROW EXECUTE FUNCTION public.calculate_nav_change();


--
-- Name: consensus_settings trigger_consensus_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_consensus_settings_updated_at BEFORE UPDATE ON public.consensus_settings FOR EACH ROW EXECUTE FUNCTION public.update_consensus_settings_updated_at();


--
-- Name: investor_groups_investors trigger_update_group_member_count_delete; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_group_member_count_delete AFTER DELETE ON public.investor_groups_investors FOR EACH ROW EXECUTE FUNCTION public.update_group_member_count();


--
-- Name: investor_groups_investors trigger_update_group_member_count_delete_new; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_group_member_count_delete_new AFTER DELETE ON public.investor_groups_investors FOR EACH ROW EXECUTE FUNCTION public.update_group_member_count();


--
-- Name: investor_group_members trigger_update_group_member_count_delete_old; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_group_member_count_delete_old AFTER DELETE ON public.investor_group_members FOR EACH ROW EXECUTE FUNCTION public.update_group_member_count();


--
-- Name: investor_groups_investors trigger_update_group_member_count_insert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_group_member_count_insert AFTER INSERT ON public.investor_groups_investors FOR EACH ROW EXECUTE FUNCTION public.update_group_member_count();


--
-- Name: investor_groups_investors trigger_update_group_member_count_insert_new; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_group_member_count_insert_new AFTER INSERT ON public.investor_groups_investors FOR EACH ROW EXECUTE FUNCTION public.update_group_member_count();


--
-- Name: investor_group_members trigger_update_group_member_count_insert_old; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_group_member_count_insert_old AFTER INSERT ON public.investor_group_members FOR EACH ROW EXECUTE FUNCTION public.update_group_member_count();


--
-- Name: redemption_settlements trigger_update_settlement_status; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_settlement_status BEFORE UPDATE ON public.redemption_settlements FOR EACH ROW EXECUTE FUNCTION public.update_settlement_status();


--
-- Name: alerts update_alerts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON public.alerts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: approval_config_approvers update_approval_config_approvers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_approval_config_approvers_updated_at BEFORE UPDATE ON public.approval_config_approvers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: approval_configs update_approval_configs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_approval_configs_updated_at BEFORE UPDATE ON public.approval_configs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: compliance_reports update_compliance_reports_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_compliance_reports_updated_at BEFORE UPDATE ON public.compliance_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: dfns_activity_logs update_dfns_activity_logs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_dfns_activity_logs_updated_at BEFORE UPDATE ON public.dfns_activity_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: dfns_api_requests update_dfns_api_requests_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_dfns_api_requests_updated_at BEFORE UPDATE ON public.dfns_api_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: dfns_applications update_dfns_applications_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_dfns_applications_updated_at BEFORE UPDATE ON public.dfns_applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: dfns_broadcast_transactions update_dfns_broadcast_transactions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_dfns_broadcast_transactions_updated_at BEFORE UPDATE ON public.dfns_broadcast_transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: dfns_credentials update_dfns_credentials_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_dfns_credentials_updated_at BEFORE UPDATE ON public.dfns_credentials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: dfns_exchange_accounts update_dfns_exchange_accounts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_dfns_exchange_accounts_updated_at BEFORE UPDATE ON public.dfns_exchange_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: dfns_exchange_balances update_dfns_exchange_balances_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_dfns_exchange_balances_updated_at BEFORE UPDATE ON public.dfns_exchange_balances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: dfns_exchange_integrations update_dfns_exchange_integrations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_dfns_exchange_integrations_updated_at BEFORE UPDATE ON public.dfns_exchange_integrations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: dfns_fee_sponsors update_dfns_fee_sponsors_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_dfns_fee_sponsors_updated_at BEFORE UPDATE ON public.dfns_fee_sponsors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: dfns_fiat_provider_configs update_dfns_fiat_provider_configs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_dfns_fiat_provider_configs_updated_at BEFORE UPDATE ON public.dfns_fiat_provider_configs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: dfns_fiat_transactions update_dfns_fiat_transactions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_dfns_fiat_transactions_updated_at BEFORE UPDATE ON public.dfns_fiat_transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: dfns_permission_assignments update_dfns_permission_assignments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_dfns_permission_assignments_updated_at BEFORE UPDATE ON public.dfns_permission_assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: dfns_permissions update_dfns_permissions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_dfns_permissions_updated_at BEFORE UPDATE ON public.dfns_permissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: dfns_personal_access_tokens update_dfns_personal_access_tokens_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_dfns_personal_access_tokens_updated_at BEFORE UPDATE ON public.dfns_personal_access_tokens FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: dfns_policies update_dfns_policies_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_dfns_policies_updated_at BEFORE UPDATE ON public.dfns_policies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: dfns_policy_approvals update_dfns_policy_approvals_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_dfns_policy_approvals_updated_at BEFORE UPDATE ON public.dfns_policy_approvals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: dfns_service_accounts update_dfns_service_accounts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_dfns_service_accounts_updated_at BEFORE UPDATE ON public.dfns_service_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: dfns_signatures update_dfns_signatures_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_dfns_signatures_updated_at BEFORE UPDATE ON public.dfns_signatures FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: dfns_signing_keys update_dfns_signing_keys_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_dfns_signing_keys_updated_at BEFORE UPDATE ON public.dfns_signing_keys FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: dfns_sponsored_fees update_dfns_sponsored_fees_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_dfns_sponsored_fees_updated_at BEFORE UPDATE ON public.dfns_sponsored_fees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: dfns_staking_integrations update_dfns_staking_integrations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_dfns_staking_integrations_updated_at BEFORE UPDATE ON public.dfns_staking_integrations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: dfns_sync_status update_dfns_sync_status_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_dfns_sync_status_updated_at BEFORE UPDATE ON public.dfns_sync_status FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: dfns_transaction_history update_dfns_transaction_history_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_dfns_transaction_history_updated_at BEFORE UPDATE ON public.dfns_transaction_history FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: dfns_transfers update_dfns_transfers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_dfns_transfers_updated_at BEFORE UPDATE ON public.dfns_transfers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: dfns_users update_dfns_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_dfns_users_updated_at BEFORE UPDATE ON public.dfns_users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: dfns_validators update_dfns_validators_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_dfns_validators_updated_at BEFORE UPDATE ON public.dfns_validators FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: dfns_wallet_balances update_dfns_wallet_balances_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_dfns_wallet_balances_updated_at BEFORE UPDATE ON public.dfns_wallet_balances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: dfns_wallet_nfts update_dfns_wallet_nfts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_dfns_wallet_nfts_updated_at BEFORE UPDATE ON public.dfns_wallet_nfts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: dfns_wallets update_dfns_wallets_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_dfns_wallets_updated_at BEFORE UPDATE ON public.dfns_wallets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: dfns_webhook_deliveries update_dfns_webhook_deliveries_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_dfns_webhook_deliveries_updated_at BEFORE UPDATE ON public.dfns_webhook_deliveries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: dfns_webhooks update_dfns_webhooks_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_dfns_webhooks_updated_at BEFORE UPDATE ON public.dfns_webhooks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: document_workflows update_document_workflows_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_document_workflows_updated_at BEFORE UPDATE ON public.document_workflows FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: fiat_transactions update_fiat_transactions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_fiat_transactions_updated_at BEFORE UPDATE ON public.fiat_transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: health_checks update_health_checks_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_health_checks_updated_at BEFORE UPDATE ON public.health_checks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: investor_approvals update_investor_approvals_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_investor_approvals_timestamp BEFORE UPDATE ON public.investor_approvals FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: investor_groups update_investor_groups_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_investor_groups_updated_at BEFORE UPDATE ON public.investor_groups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: investors update_investors_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_investors_timestamp BEFORE UPDATE ON public.investors FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: investors update_investors_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_investors_updated_at BEFORE UPDATE ON public.investors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: issuer_access_roles update_issuer_access_roles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_issuer_access_roles_updated_at BEFORE UPDATE ON public.issuer_access_roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: issuer_documents update_issuer_documents_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_issuer_documents_updated_at BEFORE UPDATE ON public.issuer_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: moonpay_compliance_alerts update_moonpay_compliance_alerts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_moonpay_compliance_alerts_updated_at BEFORE UPDATE ON public.moonpay_compliance_alerts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: moonpay_customers update_moonpay_customers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_moonpay_customers_updated_at BEFORE UPDATE ON public.moonpay_customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: moonpay_passes update_moonpay_passes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_moonpay_passes_updated_at BEFORE UPDATE ON public.moonpay_passes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: moonpay_policies update_moonpay_policies_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_moonpay_policies_updated_at BEFORE UPDATE ON public.moonpay_policies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: moonpay_policy_logs update_moonpay_policy_logs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_moonpay_policy_logs_updated_at BEFORE UPDATE ON public.moonpay_policy_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: moonpay_projects update_moonpay_projects_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_moonpay_projects_updated_at BEFORE UPDATE ON public.moonpay_projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: moonpay_swap_transactions update_moonpay_swap_transactions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_moonpay_swap_transactions_updated_at BEFORE UPDATE ON public.moonpay_swap_transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: moonpay_transactions update_moonpay_transactions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_moonpay_transactions_updated_at BEFORE UPDATE ON public.moonpay_transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: moonpay_webhook_config update_moonpay_webhook_config_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_moonpay_webhook_config_updated_at BEFORE UPDATE ON public.moonpay_webhook_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: onboarding_restrictions update_onboarding_restrictions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_onboarding_restrictions_updated_at BEFORE UPDATE ON public.onboarding_restrictions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: onchain_identities update_onchain_identities_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_onchain_identities_timestamp BEFORE UPDATE ON public.onchain_identities FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: onchain_issuers update_onchain_issuers_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_onchain_issuers_timestamp BEFORE UPDATE ON public.onchain_issuers FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: organizations update_organizations_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_organizations_timestamp BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: ramp_network_config update_ramp_network_config_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_ramp_network_config_updated_at BEFORE UPDATE ON public.ramp_network_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ramp_webhook_events update_ramp_webhook_events_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_ramp_webhook_events_updated_at BEFORE UPDATE ON public.ramp_webhook_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ripple_payments update_ripple_payments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_ripple_payments_updated_at BEFORE UPDATE ON public.ripple_payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: risk_assessments update_risk_assessments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_risk_assessments_updated_at BEFORE UPDATE ON public.risk_assessments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: token_erc1155_properties update_token_erc1155_properties_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_token_erc1155_properties_timestamp BEFORE UPDATE ON public.token_erc1155_properties FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();


--
-- Name: token_erc1400_properties update_token_erc1400_properties_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_token_erc1400_properties_timestamp BEFORE UPDATE ON public.token_erc1400_properties FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();


--
-- Name: token_erc20_properties update_token_erc20_properties_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_token_erc20_properties_timestamp BEFORE UPDATE ON public.token_erc20_properties FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();


--
-- Name: token_erc3525_properties update_token_erc3525_properties_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_token_erc3525_properties_timestamp BEFORE UPDATE ON public.token_erc3525_properties FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();


--
-- Name: token_erc4626_properties update_token_erc4626_properties_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_token_erc4626_properties_timestamp BEFORE UPDATE ON public.token_erc4626_properties FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();


--
-- Name: token_erc721_properties update_token_erc721_properties_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_token_erc721_properties_timestamp BEFORE UPDATE ON public.token_erc721_properties FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();


--
-- Name: token_templates update_token_templates_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_token_templates_updated_at BEFORE UPDATE ON public.token_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: tokens update_tokens_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_tokens_updated_at BEFORE UPDATE ON public.tokens FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: transactions update_transactions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: wallet_transactions update_wallet_transactions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_wallet_transactions_updated_at BEFORE UPDATE ON public.wallet_transactions FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- Name: tokens validate_token_data_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER validate_token_data_trigger BEFORE INSERT OR UPDATE ON public.tokens FOR EACH ROW EXECUTE FUNCTION public.validate_token_data();


--
-- Name: multi_sig_wallets validate_wallet_address_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER validate_wallet_address_trigger BEFORE INSERT OR UPDATE ON public.multi_sig_wallets FOR EACH ROW EXECUTE FUNCTION public.validate_wallet_address();


--
-- Name: wallet_signatories wallet_signatories_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER wallet_signatories_updated_at BEFORE UPDATE ON public.wallet_signatories FOR EACH ROW EXECUTE FUNCTION public.update_wallet_signatories_updated_at();


--
-- Name: whitelist_entries whitelist_entries_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER whitelist_entries_updated_at BEFORE UPDATE ON public.whitelist_entries FOR EACH ROW EXECUTE FUNCTION public.update_whitelist_entries_updated_at();


--
-- Name: approval_config_approvers approval_config_approvers_approval_config_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_config_approvers
    ADD CONSTRAINT approval_config_approvers_approval_config_id_fkey FOREIGN KEY (approval_config_id) REFERENCES public.approval_configs(id) ON DELETE CASCADE;


--
-- Name: approval_config_approvers approval_config_approvers_approver_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_config_approvers
    ADD CONSTRAINT approval_config_approvers_approver_role_id_fkey FOREIGN KEY (approver_role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: approval_config_approvers approval_config_approvers_approver_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_config_approvers
    ADD CONSTRAINT approval_config_approvers_approver_user_id_fkey FOREIGN KEY (approver_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: approval_config_approvers approval_config_approvers_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_config_approvers
    ADD CONSTRAINT approval_config_approvers_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: approval_config_history approval_config_history_approval_config_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_config_history
    ADD CONSTRAINT approval_config_history_approval_config_id_fkey FOREIGN KEY (approval_config_id) REFERENCES public.approval_configs(id) ON DELETE CASCADE;


--
-- Name: approval_config_history approval_config_history_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_config_history
    ADD CONSTRAINT approval_config_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.users(id);


--
-- Name: approval_configs approval_configs_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_configs
    ADD CONSTRAINT approval_configs_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: approval_configs approval_configs_last_modified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_configs
    ADD CONSTRAINT approval_configs_last_modified_by_fkey FOREIGN KEY (last_modified_by) REFERENCES public.users(id);


--
-- Name: approval_requests approval_requests_requested_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_requests
    ADD CONSTRAINT approval_requests_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: cap_table_investors cap_table_investors_cap_table_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cap_table_investors
    ADD CONSTRAINT cap_table_investors_cap_table_id_fkey FOREIGN KEY (cap_table_id) REFERENCES public.cap_tables(id) ON DELETE CASCADE;


--
-- Name: cap_table_investors cap_table_investors_investor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cap_table_investors
    ADD CONSTRAINT cap_table_investors_investor_id_fkey FOREIGN KEY (investor_id) REFERENCES public.investors(investor_id) ON DELETE CASCADE;


--
-- Name: cap_tables cap_tables_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cap_tables
    ADD CONSTRAINT cap_tables_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: compliance_checks compliance_checks_investor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.compliance_checks
    ADD CONSTRAINT compliance_checks_investor_id_fkey FOREIGN KEY (investor_id) REFERENCES public.investors(investor_id) ON DELETE CASCADE;


--
-- Name: compliance_checks compliance_checks_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.compliance_checks
    ADD CONSTRAINT compliance_checks_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: compliance_reports compliance_reports_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.compliance_reports
    ADD CONSTRAINT compliance_reports_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: compliance_reports compliance_reports_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.compliance_reports
    ADD CONSTRAINT compliance_reports_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: credential_usage_logs credential_usage_logs_credential_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credential_usage_logs
    ADD CONSTRAINT credential_usage_logs_credential_id_fkey FOREIGN KEY (credential_id) REFERENCES public.project_credentials(id);


--
-- Name: credential_usage_logs credential_usage_logs_performed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credential_usage_logs
    ADD CONSTRAINT credential_usage_logs_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES auth.users(id);


--
-- Name: dfns_broadcast_transactions dfns_broadcast_transactions_wallet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_broadcast_transactions
    ADD CONSTRAINT dfns_broadcast_transactions_wallet_id_fkey FOREIGN KEY (wallet_id) REFERENCES public.dfns_wallets(wallet_id) ON DELETE CASCADE;


--
-- Name: dfns_credentials dfns_credentials_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_credentials
    ADD CONSTRAINT dfns_credentials_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.dfns_users(id) ON DELETE CASCADE;


--
-- Name: dfns_exchange_accounts dfns_exchange_accounts_exchange_integration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_exchange_accounts
    ADD CONSTRAINT dfns_exchange_accounts_exchange_integration_id_fkey FOREIGN KEY (exchange_integration_id) REFERENCES public.dfns_exchange_integrations(integration_id) ON DELETE CASCADE;


--
-- Name: dfns_exchange_balances dfns_exchange_balances_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_exchange_balances
    ADD CONSTRAINT dfns_exchange_balances_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.dfns_exchange_accounts(account_id) ON DELETE CASCADE;


--
-- Name: dfns_fiat_activity_logs dfns_fiat_activity_logs_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_fiat_activity_logs
    ADD CONSTRAINT dfns_fiat_activity_logs_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.dfns_fiat_transactions(id) ON DELETE CASCADE;


--
-- Name: dfns_fiat_transactions dfns_fiat_transactions_wallet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_fiat_transactions
    ADD CONSTRAINT dfns_fiat_transactions_wallet_id_fkey FOREIGN KEY (wallet_id) REFERENCES public.dfns_wallets(id);


--
-- Name: dfns_permission_assignments dfns_permission_assignments_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_permission_assignments
    ADD CONSTRAINT dfns_permission_assignments_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.dfns_permissions(permission_id) ON DELETE CASCADE;


--
-- Name: dfns_personal_access_tokens dfns_personal_access_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_personal_access_tokens
    ADD CONSTRAINT dfns_personal_access_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.dfns_users(id) ON DELETE CASCADE;


--
-- Name: dfns_policy_approvals dfns_policy_approvals_policy_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_policy_approvals
    ADD CONSTRAINT dfns_policy_approvals_policy_id_fkey FOREIGN KEY (policy_id) REFERENCES public.dfns_policies(policy_id) ON DELETE CASCADE;


--
-- Name: dfns_signatures dfns_signatures_key_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_signatures
    ADD CONSTRAINT dfns_signatures_key_id_fkey FOREIGN KEY (key_id) REFERENCES public.dfns_signing_keys(key_id) ON DELETE CASCADE;


--
-- Name: dfns_sponsored_fees dfns_sponsored_fees_fee_sponsor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_sponsored_fees
    ADD CONSTRAINT dfns_sponsored_fees_fee_sponsor_id_fkey FOREIGN KEY (fee_sponsor_id) REFERENCES public.dfns_fee_sponsors(sponsor_id) ON DELETE CASCADE;


--
-- Name: dfns_sponsored_fees dfns_sponsored_fees_wallet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_sponsored_fees
    ADD CONSTRAINT dfns_sponsored_fees_wallet_id_fkey FOREIGN KEY (wallet_id) REFERENCES public.dfns_wallets(wallet_id) ON DELETE CASCADE;


--
-- Name: dfns_staking_integrations dfns_staking_integrations_wallet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_staking_integrations
    ADD CONSTRAINT dfns_staking_integrations_wallet_id_fkey FOREIGN KEY (wallet_id) REFERENCES public.dfns_wallets(wallet_id) ON DELETE CASCADE;


--
-- Name: dfns_transaction_history dfns_transaction_history_wallet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_transaction_history
    ADD CONSTRAINT dfns_transaction_history_wallet_id_fkey FOREIGN KEY (wallet_id) REFERENCES public.dfns_wallets(wallet_id) ON DELETE CASCADE;


--
-- Name: dfns_transfers dfns_transfers_wallet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_transfers
    ADD CONSTRAINT dfns_transfers_wallet_id_fkey FOREIGN KEY (wallet_id) REFERENCES public.dfns_wallets(wallet_id) ON DELETE CASCADE;


--
-- Name: dfns_wallet_balances dfns_wallet_balances_wallet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_wallet_balances
    ADD CONSTRAINT dfns_wallet_balances_wallet_id_fkey FOREIGN KEY (wallet_id) REFERENCES public.dfns_wallets(wallet_id) ON DELETE CASCADE;


--
-- Name: dfns_wallet_nfts dfns_wallet_nfts_wallet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_wallet_nfts
    ADD CONSTRAINT dfns_wallet_nfts_wallet_id_fkey FOREIGN KEY (wallet_id) REFERENCES public.dfns_wallets(wallet_id) ON DELETE CASCADE;


--
-- Name: dfns_wallets dfns_wallets_signing_key_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_wallets
    ADD CONSTRAINT dfns_wallets_signing_key_id_fkey FOREIGN KEY (signing_key_id) REFERENCES public.dfns_signing_keys(key_id) ON DELETE RESTRICT;


--
-- Name: dfns_webhook_deliveries dfns_webhook_deliveries_webhook_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dfns_webhook_deliveries
    ADD CONSTRAINT dfns_webhook_deliveries_webhook_id_fkey FOREIGN KEY (webhook_id) REFERENCES public.dfns_webhooks(webhook_id) ON DELETE CASCADE;


--
-- Name: distribution_redemptions distribution_redemptions_distribution_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.distribution_redemptions
    ADD CONSTRAINT distribution_redemptions_distribution_fkey FOREIGN KEY (distribution_id) REFERENCES public.distributions(id) ON DELETE CASCADE;


--
-- Name: distribution_redemptions distribution_redemptions_redemption_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.distribution_redemptions
    ADD CONSTRAINT distribution_redemptions_redemption_fkey FOREIGN KEY (redemption_request_id) REFERENCES public.redemption_requests(id) ON DELETE CASCADE;


--
-- Name: distributions distributions_investor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.distributions
    ADD CONSTRAINT distributions_investor_fkey FOREIGN KEY (investor_id) REFERENCES public.investors(investor_id) ON DELETE CASCADE;


--
-- Name: distributions distributions_project_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.distributions
    ADD CONSTRAINT distributions_project_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;


--
-- Name: distributions distributions_subscription_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.distributions
    ADD CONSTRAINT distributions_subscription_fkey FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id) ON DELETE CASCADE;


--
-- Name: distributions distributions_wallet_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.distributions
    ADD CONSTRAINT distributions_wallet_fkey FOREIGN KEY (wallet_id) REFERENCES public.multi_sig_wallets(id) ON DELETE SET NULL;


--
-- Name: document_approvals document_approvals_approver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_approvals
    ADD CONSTRAINT document_approvals_approver_id_fkey FOREIGN KEY (approver_id) REFERENCES public.users(id);


--
-- Name: document_approvals document_approvals_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_approvals
    ADD CONSTRAINT document_approvals_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- Name: document_versions document_versions_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_versions
    ADD CONSTRAINT document_versions_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- Name: document_versions document_versions_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_versions
    ADD CONSTRAINT document_versions_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: document_workflows document_workflows_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_workflows
    ADD CONSTRAINT document_workflows_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: document_workflows document_workflows_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_workflows
    ADD CONSTRAINT document_workflows_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.issuer_documents(id) ON DELETE CASCADE;


--
-- Name: document_workflows document_workflows_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_workflows
    ADD CONSTRAINT document_workflows_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: documents documents_workflow_stage_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_workflow_stage_id_fkey FOREIGN KEY (workflow_stage_id) REFERENCES public.workflow_stages(id);


--
-- Name: fiat_quotes fiat_quotes_converted_to_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fiat_quotes
    ADD CONSTRAINT fiat_quotes_converted_to_transaction_id_fkey FOREIGN KEY (converted_to_transaction_id) REFERENCES public.fiat_transactions(id);


--
-- Name: token_deployment_history fk_project_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_deployment_history
    ADD CONSTRAINT fk_project_id FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: redemption_approvers fk_redemption_approvers_redemption_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.redemption_approvers
    ADD CONSTRAINT fk_redemption_approvers_redemption_id FOREIGN KEY (redemption_id) REFERENCES public.redemption_requests(id) ON DELETE CASCADE;


--
-- Name: deployment_rate_limits fk_token; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deployment_rate_limits
    ADD CONSTRAINT fk_token FOREIGN KEY (token_id) REFERENCES public.tokens(id) ON DELETE CASCADE;


--
-- Name: token_events fk_token; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_events
    ADD CONSTRAINT fk_token FOREIGN KEY (token_id) REFERENCES public.tokens(id) ON DELETE CASCADE;


--
-- Name: token_deployment_history fk_token_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_deployment_history
    ADD CONSTRAINT fk_token_id FOREIGN KEY (token_id) REFERENCES public.tokens(id) ON DELETE CASCADE;


--
-- Name: token_whitelists fk_token_whitelists_token_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_whitelists
    ADD CONSTRAINT fk_token_whitelists_token_id FOREIGN KEY (token_id) REFERENCES public.tokens(id) ON DELETE CASCADE;


--
-- Name: fund_nav_data fund_nav_data_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fund_nav_data
    ADD CONSTRAINT fund_nav_data_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: fund_nav_data fund_nav_data_validated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fund_nav_data
    ADD CONSTRAINT fund_nav_data_validated_by_fkey FOREIGN KEY (validated_by) REFERENCES auth.users(id);


--
-- Name: guardian_operations guardian_operations_related_test_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guardian_operations
    ADD CONSTRAINT guardian_operations_related_test_id_fkey FOREIGN KEY (related_test_id) REFERENCES public.guardian_api_tests(id);


--
-- Name: guardian_wallets guardian_wallets_creation_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guardian_wallets
    ADD CONSTRAINT guardian_wallets_creation_request_id_fkey FOREIGN KEY (creation_request_id) REFERENCES public.guardian_api_tests(id);


--
-- Name: guardian_wallets guardian_wallets_operation_check_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guardian_wallets
    ADD CONSTRAINT guardian_wallets_operation_check_request_id_fkey FOREIGN KEY (operation_check_request_id) REFERENCES public.guardian_api_tests(id);


--
-- Name: guardian_wallets guardian_wallets_wallet_details_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guardian_wallets
    ADD CONSTRAINT guardian_wallets_wallet_details_request_id_fkey FOREIGN KEY (wallet_details_request_id) REFERENCES public.guardian_api_tests(id);


--
-- Name: investor_approvals investor_approvals_investor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.investor_approvals
    ADD CONSTRAINT investor_approvals_investor_id_fkey FOREIGN KEY (investor_id) REFERENCES public.investors(investor_id);


--
-- Name: investor_approvals investor_approvals_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.investor_approvals
    ADD CONSTRAINT investor_approvals_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES auth.users(id);


--
-- Name: investor_group_members investor_group_members_group_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.investor_group_members
    ADD CONSTRAINT investor_group_members_group_fkey FOREIGN KEY (group_id) REFERENCES public.investor_groups(id) ON DELETE CASCADE;


--
-- Name: investor_group_members investor_group_members_investor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.investor_group_members
    ADD CONSTRAINT investor_group_members_investor_fkey FOREIGN KEY (investor_id) REFERENCES public.investors(investor_id) ON DELETE CASCADE;


--
-- Name: investor_groups_investors investor_groups_investors_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.investor_groups_investors
    ADD CONSTRAINT investor_groups_investors_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.investor_groups(id) ON DELETE CASCADE;


--
-- Name: investor_groups_investors investor_groups_investors_investor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.investor_groups_investors
    ADD CONSTRAINT investor_groups_investors_investor_id_fkey FOREIGN KEY (investor_id) REFERENCES public.investors(investor_id) ON DELETE CASCADE;


--
-- Name: investor_groups investor_groups_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.investor_groups
    ADD CONSTRAINT investor_groups_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: invoice invoice_payer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT invoice_payer_id_fkey FOREIGN KEY (payer_id) REFERENCES public.payer(payer_id);


--
-- Name: invoice invoice_pool_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT invoice_pool_id_fkey FOREIGN KEY (pool_id) REFERENCES public.pool(pool_id);


--
-- Name: invoice invoice_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT invoice_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.provider(provider_id);


--
-- Name: issuer_access_roles issuer_access_roles_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issuer_access_roles
    ADD CONSTRAINT issuer_access_roles_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: issuer_access_roles issuer_access_roles_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issuer_access_roles
    ADD CONSTRAINT issuer_access_roles_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: issuer_access_roles issuer_access_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issuer_access_roles
    ADD CONSTRAINT issuer_access_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: issuer_detail_documents issuer_detail_documents_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issuer_detail_documents
    ADD CONSTRAINT issuer_detail_documents_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: issuer_documents issuer_documents_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issuer_documents
    ADD CONSTRAINT issuer_documents_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: issuer_documents issuer_documents_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issuer_documents
    ADD CONSTRAINT issuer_documents_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id);


--
-- Name: issuer_documents issuer_documents_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issuer_documents
    ADD CONSTRAINT issuer_documents_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: kyc_screening_logs kyc_screening_logs_investor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kyc_screening_logs
    ADD CONSTRAINT kyc_screening_logs_investor_id_fkey FOREIGN KEY (investor_id) REFERENCES public.investors(investor_id) ON DELETE CASCADE;


--
-- Name: multi_sig_confirmations multi_sig_confirmations_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.multi_sig_confirmations
    ADD CONSTRAINT multi_sig_confirmations_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.multi_sig_transactions(id) ON DELETE CASCADE;


--
-- Name: multi_sig_transactions multi_sig_transactions_wallet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.multi_sig_transactions
    ADD CONSTRAINT multi_sig_transactions_wallet_id_fkey FOREIGN KEY (wallet_id) REFERENCES public.multi_sig_wallets(id) ON DELETE CASCADE;


--
-- Name: multi_sig_wallets multi_sig_wallets_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.multi_sig_wallets
    ADD CONSTRAINT multi_sig_wallets_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: nav_oracle_configs nav_oracle_configs_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nav_oracle_configs
    ADD CONSTRAINT nav_oracle_configs_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: onchain_claims onchain_claims_identity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onchain_claims
    ADD CONSTRAINT onchain_claims_identity_id_fkey FOREIGN KEY (identity_id) REFERENCES public.onchain_identities(id) ON DELETE CASCADE;


--
-- Name: onchain_claims onchain_claims_issuer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onchain_claims
    ADD CONSTRAINT onchain_claims_issuer_id_fkey FOREIGN KEY (issuer_id) REFERENCES public.onchain_issuers(id) ON DELETE CASCADE;


--
-- Name: onchain_identities onchain_identities_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onchain_identities
    ADD CONSTRAINT onchain_identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: onchain_verification_history onchain_verification_history_identity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onchain_verification_history
    ADD CONSTRAINT onchain_verification_history_identity_id_fkey FOREIGN KEY (identity_id) REFERENCES public.onchain_identities(id) ON DELETE CASCADE;


--
-- Name: policy_rule_approvers policy_rule_approvers_policy_rule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.policy_rule_approvers
    ADD CONSTRAINT policy_rule_approvers_policy_rule_id_fkey FOREIGN KEY (policy_rule_id) REFERENCES public.rules(rule_id) ON DELETE CASCADE;


--
-- Name: policy_template_approvers policy_template_approvers_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.policy_template_approvers
    ADD CONSTRAINT policy_template_approvers_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.policy_templates(template_id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;


--
-- Name: CONSTRAINT policy_template_approvers_template_id_fkey ON policy_template_approvers; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT policy_template_approvers_template_id_fkey ON public.policy_template_approvers IS 'Foreign key to policy_templates with deferred checking to allow templates and approvers to be created in the same transaction. CASCADE DELETE ensures automatic cleanup.';


--
-- Name: policy_template_approvers policy_template_approvers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.policy_template_approvers
    ADD CONSTRAINT policy_template_approvers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: project_credentials project_credentials_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_credentials
    ADD CONSTRAINT project_credentials_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: ramp_transaction_events ramp_transaction_events_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ramp_transaction_events
    ADD CONSTRAINT ramp_transaction_events_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.fiat_transactions(id) ON DELETE CASCADE;


--
-- Name: redemption_approver_assignments redemption_approver_assignments_approval_config_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.redemption_approver_assignments
    ADD CONSTRAINT redemption_approver_assignments_approval_config_id_fkey FOREIGN KEY (approval_config_id) REFERENCES public.approval_configs(id);


--
-- Name: redemption_approver_assignments redemption_approver_assignments_approver_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.redemption_approver_assignments
    ADD CONSTRAINT redemption_approver_assignments_approver_user_id_fkey FOREIGN KEY (approver_user_id) REFERENCES public.users(id);


--
-- Name: redemption_approvers redemption_approvers_redemption_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.redemption_approvers
    ADD CONSTRAINT redemption_approvers_redemption_id_fkey FOREIGN KEY (redemption_id) REFERENCES public.redemption_requests(id) ON DELETE CASCADE;


--
-- Name: redemption_rules redemption_rules_rule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.redemption_rules
    ADD CONSTRAINT redemption_rules_rule_id_fkey FOREIGN KEY (rule_id) REFERENCES public.rules(rule_id);


--
-- Name: redemption_settlements redemption_settlements_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.redemption_settlements
    ADD CONSTRAINT redemption_settlements_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: redemption_settlements redemption_settlements_redemption_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.redemption_settlements
    ADD CONSTRAINT redemption_settlements_redemption_request_id_fkey FOREIGN KEY (redemption_request_id) REFERENCES public.redemption_requests(id) ON DELETE CASCADE;


--
-- Name: redemption_window_configs redemption_window_configs_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.redemption_window_configs
    ADD CONSTRAINT redemption_window_configs_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: redemption_windows redemption_windows_config_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.redemption_windows
    ADD CONSTRAINT redemption_windows_config_id_fkey FOREIGN KEY (config_id) REFERENCES public.redemption_window_configs(id) ON DELETE CASCADE;


--
-- Name: redemption_windows redemption_windows_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.redemption_windows
    ADD CONSTRAINT redemption_windows_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: redemption_windows redemption_windows_processed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.redemption_windows
    ADD CONSTRAINT redemption_windows_processed_by_fkey FOREIGN KEY (processed_by) REFERENCES auth.users(id);


--
-- Name: regulatory_equivalence_mapping regulatory_equivalence_mapping_equivalent_jurisdiction_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regulatory_equivalence_mapping
    ADD CONSTRAINT regulatory_equivalence_mapping_equivalent_jurisdiction_fkey FOREIGN KEY (equivalent_jurisdiction) REFERENCES public.geographic_jurisdictions(country_code);


--
-- Name: regulatory_equivalence_mapping regulatory_equivalence_mapping_home_jurisdiction_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regulatory_equivalence_mapping
    ADD CONSTRAINT regulatory_equivalence_mapping_home_jurisdiction_fkey FOREIGN KEY (home_jurisdiction) REFERENCES public.geographic_jurisdictions(country_code);


--
-- Name: role_permissions role_permissions_permission_name_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_name_fkey FOREIGN KEY (permission_name) REFERENCES public.permissions(name) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: security_events security_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_events
    ADD CONSTRAINT security_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: signatures signatures_proposal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signatures
    ADD CONSTRAINT signatures_proposal_id_fkey FOREIGN KEY (proposal_id) REFERENCES public.transaction_proposals(id) ON DELETE CASCADE;


--
-- Name: stage_requirements stage_requirements_stage_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stage_requirements
    ADD CONSTRAINT stage_requirements_stage_id_fkey FOREIGN KEY (stage_id) REFERENCES public.workflow_stages(id) ON DELETE CASCADE;


--
-- Name: subscriptions subscriptions_investor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_investor_id_fkey FOREIGN KEY (investor_id) REFERENCES public.investors(investor_id) ON DELETE CASCADE;


--
-- Name: subscriptions subscriptions_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: token_allocations token_allocations_investor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_allocations
    ADD CONSTRAINT token_allocations_investor_fkey FOREIGN KEY (investor_id) REFERENCES public.investors(investor_id) ON DELETE CASCADE;


--
-- Name: token_allocations token_allocations_project_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_allocations
    ADD CONSTRAINT token_allocations_project_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;


--
-- Name: token_allocations token_allocations_subscription_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_allocations
    ADD CONSTRAINT token_allocations_subscription_fkey FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id) ON DELETE CASCADE;


--
-- Name: token_allocations token_allocations_token_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_allocations
    ADD CONSTRAINT token_allocations_token_fkey FOREIGN KEY (token_id) REFERENCES public.tokens(id);


--
-- Name: token_deployments token_deployments_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_deployments
    ADD CONSTRAINT token_deployments_token_id_fkey FOREIGN KEY (token_id) REFERENCES public.tokens(id) ON DELETE CASCADE;


--
-- Name: token_erc1155_balances token_erc1155_balances_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc1155_balances
    ADD CONSTRAINT token_erc1155_balances_token_id_fkey FOREIGN KEY (token_id) REFERENCES public.tokens(id) ON DELETE CASCADE;


--
-- Name: token_erc1155_crafting_recipes token_erc1155_crafting_recipes_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc1155_crafting_recipes
    ADD CONSTRAINT token_erc1155_crafting_recipes_token_id_fkey FOREIGN KEY (token_id) REFERENCES public.tokens(id) ON DELETE CASCADE;


--
-- Name: token_erc1155_discount_tiers token_erc1155_discount_tiers_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc1155_discount_tiers
    ADD CONSTRAINT token_erc1155_discount_tiers_token_id_fkey FOREIGN KEY (token_id) REFERENCES public.tokens(id) ON DELETE CASCADE;


--
-- Name: token_erc1155_properties token_erc1155_properties_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc1155_properties
    ADD CONSTRAINT token_erc1155_properties_token_id_fkey FOREIGN KEY (token_id) REFERENCES public.tokens(id) ON DELETE CASCADE;


--
-- Name: token_erc1155_type_configs token_erc1155_type_configs_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc1155_type_configs
    ADD CONSTRAINT token_erc1155_type_configs_token_id_fkey FOREIGN KEY (token_id) REFERENCES public.tokens(id) ON DELETE CASCADE;


--
-- Name: token_erc1155_types token_erc1155_types_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc1155_types
    ADD CONSTRAINT token_erc1155_types_token_id_fkey FOREIGN KEY (token_id) REFERENCES public.tokens(id) ON DELETE CASCADE;


--
-- Name: token_erc1155_uri_mappings token_erc1155_uri_mappings_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc1155_uri_mappings
    ADD CONSTRAINT token_erc1155_uri_mappings_token_id_fkey FOREIGN KEY (token_id) REFERENCES public.tokens(id) ON DELETE CASCADE;


--
-- Name: token_erc1400_controllers token_erc1400_controllers_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc1400_controllers
    ADD CONSTRAINT token_erc1400_controllers_token_id_fkey FOREIGN KEY (token_id) REFERENCES public.tokens(id) ON DELETE CASCADE;


--
-- Name: token_erc1400_corporate_actions token_erc1400_corporate_actions_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc1400_corporate_actions
    ADD CONSTRAINT token_erc1400_corporate_actions_token_id_fkey FOREIGN KEY (token_id) REFERENCES public.tokens(id) ON DELETE CASCADE;


--
-- Name: token_erc1400_custody_providers token_erc1400_custody_providers_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc1400_custody_providers
    ADD CONSTRAINT token_erc1400_custody_providers_token_id_fkey FOREIGN KEY (token_id) REFERENCES public.tokens(id) ON DELETE CASCADE;


--
-- Name: token_erc1400_documents token_erc1400_documents_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc1400_documents
    ADD CONSTRAINT token_erc1400_documents_token_id_fkey FOREIGN KEY (token_id) REFERENCES public.tokens(id);


--
-- Name: token_erc1400_partition_balances token_erc1400_partition_balances_partition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc1400_partition_balances
    ADD CONSTRAINT token_erc1400_partition_balances_partition_id_fkey FOREIGN KEY (partition_id) REFERENCES public.token_erc1400_partitions(id) ON DELETE CASCADE;


--
-- Name: token_erc1400_partition_operators token_erc1400_partition_operators_partition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc1400_partition_operators
    ADD CONSTRAINT token_erc1400_partition_operators_partition_id_fkey FOREIGN KEY (partition_id) REFERENCES public.token_erc1400_partitions(id) ON DELETE CASCADE;


--
-- Name: token_erc1400_partition_transfers token_erc1400_partition_transfers_partition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc1400_partition_transfers
    ADD CONSTRAINT token_erc1400_partition_transfers_partition_id_fkey FOREIGN KEY (partition_id) REFERENCES public.token_erc1400_partitions(id) ON DELETE CASCADE;


--
-- Name: token_erc1400_partitions token_erc1400_partitions_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc1400_partitions
    ADD CONSTRAINT token_erc1400_partitions_token_id_fkey FOREIGN KEY (token_id) REFERENCES public.tokens(id) ON DELETE CASCADE;


--
-- Name: token_erc1400_properties token_erc1400_properties_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc1400_properties
    ADD CONSTRAINT token_erc1400_properties_token_id_fkey FOREIGN KEY (token_id) REFERENCES public.tokens(id) ON DELETE CASCADE;


--
-- Name: token_erc1400_regulatory_filings token_erc1400_regulatory_filings_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc1400_regulatory_filings
    ADD CONSTRAINT token_erc1400_regulatory_filings_token_id_fkey FOREIGN KEY (token_id) REFERENCES public.tokens(id) ON DELETE CASCADE;


--
-- Name: token_erc20_properties token_erc20_properties_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc20_properties
    ADD CONSTRAINT token_erc20_properties_token_id_fkey FOREIGN KEY (token_id) REFERENCES public.tokens(id) ON DELETE CASCADE;


--
-- Name: token_erc3525_allocations token_erc3525_allocations_linked_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc3525_allocations
    ADD CONSTRAINT token_erc3525_allocations_linked_token_id_fkey FOREIGN KEY (linked_token_id) REFERENCES public.tokens(id);


--
-- Name: token_erc3525_allocations token_erc3525_allocations_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc3525_allocations
    ADD CONSTRAINT token_erc3525_allocations_token_id_fkey FOREIGN KEY (token_id) REFERENCES public.tokens(id) ON DELETE CASCADE;


--
-- Name: token_erc3525_payment_schedules token_erc3525_payment_schedules_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc3525_payment_schedules
    ADD CONSTRAINT token_erc3525_payment_schedules_token_id_fkey FOREIGN KEY (token_id) REFERENCES public.tokens(id) ON DELETE CASCADE;


--
-- Name: token_erc3525_properties token_erc3525_properties_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc3525_properties
    ADD CONSTRAINT token_erc3525_properties_token_id_fkey FOREIGN KEY (token_id) REFERENCES public.tokens(id) ON DELETE CASCADE;


--
-- Name: token_erc3525_slot_configs token_erc3525_slot_configs_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc3525_slot_configs
    ADD CONSTRAINT token_erc3525_slot_configs_token_id_fkey FOREIGN KEY (token_id) REFERENCES public.tokens(id) ON DELETE CASCADE;


--
-- Name: token_erc3525_slots token_erc3525_slots_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc3525_slots
    ADD CONSTRAINT token_erc3525_slots_token_id_fkey FOREIGN KEY (token_id) REFERENCES public.tokens(id) ON DELETE CASCADE;


--
-- Name: token_erc3525_value_adjustments token_erc3525_value_adjustments_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc3525_value_adjustments
    ADD CONSTRAINT token_erc3525_value_adjustments_token_id_fkey FOREIGN KEY (token_id) REFERENCES public.tokens(id) ON DELETE CASCADE;


--
-- Name: token_erc4626_asset_allocations token_erc4626_asset_allocations_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc4626_asset_allocations
    ADD CONSTRAINT token_erc4626_asset_allocations_token_id_fkey FOREIGN KEY (token_id) REFERENCES public.tokens(id) ON DELETE CASCADE;


--
-- Name: token_erc4626_fee_tiers token_erc4626_fee_tiers_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc4626_fee_tiers
    ADD CONSTRAINT token_erc4626_fee_tiers_token_id_fkey FOREIGN KEY (token_id) REFERENCES public.tokens(id) ON DELETE CASCADE;


--
-- Name: token_erc4626_performance_metrics token_erc4626_performance_metrics_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc4626_performance_metrics
    ADD CONSTRAINT token_erc4626_performance_metrics_token_id_fkey FOREIGN KEY (token_id) REFERENCES public.tokens(id) ON DELETE CASCADE;


--
-- Name: token_erc4626_properties token_erc4626_properties_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc4626_properties
    ADD CONSTRAINT token_erc4626_properties_token_id_fkey FOREIGN KEY (token_id) REFERENCES public.tokens(id) ON DELETE CASCADE;


--
-- Name: token_erc4626_strategy_params token_erc4626_strategy_params_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc4626_strategy_params
    ADD CONSTRAINT token_erc4626_strategy_params_token_id_fkey FOREIGN KEY (token_id) REFERENCES public.tokens(id) ON DELETE CASCADE;


--
-- Name: token_erc4626_vault_strategies token_erc4626_vault_strategies_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc4626_vault_strategies
    ADD CONSTRAINT token_erc4626_vault_strategies_token_id_fkey FOREIGN KEY (token_id) REFERENCES public.tokens(id) ON DELETE CASCADE;


--
-- Name: token_erc721_attributes token_erc721_attributes_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc721_attributes
    ADD CONSTRAINT token_erc721_attributes_token_id_fkey FOREIGN KEY (token_id) REFERENCES public.tokens(id) ON DELETE CASCADE;


--
-- Name: token_erc721_mint_phases token_erc721_mint_phases_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc721_mint_phases
    ADD CONSTRAINT token_erc721_mint_phases_token_id_fkey FOREIGN KEY (token_id) REFERENCES public.tokens(id) ON DELETE CASCADE;


--
-- Name: token_erc721_properties token_erc721_properties_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc721_properties
    ADD CONSTRAINT token_erc721_properties_token_id_fkey FOREIGN KEY (token_id) REFERENCES public.tokens(id) ON DELETE CASCADE;


--
-- Name: token_erc721_trait_definitions token_erc721_trait_definitions_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_erc721_trait_definitions
    ADD CONSTRAINT token_erc721_trait_definitions_token_id_fkey FOREIGN KEY (token_id) REFERENCES public.tokens(id) ON DELETE CASCADE;


--
-- Name: token_geographic_restrictions token_geographic_restrictions_country_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_geographic_restrictions
    ADD CONSTRAINT token_geographic_restrictions_country_code_fkey FOREIGN KEY (country_code) REFERENCES public.geographic_jurisdictions(country_code);


--
-- Name: token_geographic_restrictions token_geographic_restrictions_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_geographic_restrictions
    ADD CONSTRAINT token_geographic_restrictions_token_id_fkey FOREIGN KEY (token_id) REFERENCES public.tokens(id) ON DELETE CASCADE;


--
-- Name: token_operations token_operations_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_operations
    ADD CONSTRAINT token_operations_token_id_fkey FOREIGN KEY (token_id) REFERENCES public.tokens(id) ON DELETE CASCADE;


--
-- Name: token_sanctions_rules token_sanctions_rules_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_sanctions_rules
    ADD CONSTRAINT token_sanctions_rules_token_id_fkey FOREIGN KEY (token_id) REFERENCES public.tokens(id) ON DELETE CASCADE;


--
-- Name: token_templates token_templates_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_templates
    ADD CONSTRAINT token_templates_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: token_versions token_versions_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_versions
    ADD CONSTRAINT token_versions_token_id_fkey FOREIGN KEY (token_id) REFERENCES public.tokens(id) ON DELETE CASCADE;


--
-- Name: token_whitelists token_whitelists_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_whitelists
    ADD CONSTRAINT token_whitelists_token_id_fkey FOREIGN KEY (token_id) REFERENCES public.tokens(id) ON DELETE CASCADE;


--
-- Name: tokens tokens_deployed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tokens
    ADD CONSTRAINT tokens_deployed_by_fkey FOREIGN KEY (deployed_by) REFERENCES auth.users(id);


--
-- Name: tokens tokens_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tokens
    ADD CONSTRAINT tokens_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: transaction_proposals transaction_proposals_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaction_proposals
    ADD CONSTRAINT transaction_proposals_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: transaction_proposals transaction_proposals_wallet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaction_proposals
    ADD CONSTRAINT transaction_proposals_wallet_id_fkey FOREIGN KEY (wallet_id) REFERENCES public.multi_sig_wallets(id) ON DELETE CASCADE;


--
-- Name: transaction_signatures transaction_signatures_proposal_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaction_signatures
    ADD CONSTRAINT transaction_signatures_proposal_fkey FOREIGN KEY (proposal_id) REFERENCES public.transaction_proposals(id) ON DELETE CASCADE;


--
-- Name: transaction_signatures transaction_signatures_signer_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaction_signatures
    ADD CONSTRAINT transaction_signatures_signer_fkey FOREIGN KEY (signer) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_mfa_settings user_mfa_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_mfa_settings
    ADD CONSTRAINT user_mfa_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: wallet_details wallet_details_wallet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_details
    ADD CONSTRAINT wallet_details_wallet_id_fkey FOREIGN KEY (wallet_id) REFERENCES public.multi_sig_wallets(id) ON DELETE CASCADE;


--
-- Name: whitelist_settings whitelist_settings_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whitelist_settings
    ADD CONSTRAINT whitelist_settings_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: whitelist_settings whitelist_settings_rule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whitelist_settings
    ADD CONSTRAINT whitelist_settings_rule_id_fkey FOREIGN KEY (rule_id) REFERENCES public.rules(rule_id);


--
-- Name: whitelist_signatories whitelist_signatories_whitelist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whitelist_signatories
    ADD CONSTRAINT whitelist_signatories_whitelist_id_fkey FOREIGN KEY (whitelist_id) REFERENCES public.whitelist_settings(id) ON DELETE CASCADE;


--
-- Name: onchain_claims Admin users can manage claims; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin users can manage claims" ON public.onchain_claims USING ((EXISTS ( SELECT 1
   FROM (public.user_roles ur
     JOIN public.roles r ON ((ur.role_id = r.id)))
  WHERE ((ur.user_id = auth.uid()) AND (r.name = 'Super Admin'::text)))));


--
-- Name: onchain_identities Admin users can manage identities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin users can manage identities" ON public.onchain_identities USING ((EXISTS ( SELECT 1
   FROM (public.user_roles ur
     JOIN public.roles r ON ((ur.role_id = r.id)))
  WHERE ((ur.user_id = auth.uid()) AND (r.name = 'Super Admin'::text)))));


--
-- Name: onchain_issuers Admin users can manage issuers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin users can manage issuers" ON public.onchain_issuers USING ((EXISTS ( SELECT 1
   FROM (public.user_roles ur
     JOIN public.roles r ON ((ur.role_id = r.id)))
  WHERE ((ur.user_id = auth.uid()) AND (r.name = 'Super Admin'::text)))));


--
-- Name: onchain_verification_history Admin users can manage verification history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin users can manage verification history" ON public.onchain_verification_history USING ((EXISTS ( SELECT 1
   FROM (public.user_roles ur
     JOIN public.roles r ON ((ur.role_id = r.id)))
  WHERE ((ur.user_id = auth.uid()) AND (r.name = 'Super Admin'::text)))));


--
-- Name: onchain_identities Admin users can view all identities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin users can view all identities" ON public.onchain_identities FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.user_roles ur
     JOIN public.roles r ON ((ur.role_id = r.id)))
  WHERE ((ur.user_id = auth.uid()) AND (r.name = 'Super Admin'::text)))));


--
-- Name: dfns_activity_logs Allow authenticated users to view DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users to view DFNS data" ON public.dfns_activity_logs FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: dfns_api_requests Allow authenticated users to view DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users to view DFNS data" ON public.dfns_api_requests FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: dfns_applications Allow authenticated users to view DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users to view DFNS data" ON public.dfns_applications FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: dfns_broadcast_transactions Allow authenticated users to view DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users to view DFNS data" ON public.dfns_broadcast_transactions FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: dfns_credentials Allow authenticated users to view DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users to view DFNS data" ON public.dfns_credentials FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: dfns_exchange_accounts Allow authenticated users to view DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users to view DFNS data" ON public.dfns_exchange_accounts FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: dfns_exchange_balances Allow authenticated users to view DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users to view DFNS data" ON public.dfns_exchange_balances FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: dfns_exchange_integrations Allow authenticated users to view DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users to view DFNS data" ON public.dfns_exchange_integrations FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: dfns_fee_sponsors Allow authenticated users to view DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users to view DFNS data" ON public.dfns_fee_sponsors FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: dfns_permission_assignments Allow authenticated users to view DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users to view DFNS data" ON public.dfns_permission_assignments FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: dfns_permissions Allow authenticated users to view DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users to view DFNS data" ON public.dfns_permissions FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: dfns_personal_access_tokens Allow authenticated users to view DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users to view DFNS data" ON public.dfns_personal_access_tokens FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: dfns_policies Allow authenticated users to view DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users to view DFNS data" ON public.dfns_policies FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: dfns_policy_approvals Allow authenticated users to view DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users to view DFNS data" ON public.dfns_policy_approvals FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: dfns_service_accounts Allow authenticated users to view DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users to view DFNS data" ON public.dfns_service_accounts FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: dfns_signatures Allow authenticated users to view DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users to view DFNS data" ON public.dfns_signatures FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: dfns_signing_keys Allow authenticated users to view DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users to view DFNS data" ON public.dfns_signing_keys FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: dfns_sponsored_fees Allow authenticated users to view DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users to view DFNS data" ON public.dfns_sponsored_fees FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: dfns_staking_integrations Allow authenticated users to view DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users to view DFNS data" ON public.dfns_staking_integrations FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: dfns_sync_status Allow authenticated users to view DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users to view DFNS data" ON public.dfns_sync_status FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: dfns_transaction_history Allow authenticated users to view DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users to view DFNS data" ON public.dfns_transaction_history FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: dfns_transfers Allow authenticated users to view DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users to view DFNS data" ON public.dfns_transfers FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: dfns_users Allow authenticated users to view DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users to view DFNS data" ON public.dfns_users FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: dfns_validators Allow authenticated users to view DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users to view DFNS data" ON public.dfns_validators FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: dfns_wallet_balances Allow authenticated users to view DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users to view DFNS data" ON public.dfns_wallet_balances FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: dfns_wallet_nfts Allow authenticated users to view DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users to view DFNS data" ON public.dfns_wallet_nfts FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: dfns_wallets Allow authenticated users to view DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users to view DFNS data" ON public.dfns_wallets FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: dfns_webhook_deliveries Allow authenticated users to view DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users to view DFNS data" ON public.dfns_webhook_deliveries FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: dfns_webhooks Allow authenticated users to view DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users to view DFNS data" ON public.dfns_webhooks FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: dfns_activity_logs Allow service role to manage DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow service role to manage DFNS data" ON public.dfns_activity_logs USING ((auth.role() = 'service_role'::text));


--
-- Name: dfns_api_requests Allow service role to manage DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow service role to manage DFNS data" ON public.dfns_api_requests USING ((auth.role() = 'service_role'::text));


--
-- Name: dfns_applications Allow service role to manage DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow service role to manage DFNS data" ON public.dfns_applications USING ((auth.role() = 'service_role'::text));


--
-- Name: dfns_broadcast_transactions Allow service role to manage DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow service role to manage DFNS data" ON public.dfns_broadcast_transactions USING ((auth.role() = 'service_role'::text));


--
-- Name: dfns_credentials Allow service role to manage DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow service role to manage DFNS data" ON public.dfns_credentials USING ((auth.role() = 'service_role'::text));


--
-- Name: dfns_exchange_accounts Allow service role to manage DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow service role to manage DFNS data" ON public.dfns_exchange_accounts USING ((auth.role() = 'service_role'::text));


--
-- Name: dfns_exchange_balances Allow service role to manage DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow service role to manage DFNS data" ON public.dfns_exchange_balances USING ((auth.role() = 'service_role'::text));


--
-- Name: dfns_exchange_integrations Allow service role to manage DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow service role to manage DFNS data" ON public.dfns_exchange_integrations USING ((auth.role() = 'service_role'::text));


--
-- Name: dfns_fee_sponsors Allow service role to manage DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow service role to manage DFNS data" ON public.dfns_fee_sponsors USING ((auth.role() = 'service_role'::text));


--
-- Name: dfns_permission_assignments Allow service role to manage DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow service role to manage DFNS data" ON public.dfns_permission_assignments USING ((auth.role() = 'service_role'::text));


--
-- Name: dfns_permissions Allow service role to manage DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow service role to manage DFNS data" ON public.dfns_permissions USING ((auth.role() = 'service_role'::text));


--
-- Name: dfns_personal_access_tokens Allow service role to manage DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow service role to manage DFNS data" ON public.dfns_personal_access_tokens USING ((auth.role() = 'service_role'::text));


--
-- Name: dfns_policies Allow service role to manage DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow service role to manage DFNS data" ON public.dfns_policies USING ((auth.role() = 'service_role'::text));


--
-- Name: dfns_policy_approvals Allow service role to manage DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow service role to manage DFNS data" ON public.dfns_policy_approvals USING ((auth.role() = 'service_role'::text));


--
-- Name: dfns_service_accounts Allow service role to manage DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow service role to manage DFNS data" ON public.dfns_service_accounts USING ((auth.role() = 'service_role'::text));


--
-- Name: dfns_signatures Allow service role to manage DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow service role to manage DFNS data" ON public.dfns_signatures USING ((auth.role() = 'service_role'::text));


--
-- Name: dfns_signing_keys Allow service role to manage DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow service role to manage DFNS data" ON public.dfns_signing_keys USING ((auth.role() = 'service_role'::text));


--
-- Name: dfns_sponsored_fees Allow service role to manage DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow service role to manage DFNS data" ON public.dfns_sponsored_fees USING ((auth.role() = 'service_role'::text));


--
-- Name: dfns_staking_integrations Allow service role to manage DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow service role to manage DFNS data" ON public.dfns_staking_integrations USING ((auth.role() = 'service_role'::text));


--
-- Name: dfns_sync_status Allow service role to manage DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow service role to manage DFNS data" ON public.dfns_sync_status USING ((auth.role() = 'service_role'::text));


--
-- Name: dfns_transaction_history Allow service role to manage DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow service role to manage DFNS data" ON public.dfns_transaction_history USING ((auth.role() = 'service_role'::text));


--
-- Name: dfns_transfers Allow service role to manage DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow service role to manage DFNS data" ON public.dfns_transfers USING ((auth.role() = 'service_role'::text));


--
-- Name: dfns_users Allow service role to manage DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow service role to manage DFNS data" ON public.dfns_users USING ((auth.role() = 'service_role'::text));


--
-- Name: dfns_validators Allow service role to manage DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow service role to manage DFNS data" ON public.dfns_validators USING ((auth.role() = 'service_role'::text));


--
-- Name: dfns_wallet_balances Allow service role to manage DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow service role to manage DFNS data" ON public.dfns_wallet_balances USING ((auth.role() = 'service_role'::text));


--
-- Name: dfns_wallet_nfts Allow service role to manage DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow service role to manage DFNS data" ON public.dfns_wallet_nfts USING ((auth.role() = 'service_role'::text));


--
-- Name: dfns_wallets Allow service role to manage DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow service role to manage DFNS data" ON public.dfns_wallets USING ((auth.role() = 'service_role'::text));


--
-- Name: dfns_webhook_deliveries Allow service role to manage DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow service role to manage DFNS data" ON public.dfns_webhook_deliveries USING ((auth.role() = 'service_role'::text));


--
-- Name: dfns_webhooks Allow service role to manage DFNS data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow service role to manage DFNS data" ON public.dfns_webhooks USING ((auth.role() = 'service_role'::text));


--
-- Name: dfns_fiat_quotes Anyone can view fiat quotes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view fiat quotes" ON public.dfns_fiat_quotes FOR SELECT USING (true);


--
-- Name: secure_keys Service role can access secure_keys; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can access secure_keys" ON public.secure_keys USING (((auth.jwt() ->> 'role'::text) = 'service_role'::text));


--
-- Name: dfns_fiat_activity_logs Service role can manage activity logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can manage activity logs" ON public.dfns_fiat_activity_logs USING ((auth.role() = 'service_role'::text));


--
-- Name: dfns_fiat_quotes Service role can manage fiat quotes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can manage fiat quotes" ON public.dfns_fiat_quotes USING ((auth.role() = 'service_role'::text));


--
-- Name: dfns_fiat_provider_configs Service role can manage provider configs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can manage provider configs" ON public.dfns_fiat_provider_configs USING ((auth.role() = 'service_role'::text));


--
-- Name: faucet_requests Users can create their own faucet requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own faucet requests" ON public.faucet_requests FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));


--
-- Name: deployment_rate_limits Users can insert their own deployment rate limits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own deployment rate limits" ON public.deployment_rate_limits FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: dfns_fiat_transactions Users can insert their own fiat transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own fiat transactions" ON public.dfns_fiat_transactions FOR INSERT WITH CHECK (((auth.uid())::text = (user_id)::text));


--
-- Name: deployment_rate_limits Users can update their own deployment rate limits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own deployment rate limits" ON public.deployment_rate_limits FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: faucet_requests Users can update their own faucet requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own faucet requests" ON public.faucet_requests FOR UPDATE USING (((auth.role() = 'authenticated'::text) AND (user_id = auth.uid())));


--
-- Name: dfns_fiat_transactions Users can update their own fiat transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own fiat transactions" ON public.dfns_fiat_transactions FOR UPDATE USING (((auth.uid())::text = (user_id)::text));


--
-- Name: onchain_issuers Users can view all issuers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view all issuers" ON public.onchain_issuers FOR SELECT USING (true);


--
-- Name: faucet_requests Users can view faucet requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view faucet requests" ON public.faucet_requests FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: onchain_claims Users can view their own claims; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own claims" ON public.onchain_claims FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.onchain_identities oi
  WHERE ((oi.id = onchain_claims.identity_id) AND (oi.user_id = auth.uid())))));


--
-- Name: deployment_rate_limits Users can view their own deployment rate limits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own deployment rate limits" ON public.deployment_rate_limits FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: dfns_fiat_transactions Users can view their own fiat transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own fiat transactions" ON public.dfns_fiat_transactions FOR SELECT USING (((auth.uid())::text = (user_id)::text));


--
-- Name: onchain_identities Users can view their own identities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own identities" ON public.onchain_identities FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: onchain_verification_history Users can view their own verification history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own verification history" ON public.onchain_verification_history FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.onchain_identities oi
  WHERE ((oi.id = onchain_verification_history.identity_id) AND (oi.user_id = auth.uid())))));


--
-- Name: dfns_fiat_activity_logs Users can view their transaction activity logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their transaction activity logs" ON public.dfns_fiat_activity_logs FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.dfns_fiat_transactions
  WHERE ((dfns_fiat_transactions.id = dfns_fiat_activity_logs.transaction_id) AND ((dfns_fiat_transactions.user_id)::text = (auth.uid())::text)))));


--
-- Name: deployment_rate_limits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.deployment_rate_limits ENABLE ROW LEVEL SECURITY;

--
-- Name: dfns_activity_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dfns_activity_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: dfns_api_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dfns_api_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: dfns_applications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dfns_applications ENABLE ROW LEVEL SECURITY;

--
-- Name: dfns_broadcast_transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dfns_broadcast_transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: dfns_credentials; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dfns_credentials ENABLE ROW LEVEL SECURITY;

--
-- Name: dfns_exchange_accounts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dfns_exchange_accounts ENABLE ROW LEVEL SECURITY;

--
-- Name: dfns_exchange_balances; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dfns_exchange_balances ENABLE ROW LEVEL SECURITY;

--
-- Name: dfns_exchange_integrations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dfns_exchange_integrations ENABLE ROW LEVEL SECURITY;

--
-- Name: dfns_fee_sponsors; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dfns_fee_sponsors ENABLE ROW LEVEL SECURITY;

--
-- Name: dfns_fiat_activity_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dfns_fiat_activity_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: dfns_fiat_provider_configs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dfns_fiat_provider_configs ENABLE ROW LEVEL SECURITY;

--
-- Name: dfns_fiat_quotes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dfns_fiat_quotes ENABLE ROW LEVEL SECURITY;

--
-- Name: dfns_fiat_transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dfns_fiat_transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: dfns_permission_assignments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dfns_permission_assignments ENABLE ROW LEVEL SECURITY;

--
-- Name: dfns_permissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dfns_permissions ENABLE ROW LEVEL SECURITY;

--
-- Name: dfns_personal_access_tokens; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dfns_personal_access_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: dfns_policies; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dfns_policies ENABLE ROW LEVEL SECURITY;

--
-- Name: dfns_policy_approvals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dfns_policy_approvals ENABLE ROW LEVEL SECURITY;

--
-- Name: dfns_service_accounts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dfns_service_accounts ENABLE ROW LEVEL SECURITY;

--
-- Name: dfns_signatures; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dfns_signatures ENABLE ROW LEVEL SECURITY;

--
-- Name: dfns_signing_keys; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dfns_signing_keys ENABLE ROW LEVEL SECURITY;

--
-- Name: dfns_sponsored_fees; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dfns_sponsored_fees ENABLE ROW LEVEL SECURITY;

--
-- Name: dfns_staking_integrations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dfns_staking_integrations ENABLE ROW LEVEL SECURITY;

--
-- Name: dfns_sync_status; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dfns_sync_status ENABLE ROW LEVEL SECURITY;

--
-- Name: dfns_transaction_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dfns_transaction_history ENABLE ROW LEVEL SECURITY;

--
-- Name: dfns_transfers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dfns_transfers ENABLE ROW LEVEL SECURITY;

--
-- Name: dfns_users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dfns_users ENABLE ROW LEVEL SECURITY;

--
-- Name: dfns_validators; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dfns_validators ENABLE ROW LEVEL SECURITY;

--
-- Name: dfns_wallet_balances; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dfns_wallet_balances ENABLE ROW LEVEL SECURITY;

--
-- Name: dfns_wallet_nfts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dfns_wallet_nfts ENABLE ROW LEVEL SECURITY;

--
-- Name: dfns_wallets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dfns_wallets ENABLE ROW LEVEL SECURITY;

--
-- Name: dfns_webhook_deliveries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dfns_webhook_deliveries ENABLE ROW LEVEL SECURITY;

--
-- Name: dfns_webhooks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dfns_webhooks ENABLE ROW LEVEL SECURITY;

--
-- Name: guardian_api_tests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.guardian_api_tests ENABLE ROW LEVEL SECURITY;

--
-- Name: guardian_api_tests guardian_api_tests_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY guardian_api_tests_policy ON public.guardian_api_tests USING (true);


--
-- Name: guardian_operations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.guardian_operations ENABLE ROW LEVEL SECURITY;

--
-- Name: guardian_operations guardian_operations_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY guardian_operations_policy ON public.guardian_operations USING (true);


--
-- Name: guardian_wallets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.guardian_wallets ENABLE ROW LEVEL SECURITY;

--
-- Name: guardian_wallets guardian_wallets_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY guardian_wallets_policy ON public.guardian_wallets USING (true);


--
-- Name: health_checks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.health_checks ENABLE ROW LEVEL SECURITY;

--
-- Name: monitoring_metrics; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.monitoring_metrics ENABLE ROW LEVEL SECURITY;

--
-- Name: moonpay_asset_cache; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.moonpay_asset_cache ENABLE ROW LEVEL SECURITY;

--
-- Name: moonpay_compliance_alerts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.moonpay_compliance_alerts ENABLE ROW LEVEL SECURITY;

--
-- Name: moonpay_customers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.moonpay_customers ENABLE ROW LEVEL SECURITY;

--
-- Name: moonpay_passes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.moonpay_passes ENABLE ROW LEVEL SECURITY;

--
-- Name: moonpay_policies; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.moonpay_policies ENABLE ROW LEVEL SECURITY;

--
-- Name: moonpay_policy_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.moonpay_policy_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: moonpay_projects; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.moonpay_projects ENABLE ROW LEVEL SECURITY;

--
-- Name: moonpay_swap_transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.moonpay_swap_transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: moonpay_webhook_config; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.moonpay_webhook_config ENABLE ROW LEVEL SECURITY;

--
-- Name: moonpay_webhook_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.moonpay_webhook_events ENABLE ROW LEVEL SECURITY;

--
-- Name: onchain_claims; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.onchain_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: onchain_identities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.onchain_identities ENABLE ROW LEVEL SECURITY;

--
-- Name: onchain_issuers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.onchain_issuers ENABLE ROW LEVEL SECURITY;

--
-- Name: onchain_verification_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.onchain_verification_history ENABLE ROW LEVEL SECURITY;

--
-- Name: risk_assessments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.risk_assessments ENABLE ROW LEVEL SECURITY;

--
-- Name: secure_keys; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.secure_keys ENABLE ROW LEVEL SECURITY;

--
-- Name: security_audit_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: FUNCTION add_investors_to_group(p_group_id text, p_investor_ids text[]); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.add_investors_to_group(p_group_id text, p_investor_ids text[]) TO anon;
GRANT ALL ON FUNCTION public.add_investors_to_group(p_group_id text, p_investor_ids text[]) TO authenticated;
GRANT ALL ON FUNCTION public.add_investors_to_group(p_group_id text, p_investor_ids text[]) TO service_role;


--
-- Name: FUNCTION add_policy_approver(p_policy_id uuid, p_user_id text, p_created_by text); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.add_policy_approver(p_policy_id uuid, p_user_id text, p_created_by text) TO anon;
GRANT ALL ON FUNCTION public.add_policy_approver(p_policy_id uuid, p_user_id text, p_created_by text) TO authenticated;
GRANT ALL ON FUNCTION public.add_policy_approver(p_policy_id uuid, p_user_id text, p_created_by text) TO service_role;


--
-- Name: FUNCTION add_policy_approver(policy_id text, user_id text, created_by text, status_val text); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.add_policy_approver(policy_id text, user_id text, created_by text, status_val text) TO anon;
GRANT ALL ON FUNCTION public.add_policy_approver(policy_id text, user_id text, created_by text, status_val text) TO authenticated;
GRANT ALL ON FUNCTION public.add_policy_approver(policy_id text, user_id text, created_by text, status_val text) TO service_role;


--
-- Name: FUNCTION add_policy_approver_with_cast(policy_id text, user_id text, created_by_id text); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.add_policy_approver_with_cast(policy_id text, user_id text, created_by_id text) TO anon;
GRANT ALL ON FUNCTION public.add_policy_approver_with_cast(policy_id text, user_id text, created_by_id text) TO authenticated;
GRANT ALL ON FUNCTION public.add_policy_approver_with_cast(policy_id text, user_id text, created_by_id text) TO service_role;


--
-- Name: FUNCTION add_rule_to_approval_queue(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.add_rule_to_approval_queue() TO anon;
GRANT ALL ON FUNCTION public.add_rule_to_approval_queue() TO authenticated;
GRANT ALL ON FUNCTION public.add_rule_to_approval_queue() TO service_role;


--
-- Name: FUNCTION add_table_to_realtime(table_name text); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.add_table_to_realtime(table_name text) TO anon;
GRANT ALL ON FUNCTION public.add_table_to_realtime(table_name text) TO authenticated;
GRANT ALL ON FUNCTION public.add_table_to_realtime(table_name text) TO service_role;


--
-- Name: FUNCTION add_template_to_approval_queue(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.add_template_to_approval_queue() TO anon;
GRANT ALL ON FUNCTION public.add_template_to_approval_queue() TO authenticated;
GRANT ALL ON FUNCTION public.add_template_to_approval_queue() TO service_role;


--
-- Name: PROCEDURE apply_audit_trigger_to_table(IN table_name text); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON PROCEDURE public.apply_audit_trigger_to_table(IN table_name text) TO anon;
GRANT ALL ON PROCEDURE public.apply_audit_trigger_to_table(IN table_name text) TO authenticated;
GRANT ALL ON PROCEDURE public.apply_audit_trigger_to_table(IN table_name text) TO service_role;


--
-- Name: FUNCTION archive_old_moonpay_compliance_alerts(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.archive_old_moonpay_compliance_alerts() TO anon;
GRANT ALL ON FUNCTION public.archive_old_moonpay_compliance_alerts() TO authenticated;
GRANT ALL ON FUNCTION public.archive_old_moonpay_compliance_alerts() TO service_role;


--
-- Name: FUNCTION assign_redemption_approvers(p_redemption_request_id uuid, p_approval_config_id uuid); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.assign_redemption_approvers(p_redemption_request_id uuid, p_approval_config_id uuid) TO anon;
GRANT ALL ON FUNCTION public.assign_redemption_approvers(p_redemption_request_id uuid, p_approval_config_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.assign_redemption_approvers(p_redemption_request_id uuid, p_approval_config_id uuid) TO service_role;


--
-- Name: FUNCTION audit_investor_approval_changes(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.audit_investor_approval_changes() TO anon;
GRANT ALL ON FUNCTION public.audit_investor_approval_changes() TO authenticated;
GRANT ALL ON FUNCTION public.audit_investor_approval_changes() TO service_role;


--
-- Name: FUNCTION calculate_nav_change(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.calculate_nav_change() TO anon;
GRANT ALL ON FUNCTION public.calculate_nav_change() TO authenticated;
GRANT ALL ON FUNCTION public.calculate_nav_change() TO service_role;


--
-- Name: FUNCTION check_all_approvals(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.check_all_approvals() TO anon;
GRANT ALL ON FUNCTION public.check_all_approvals() TO authenticated;
GRANT ALL ON FUNCTION public.check_all_approvals() TO service_role;


--
-- Name: FUNCTION check_document_expiry(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.check_document_expiry() TO anon;
GRANT ALL ON FUNCTION public.check_document_expiry() TO authenticated;
GRANT ALL ON FUNCTION public.check_document_expiry() TO service_role;


--
-- Name: FUNCTION check_permission(p_role_name text, p_resource text, p_action text); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.check_permission(p_role_name text, p_resource text, p_action text) TO anon;
GRANT ALL ON FUNCTION public.check_permission(p_role_name text, p_resource text, p_action text) TO authenticated;
GRANT ALL ON FUNCTION public.check_permission(p_role_name text, p_resource text, p_action text) TO service_role;


--
-- Name: FUNCTION check_role_exists(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.check_role_exists() TO anon;
GRANT ALL ON FUNCTION public.check_role_exists() TO authenticated;
GRANT ALL ON FUNCTION public.check_role_exists() TO service_role;


--
-- Name: FUNCTION check_user_permission(user_id uuid, permission text); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.check_user_permission(user_id uuid, permission text) TO anon;
GRANT ALL ON FUNCTION public.check_user_permission(user_id uuid, permission text) TO authenticated;
GRANT ALL ON FUNCTION public.check_user_permission(user_id uuid, permission text) TO service_role;


--
-- Name: FUNCTION cleanup_expired_asset_cache(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.cleanup_expired_asset_cache() TO anon;
GRANT ALL ON FUNCTION public.cleanup_expired_asset_cache() TO authenticated;
GRANT ALL ON FUNCTION public.cleanup_expired_asset_cache() TO service_role;


--
-- Name: FUNCTION cleanup_old_moonpay_policy_logs(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.cleanup_old_moonpay_policy_logs() TO anon;
GRANT ALL ON FUNCTION public.cleanup_old_moonpay_policy_logs() TO authenticated;
GRANT ALL ON FUNCTION public.cleanup_old_moonpay_policy_logs() TO service_role;


--
-- Name: FUNCTION cleanup_old_webhook_events(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.cleanup_old_webhook_events() TO anon;
GRANT ALL ON FUNCTION public.cleanup_old_webhook_events() TO authenticated;
GRANT ALL ON FUNCTION public.cleanup_old_webhook_events() TO service_role;


--
-- Name: FUNCTION cleanup_orphaned_policy_approvers(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.cleanup_orphaned_policy_approvers() TO anon;
GRANT ALL ON FUNCTION public.cleanup_orphaned_policy_approvers() TO authenticated;
GRANT ALL ON FUNCTION public.cleanup_orphaned_policy_approvers() TO service_role;


--
-- Name: FUNCTION column_exists(p_schema_name text, p_table_name text, p_column_name text); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.column_exists(p_schema_name text, p_table_name text, p_column_name text) TO anon;
GRANT ALL ON FUNCTION public.column_exists(p_schema_name text, p_table_name text, p_column_name text) TO authenticated;
GRANT ALL ON FUNCTION public.column_exists(p_schema_name text, p_table_name text, p_column_name text) TO service_role;


--
-- Name: FUNCTION create_audit_trigger(table_name text, is_high_volume boolean); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.create_audit_trigger(table_name text, is_high_volume boolean) TO anon;
GRANT ALL ON FUNCTION public.create_audit_trigger(table_name text, is_high_volume boolean) TO authenticated;
GRANT ALL ON FUNCTION public.create_audit_trigger(table_name text, is_high_volume boolean) TO service_role;


--
-- Name: FUNCTION create_document_version(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.create_document_version() TO anon;
GRANT ALL ON FUNCTION public.create_document_version() TO authenticated;
GRANT ALL ON FUNCTION public.create_document_version() TO service_role;


--
-- Name: FUNCTION create_project_with_cap_table(project_data jsonb, cap_table_name text); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.create_project_with_cap_table(project_data jsonb, cap_table_name text) TO anon;
GRANT ALL ON FUNCTION public.create_project_with_cap_table(project_data jsonb, cap_table_name text) TO authenticated;
GRANT ALL ON FUNCTION public.create_project_with_cap_table(project_data jsonb, cap_table_name text) TO service_role;


--
-- Name: FUNCTION create_selective_audit_trigger(p_table text, p_condition text); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.create_selective_audit_trigger(p_table text, p_condition text) TO anon;
GRANT ALL ON FUNCTION public.create_selective_audit_trigger(p_table text, p_condition text) TO authenticated;
GRANT ALL ON FUNCTION public.create_selective_audit_trigger(p_table text, p_condition text) TO service_role;


--
-- Name: FUNCTION create_token_version(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.create_token_version() TO anon;
GRANT ALL ON FUNCTION public.create_token_version() TO authenticated;
GRANT ALL ON FUNCTION public.create_token_version() TO service_role;


--
-- Name: FUNCTION create_transaction_events_table(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.create_transaction_events_table() TO anon;
GRANT ALL ON FUNCTION public.create_transaction_events_table() TO authenticated;
GRANT ALL ON FUNCTION public.create_transaction_events_table() TO service_role;


--
-- Name: FUNCTION delete_project_cascade(project_id uuid); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.delete_project_cascade(project_id uuid) TO anon;
GRANT ALL ON FUNCTION public.delete_project_cascade(project_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.delete_project_cascade(project_id uuid) TO service_role;


--
-- Name: FUNCTION delete_user_with_privileges(p_user_id uuid); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.delete_user_with_privileges(p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.delete_user_with_privileges(p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.delete_user_with_privileges(p_user_id uuid) TO service_role;


--
-- Name: FUNCTION disable_rls_for_deletion(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.disable_rls_for_deletion() TO anon;
GRANT ALL ON FUNCTION public.disable_rls_for_deletion() TO authenticated;
GRANT ALL ON FUNCTION public.disable_rls_for_deletion() TO service_role;


--
-- Name: FUNCTION enable_rls_after_deletion(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.enable_rls_after_deletion() TO anon;
GRANT ALL ON FUNCTION public.enable_rls_after_deletion() TO authenticated;
GRANT ALL ON FUNCTION public.enable_rls_after_deletion() TO service_role;


--
-- Name: FUNCTION exec(query text); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.exec(query text) TO anon;
GRANT ALL ON FUNCTION public.exec(query text) TO authenticated;
GRANT ALL ON FUNCTION public.exec(query text) TO service_role;


--
-- Name: FUNCTION execute_safely(p_statement text); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.execute_safely(p_statement text) TO anon;
GRANT ALL ON FUNCTION public.execute_safely(p_statement text) TO authenticated;
GRANT ALL ON FUNCTION public.execute_safely(p_statement text) TO service_role;


--
-- Name: FUNCTION extract_severity_from_metadata(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.extract_severity_from_metadata() TO anon;
GRANT ALL ON FUNCTION public.extract_severity_from_metadata() TO authenticated;
GRANT ALL ON FUNCTION public.extract_severity_from_metadata() TO service_role;


--
-- Name: FUNCTION get_activity_counts_by_timeframe(p_start_time timestamp without time zone, p_end_time timestamp without time zone, p_interval text); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.get_activity_counts_by_timeframe(p_start_time timestamp without time zone, p_end_time timestamp without time zone, p_interval text) TO anon;
GRANT ALL ON FUNCTION public.get_activity_counts_by_timeframe(p_start_time timestamp without time zone, p_end_time timestamp without time zone, p_interval text) TO authenticated;
GRANT ALL ON FUNCTION public.get_activity_counts_by_timeframe(p_start_time timestamp without time zone, p_end_time timestamp without time zone, p_interval text) TO service_role;


--
-- Name: FUNCTION get_activity_distribution_by_category(p_start_time timestamp without time zone, p_end_time timestamp without time zone); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.get_activity_distribution_by_category(p_start_time timestamp without time zone, p_end_time timestamp without time zone) TO anon;
GRANT ALL ON FUNCTION public.get_activity_distribution_by_category(p_start_time timestamp without time zone, p_end_time timestamp without time zone) TO authenticated;
GRANT ALL ON FUNCTION public.get_activity_distribution_by_category(p_start_time timestamp without time zone, p_end_time timestamp without time zone) TO service_role;


--
-- Name: FUNCTION get_activity_hierarchy(root_id uuid); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.get_activity_hierarchy(root_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_activity_hierarchy(root_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_activity_hierarchy(root_id uuid) TO service_role;


--
-- Name: FUNCTION get_moonpay_webhook_stats(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.get_moonpay_webhook_stats() TO anon;
GRANT ALL ON FUNCTION public.get_moonpay_webhook_stats() TO authenticated;
GRANT ALL ON FUNCTION public.get_moonpay_webhook_stats() TO service_role;


--
-- Name: FUNCTION get_token_whitelist_addresses(p_token_id uuid); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.get_token_whitelist_addresses(p_token_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_token_whitelist_addresses(p_token_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_token_whitelist_addresses(p_token_id uuid) TO service_role;


--
-- Name: FUNCTION get_unique_group_memberships(investor_ids text[]); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.get_unique_group_memberships(investor_ids text[]) TO anon;
GRANT ALL ON FUNCTION public.get_unique_group_memberships(investor_ids text[]) TO authenticated;
GRANT ALL ON FUNCTION public.get_unique_group_memberships(investor_ids text[]) TO service_role;


--
-- Name: FUNCTION get_unique_member_count(group_id_param text); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.get_unique_member_count(group_id_param text) TO anon;
GRANT ALL ON FUNCTION public.get_unique_member_count(group_id_param text) TO authenticated;
GRANT ALL ON FUNCTION public.get_unique_member_count(group_id_param text) TO service_role;


--
-- Name: FUNCTION get_users_by_role_for_approval(role_names text[]); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.get_users_by_role_for_approval(role_names text[]) TO anon;
GRANT ALL ON FUNCTION public.get_users_by_role_for_approval(role_names text[]) TO authenticated;
GRANT ALL ON FUNCTION public.get_users_by_role_for_approval(role_names text[]) TO service_role;


--
-- Name: FUNCTION get_users_with_any_permission(permission_names text[]); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.get_users_with_any_permission(permission_names text[]) TO anon;
GRANT ALL ON FUNCTION public.get_users_with_any_permission(permission_names text[]) TO authenticated;
GRANT ALL ON FUNCTION public.get_users_with_any_permission(permission_names text[]) TO service_role;


--
-- Name: FUNCTION get_users_with_permission(permission_name text); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.get_users_with_permission(permission_name text) TO anon;
GRANT ALL ON FUNCTION public.get_users_with_permission(permission_name text) TO authenticated;
GRANT ALL ON FUNCTION public.get_users_with_permission(permission_name text) TO service_role;


--
-- Name: FUNCTION get_users_with_permission_simple(p_permission_id text); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.get_users_with_permission_simple(p_permission_id text) TO anon;
GRANT ALL ON FUNCTION public.get_users_with_permission_simple(p_permission_id text) TO authenticated;
GRANT ALL ON FUNCTION public.get_users_with_permission_simple(p_permission_id text) TO service_role;


--
-- Name: FUNCTION handle_auth_user_created(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.handle_auth_user_created() TO anon;
GRANT ALL ON FUNCTION public.handle_auth_user_created() TO authenticated;
GRANT ALL ON FUNCTION public.handle_auth_user_created() TO service_role;


--
-- Name: FUNCTION handle_rule_rejection(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.handle_rule_rejection() TO anon;
GRANT ALL ON FUNCTION public.handle_rule_rejection() TO authenticated;
GRANT ALL ON FUNCTION public.handle_rule_rejection() TO service_role;


--
-- Name: FUNCTION handle_token_allocation_deletion(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.handle_token_allocation_deletion() TO anon;
GRANT ALL ON FUNCTION public.handle_token_allocation_deletion() TO authenticated;
GRANT ALL ON FUNCTION public.handle_token_allocation_deletion() TO service_role;


--
-- Name: FUNCTION handle_token_distribution(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.handle_token_distribution() TO anon;
GRANT ALL ON FUNCTION public.handle_token_distribution() TO authenticated;
GRANT ALL ON FUNCTION public.handle_token_distribution() TO service_role;


--
-- Name: FUNCTION handle_user_deletion(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.handle_user_deletion() TO anon;
GRANT ALL ON FUNCTION public.handle_user_deletion() TO authenticated;
GRANT ALL ON FUNCTION public.handle_user_deletion() TO service_role;


--
-- Name: FUNCTION insert_policy_approver(p_policy_id uuid, p_user_id text, p_created_by text); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.insert_policy_approver(p_policy_id uuid, p_user_id text, p_created_by text) TO anon;
GRANT ALL ON FUNCTION public.insert_policy_approver(p_policy_id uuid, p_user_id text, p_created_by text) TO authenticated;
GRANT ALL ON FUNCTION public.insert_policy_approver(p_policy_id uuid, p_user_id text, p_created_by text) TO service_role;


--
-- Name: FUNCTION insert_token_properties(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.insert_token_properties() TO anon;
GRANT ALL ON FUNCTION public.insert_token_properties() TO authenticated;
GRANT ALL ON FUNCTION public.insert_token_properties() TO service_role;


--
-- Name: FUNCTION is_address_whitelisted(p_token_id uuid, p_address text); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.is_address_whitelisted(p_token_id uuid, p_address text) TO anon;
GRANT ALL ON FUNCTION public.is_address_whitelisted(p_token_id uuid, p_address text) TO authenticated;
GRANT ALL ON FUNCTION public.is_address_whitelisted(p_token_id uuid, p_address text) TO service_role;


--
-- Name: FUNCTION list_tables(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.list_tables() TO anon;
GRANT ALL ON FUNCTION public.list_tables() TO authenticated;
GRANT ALL ON FUNCTION public.list_tables() TO service_role;


--
-- Name: FUNCTION log_approval_config_changes(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.log_approval_config_changes() TO anon;
GRANT ALL ON FUNCTION public.log_approval_config_changes() TO authenticated;
GRANT ALL ON FUNCTION public.log_approval_config_changes() TO service_role;


--
-- Name: FUNCTION log_approver_assignment_changes(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.log_approver_assignment_changes() TO anon;
GRANT ALL ON FUNCTION public.log_approver_assignment_changes() TO authenticated;
GRANT ALL ON FUNCTION public.log_approver_assignment_changes() TO service_role;


--
-- Name: FUNCTION log_audit(p_action text, p_user_id uuid, p_entity_type text, p_entity_id text, p_details text, p_status text, p_metadata jsonb, p_old_data jsonb, p_new_data jsonb); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.log_audit(p_action text, p_user_id uuid, p_entity_type text, p_entity_id text, p_details text, p_status text, p_metadata jsonb, p_old_data jsonb, p_new_data jsonb) TO anon;
GRANT ALL ON FUNCTION public.log_audit(p_action text, p_user_id uuid, p_entity_type text, p_entity_id text, p_details text, p_status text, p_metadata jsonb, p_old_data jsonb, p_new_data jsonb) TO authenticated;
GRANT ALL ON FUNCTION public.log_audit(p_action text, p_user_id uuid, p_entity_type text, p_entity_id text, p_details text, p_status text, p_metadata jsonb, p_old_data jsonb, p_new_data jsonb) TO service_role;


--
-- Name: FUNCTION log_auth_event(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.log_auth_event() TO anon;
GRANT ALL ON FUNCTION public.log_auth_event() TO authenticated;
GRANT ALL ON FUNCTION public.log_auth_event() TO service_role;


--
-- Name: FUNCTION log_database_changes(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.log_database_changes() TO anon;
GRANT ALL ON FUNCTION public.log_database_changes() TO authenticated;
GRANT ALL ON FUNCTION public.log_database_changes() TO service_role;


--
-- Name: FUNCTION log_table_change(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.log_table_change() TO anon;
GRANT ALL ON FUNCTION public.log_table_change() TO authenticated;
GRANT ALL ON FUNCTION public.log_table_change() TO service_role;


--
-- Name: FUNCTION log_user_action(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.log_user_action() TO anon;
GRANT ALL ON FUNCTION public.log_user_action() TO authenticated;
GRANT ALL ON FUNCTION public.log_user_action() TO service_role;


--
-- Name: FUNCTION migrate_token_json_to_tables(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.migrate_token_json_to_tables() TO anon;
GRANT ALL ON FUNCTION public.migrate_token_json_to_tables() TO authenticated;
GRANT ALL ON FUNCTION public.migrate_token_json_to_tables() TO service_role;


--
-- Name: FUNCTION projects_audit_function(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.projects_audit_function() TO anon;
GRANT ALL ON FUNCTION public.projects_audit_function() TO authenticated;
GRANT ALL ON FUNCTION public.projects_audit_function() TO service_role;


--
-- Name: FUNCTION refresh_activity_metrics(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.refresh_activity_metrics() TO anon;
GRANT ALL ON FUNCTION public.refresh_activity_metrics() TO authenticated;
GRANT ALL ON FUNCTION public.refresh_activity_metrics() TO service_role;


--
-- Name: FUNCTION remove_investors_from_group(p_group_id text, p_investor_ids text[]); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.remove_investors_from_group(p_group_id text, p_investor_ids text[]) TO anon;
GRANT ALL ON FUNCTION public.remove_investors_from_group(p_group_id text, p_investor_ids text[]) TO authenticated;
GRANT ALL ON FUNCTION public.remove_investors_from_group(p_group_id text, p_investor_ids text[]) TO service_role;


--
-- Name: FUNCTION safe_cast_to_uuid(input text); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.safe_cast_to_uuid(input text) TO anon;
GRANT ALL ON FUNCTION public.safe_cast_to_uuid(input text) TO authenticated;
GRANT ALL ON FUNCTION public.safe_cast_to_uuid(input text) TO service_role;


--
-- Name: FUNCTION safe_uuid_cast(text_id text); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.safe_uuid_cast(text_id text) TO anon;
GRANT ALL ON FUNCTION public.safe_uuid_cast(text_id text) TO authenticated;
GRANT ALL ON FUNCTION public.safe_uuid_cast(text_id text) TO service_role;


--
-- Name: FUNCTION save_consensus_config(p_consensus_type text, p_required_approvals integer, p_eligible_roles text[]); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.save_consensus_config(p_consensus_type text, p_required_approvals integer, p_eligible_roles text[]) TO anon;
GRANT ALL ON FUNCTION public.save_consensus_config(p_consensus_type text, p_required_approvals integer, p_eligible_roles text[]) TO authenticated;
GRANT ALL ON FUNCTION public.save_consensus_config(p_consensus_type text, p_required_approvals integer, p_eligible_roles text[]) TO service_role;


--
-- Name: FUNCTION set_distribution_standard(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.set_distribution_standard() TO anon;
GRANT ALL ON FUNCTION public.set_distribution_standard() TO authenticated;
GRANT ALL ON FUNCTION public.set_distribution_standard() TO service_role;


--
-- Name: FUNCTION set_token_allocation_standard(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.set_token_allocation_standard() TO anon;
GRANT ALL ON FUNCTION public.set_token_allocation_standard() TO authenticated;
GRANT ALL ON FUNCTION public.set_token_allocation_standard() TO service_role;


--
-- Name: FUNCTION set_updated_at(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.set_updated_at() TO anon;
GRANT ALL ON FUNCTION public.set_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.set_updated_at() TO service_role;


--
-- Name: FUNCTION sync_group_memberships(group_id_param text); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.sync_group_memberships(group_id_param text) TO anon;
GRANT ALL ON FUNCTION public.sync_group_memberships(group_id_param text) TO authenticated;
GRANT ALL ON FUNCTION public.sync_group_memberships(group_id_param text) TO service_role;


--
-- Name: FUNCTION sync_investor_group_memberships(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.sync_investor_group_memberships() TO anon;
GRANT ALL ON FUNCTION public.sync_investor_group_memberships() TO authenticated;
GRANT ALL ON FUNCTION public.sync_investor_group_memberships() TO service_role;


--
-- Name: FUNCTION table_exists(p_schema_name text, p_table_name text); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.table_exists(p_schema_name text, p_table_name text) TO anon;
GRANT ALL ON FUNCTION public.table_exists(p_schema_name text, p_table_name text) TO authenticated;
GRANT ALL ON FUNCTION public.table_exists(p_schema_name text, p_table_name text) TO service_role;


--
-- Name: FUNCTION track_system_process(process_name text, description text, metadata jsonb); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.track_system_process(process_name text, description text, metadata jsonb) TO anon;
GRANT ALL ON FUNCTION public.track_system_process(process_name text, description text, metadata jsonb) TO authenticated;
GRANT ALL ON FUNCTION public.track_system_process(process_name text, description text, metadata jsonb) TO service_role;


--
-- Name: FUNCTION update_bulk_operation_progress(p_operation_id text, p_progress double precision, p_processed_count integer, p_failed_count integer, p_status character varying); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.update_bulk_operation_progress(p_operation_id text, p_progress double precision, p_processed_count integer, p_failed_count integer, p_status character varying) TO anon;
GRANT ALL ON FUNCTION public.update_bulk_operation_progress(p_operation_id text, p_progress double precision, p_processed_count integer, p_failed_count integer, p_status character varying) TO authenticated;
GRANT ALL ON FUNCTION public.update_bulk_operation_progress(p_operation_id text, p_progress double precision, p_processed_count integer, p_failed_count integer, p_status character varying) TO service_role;


--
-- Name: FUNCTION update_consensus_settings_updated_at(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.update_consensus_settings_updated_at() TO anon;
GRANT ALL ON FUNCTION public.update_consensus_settings_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.update_consensus_settings_updated_at() TO service_role;


--
-- Name: FUNCTION update_distribution_remaining_amount(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.update_distribution_remaining_amount() TO anon;
GRANT ALL ON FUNCTION public.update_distribution_remaining_amount() TO authenticated;
GRANT ALL ON FUNCTION public.update_distribution_remaining_amount() TO service_role;


--
-- Name: FUNCTION update_group_member_count(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.update_group_member_count() TO anon;
GRANT ALL ON FUNCTION public.update_group_member_count() TO authenticated;
GRANT ALL ON FUNCTION public.update_group_member_count() TO service_role;


--
-- Name: FUNCTION update_modified_column(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.update_modified_column() TO anon;
GRANT ALL ON FUNCTION public.update_modified_column() TO authenticated;
GRANT ALL ON FUNCTION public.update_modified_column() TO service_role;


--
-- Name: FUNCTION update_redemption_approvers_updated_at(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.update_redemption_approvers_updated_at() TO anon;
GRANT ALL ON FUNCTION public.update_redemption_approvers_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.update_redemption_approvers_updated_at() TO service_role;


--
-- Name: FUNCTION update_rules_updated_at(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.update_rules_updated_at() TO anon;
GRANT ALL ON FUNCTION public.update_rules_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.update_rules_updated_at() TO service_role;


--
-- Name: FUNCTION update_security_events_updated_at(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.update_security_events_updated_at() TO anon;
GRANT ALL ON FUNCTION public.update_security_events_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.update_security_events_updated_at() TO service_role;


--
-- Name: FUNCTION update_settlement_status(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.update_settlement_status() TO anon;
GRANT ALL ON FUNCTION public.update_settlement_status() TO authenticated;
GRANT ALL ON FUNCTION public.update_settlement_status() TO service_role;


--
-- Name: FUNCTION update_system_process_progress(p_process_id text, p_progress double precision, p_processed_count integer, p_status character varying); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.update_system_process_progress(p_process_id text, p_progress double precision, p_processed_count integer, p_status character varying) TO anon;
GRANT ALL ON FUNCTION public.update_system_process_progress(p_process_id text, p_progress double precision, p_processed_count integer, p_status character varying) TO authenticated;
GRANT ALL ON FUNCTION public.update_system_process_progress(p_process_id text, p_progress double precision, p_processed_count integer, p_status character varying) TO service_role;


--
-- Name: FUNCTION update_system_process_status(process_id uuid, new_status text, error_details text); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.update_system_process_status(process_id uuid, new_status text, error_details text) TO anon;
GRANT ALL ON FUNCTION public.update_system_process_status(process_id uuid, new_status text, error_details text) TO authenticated;
GRANT ALL ON FUNCTION public.update_system_process_status(process_id uuid, new_status text, error_details text) TO service_role;


--
-- Name: FUNCTION update_timestamp(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.update_timestamp() TO anon;
GRANT ALL ON FUNCTION public.update_timestamp() TO authenticated;
GRANT ALL ON FUNCTION public.update_timestamp() TO service_role;


--
-- Name: FUNCTION update_timestamp_column(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.update_timestamp_column() TO anon;
GRANT ALL ON FUNCTION public.update_timestamp_column() TO authenticated;
GRANT ALL ON FUNCTION public.update_timestamp_column() TO service_role;


--
-- Name: FUNCTION update_updated_at_column(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.update_updated_at_column() TO anon;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO authenticated;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO service_role;


--
-- Name: FUNCTION update_user_role(p_user_id uuid, p_role text); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.update_user_role(p_user_id uuid, p_role text) TO anon;
GRANT ALL ON FUNCTION public.update_user_role(p_user_id uuid, p_role text) TO authenticated;
GRANT ALL ON FUNCTION public.update_user_role(p_user_id uuid, p_role text) TO service_role;


--
-- Name: FUNCTION update_wallet_signatories_updated_at(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.update_wallet_signatories_updated_at() TO anon;
GRANT ALL ON FUNCTION public.update_wallet_signatories_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.update_wallet_signatories_updated_at() TO service_role;


--
-- Name: FUNCTION update_whitelist_entries_updated_at(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.update_whitelist_entries_updated_at() TO anon;
GRANT ALL ON FUNCTION public.update_whitelist_entries_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.update_whitelist_entries_updated_at() TO service_role;


--
-- Name: FUNCTION upsert_policy_template_approver(p_template_id uuid, p_user_id uuid, p_created_by text, p_status text); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.upsert_policy_template_approver(p_template_id uuid, p_user_id uuid, p_created_by text, p_status text) TO anon;
GRANT ALL ON FUNCTION public.upsert_policy_template_approver(p_template_id uuid, p_user_id uuid, p_created_by text, p_status text) TO authenticated;
GRANT ALL ON FUNCTION public.upsert_policy_template_approver(p_template_id uuid, p_user_id uuid, p_created_by text, p_status text) TO service_role;


--
-- Name: FUNCTION user_has_delete_permission(p_user_id uuid); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.user_has_delete_permission(p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.user_has_delete_permission(p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.user_has_delete_permission(p_user_id uuid) TO service_role;


--
-- Name: FUNCTION validate_blockchain_address(blockchain text, address text); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.validate_blockchain_address(blockchain text, address text) TO anon;
GRANT ALL ON FUNCTION public.validate_blockchain_address(blockchain text, address text) TO authenticated;
GRANT ALL ON FUNCTION public.validate_blockchain_address(blockchain text, address text) TO service_role;


--
-- Name: FUNCTION validate_geographic_restriction(p_token_id uuid, p_investor_country_code character, p_investment_amount numeric); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.validate_geographic_restriction(p_token_id uuid, p_investor_country_code character, p_investment_amount numeric) TO anon;
GRANT ALL ON FUNCTION public.validate_geographic_restriction(p_token_id uuid, p_investor_country_code character, p_investment_amount numeric) TO authenticated;
GRANT ALL ON FUNCTION public.validate_geographic_restriction(p_token_id uuid, p_investor_country_code character, p_investment_amount numeric) TO service_role;


--
-- Name: FUNCTION validate_token_data(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.validate_token_data() TO anon;
GRANT ALL ON FUNCTION public.validate_token_data() TO authenticated;
GRANT ALL ON FUNCTION public.validate_token_data() TO service_role;


--
-- Name: FUNCTION validate_token_exists(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.validate_token_exists() TO anon;
GRANT ALL ON FUNCTION public.validate_token_exists() TO authenticated;
GRANT ALL ON FUNCTION public.validate_token_exists() TO service_role;


--
-- Name: FUNCTION validate_wallet_address(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.validate_wallet_address() TO anon;
GRANT ALL ON FUNCTION public.validate_wallet_address() TO authenticated;
GRANT ALL ON FUNCTION public.validate_wallet_address() TO service_role;


--
-- Name: FUNCTION validate_whitelist_config_permissive(config jsonb); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.validate_whitelist_config_permissive(config jsonb) TO anon;
GRANT ALL ON FUNCTION public.validate_whitelist_config_permissive(config jsonb) TO authenticated;
GRANT ALL ON FUNCTION public.validate_whitelist_config_permissive(config jsonb) TO service_role;


--
-- Name: TABLE redemption_window_configs; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.redemption_window_configs TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.redemption_window_configs TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.redemption_window_configs TO service_role;


--
-- Name: TABLE redemption_windows; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.redemption_windows TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.redemption_windows TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.redemption_windows TO service_role;


--
-- Name: TABLE active_redemption_windows; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.active_redemption_windows TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.active_redemption_windows TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.active_redemption_windows TO service_role;


--
-- Name: TABLE audit_logs; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.audit_logs TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.audit_logs TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.audit_logs TO service_role;


--
-- Name: TABLE activity_analytics; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.activity_analytics TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.activity_analytics TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.activity_analytics TO service_role;


--
-- Name: TABLE activity_metrics; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.activity_metrics TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.activity_metrics TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.activity_metrics TO service_role;


--
-- Name: TABLE activity_summary_daily; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.activity_summary_daily TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.activity_summary_daily TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.activity_summary_daily TO service_role;


--
-- Name: TABLE alerts; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.alerts TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.alerts TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.alerts TO service_role;


--
-- Name: TABLE approval_config_approvers; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.approval_config_approvers TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.approval_config_approvers TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.approval_config_approvers TO service_role;


--
-- Name: TABLE approval_config_history; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.approval_config_history TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.approval_config_history TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.approval_config_history TO service_role;


--
-- Name: TABLE approval_configs; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.approval_configs TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.approval_configs TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.approval_configs TO service_role;


--
-- Name: TABLE roles; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.roles TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.roles TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.roles TO service_role;


--
-- Name: TABLE users; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.users TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.users TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.users TO service_role;


--
-- Name: TABLE approval_configs_with_approvers; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.approval_configs_with_approvers TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.approval_configs_with_approvers TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.approval_configs_with_approvers TO service_role;


--
-- Name: TABLE approval_requests; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.approval_requests TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.approval_requests TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.approval_requests TO service_role;


--
-- Name: TABLE audit_coverage; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.audit_coverage TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.audit_coverage TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.audit_coverage TO service_role;


--
-- Name: TABLE auth_events; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.auth_events TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.auth_events TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.auth_events TO service_role;


--
-- Name: TABLE bulk_operations; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.bulk_operations TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.bulk_operations TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.bulk_operations TO service_role;


--
-- Name: TABLE cap_table_investors; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.cap_table_investors TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.cap_table_investors TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.cap_table_investors TO service_role;


--
-- Name: TABLE cap_tables; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.cap_tables TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.cap_tables TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.cap_tables TO service_role;


--
-- Name: TABLE compliance_checks; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.compliance_checks TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.compliance_checks TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.compliance_checks TO service_role;


--
-- Name: TABLE compliance_reports; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.compliance_reports TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.compliance_reports TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.compliance_reports TO service_role;


--
-- Name: TABLE compliance_settings; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.compliance_settings TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.compliance_settings TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.compliance_settings TO service_role;


--
-- Name: TABLE consensus_settings; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.consensus_settings TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.consensus_settings TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.consensus_settings TO service_role;


--
-- Name: TABLE credential_usage_logs; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.credential_usage_logs TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.credential_usage_logs TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.credential_usage_logs TO service_role;


--
-- Name: TABLE deployment_rate_limits; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.deployment_rate_limits TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.deployment_rate_limits TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.deployment_rate_limits TO service_role;


--
-- Name: TABLE dfns_activity_logs; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_activity_logs TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_activity_logs TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_activity_logs TO service_role;


--
-- Name: TABLE dfns_api_requests; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_api_requests TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_api_requests TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_api_requests TO service_role;


--
-- Name: TABLE dfns_applications; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_applications TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_applications TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_applications TO service_role;


--
-- Name: TABLE dfns_broadcast_transactions; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_broadcast_transactions TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_broadcast_transactions TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_broadcast_transactions TO service_role;


--
-- Name: TABLE dfns_credentials; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_credentials TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_credentials TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_credentials TO service_role;


--
-- Name: TABLE dfns_exchange_accounts; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_exchange_accounts TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_exchange_accounts TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_exchange_accounts TO service_role;


--
-- Name: TABLE dfns_exchange_balances; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_exchange_balances TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_exchange_balances TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_exchange_balances TO service_role;


--
-- Name: TABLE dfns_exchange_integrations; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_exchange_integrations TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_exchange_integrations TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_exchange_integrations TO service_role;


--
-- Name: TABLE dfns_fee_sponsors; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_fee_sponsors TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_fee_sponsors TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_fee_sponsors TO service_role;


--
-- Name: TABLE dfns_fiat_activity_logs; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_fiat_activity_logs TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_fiat_activity_logs TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_fiat_activity_logs TO service_role;


--
-- Name: TABLE dfns_fiat_provider_configs; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_fiat_provider_configs TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_fiat_provider_configs TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_fiat_provider_configs TO service_role;


--
-- Name: TABLE dfns_fiat_quotes; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_fiat_quotes TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_fiat_quotes TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_fiat_quotes TO service_role;


--
-- Name: TABLE dfns_fiat_transactions; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_fiat_transactions TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_fiat_transactions TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_fiat_transactions TO service_role;


--
-- Name: TABLE dfns_permission_assignments; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_permission_assignments TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_permission_assignments TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_permission_assignments TO service_role;


--
-- Name: TABLE dfns_permissions; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_permissions TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_permissions TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_permissions TO service_role;


--
-- Name: TABLE dfns_personal_access_tokens; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_personal_access_tokens TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_personal_access_tokens TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_personal_access_tokens TO service_role;


--
-- Name: TABLE dfns_policies; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_policies TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_policies TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_policies TO service_role;


--
-- Name: TABLE dfns_policy_approvals; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_policy_approvals TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_policy_approvals TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_policy_approvals TO service_role;


--
-- Name: TABLE dfns_service_accounts; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_service_accounts TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_service_accounts TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_service_accounts TO service_role;


--
-- Name: TABLE dfns_signatures; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_signatures TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_signatures TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_signatures TO service_role;


--
-- Name: TABLE dfns_signing_keys; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_signing_keys TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_signing_keys TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_signing_keys TO service_role;


--
-- Name: TABLE dfns_sponsored_fees; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_sponsored_fees TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_sponsored_fees TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_sponsored_fees TO service_role;


--
-- Name: TABLE dfns_staking_integrations; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_staking_integrations TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_staking_integrations TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_staking_integrations TO service_role;


--
-- Name: TABLE dfns_sync_status; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_sync_status TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_sync_status TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_sync_status TO service_role;


--
-- Name: TABLE dfns_transaction_history; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_transaction_history TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_transaction_history TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_transaction_history TO service_role;


--
-- Name: TABLE dfns_transfers; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_transfers TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_transfers TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_transfers TO service_role;


--
-- Name: TABLE dfns_users; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_users TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_users TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_users TO service_role;


--
-- Name: TABLE dfns_validators; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_validators TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_validators TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_validators TO service_role;


--
-- Name: TABLE dfns_wallet_balances; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_wallet_balances TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_wallet_balances TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_wallet_balances TO service_role;


--
-- Name: TABLE dfns_wallet_nfts; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_wallet_nfts TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_wallet_nfts TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_wallet_nfts TO service_role;


--
-- Name: TABLE dfns_wallets; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_wallets TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_wallets TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_wallets TO service_role;


--
-- Name: TABLE dfns_webhook_deliveries; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_webhook_deliveries TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_webhook_deliveries TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_webhook_deliveries TO service_role;


--
-- Name: TABLE dfns_webhooks; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_webhooks TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_webhooks TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.dfns_webhooks TO service_role;


--
-- Name: TABLE distribution_redemptions; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.distribution_redemptions TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.distribution_redemptions TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.distribution_redemptions TO service_role;


--
-- Name: TABLE distributions; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.distributions TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.distributions TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.distributions TO service_role;


--
-- Name: TABLE document_approvals; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.document_approvals TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.document_approvals TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.document_approvals TO service_role;


--
-- Name: TABLE document_versions; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.document_versions TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.document_versions TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.document_versions TO service_role;


--
-- Name: TABLE document_workflows; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.document_workflows TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.document_workflows TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.document_workflows TO service_role;


--
-- Name: TABLE documents; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.documents TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.documents TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.documents TO service_role;


--
-- Name: TABLE faucet_requests; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.faucet_requests TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.faucet_requests TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.faucet_requests TO service_role;


--
-- Name: TABLE fiat_quotes; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.fiat_quotes TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.fiat_quotes TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.fiat_quotes TO service_role;


--
-- Name: TABLE fiat_transactions; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.fiat_transactions TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.fiat_transactions TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.fiat_transactions TO service_role;


--
-- Name: TABLE fund_nav_data; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.fund_nav_data TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.fund_nav_data TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.fund_nav_data TO service_role;


--
-- Name: TABLE geographic_jurisdictions; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.geographic_jurisdictions TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.geographic_jurisdictions TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.geographic_jurisdictions TO service_role;


--
-- Name: TABLE guardian_api_tests; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.guardian_api_tests TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.guardian_api_tests TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.guardian_api_tests TO service_role;


--
-- Name: TABLE guardian_operations; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.guardian_operations TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.guardian_operations TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.guardian_operations TO service_role;


--
-- Name: TABLE guardian_wallets; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.guardian_wallets TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.guardian_wallets TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.guardian_wallets TO service_role;


--
-- Name: TABLE health_checks; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.health_checks TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.health_checks TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.health_checks TO service_role;


--
-- Name: TABLE investor_approvals; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.investor_approvals TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.investor_approvals TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.investor_approvals TO service_role;


--
-- Name: TABLE investor_group_members; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.investor_group_members TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.investor_group_members TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.investor_group_members TO service_role;


--
-- Name: TABLE investor_groups; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.investor_groups TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.investor_groups TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.investor_groups TO service_role;


--
-- Name: TABLE investor_groups_investors; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.investor_groups_investors TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.investor_groups_investors TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.investor_groups_investors TO service_role;


--
-- Name: TABLE investors; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.investors TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.investors TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.investors TO service_role;


--
-- Name: TABLE investors_backup_pre_kyc_update; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.investors_backup_pre_kyc_update TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.investors_backup_pre_kyc_update TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.investors_backup_pre_kyc_update TO service_role;


--
-- Name: TABLE invoice; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.invoice TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.invoice TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.invoice TO service_role;


--
-- Name: SEQUENCE invoice_invoice_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.invoice_invoice_id_seq TO anon;
GRANT ALL ON SEQUENCE public.invoice_invoice_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.invoice_invoice_id_seq TO service_role;


--
-- Name: TABLE invoices; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.invoices TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.invoices TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.invoices TO service_role;


--
-- Name: TABLE issuer_access_roles; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.issuer_access_roles TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.issuer_access_roles TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.issuer_access_roles TO service_role;


--
-- Name: TABLE issuer_detail_documents; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.issuer_detail_documents TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.issuer_detail_documents TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.issuer_detail_documents TO service_role;


--
-- Name: TABLE issuer_documents; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.issuer_documents TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.issuer_documents TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.issuer_documents TO service_role;


--
-- Name: TABLE kyc_screening_logs; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.kyc_screening_logs TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.kyc_screening_logs TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.kyc_screening_logs TO service_role;


--
-- Name: TABLE latest_nav_by_fund; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.latest_nav_by_fund TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.latest_nav_by_fund TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.latest_nav_by_fund TO service_role;


--
-- Name: TABLE mfa_policies; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.mfa_policies TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.mfa_policies TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.mfa_policies TO service_role;


--
-- Name: TABLE monitoring_metrics; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.monitoring_metrics TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.monitoring_metrics TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.monitoring_metrics TO service_role;


--
-- Name: TABLE moonpay_asset_cache; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.moonpay_asset_cache TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.moonpay_asset_cache TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.moonpay_asset_cache TO service_role;


--
-- Name: TABLE moonpay_compliance_alerts; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.moonpay_compliance_alerts TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.moonpay_compliance_alerts TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.moonpay_compliance_alerts TO service_role;


--
-- Name: TABLE moonpay_customers; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.moonpay_customers TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.moonpay_customers TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.moonpay_customers TO service_role;


--
-- Name: TABLE moonpay_passes; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.moonpay_passes TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.moonpay_passes TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.moonpay_passes TO service_role;


--
-- Name: TABLE moonpay_policies; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.moonpay_policies TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.moonpay_policies TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.moonpay_policies TO service_role;


--
-- Name: TABLE moonpay_policy_logs; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.moonpay_policy_logs TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.moonpay_policy_logs TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.moonpay_policy_logs TO service_role;


--
-- Name: TABLE moonpay_projects; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.moonpay_projects TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.moonpay_projects TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.moonpay_projects TO service_role;


--
-- Name: TABLE moonpay_swap_transactions; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.moonpay_swap_transactions TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.moonpay_swap_transactions TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.moonpay_swap_transactions TO service_role;


--
-- Name: TABLE moonpay_transactions; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.moonpay_transactions TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.moonpay_transactions TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.moonpay_transactions TO service_role;


--
-- Name: TABLE moonpay_webhook_config; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.moonpay_webhook_config TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.moonpay_webhook_config TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.moonpay_webhook_config TO service_role;


--
-- Name: TABLE moonpay_webhook_events; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.moonpay_webhook_events TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.moonpay_webhook_events TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.moonpay_webhook_events TO service_role;


--
-- Name: TABLE multi_sig_confirmations; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.multi_sig_confirmations TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.multi_sig_confirmations TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.multi_sig_confirmations TO service_role;


--
-- Name: TABLE multi_sig_transactions; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.multi_sig_transactions TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.multi_sig_transactions TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.multi_sig_transactions TO service_role;


--
-- Name: TABLE multi_sig_wallets; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.multi_sig_wallets TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.multi_sig_wallets TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.multi_sig_wallets TO service_role;


--
-- Name: TABLE nav_oracle_configs; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.nav_oracle_configs TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.nav_oracle_configs TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.nav_oracle_configs TO service_role;


--
-- Name: TABLE notifications; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.notifications TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.notifications TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.notifications TO service_role;


--
-- Name: TABLE onboarding_restrictions; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.onboarding_restrictions TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.onboarding_restrictions TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.onboarding_restrictions TO service_role;


--
-- Name: TABLE onchain_claims; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.onchain_claims TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.onchain_claims TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.onchain_claims TO service_role;


--
-- Name: TABLE onchain_identities; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.onchain_identities TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.onchain_identities TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.onchain_identities TO service_role;


--
-- Name: TABLE onchain_issuers; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.onchain_issuers TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.onchain_issuers TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.onchain_issuers TO service_role;


--
-- Name: TABLE onchain_verification_history; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.onchain_verification_history TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.onchain_verification_history TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.onchain_verification_history TO service_role;


--
-- Name: TABLE organizations; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.organizations TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.organizations TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.organizations TO service_role;


--
-- Name: TABLE payer; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.payer TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.payer TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.payer TO service_role;


--
-- Name: SEQUENCE payer_payer_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.payer_payer_id_seq TO anon;
GRANT ALL ON SEQUENCE public.payer_payer_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.payer_payer_id_seq TO service_role;


--
-- Name: TABLE permissions; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.permissions TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.permissions TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.permissions TO service_role;


--
-- Name: TABLE policy_rule_approvers; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.policy_rule_approvers TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.policy_rule_approvers TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.policy_rule_approvers TO service_role;


--
-- Name: TABLE policy_rule_approvers_backup; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.policy_rule_approvers_backup TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.policy_rule_approvers_backup TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.policy_rule_approvers_backup TO service_role;


--
-- Name: TABLE policy_template_approvers; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.policy_template_approvers TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.policy_template_approvers TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.policy_template_approvers TO service_role;


--
-- Name: TABLE policy_templates; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.policy_templates TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.policy_templates TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.policy_templates TO service_role;


--
-- Name: TABLE pool; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.pool TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.pool TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.pool TO service_role;


--
-- Name: SEQUENCE pool_pool_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.pool_pool_id_seq TO anon;
GRANT ALL ON SEQUENCE public.pool_pool_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.pool_pool_id_seq TO service_role;


--
-- Name: TABLE project_credentials; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.project_credentials TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.project_credentials TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.project_credentials TO service_role;


--
-- Name: TABLE projects; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.projects TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.projects TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.projects TO service_role;


--
-- Name: TABLE provider; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.provider TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.provider TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.provider TO service_role;


--
-- Name: SEQUENCE provider_provider_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.provider_provider_id_seq TO anon;
GRANT ALL ON SEQUENCE public.provider_provider_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.provider_provider_id_seq TO service_role;


--
-- Name: TABLE ramp_network_config; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.ramp_network_config TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.ramp_network_config TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.ramp_network_config TO service_role;


--
-- Name: TABLE ramp_supported_assets; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.ramp_supported_assets TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.ramp_supported_assets TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.ramp_supported_assets TO service_role;


--
-- Name: TABLE ramp_transaction_events; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.ramp_transaction_events TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.ramp_transaction_events TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.ramp_transaction_events TO service_role;


--
-- Name: TABLE ramp_webhook_events; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.ramp_webhook_events TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.ramp_webhook_events TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.ramp_webhook_events TO service_role;


--
-- Name: TABLE redemption_approver_assignments; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.redemption_approver_assignments TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.redemption_approver_assignments TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.redemption_approver_assignments TO service_role;


--
-- Name: TABLE redemption_approval_status; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.redemption_approval_status TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.redemption_approval_status TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.redemption_approval_status TO service_role;


--
-- Name: TABLE redemption_approvers; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.redemption_approvers TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.redemption_approvers TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.redemption_approvers TO service_role;


--
-- Name: TABLE redemption_requests; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.redemption_requests TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.redemption_requests TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.redemption_requests TO service_role;


--
-- Name: TABLE redemption_rules; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.redemption_rules TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.redemption_rules TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.redemption_rules TO service_role;


--
-- Name: TABLE redemption_settlements; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.redemption_settlements TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.redemption_settlements TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.redemption_settlements TO service_role;


--
-- Name: TABLE regulatory_equivalence_mapping; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.regulatory_equivalence_mapping TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.regulatory_equivalence_mapping TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.regulatory_equivalence_mapping TO service_role;


--
-- Name: TABLE restriction_statistics; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.restriction_statistics TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.restriction_statistics TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.restriction_statistics TO service_role;


--
-- Name: TABLE ripple_payments; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.ripple_payments TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.ripple_payments TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.ripple_payments TO service_role;


--
-- Name: TABLE risk_assessments; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.risk_assessments TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.risk_assessments TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.risk_assessments TO service_role;


--
-- Name: TABLE role_permissions; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.role_permissions TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.role_permissions TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.role_permissions TO service_role;


--
-- Name: TABLE rules; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.rules TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.rules TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.rules TO service_role;


--
-- Name: TABLE secure_keys; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.secure_keys TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.secure_keys TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.secure_keys TO service_role;


--
-- Name: TABLE security_audit_logs; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.security_audit_logs TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.security_audit_logs TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.security_audit_logs TO service_role;


--
-- Name: TABLE security_events; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.security_events TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.security_events TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.security_events TO service_role;


--
-- Name: TABLE settlement_metrics; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.settlement_metrics TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.settlement_metrics TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.settlement_metrics TO service_role;


--
-- Name: TABLE settlement_summary; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.settlement_summary TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.settlement_summary TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.settlement_summary TO service_role;


--
-- Name: TABLE signatures; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.signatures TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.signatures TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.signatures TO service_role;


--
-- Name: TABLE stage_requirements; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.stage_requirements TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.stage_requirements TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.stage_requirements TO service_role;


--
-- Name: TABLE subscriptions; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.subscriptions TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.subscriptions TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.subscriptions TO service_role;


--
-- Name: TABLE system_processes; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.system_processes TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.system_processes TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.system_processes TO service_role;


--
-- Name: TABLE system_process_activities; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.system_process_activities TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.system_process_activities TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.system_process_activities TO service_role;


--
-- Name: TABLE system_process_activity; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.system_process_activity TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.system_process_activity TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.system_process_activity TO service_role;


--
-- Name: TABLE system_process_performance; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.system_process_performance TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.system_process_performance TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.system_process_performance TO service_role;


--
-- Name: TABLE system_settings; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.system_settings TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.system_settings TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.system_settings TO service_role;


--
-- Name: TABLE token_allocations; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_allocations TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_allocations TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_allocations TO service_role;


--
-- Name: TABLE token_deployment_history; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_deployment_history TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_deployment_history TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_deployment_history TO service_role;


--
-- Name: TABLE token_deployments; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_deployments TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_deployments TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_deployments TO service_role;


--
-- Name: TABLE token_designs; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_designs TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_designs TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_designs TO service_role;


--
-- Name: TABLE token_erc1155_balances; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1155_balances TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1155_balances TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1155_balances TO service_role;


--
-- Name: TABLE token_erc1155_crafting_recipes; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1155_crafting_recipes TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1155_crafting_recipes TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1155_crafting_recipes TO service_role;


--
-- Name: TABLE token_erc1155_discount_tiers; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1155_discount_tiers TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1155_discount_tiers TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1155_discount_tiers TO service_role;


--
-- Name: TABLE token_erc1155_properties; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1155_properties TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1155_properties TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1155_properties TO service_role;


--
-- Name: TABLE token_erc1155_type_configs; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1155_type_configs TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1155_type_configs TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1155_type_configs TO service_role;


--
-- Name: TABLE token_erc1155_types; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1155_types TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1155_types TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1155_types TO service_role;


--
-- Name: TABLE token_erc1155_uri_mappings; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1155_uri_mappings TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1155_uri_mappings TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1155_uri_mappings TO service_role;


--
-- Name: TABLE tokens; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.tokens TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.tokens TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.tokens TO service_role;


--
-- Name: TABLE token_erc1155_view; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1155_view TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1155_view TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1155_view TO service_role;


--
-- Name: TABLE token_erc1400_controllers; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1400_controllers TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1400_controllers TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1400_controllers TO service_role;


--
-- Name: TABLE token_erc1400_corporate_actions; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1400_corporate_actions TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1400_corporate_actions TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1400_corporate_actions TO service_role;


--
-- Name: TABLE token_erc1400_custody_providers; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1400_custody_providers TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1400_custody_providers TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1400_custody_providers TO service_role;


--
-- Name: TABLE token_erc1400_documents; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1400_documents TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1400_documents TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1400_documents TO service_role;


--
-- Name: TABLE token_erc1400_partition_balances; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1400_partition_balances TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1400_partition_balances TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1400_partition_balances TO service_role;


--
-- Name: TABLE token_erc1400_partition_operators; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1400_partition_operators TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1400_partition_operators TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1400_partition_operators TO service_role;


--
-- Name: TABLE token_erc1400_partition_transfers; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1400_partition_transfers TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1400_partition_transfers TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1400_partition_transfers TO service_role;


--
-- Name: TABLE token_erc1400_partitions; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1400_partitions TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1400_partitions TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1400_partitions TO service_role;


--
-- Name: TABLE token_erc1400_properties; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1400_properties TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1400_properties TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1400_properties TO service_role;


--
-- Name: TABLE token_erc1400_regulatory_filings; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1400_regulatory_filings TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1400_regulatory_filings TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1400_regulatory_filings TO service_role;


--
-- Name: TABLE token_erc1400_view; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1400_view TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1400_view TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc1400_view TO service_role;


--
-- Name: TABLE token_erc20_properties; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc20_properties TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc20_properties TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc20_properties TO service_role;


--
-- Name: TABLE token_erc20_view; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc20_view TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc20_view TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc20_view TO service_role;


--
-- Name: TABLE token_erc3525_allocations; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc3525_allocations TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc3525_allocations TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc3525_allocations TO service_role;


--
-- Name: TABLE token_erc3525_payment_schedules; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc3525_payment_schedules TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc3525_payment_schedules TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc3525_payment_schedules TO service_role;


--
-- Name: TABLE token_erc3525_properties; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc3525_properties TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc3525_properties TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc3525_properties TO service_role;


--
-- Name: TABLE token_erc3525_slot_configs; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc3525_slot_configs TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc3525_slot_configs TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc3525_slot_configs TO service_role;


--
-- Name: TABLE token_erc3525_slots; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc3525_slots TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc3525_slots TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc3525_slots TO service_role;


--
-- Name: TABLE token_erc3525_value_adjustments; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc3525_value_adjustments TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc3525_value_adjustments TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc3525_value_adjustments TO service_role;


--
-- Name: TABLE token_erc3525_view; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc3525_view TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc3525_view TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc3525_view TO service_role;


--
-- Name: TABLE token_erc4626_asset_allocations; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc4626_asset_allocations TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc4626_asset_allocations TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc4626_asset_allocations TO service_role;


--
-- Name: TABLE token_erc4626_fee_tiers; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc4626_fee_tiers TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc4626_fee_tiers TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc4626_fee_tiers TO service_role;


--
-- Name: TABLE token_erc4626_performance_metrics; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc4626_performance_metrics TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc4626_performance_metrics TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc4626_performance_metrics TO service_role;


--
-- Name: TABLE token_erc4626_properties; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc4626_properties TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc4626_properties TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc4626_properties TO service_role;


--
-- Name: TABLE token_erc4626_strategy_params; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc4626_strategy_params TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc4626_strategy_params TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc4626_strategy_params TO service_role;


--
-- Name: TABLE token_erc4626_vault_strategies; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc4626_vault_strategies TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc4626_vault_strategies TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc4626_vault_strategies TO service_role;


--
-- Name: TABLE token_erc4626_view; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc4626_view TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc4626_view TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc4626_view TO service_role;


--
-- Name: TABLE token_erc721_attributes; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc721_attributes TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc721_attributes TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc721_attributes TO service_role;


--
-- Name: TABLE token_erc721_mint_phases; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc721_mint_phases TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc721_mint_phases TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc721_mint_phases TO service_role;


--
-- Name: TABLE token_erc721_properties; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc721_properties TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc721_properties TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc721_properties TO service_role;


--
-- Name: TABLE token_erc721_trait_definitions; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc721_trait_definitions TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc721_trait_definitions TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc721_trait_definitions TO service_role;


--
-- Name: TABLE token_erc721_view; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc721_view TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc721_view TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_erc721_view TO service_role;


--
-- Name: TABLE token_events; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_events TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_events TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_events TO service_role;


--
-- Name: TABLE token_geographic_restrictions; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_geographic_restrictions TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_geographic_restrictions TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_geographic_restrictions TO service_role;


--
-- Name: TABLE token_geographic_restrictions_view; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_geographic_restrictions_view TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_geographic_restrictions_view TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_geographic_restrictions_view TO service_role;


--
-- Name: TABLE token_operations; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_operations TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_operations TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_operations TO service_role;


--
-- Name: TABLE token_sanctions_rules; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_sanctions_rules TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_sanctions_rules TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_sanctions_rules TO service_role;


--
-- Name: TABLE token_templates; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_templates TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_templates TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_templates TO service_role;


--
-- Name: TABLE token_versions; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_versions TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_versions TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_versions TO service_role;


--
-- Name: TABLE token_whitelists; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_whitelists TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_whitelists TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_whitelists TO service_role;


--
-- Name: TABLE token_whitelist_summary; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_whitelist_summary TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_whitelist_summary TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.token_whitelist_summary TO service_role;


--
-- Name: TABLE transaction_events; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.transaction_events TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.transaction_events TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.transaction_events TO service_role;


--
-- Name: TABLE transaction_notifications; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.transaction_notifications TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.transaction_notifications TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.transaction_notifications TO service_role;


--
-- Name: TABLE transaction_proposals; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.transaction_proposals TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.transaction_proposals TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.transaction_proposals TO service_role;


--
-- Name: TABLE transaction_signatures; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.transaction_signatures TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.transaction_signatures TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.transaction_signatures TO service_role;


--
-- Name: TABLE transactions; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.transactions TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.transactions TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.transactions TO service_role;


--
-- Name: TABLE transfer_history; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.transfer_history TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.transfer_history TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.transfer_history TO service_role;


--
-- Name: TABLE user_activity_summary; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.user_activity_summary TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.user_activity_summary TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.user_activity_summary TO service_role;


--
-- Name: TABLE user_mfa_settings; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.user_mfa_settings TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.user_mfa_settings TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.user_mfa_settings TO service_role;


--
-- Name: TABLE user_roles; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.user_roles TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.user_roles TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.user_roles TO service_role;


--
-- Name: TABLE user_permissions_view; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.user_permissions_view TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.user_permissions_view TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.user_permissions_view TO service_role;


--
-- Name: TABLE user_sessions; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.user_sessions TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.user_sessions TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.user_sessions TO service_role;


--
-- Name: TABLE valid_policy_approvers; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.valid_policy_approvers TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.valid_policy_approvers TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.valid_policy_approvers TO service_role;


--
-- Name: TABLE wallet_details; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.wallet_details TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.wallet_details TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.wallet_details TO service_role;


--
-- Name: TABLE wallet_signatories; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.wallet_signatories TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.wallet_signatories TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.wallet_signatories TO service_role;


--
-- Name: TABLE wallet_transactions; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.wallet_transactions TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.wallet_transactions TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.wallet_transactions TO service_role;


--
-- Name: TABLE whitelist_entries; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.whitelist_entries TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.whitelist_entries TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.whitelist_entries TO service_role;


--
-- Name: TABLE whitelist_settings; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.whitelist_settings TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.whitelist_settings TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.whitelist_settings TO service_role;


--
-- Name: TABLE whitelist_signatories; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.whitelist_signatories TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.whitelist_signatories TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.whitelist_signatories TO service_role;


--
-- Name: TABLE workflow_stages; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.workflow_stages TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.workflow_stages TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.workflow_stages TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO service_role;


--
-- PostgreSQL database dump complete
--

