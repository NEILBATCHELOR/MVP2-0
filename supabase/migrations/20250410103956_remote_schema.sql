

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."compliance_status" AS ENUM (
    'compliant',
    'non_compliant',
    'pending_review'
);


ALTER TYPE "public"."compliance_status" OWNER TO "postgres";


CREATE TYPE "public"."document_status" AS ENUM (
    'pending',
    'approved',
    'rejected',
    'expired'
);


ALTER TYPE "public"."document_status" OWNER TO "postgres";


CREATE TYPE "public"."document_type" AS ENUM (
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


ALTER TYPE "public"."document_type" OWNER TO "postgres";


CREATE TYPE "public"."issuer_role" AS ENUM (
    'admin',
    'editor',
    'viewer',
    'compliance_officer'
);


ALTER TYPE "public"."issuer_role" OWNER TO "postgres";


CREATE TYPE "public"."kyc_status" AS ENUM (
    'approved',
    'pending',
    'failed',
    'not_started',
    'expired'
);


ALTER TYPE "public"."kyc_status" OWNER TO "postgres";


CREATE TYPE "public"."workflow_status" AS ENUM (
    'pending',
    'completed',
    'rejected'
);


ALTER TYPE "public"."workflow_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_policy_approver"("p_policy_id" "uuid", "p_user_id" "text", "p_created_by" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO policy_rule_approvers (policy_rule_id, user_id, created_by, status)
  VALUES (p_policy_id, p_user_id::UUID, p_created_by, 'pending')
  ON CONFLICT (policy_rule_id, user_id) 
  DO UPDATE SET status = 'pending', timestamp = now();
END;
$$;


ALTER FUNCTION "public"."add_policy_approver"("p_policy_id" "uuid", "p_user_id" "text", "p_created_by" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_policy_approver"("policy_id" "text", "user_id" "text", "created_by" "text", "status_val" "text" DEFAULT 'pending'::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."add_policy_approver"("policy_id" "text", "user_id" "text", "created_by" "text", "status_val" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_policy_approver_with_cast"("policy_id" "text", "user_id" "text", "created_by_id" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."add_policy_approver_with_cast"("policy_id" "text", "user_id" "text", "created_by_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_rule_to_approval_queue"() RETURNS "trigger"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."add_rule_to_approval_queue"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_table_to_realtime"("table_name" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- This function is just a placeholder
  -- The actual ALTER PUBLICATION is done in the migration
  RETURN;
END;
$$;


ALTER FUNCTION "public"."add_table_to_realtime"("table_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_template_to_approval_queue"() RETURNS "trigger"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."add_template_to_approval_queue"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_all_approvals"() RETURNS "trigger"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."check_all_approvals"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_document_expiry"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."check_document_expiry"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_permission"("p_role_name" "text", "p_resource" "text", "p_action" "text") RETURNS boolean
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."check_permission"("p_role_name" "text", "p_resource" "text", "p_action" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_role_exists"() RETURNS "trigger"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."check_role_exists"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_user_permission"("user_id" "uuid", "permission" "text") RETURNS boolean
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."check_user_permission"("user_id" "uuid", "permission" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_document_version"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."create_document_version"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_token_version"() RETURNS "trigger"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."create_token_version"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_transaction_events_table"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Table is created in the migration, this is just a placeholder
  -- for the API to call to ensure the table exists
  RETURN;
END;
$$;


ALTER FUNCTION "public"."create_transaction_events_table"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_user_with_privileges"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."delete_user_with_privileges"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."disable_rls_for_deletion"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Temporarily disable RLS
  ALTER TABLE users DISABLE ROW LEVEL SECURITY;
  ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
  ALTER TABLE user_sessions DISABLE ROW LEVEL SECURITY;
  RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."disable_rls_for_deletion"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enable_rls_after_deletion"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Re-enable RLS
  ALTER TABLE users ENABLE ROW LEVEL SECURITY;
  ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
  ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
  RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."enable_rls_after_deletion"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_users_with_any_permission"("permission_names" "text"[]) RETURNS TABLE("user_id" "uuid", "name" "text", "email" "text", "role" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."get_users_with_any_permission"("permission_names" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_users_with_permission"("permission_name" "text") RETURNS TABLE("user_id" "uuid", "name" "text", "email" "text", "role" "text")
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."get_users_with_permission"("permission_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_users_with_permission_simple"("p_permission_id" "text") RETURNS SETOF "text"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."get_users_with_permission_simple"("p_permission_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_auth_user_created"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.auth_events (user_id, event_type, metadata)
  VALUES (NEW.id, 'user_created', json_build_object('email', NEW.email));
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_auth_user_created"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_rule_rejection"() RETURNS "trigger"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."handle_rule_rejection"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_user_deletion"() RETURNS "trigger"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."handle_user_deletion"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_policy_approver"("p_policy_id" "uuid", "p_user_id" "text", "p_created_by" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO policy_rule_approvers (policy_rule_id, user_id, created_by, status)
  VALUES (p_policy_id, p_user_id::UUID, p_created_by::UUID, 'pending')
  ON CONFLICT (policy_rule_id, user_id) 
  DO UPDATE SET status = 'pending', timestamp = now();
END;
$$;


ALTER FUNCTION "public"."insert_policy_approver"("p_policy_id" "uuid", "p_user_id" "text", "p_created_by" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."list_tables"() RETURNS TABLE("table_name" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT tablename::text
  FROM pg_catalog.pg_tables
  WHERE schemaname = 'public'
  ORDER BY tablename;
END;
$$;


ALTER FUNCTION "public"."list_tables"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_audit"("p_action" "text", "p_user_id" "uuid", "p_entity_type" "text", "p_entity_id" "text" DEFAULT NULL::"text", "p_details" "text" DEFAULT NULL::"text", "p_status" "text" DEFAULT 'Success'::"text", "p_metadata" "jsonb" DEFAULT NULL::"jsonb", "p_old_data" "jsonb" DEFAULT NULL::"jsonb", "p_new_data" "jsonb" DEFAULT NULL::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."log_audit"("p_action" "text", "p_user_id" "uuid", "p_entity_type" "text", "p_entity_id" "text", "p_details" "text", "p_status" "text", "p_metadata" "jsonb", "p_old_data" "jsonb", "p_new_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_auth_event"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."log_auth_event"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_user_action"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."log_user_action"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."log_user_action"() IS 'This function handles audit logging for various tables, with special handling for token_templates';



CREATE OR REPLACE FUNCTION "public"."projects_audit_function"() RETURNS "trigger"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."projects_audit_function"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."safe_cast_to_uuid"("input" "text") RETURNS "uuid"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."safe_cast_to_uuid"("input" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."safe_uuid_cast"("text_id" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."safe_uuid_cast"("text_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."save_consensus_config"("p_consensus_type" "text", "p_required_approvals" integer, "p_eligible_roles" "text"[]) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."save_consensus_config"("p_consensus_type" "text", "p_required_approvals" integer, "p_eligible_roles" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_consensus_settings_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_consensus_settings_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_modified_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;   
END;
$$;


ALTER FUNCTION "public"."update_modified_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_role"("p_user_id" "uuid", "p_role" "text") RETURNS "void"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."update_user_role"("p_user_id" "uuid", "p_role" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_has_delete_permission"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."user_has_delete_permission"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_blockchain_address"("blockchain" "text", "address" "text") RETURNS boolean
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."validate_blockchain_address"("blockchain" "text", "address" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_token_data"() RETURNS "trigger"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."validate_token_data"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_wallet_address"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NOT validate_blockchain_address(NEW.blockchain, NEW.address) THEN
    RAISE EXCEPTION 'Invalid address format for blockchain %', NEW.blockchain;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_wallet_address"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."approval_configs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "permission_id" "uuid" NOT NULL,
    "required_approvals" integer DEFAULT 2 NOT NULL,
    "eligible_roles" "text"[] NOT NULL,
    "auto_approval_conditions" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "consensus_type" "text" DEFAULT '2of3'::"text" NOT NULL
);


ALTER TABLE "public"."approval_configs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."approval_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "action" character varying(100) NOT NULL,
    "resource" character varying(100) NOT NULL,
    "resource_id" character varying(100) NOT NULL,
    "requested_by" "uuid" NOT NULL,
    "status" character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    "approvers" "uuid"[] NOT NULL,
    "approved_by" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL,
    "rejected_by" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL,
    "required_approvals" integer DEFAULT 2 NOT NULL,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "approval_requests_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::"text"[])))
);


ALTER TABLE "public"."approval_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "action" "text" NOT NULL,
    "username" "text" DEFAULT 'system'::"text",
    "details" "text" DEFAULT 'system action'::"text",
    "status" "text" DEFAULT 'Success'::"text",
    "signature" "text",
    "verified" boolean DEFAULT false,
    "user_email" "text",
    "user_id" "uuid",
    "entity_type" "text",
    "entity_id" "text",
    "old_data" "jsonb",
    "new_data" "jsonb",
    "metadata" "jsonb",
    "project_id" "uuid",
    "action_type" "text",
    "changes" "jsonb",
    "occurred_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."auth_events" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "event_type" "text" NOT NULL,
    "ip_address" "text",
    "user_agent" "text",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."auth_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bulk_operations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "completed_at" timestamp with time zone,
    "created_by" "uuid",
    "metadata" "jsonb",
    "operation_type" "text",
    "status" "text",
    "tags" "text"[],
    "target_ids" "uuid"[],
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."bulk_operations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cap_table_investors" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "cap_table_id" "uuid",
    "investor_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."cap_table_investors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cap_tables" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "project_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."cap_tables" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."compliance_checks" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "investor_id" "uuid" NOT NULL,
    "project_id" "uuid" NOT NULL,
    "risk_level" "text" NOT NULL,
    "risk_reason" "text" NOT NULL,
    "status" "text" NOT NULL,
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "compliance_checks_risk_level_check" CHECK (("risk_level" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text"]))),
    CONSTRAINT "compliance_checks_status_check" CHECK (("status" = ANY (ARRAY['pending_approval'::"text", 'approved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."compliance_checks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."compliance_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "issuer_id" "uuid" NOT NULL,
    "generated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "public"."compliance_status" DEFAULT 'pending_review'::"public"."compliance_status" NOT NULL,
    "findings" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid" NOT NULL,
    "updated_by" "uuid" NOT NULL
);


ALTER TABLE "public"."compliance_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."compliance_settings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "organization_id" "text" NOT NULL,
    "kyc_status" "text" DEFAULT 'not_started'::"text" NOT NULL,
    "require_accreditation" boolean DEFAULT false NOT NULL,
    "minimum_investment" integer DEFAULT 0 NOT NULL,
    "jurisdictions" "text"[] DEFAULT '{}'::"text"[],
    "investor_count" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."compliance_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."consensus_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "consensus_type" "text" NOT NULL,
    "required_approvals" integer NOT NULL,
    "eligible_roles" "text"[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."consensus_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."document_approvals" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "document_id" "uuid",
    "approver_id" "uuid",
    "status" "text" NOT NULL,
    "comments" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "document_approvals_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."document_approvals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."document_versions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "document_id" "uuid",
    "version_number" integer NOT NULL,
    "file_path" "text",
    "file_url" "text",
    "uploaded_by" "uuid",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."document_versions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."document_workflows" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "document_id" "uuid" NOT NULL,
    "required_signers" "uuid"[] NOT NULL,
    "completed_signers" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL,
    "status" "public"."workflow_status" DEFAULT 'pending'::"public"."workflow_status" NOT NULL,
    "deadline" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid" NOT NULL,
    "updated_by" "uuid" NOT NULL,
    CONSTRAINT "valid_deadline" CHECK (("deadline" > "created_at")),
    CONSTRAINT "valid_signers" CHECK ((("array_length"("completed_signers", 1) <= "array_length"("required_signers", 1)) AND ("completed_signers" <@ "required_signers")))
);


ALTER TABLE "public"."document_workflows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."documents" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "type" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "file_path" "text",
    "file_url" "text",
    "entity_id" "uuid" NOT NULL,
    "entity_type" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "category" "text",
    "project_id" "uuid",
    "uploaded_by" "uuid",
    "expiry_date" timestamp with time zone,
    "workflow_stage_id" "text",
    "version" integer DEFAULT 1
);


ALTER TABLE "public"."documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."investor_group_members" (
    "group_id" "uuid" NOT NULL,
    "investor_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."investor_group_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."investor_groups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "project_id" "uuid",
    "description" "text",
    "member_count" integer DEFAULT 0 NOT NULL,
    "group" "text"
);


ALTER TABLE "public"."investor_groups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."investor_groups_investors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "investor_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."investor_groups_investors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."investors" (
    "investor_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "type" "text" NOT NULL,
    "wallet_address" "text",
    "kyc_status" "text" NOT NULL,
    "lastUpdated" "text",
    "verification_details" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "kyc_expiry_date" timestamp with time zone,
    "company" "text",
    "notes" "text"
);


ALTER TABLE "public"."investors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "amount" numeric,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "currency" "text",
    "due_date" "date",
    "invoice_number" "text",
    "issued_date" "date",
    "paid" boolean DEFAULT false,
    "subscription_id" "uuid"
);


ALTER TABLE "public"."invoices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."issuer_access_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "issuer_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "public"."issuer_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid" NOT NULL,
    "updated_by" "uuid" NOT NULL
);


ALTER TABLE "public"."issuer_access_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."issuer_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "issuer_id" "uuid" NOT NULL,
    "document_type" "public"."document_type" NOT NULL,
    "file_url" "text" NOT NULL,
    "status" "public"."document_status" DEFAULT 'pending'::"public"."document_status" NOT NULL,
    "uploaded_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone,
    "last_reviewed_at" timestamp with time zone,
    "reviewed_by" "uuid",
    "version" integer DEFAULT 1 NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid" NOT NULL,
    "updated_by" "uuid" NOT NULL,
    CONSTRAINT "valid_expiry_date" CHECK (("expires_at" > "uploaded_at")),
    CONSTRAINT "valid_review_date" CHECK (("last_reviewed_at" >= "uploaded_at"))
);


ALTER TABLE "public"."issuer_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."kyc_screening_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "investor_id" "uuid" NOT NULL,
    "previous_status" "text",
    "new_status" "text",
    "method" "text" NOT NULL,
    "notes" "text",
    "performed_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."kyc_screening_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mfa_policies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "required" boolean NOT NULL,
    "applies_to" "uuid"[] NOT NULL,
    "exceptions" "uuid"[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."mfa_policies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."multi_sig_confirmations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "transaction_id" "uuid",
    "owner" "text" NOT NULL,
    "signature" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "confirmed" boolean,
    "signer" "text",
    "timestamp" timestamp with time zone
);


ALTER TABLE "public"."multi_sig_confirmations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."multi_sig_transactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "wallet_id" "uuid",
    "destination_wallet_address" "text" NOT NULL,
    "value" "text" NOT NULL,
    "data" "text" DEFAULT '0x'::"text" NOT NULL,
    "nonce" integer NOT NULL,
    "hash" "text" NOT NULL,
    "executed" boolean DEFAULT false NOT NULL,
    "confirmations" integer DEFAULT 0 NOT NULL,
    "blockchain" "text" NOT NULL,
    "token_address" "text",
    "token_symbol" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "blockchain_specific_data" "jsonb",
    "description" "text",
    "required" integer,
    "to" "text"
);


ALTER TABLE "public"."multi_sig_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."multi_sig_wallets" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "blockchain" "text" NOT NULL,
    "address" "text" NOT NULL,
    "owners" "text"[] NOT NULL,
    "threshold" integer NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "multi_sig_wallets_blockchain_check" CHECK (("blockchain" = ANY (ARRAY['ethereum'::"text", 'polygon'::"text", 'avalanche'::"text", 'optimism'::"text", 'solana'::"text", 'bitcoin'::"text", 'ripple'::"text", 'aptos'::"text", 'sui'::"text", 'mantle'::"text", 'stellar'::"text", 'hedera'::"text", 'base'::"text", 'zksync'::"text", 'arbitrum'::"text", 'near'::"text"])))
);


ALTER TABLE "public"."multi_sig_wallets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "text" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "read" boolean DEFAULT false NOT NULL,
    "action_required" boolean DEFAULT false NOT NULL,
    "action_url" "text",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."onboarding_restrictions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "type" "text" NOT NULL,
    "value" "text" NOT NULL,
    "reason" "text" NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "created_by" "text" NOT NULL,
    CONSTRAINT "onboarding_restrictions_type_check" CHECK (("type" = ANY (ARRAY['COUNTRY'::"text", 'INVESTOR_TYPE'::"text"])))
);


ALTER TABLE "public"."onboarding_restrictions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."permissions" (
    "name" "text" NOT NULL,
    "description" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."policy_rule_approvers" (
    "policy_rule_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid" NOT NULL,
    "status" "text",
    "comment" "text",
    "timestamp" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."policy_rule_approvers" OWNER TO "postgres";


COMMENT ON TABLE "public"."policy_rule_approvers" IS 'Stores approvers assigned to specific policy rules';



CREATE TABLE IF NOT EXISTS "public"."policy_template_approvers" (
    "template_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_by" "uuid",
    "status" "text" DEFAULT 'pending'::"text",
    "timestamp" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."policy_template_approvers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."policy_templates" (
    "template_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "template_name" "text" NOT NULL,
    "description" "text",
    "template_data" "jsonb" NOT NULL,
    "created_by" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "template_type" "text" GENERATED ALWAYS AS (
CASE
    WHEN (("template_data" ->> 'type'::"text") IS NOT NULL) THEN ("template_data" ->> 'type'::"text")
    ELSE 'general'::"text"
END) STORED,
    "status" "text" DEFAULT 'active'::"text" NOT NULL
);


ALTER TABLE "public"."policy_templates" OWNER TO "postgres";


COMMENT ON TABLE "public"."policy_templates" IS 'Stores reusable policy templates';



COMMENT ON COLUMN "public"."policy_templates"."status" IS 'Status of the template (active, inactive)';



CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "project_type" "text",
    "token_symbol" "text",
    "target_raise" numeric,
    "authorized_shares" integer,
    "share_price" numeric,
    "company_valuation" numeric,
    "funding_round" "text",
    "legal_entity" "text",
    "jurisdiction" "text",
    "tax_id" "text",
    "status" "text" DEFAULT 'active'::"text"
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."redemption_approvers" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "redemption_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "role" "text" NOT NULL,
    "avatar_url" "text",
    "approved" boolean DEFAULT false NOT NULL,
    "approved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."redemption_approvers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."redemption_requests" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "token_amount" numeric NOT NULL,
    "token_type" "text" NOT NULL,
    "redemption_type" "text" NOT NULL,
    "status" "text" NOT NULL,
    "source_wallet_address" "text" NOT NULL,
    "destination_wallet_address" "text" NOT NULL,
    "conversion_rate" numeric NOT NULL,
    "investor_name" "text",
    "investor_id" "text",
    "required_approvals" integer DEFAULT 1 NOT NULL,
    "is_bulk_redemption" boolean DEFAULT false,
    "investor_count" integer DEFAULT 1,
    "rejection_reason" "text",
    "rejected_by" "text",
    "rejection_timestamp" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."redemption_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."redemption_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "rule_id" "uuid",
    "redemption_type" "text" NOT NULL,
    "require_multi_sig_approval" boolean DEFAULT true,
    "required_approvers" integer DEFAULT 2,
    "total_approvers" integer DEFAULT 3,
    "notify_investors" boolean DEFAULT true,
    "settlement_method" "text" DEFAULT 'stablecoin'::"text",
    "immediate_execution" boolean,
    "use_latest_nav" boolean,
    "allow_any_time_redemption" boolean,
    "repurchase_frequency" "text",
    "lock_up_period" integer,
    "submission_window_days" integer,
    "lock_tokens_on_request" boolean,
    "use_window_nav" boolean,
    "enable_pro_rata_distribution" boolean,
    "queue_unprocessed_requests" boolean,
    "enable_admin_override" boolean,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "redemption_rules_redemption_type_check" CHECK (("redemption_type" = ANY (ARRAY['standard'::"text", 'interval'::"text"]))),
    CONSTRAINT "redemption_rules_settlement_method_check" CHECK (("settlement_method" = ANY (ARRAY['stablecoin'::"text", 'fiat'::"text", 'hybrid'::"text"])))
);


ALTER TABLE "public"."redemption_rules" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."restriction_statistics" AS
 SELECT "count"(*) AS "total_rules",
    "count"(*) FILTER (WHERE ("onboarding_restrictions"."active" = true)) AS "active_rules",
    "count"(*) FILTER (WHERE (("onboarding_restrictions"."type" = 'COUNTRY'::"text") AND ("onboarding_restrictions"."active" = true))) AS "blocked_countries",
    "count"(*) FILTER (WHERE (("onboarding_restrictions"."type" = 'INVESTOR_TYPE'::"text") AND ("onboarding_restrictions"."active" = true))) AS "blocked_investor_types"
   FROM "public"."onboarding_restrictions";


ALTER TABLE "public"."restriction_statistics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."role_permissions" (
    "role_id" "uuid" NOT NULL,
    "permission_name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."role_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" NOT NULL,
    "priority" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rules" (
    "rule_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "rule_name" "text" NOT NULL,
    "rule_type" "text" NOT NULL,
    "rule_details" "jsonb",
    "created_by" "uuid" NOT NULL,
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_template" boolean DEFAULT false,
    CONSTRAINT "rules_created_by_uuid_check" CHECK ((("created_by")::"text" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'::"text"))
);


ALTER TABLE "public"."rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."signatures" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "proposal_id" "uuid",
    "signer" "text" NOT NULL,
    "signature" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."signatures" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stage_requirements" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "stage_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "completed_at" timestamp with time zone,
    "failure_reason" "text",
    "order" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."stage_requirements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "investor_id" "uuid" NOT NULL,
    "subscription_id" "text" NOT NULL,
    "fiat_amount" numeric NOT NULL,
    "currency" "text" NOT NULL,
    "confirmed" boolean DEFAULT false NOT NULL,
    "allocated" boolean DEFAULT false NOT NULL,
    "distributed" boolean DEFAULT false NOT NULL,
    "notes" "text",
    "subscription_date" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "project_id" "uuid"
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "value" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."system_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."token_allocations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "investor_id" "uuid" NOT NULL,
    "subscription_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "token_type" "text" NOT NULL,
    "token_amount" numeric NOT NULL,
    "distributed" boolean DEFAULT false NOT NULL,
    "distribution_date" timestamp with time zone,
    "distribution_tx_hash" "text",
    "notes" "text",
    "allocation_date" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "minted" boolean DEFAULT false NOT NULL,
    "minting_date" timestamp with time zone,
    "minting_tx_hash" "text",
    CONSTRAINT "token_allocations_token_amount_check" CHECK (("token_amount" > (0)::numeric)),
    CONSTRAINT "token_allocations_token_type_check" CHECK (("token_type" = ANY (ARRAY['ERC-20'::"text", 'ERC-721'::"text", 'ERC-1155'::"text", 'ERC-1400'::"text", 'ERC-3525'::"text", 'ERC-4626'::"text"])))
);


ALTER TABLE "public"."token_allocations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."token_deployments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "token_id" "uuid" NOT NULL,
    "network" "text" NOT NULL,
    "contract_address" "text" NOT NULL,
    "transaction_hash" "text" NOT NULL,
    "deployed_at" timestamp with time zone DEFAULT "now"(),
    "deployed_by" "text" NOT NULL,
    "status" "text" DEFAULT 'PENDING'::"text" NOT NULL,
    "deployment_data" "jsonb"
);


ALTER TABLE "public"."token_deployments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."token_designs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "name" "text" NOT NULL,
    "type" "text" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "total_supply" numeric NOT NULL,
    "contract_address" "text",
    "deployment_date" timestamp with time zone,
    CONSTRAINT "token_designs_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'ready'::"text", 'minted'::"text"]))),
    CONSTRAINT "token_designs_type_check" CHECK (("type" = ANY (ARRAY['ERC-20'::"text", 'ERC-721'::"text", 'ERC-1155'::"text", 'ERC-1400'::"text", 'ERC-3525'::"text"])))
);


ALTER TABLE "public"."token_designs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."token_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "standard" "text" NOT NULL,
    "blocks" "jsonb" NOT NULL,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "token_templates_standard_check" CHECK (("standard" = ANY (ARRAY['ERC-20'::"text", 'ERC-721'::"text", 'ERC-1155'::"text", 'ERC-1400'::"text", 'ERC-3525'::"text", 'ERC-4626'::"text"])))
);


ALTER TABLE "public"."token_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."token_versions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "token_id" "uuid" NOT NULL,
    "version" integer NOT NULL,
    "data" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "text",
    "blocks" "jsonb",
    "decimals" integer,
    "metadata" "jsonb",
    "name" "text",
    "standard" "text",
    "symbol" "text"
);


ALTER TABLE "public"."token_versions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "symbol" "text" NOT NULL,
    "decimals" integer DEFAULT 18 NOT NULL,
    "standard" "text" NOT NULL,
    "blocks" "jsonb" NOT NULL,
    "metadata" "jsonb",
    "status" "text" DEFAULT 'DRAFT'::"text" NOT NULL,
    "reviewers" "text"[] DEFAULT '{}'::"text"[],
    "approvals" "text"[] DEFAULT '{}'::"text"[],
    "contract_preview" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transaction_events" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "request_id" "text" NOT NULL,
    "event_type" "text" NOT NULL,
    "timestamp" timestamp with time zone DEFAULT "now"() NOT NULL,
    "data" "jsonb" NOT NULL,
    "actor" "text",
    "actor_role" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."transaction_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transaction_notifications" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "transaction_id" "text",
    "wallet_address" "text" NOT NULL,
    "type" "text" NOT NULL,
    "message" "text" NOT NULL,
    "read" boolean DEFAULT false,
    "action_url" "text",
    "data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."transaction_notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transaction_proposals" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "wallet_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "to_address" "text" NOT NULL,
    "value" "text" NOT NULL,
    "data" "text" DEFAULT '0x'::"text",
    "nonce" integer,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "blockchain" "text" NOT NULL,
    "token_address" "text",
    "token_symbol" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."transaction_proposals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_mfa_settings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "enabled" boolean DEFAULT false NOT NULL,
    "verified" boolean DEFAULT false NOT NULL,
    "secret" "text",
    "backup_codes" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_mfa_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "user_id" "uuid" NOT NULL,
    "role_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "public_key" "text",
    "encrypted_private_key" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."user_permissions_view" AS
 SELECT "u"."id" AS "user_id",
    "u"."name" AS "user_name",
    "u"."email",
    "r"."name" AS "role_name",
    "p"."name" AS "permission_name",
    "p"."description" AS "permission_description"
   FROM (((("public"."users" "u"
     JOIN "public"."user_roles" "ur" ON (("u"."id" = "ur"."user_id")))
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
     JOIN "public"."role_permissions" "rp" ON (("r"."id" = "rp"."role_id")))
     JOIN "public"."permissions" "p" ON (("rp"."permission_name" = "p"."name")));


ALTER TABLE "public"."user_permissions_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_sessions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "session_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "last_active_at" timestamp with time zone DEFAULT "now"(),
    "ip_address" "text",
    "user_agent" "text",
    "device_info" "jsonb"
);


ALTER TABLE "public"."user_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wallet_details" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "wallet_id" "uuid",
    "blockchain_specific_data" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."wallet_details" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wallet_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "chain_id" "text",
    "data" "jsonb",
    "from_address" "text",
    "gas_limit" numeric,
    "gas_price" numeric,
    "nonce" integer,
    "to_address" "text",
    "value" numeric,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "tx_hash" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "token_symbol" "text",
    "token_address" "text",
    "confirmation_count" integer DEFAULT 0,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."wallet_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."whitelist_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "rule_id" "uuid",
    "required_approvals" integer NOT NULL,
    "total_approvers" integer NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "whitelist_settings_check" CHECK (("total_approvers" >= "required_approvals")),
    CONSTRAINT "whitelist_settings_required_approvals_check" CHECK (("required_approvals" > 0))
);


ALTER TABLE "public"."whitelist_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."whitelist_signatories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "whitelist_id" "uuid",
    "user_id" "uuid",
    "approved" boolean DEFAULT false,
    "approved_at" timestamp with time zone
);


ALTER TABLE "public"."whitelist_signatories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workflow_stages" (
    "id" "text" NOT NULL,
    "organization_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "status" "text" NOT NULL,
    "completion_percentage" integer DEFAULT 0 NOT NULL,
    "order" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."workflow_stages" OWNER TO "postgres";


ALTER TABLE ONLY "public"."approval_configs"
    ADD CONSTRAINT "approval_configs_permission_id_key" UNIQUE ("permission_id");



ALTER TABLE ONLY "public"."approval_configs"
    ADD CONSTRAINT "approval_configs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."approval_requests"
    ADD CONSTRAINT "approval_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."auth_events"
    ADD CONSTRAINT "auth_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bulk_operations"
    ADD CONSTRAINT "bulk_operations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cap_table_investors"
    ADD CONSTRAINT "cap_table_investors_cap_table_id_investor_id_key" UNIQUE ("cap_table_id", "investor_id");



ALTER TABLE ONLY "public"."cap_table_investors"
    ADD CONSTRAINT "cap_table_investors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cap_table_investors"
    ADD CONSTRAINT "cap_table_investors_unique_constraint" UNIQUE ("cap_table_id", "investor_id");



ALTER TABLE ONLY "public"."cap_tables"
    ADD CONSTRAINT "cap_tables_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."compliance_checks"
    ADD CONSTRAINT "compliance_checks_investor_id_project_id_key" UNIQUE ("investor_id", "project_id");



ALTER TABLE ONLY "public"."compliance_checks"
    ADD CONSTRAINT "compliance_checks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."compliance_reports"
    ADD CONSTRAINT "compliance_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."compliance_settings"
    ADD CONSTRAINT "compliance_settings_organization_id_key" UNIQUE ("organization_id");



ALTER TABLE ONLY "public"."compliance_settings"
    ADD CONSTRAINT "compliance_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."consensus_settings"
    ADD CONSTRAINT "consensus_settings_consensus_type_key" UNIQUE ("consensus_type");



ALTER TABLE ONLY "public"."consensus_settings"
    ADD CONSTRAINT "consensus_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_approvals"
    ADD CONSTRAINT "document_approvals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_versions"
    ADD CONSTRAINT "document_versions_document_id_version_number_key" UNIQUE ("document_id", "version_number");



ALTER TABLE ONLY "public"."document_versions"
    ADD CONSTRAINT "document_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_workflows"
    ADD CONSTRAINT "document_workflows_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."investor_group_members"
    ADD CONSTRAINT "investor_group_members_pkey" PRIMARY KEY ("group_id", "investor_id");



ALTER TABLE ONLY "public"."investor_groups_investors"
    ADD CONSTRAINT "investor_groups_investors_group_id_investor_id_key" UNIQUE ("group_id", "investor_id");



ALTER TABLE ONLY "public"."investor_groups_investors"
    ADD CONSTRAINT "investor_groups_investors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."investor_groups"
    ADD CONSTRAINT "investor_groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."investors"
    ADD CONSTRAINT "investors_pkey" PRIMARY KEY ("investor_id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."issuer_access_roles"
    ADD CONSTRAINT "issuer_access_roles_issuer_id_user_id_key" UNIQUE ("issuer_id", "user_id");



ALTER TABLE ONLY "public"."issuer_access_roles"
    ADD CONSTRAINT "issuer_access_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."issuer_documents"
    ADD CONSTRAINT "issuer_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."kyc_screening_logs"
    ADD CONSTRAINT "kyc_screening_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mfa_policies"
    ADD CONSTRAINT "mfa_policies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."multi_sig_confirmations"
    ADD CONSTRAINT "multi_sig_confirmations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."multi_sig_transactions"
    ADD CONSTRAINT "multi_sig_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."multi_sig_wallets"
    ADD CONSTRAINT "multi_sig_wallets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."onboarding_restrictions"
    ADD CONSTRAINT "onboarding_restrictions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_pkey" PRIMARY KEY ("name");



ALTER TABLE ONLY "public"."policy_rule_approvers"
    ADD CONSTRAINT "policy_rule_approvers_pkey" PRIMARY KEY ("policy_rule_id", "user_id");



ALTER TABLE ONLY "public"."policy_template_approvers"
    ADD CONSTRAINT "policy_template_approvers_pkey" PRIMARY KEY ("template_id", "user_id");



ALTER TABLE ONLY "public"."policy_templates"
    ADD CONSTRAINT "policy_templates_pkey" PRIMARY KEY ("template_id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."redemption_approvers"
    ADD CONSTRAINT "redemption_approvers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."redemption_requests"
    ADD CONSTRAINT "redemption_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."redemption_rules"
    ADD CONSTRAINT "redemption_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id", "permission_name");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rules"
    ADD CONSTRAINT "rules_pkey" PRIMARY KEY ("rule_id");



ALTER TABLE ONLY "public"."signatures"
    ADD CONSTRAINT "signatures_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stage_requirements"
    ADD CONSTRAINT "stage_requirements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_key_unique" UNIQUE ("key");



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."token_allocations"
    ADD CONSTRAINT "token_allocations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."token_deployments"
    ADD CONSTRAINT "token_deployments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."token_designs"
    ADD CONSTRAINT "token_designs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."token_templates"
    ADD CONSTRAINT "token_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."token_versions"
    ADD CONSTRAINT "token_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tokens"
    ADD CONSTRAINT "tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transaction_events"
    ADD CONSTRAINT "transaction_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transaction_notifications"
    ADD CONSTRAINT "transaction_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transaction_proposals"
    ADD CONSTRAINT "transaction_proposals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_mfa_settings"
    ADD CONSTRAINT "user_mfa_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wallet_details"
    ADD CONSTRAINT "wallet_details_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wallet_transactions"
    ADD CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."whitelist_settings"
    ADD CONSTRAINT "whitelist_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."whitelist_signatories"
    ADD CONSTRAINT "whitelist_signatories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."whitelist_signatories"
    ADD CONSTRAINT "whitelist_signatories_whitelist_id_user_id_key" UNIQUE ("whitelist_id", "user_id");



ALTER TABLE ONLY "public"."workflow_stages"
    ADD CONSTRAINT "workflow_stages_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_audit_logs_action" ON "public"."audit_logs" USING "btree" ("action");



CREATE INDEX "idx_audit_logs_entity_type" ON "public"."audit_logs" USING "btree" ("entity_type");



CREATE INDEX "idx_audit_logs_status" ON "public"."audit_logs" USING "btree" ("status");



CREATE INDEX "idx_audit_logs_timestamp" ON "public"."audit_logs" USING "btree" ("timestamp" DESC);



CREATE INDEX "idx_audit_logs_user" ON "public"."audit_logs" USING "btree" ("username");



CREATE INDEX "idx_audit_logs_user_id" ON "public"."audit_logs" USING "btree" ("user_id");



CREATE INDEX "idx_compliance_checks_project_risk" ON "public"."compliance_checks" USING "btree" ("project_id", "risk_level");



CREATE INDEX "idx_compliance_reports_generated_at" ON "public"."compliance_reports" USING "btree" ("generated_at");



CREATE INDEX "idx_compliance_reports_issuer_id" ON "public"."compliance_reports" USING "btree" ("issuer_id");



CREATE INDEX "idx_compliance_reports_status" ON "public"."compliance_reports" USING "btree" ("status");



CREATE INDEX "idx_document_approvals_document_id" ON "public"."document_approvals" USING "btree" ("document_id");



CREATE INDEX "idx_document_versions_document_id" ON "public"."document_versions" USING "btree" ("document_id");



CREATE INDEX "idx_document_workflows_document_id" ON "public"."document_workflows" USING "btree" ("document_id");



CREATE INDEX "idx_document_workflows_status" ON "public"."document_workflows" USING "btree" ("status");



CREATE INDEX "idx_documents_entity_id" ON "public"."documents" USING "btree" ("entity_id");



CREATE INDEX "idx_documents_entity_type" ON "public"."documents" USING "btree" ("entity_type");



CREATE INDEX "idx_documents_expiry_date" ON "public"."documents" USING "btree" ("expiry_date");



CREATE INDEX "idx_documents_status" ON "public"."documents" USING "btree" ("status");



CREATE INDEX "idx_documents_workflow_stage" ON "public"."documents" USING "btree" ("workflow_stage_id");



CREATE INDEX "idx_investor_groups_investors_group_id" ON "public"."investor_groups_investors" USING "btree" ("group_id");



CREATE INDEX "idx_investor_groups_investors_investor_id" ON "public"."investor_groups_investors" USING "btree" ("investor_id");



CREATE INDEX "idx_investors_kyc_status" ON "public"."investors" USING "btree" ("kyc_status");



CREATE INDEX "idx_investors_type" ON "public"."investors" USING "btree" ("type");



CREATE INDEX "idx_issuer_access_roles_issuer_id" ON "public"."issuer_access_roles" USING "btree" ("issuer_id");



CREATE INDEX "idx_issuer_access_roles_role" ON "public"."issuer_access_roles" USING "btree" ("role");



CREATE INDEX "idx_issuer_access_roles_user_id" ON "public"."issuer_access_roles" USING "btree" ("user_id");



CREATE INDEX "idx_issuer_documents_issuer_id" ON "public"."issuer_documents" USING "btree" ("issuer_id");



CREATE INDEX "idx_issuer_documents_status" ON "public"."issuer_documents" USING "btree" ("status");



CREATE INDEX "idx_issuer_documents_type" ON "public"."issuer_documents" USING "btree" ("document_type");



CREATE INDEX "idx_policy_rule_approvers_policy_rule_id" ON "public"."policy_rule_approvers" USING "btree" ("policy_rule_id");



CREATE INDEX "idx_policy_rule_approvers_status" ON "public"."policy_rule_approvers" USING "btree" ("status");



CREATE INDEX "idx_policy_rule_approvers_user_id" ON "public"."policy_rule_approvers" USING "btree" ("user_id");



CREATE INDEX "idx_policy_templates_created_at" ON "public"."policy_templates" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_policy_templates_name" ON "public"."policy_templates" USING "btree" ("template_name");



CREATE INDEX "idx_policy_templates_status" ON "public"."policy_templates" USING "btree" ("status");



CREATE INDEX "idx_policy_templates_type" ON "public"."policy_templates" USING "btree" ("template_type");



CREATE INDEX "idx_redemption_rules_rule_id" ON "public"."redemption_rules" USING "btree" ("rule_id");



CREATE INDEX "idx_rules_is_template" ON "public"."rules" USING "btree" ("is_template");



CREATE INDEX "idx_token_deployments_token_id" ON "public"."token_deployments" USING "btree" ("token_id");



CREATE INDEX "idx_token_versions_token_id" ON "public"."token_versions" USING "btree" ("token_id");



CREATE INDEX "idx_tokens_project_id" ON "public"."tokens" USING "btree" ("project_id");



CREATE INDEX "idx_tokens_standard" ON "public"."tokens" USING "btree" ("standard");



CREATE INDEX "idx_tokens_status" ON "public"."tokens" USING "btree" ("status");



CREATE INDEX "idx_transaction_events_actor" ON "public"."transaction_events" USING "btree" ("actor");



CREATE INDEX "idx_transaction_events_event_type" ON "public"."transaction_events" USING "btree" ("event_type");



CREATE INDEX "idx_transaction_events_request_id" ON "public"."transaction_events" USING "btree" ("request_id");



CREATE INDEX "idx_transaction_events_timestamp" ON "public"."transaction_events" USING "btree" ("timestamp");



CREATE INDEX "idx_transaction_notifications_read" ON "public"."transaction_notifications" USING "btree" ("read");



CREATE INDEX "idx_transaction_notifications_transaction" ON "public"."transaction_notifications" USING "btree" ("transaction_id");



CREATE INDEX "idx_transaction_notifications_wallet" ON "public"."transaction_notifications" USING "btree" ("wallet_address");



CREATE INDEX "idx_user_mfa_settings_user_id" ON "public"."user_mfa_settings" USING "btree" ("user_id");



CREATE INDEX "idx_wallet_transactions_from_address" ON "public"."wallet_transactions" USING "btree" ("from_address");



CREATE INDEX "idx_wallet_transactions_status" ON "public"."wallet_transactions" USING "btree" ("status");



CREATE INDEX "idx_wallet_transactions_tx_hash" ON "public"."wallet_transactions" USING "btree" ("tx_hash");



CREATE INDEX "multi_sig_transactions_blockchain_idx" ON "public"."multi_sig_transactions" USING "btree" ("blockchain");



CREATE INDEX "multi_sig_wallets_blockchain_idx" ON "public"."multi_sig_wallets" USING "btree" ("blockchain");



CREATE OR REPLACE TRIGGER "check_approvals_trigger" AFTER UPDATE ON "public"."policy_rule_approvers" FOR EACH ROW WHEN (("new"."status" = 'approved'::"text")) EXECUTE FUNCTION "public"."check_all_approvals"();



CREATE OR REPLACE TRIGGER "create_token_version_on_insert" AFTER INSERT ON "public"."tokens" FOR EACH ROW EXECUTE FUNCTION "public"."create_token_version"();



CREATE OR REPLACE TRIGGER "create_token_version_on_update" AFTER UPDATE ON "public"."tokens" FOR EACH ROW WHEN (("old".* IS DISTINCT FROM "new".*)) EXECUTE FUNCTION "public"."create_token_version"();



CREATE OR REPLACE TRIGGER "document_expiry_trigger" AFTER INSERT OR UPDATE OF "expiry_date" ON "public"."documents" FOR EACH ROW EXECUTE FUNCTION "public"."check_document_expiry"();



CREATE OR REPLACE TRIGGER "document_version_trigger" BEFORE UPDATE ON "public"."documents" FOR EACH ROW EXECUTE FUNCTION "public"."create_document_version"();



CREATE OR REPLACE TRIGGER "handle_rejection_trigger" AFTER UPDATE ON "public"."policy_rule_approvers" FOR EACH ROW WHEN (("new"."status" = 'rejected'::"text")) EXECUTE FUNCTION "public"."handle_rule_rejection"();



CREATE OR REPLACE TRIGGER "log_investor_changes" AFTER INSERT OR DELETE OR UPDATE ON "public"."investors" FOR EACH ROW EXECUTE FUNCTION "public"."log_user_action"();



CREATE OR REPLACE TRIGGER "log_redemption_request_changes" AFTER INSERT OR DELETE OR UPDATE ON "public"."redemption_requests" FOR EACH ROW EXECUTE FUNCTION "public"."log_user_action"();



CREATE OR REPLACE TRIGGER "log_subscription_changes" AFTER INSERT OR DELETE OR UPDATE ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."log_user_action"();



CREATE OR REPLACE TRIGGER "log_token_allocation_changes" AFTER INSERT OR DELETE OR UPDATE ON "public"."token_allocations" FOR EACH ROW EXECUTE FUNCTION "public"."log_user_action"();



CREATE OR REPLACE TRIGGER "log_token_changes" AFTER INSERT OR DELETE OR UPDATE ON "public"."tokens" FOR EACH ROW EXECUTE FUNCTION "public"."log_user_action"();



CREATE OR REPLACE TRIGGER "log_token_template_changes" AFTER INSERT OR DELETE OR UPDATE ON "public"."token_templates" FOR EACH ROW EXECUTE FUNCTION "public"."log_user_action"();



CREATE OR REPLACE TRIGGER "policy_templates_audit_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."policy_templates" FOR EACH ROW EXECUTE FUNCTION "public"."log_user_action"();



CREATE OR REPLACE TRIGGER "projects_audit_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."projects_audit_function"();



CREATE OR REPLACE TRIGGER "rule_approval_trigger" BEFORE INSERT OR UPDATE ON "public"."rules" FOR EACH ROW EXECUTE FUNCTION "public"."add_rule_to_approval_queue"();



CREATE OR REPLACE TRIGGER "rules_audit_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."rules" FOR EACH ROW EXECUTE FUNCTION "public"."log_user_action"();



CREATE OR REPLACE TRIGGER "template_approval_trigger" BEFORE INSERT OR UPDATE ON "public"."policy_templates" FOR EACH ROW EXECUTE FUNCTION "public"."add_template_to_approval_queue"();



CREATE OR REPLACE TRIGGER "trigger_consensus_settings_updated_at" BEFORE UPDATE ON "public"."consensus_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_consensus_settings_updated_at"();



CREATE OR REPLACE TRIGGER "update_compliance_reports_updated_at" BEFORE UPDATE ON "public"."compliance_reports" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_document_workflows_updated_at" BEFORE UPDATE ON "public"."document_workflows" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_investor_groups_updated_at" BEFORE UPDATE ON "public"."investor_groups" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_investors_updated_at" BEFORE UPDATE ON "public"."investors" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_issuer_access_roles_updated_at" BEFORE UPDATE ON "public"."issuer_access_roles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_issuer_documents_updated_at" BEFORE UPDATE ON "public"."issuer_documents" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_onboarding_restrictions_updated_at" BEFORE UPDATE ON "public"."onboarding_restrictions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_token_templates_updated_at" BEFORE UPDATE ON "public"."token_templates" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_tokens_updated_at" BEFORE UPDATE ON "public"."tokens" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_wallet_transactions_updated_at" BEFORE UPDATE ON "public"."wallet_transactions" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



CREATE OR REPLACE TRIGGER "validate_token_data_trigger" BEFORE INSERT OR UPDATE ON "public"."tokens" FOR EACH ROW EXECUTE FUNCTION "public"."validate_token_data"();



CREATE OR REPLACE TRIGGER "validate_wallet_address_trigger" BEFORE INSERT OR UPDATE ON "public"."multi_sig_wallets" FOR EACH ROW EXECUTE FUNCTION "public"."validate_wallet_address"();



ALTER TABLE ONLY "public"."approval_requests"
    ADD CONSTRAINT "approval_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."cap_table_investors"
    ADD CONSTRAINT "cap_table_investors_cap_table_id_fkey" FOREIGN KEY ("cap_table_id") REFERENCES "public"."cap_tables"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cap_table_investors"
    ADD CONSTRAINT "cap_table_investors_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "public"."investors"("investor_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cap_tables"
    ADD CONSTRAINT "cap_tables_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id");



ALTER TABLE ONLY "public"."compliance_checks"
    ADD CONSTRAINT "compliance_checks_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "public"."investors"("investor_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."compliance_checks"
    ADD CONSTRAINT "compliance_checks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."compliance_reports"
    ADD CONSTRAINT "compliance_reports_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."compliance_reports"
    ADD CONSTRAINT "compliance_reports_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."document_approvals"
    ADD CONSTRAINT "document_approvals_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."document_approvals"
    ADD CONSTRAINT "document_approvals_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_versions"
    ADD CONSTRAINT "document_versions_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_versions"
    ADD CONSTRAINT "document_versions_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."document_workflows"
    ADD CONSTRAINT "document_workflows_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."document_workflows"
    ADD CONSTRAINT "document_workflows_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."issuer_documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_workflows"
    ADD CONSTRAINT "document_workflows_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_workflow_stage_id_fkey" FOREIGN KEY ("workflow_stage_id") REFERENCES "public"."workflow_stages"("id");



ALTER TABLE ONLY "public"."investor_group_members"
    ADD CONSTRAINT "investor_group_members_group_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."investor_groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."investor_group_members"
    ADD CONSTRAINT "investor_group_members_investor_fkey" FOREIGN KEY ("investor_id") REFERENCES "public"."investors"("investor_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."investor_groups_investors"
    ADD CONSTRAINT "investor_groups_investors_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."investor_groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."investor_groups_investors"
    ADD CONSTRAINT "investor_groups_investors_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "public"."investors"("investor_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."investor_groups"
    ADD CONSTRAINT "investor_groups_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id");



ALTER TABLE ONLY "public"."issuer_access_roles"
    ADD CONSTRAINT "issuer_access_roles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."issuer_access_roles"
    ADD CONSTRAINT "issuer_access_roles_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."issuer_access_roles"
    ADD CONSTRAINT "issuer_access_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."issuer_documents"
    ADD CONSTRAINT "issuer_documents_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."issuer_documents"
    ADD CONSTRAINT "issuer_documents_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."issuer_documents"
    ADD CONSTRAINT "issuer_documents_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."kyc_screening_logs"
    ADD CONSTRAINT "kyc_screening_logs_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "public"."investors"("investor_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."multi_sig_confirmations"
    ADD CONSTRAINT "multi_sig_confirmations_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."multi_sig_transactions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."multi_sig_transactions"
    ADD CONSTRAINT "multi_sig_transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "public"."multi_sig_wallets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."multi_sig_wallets"
    ADD CONSTRAINT "multi_sig_wallets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."policy_rule_approvers"
    ADD CONSTRAINT "policy_rule_approvers_rule_id_fkey" FOREIGN KEY ("policy_rule_id") REFERENCES "public"."rules"("rule_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."policy_rule_approvers"
    ADD CONSTRAINT "policy_rule_approvers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."policy_template_approvers"
    ADD CONSTRAINT "policy_template_approvers_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."policy_templates"("template_id");



ALTER TABLE ONLY "public"."policy_template_approvers"
    ADD CONSTRAINT "policy_template_approvers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."redemption_approvers"
    ADD CONSTRAINT "redemption_approvers_redemption_id_fkey" FOREIGN KEY ("redemption_id") REFERENCES "public"."redemption_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."redemption_rules"
    ADD CONSTRAINT "redemption_rules_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "public"."rules"("rule_id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_permission_name_fkey" FOREIGN KEY ("permission_name") REFERENCES "public"."permissions"("name") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."signatures"
    ADD CONSTRAINT "signatures_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "public"."transaction_proposals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stage_requirements"
    ADD CONSTRAINT "stage_requirements_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "public"."workflow_stages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "public"."investors"("investor_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."token_allocations"
    ADD CONSTRAINT "token_allocations_investor_fkey" FOREIGN KEY ("investor_id") REFERENCES "public"."investors"("investor_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."token_allocations"
    ADD CONSTRAINT "token_allocations_project_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."token_allocations"
    ADD CONSTRAINT "token_allocations_subscription_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."token_deployments"
    ADD CONSTRAINT "token_deployments_token_id_fkey" FOREIGN KEY ("token_id") REFERENCES "public"."tokens"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."token_templates"
    ADD CONSTRAINT "token_templates_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."token_versions"
    ADD CONSTRAINT "token_versions_token_id_fkey" FOREIGN KEY ("token_id") REFERENCES "public"."tokens"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tokens"
    ADD CONSTRAINT "tokens_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transaction_proposals"
    ADD CONSTRAINT "transaction_proposals_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."transaction_proposals"
    ADD CONSTRAINT "transaction_proposals_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "public"."multi_sig_wallets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_mfa_settings"
    ADD CONSTRAINT "user_mfa_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wallet_details"
    ADD CONSTRAINT "wallet_details_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "public"."multi_sig_wallets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."whitelist_settings"
    ADD CONSTRAINT "whitelist_settings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."whitelist_settings"
    ADD CONSTRAINT "whitelist_settings_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "public"."rules"("rule_id");



ALTER TABLE ONLY "public"."whitelist_signatories"
    ADD CONSTRAINT "whitelist_signatories_whitelist_id_fkey" FOREIGN KEY ("whitelist_id") REFERENCES "public"."whitelist_settings"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can manage roles" ON "public"."issuer_access_roles" USING (("auth"."uid"() IN ( SELECT "issuer_access_roles_1"."user_id"
   FROM "public"."issuer_access_roles" "issuer_access_roles_1"
  WHERE (("issuer_access_roles_1"."issuer_id" = "issuer_access_roles_1"."issuer_id") AND ("issuer_access_roles_1"."role" = 'admin'::"public"."issuer_role")))));



CREATE POLICY "Compliance officers can create reports" ON "public"."compliance_reports" FOR INSERT WITH CHECK (("auth"."uid"() IN ( SELECT "issuer_access_roles"."user_id"
   FROM "public"."issuer_access_roles"
  WHERE (("issuer_access_roles"."issuer_id" = "compliance_reports"."issuer_id") AND ("issuer_access_roles"."role" = ANY (ARRAY['admin'::"public"."issuer_role", 'compliance_officer'::"public"."issuer_role"]))))));



CREATE POLICY "Compliance officers can update reports" ON "public"."compliance_reports" FOR UPDATE USING (("auth"."uid"() IN ( SELECT "issuer_access_roles"."user_id"
   FROM "public"."issuer_access_roles"
  WHERE (("issuer_access_roles"."issuer_id" = "compliance_reports"."issuer_id") AND ("issuer_access_roles"."role" = ANY (ARRAY['admin'::"public"."issuer_role", 'compliance_officer'::"public"."issuer_role"]))))));



CREATE POLICY "Enable delete for authenticated users only" ON "public"."onboarding_restrictions" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."onboarding_restrictions" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable read access for all users" ON "public"."onboarding_restrictions" FOR SELECT USING (true);



CREATE POLICY "Enable update for authenticated users only" ON "public"."onboarding_restrictions" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Users can create and update their own approvals" ON "public"."document_approvals" USING ((("approver_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."role_permissions" "rp" ON (("rp"."role_id" = "ur"."role_id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("rp"."permission_name" = 'document:approve'::"text")))))) WITH CHECK ((("approver_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."role_permissions" "rp" ON (("rp"."role_id" = "ur"."role_id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("rp"."permission_name" = 'document:approve'::"text"))))));



CREATE POLICY "Users can create document versions they have access to" ON "public"."document_versions" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM (("public"."documents" "d"
     JOIN "public"."user_roles" "ur" ON (("ur"."user_id" = "auth"."uid"())))
     JOIN "public"."role_permissions" "rp" ON (("rp"."role_id" = "ur"."role_id")))
  WHERE (("d"."id" = "document_versions"."document_id") AND ("rp"."permission_name" = 'document:write'::"text")))));



CREATE POLICY "Users can create workflows for their documents" ON "public"."document_workflows" FOR INSERT WITH CHECK (("auth"."uid"() IN ( SELECT "issuer_access_roles"."user_id"
   FROM "public"."issuer_access_roles"
  WHERE (("issuer_access_roles"."issuer_id" = ( SELECT "issuer_documents"."issuer_id"
           FROM "public"."issuer_documents"
          WHERE ("issuer_documents"."id" = "document_workflows"."document_id"))) AND ("issuer_access_roles"."role" = ANY (ARRAY['admin'::"public"."issuer_role", 'editor'::"public"."issuer_role"]))))));



CREATE POLICY "Users can insert documents for their issuers" ON "public"."issuer_documents" FOR INSERT WITH CHECK (("auth"."uid"() IN ( SELECT "issuer_access_roles"."user_id"
   FROM "public"."issuer_access_roles"
  WHERE (("issuer_access_roles"."issuer_id" = "issuer_documents"."issuer_id") AND ("issuer_access_roles"."role" = ANY (ARRAY['admin'::"public"."issuer_role", 'editor'::"public"."issuer_role"]))))));



CREATE POLICY "Users can see their own transaction events" ON "public"."transaction_events" FOR SELECT USING (("actor" = ("auth"."uid"())::"text"));



CREATE POLICY "Users can see their own transaction notifications" ON "public"."transaction_notifications" FOR SELECT USING (("wallet_address" = ("auth"."uid"())::"text"));



CREATE POLICY "Users can update documents for their issuers" ON "public"."issuer_documents" FOR UPDATE USING (("auth"."uid"() IN ( SELECT "issuer_access_roles"."user_id"
   FROM "public"."issuer_access_roles"
  WHERE (("issuer_access_roles"."issuer_id" = "issuer_documents"."issuer_id") AND ("issuer_access_roles"."role" = ANY (ARRAY['admin'::"public"."issuer_role", 'editor'::"public"."issuer_role"]))))));



CREATE POLICY "Users can update their own transaction notifications" ON "public"."transaction_notifications" FOR UPDATE USING (("wallet_address" = ("auth"."uid"())::"text"));



CREATE POLICY "Users can update workflows they are involved in" ON "public"."document_workflows" FOR UPDATE USING ((("auth"."uid"() = ANY ("required_signers")) OR ("auth"."uid"() IN ( SELECT "issuer_access_roles"."user_id"
   FROM "public"."issuer_access_roles"
  WHERE (("issuer_access_roles"."issuer_id" = ( SELECT "issuer_documents"."issuer_id"
           FROM "public"."issuer_documents"
          WHERE ("issuer_documents"."id" = "document_workflows"."document_id"))) AND ("issuer_access_roles"."role" = ANY (ARRAY['admin'::"public"."issuer_role", 'editor'::"public"."issuer_role"])))))));



CREATE POLICY "Users can view document approvals they have access to" ON "public"."document_approvals" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (("public"."documents" "d"
     JOIN "public"."user_roles" "ur" ON (("ur"."user_id" = "auth"."uid"())))
     JOIN "public"."role_permissions" "rp" ON (("rp"."role_id" = "ur"."role_id")))
  WHERE (("d"."id" = "document_approvals"."document_id") AND ("rp"."permission_name" = 'document:read'::"text")))));



CREATE POLICY "Users can view document versions they have access to" ON "public"."document_versions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (("public"."documents" "d"
     JOIN "public"."user_roles" "ur" ON (("ur"."user_id" = "auth"."uid"())))
     JOIN "public"."role_permissions" "rp" ON (("rp"."role_id" = "ur"."role_id")))
  WHERE (("d"."id" = "document_versions"."document_id") AND ("rp"."permission_name" = 'document:read'::"text")))));



CREATE POLICY "Users can view documents they have access to" ON "public"."issuer_documents" FOR SELECT USING (("auth"."uid"() IN ( SELECT "issuer_access_roles"."user_id"
   FROM "public"."issuer_access_roles"
  WHERE ("issuer_access_roles"."issuer_id" = "issuer_documents"."issuer_id"))));



CREATE POLICY "Users can view reports for their issuers" ON "public"."compliance_reports" FOR SELECT USING (("auth"."uid"() IN ( SELECT "issuer_access_roles"."user_id"
   FROM "public"."issuer_access_roles"
  WHERE ("issuer_access_roles"."issuer_id" = "compliance_reports"."issuer_id"))));



CREATE POLICY "Users can view roles for their issuers" ON "public"."issuer_access_roles" FOR SELECT USING (("auth"."uid"() IN ( SELECT "issuer_access_roles_1"."user_id"
   FROM "public"."issuer_access_roles" "issuer_access_roles_1"
  WHERE ("issuer_access_roles_1"."issuer_id" = "issuer_access_roles_1"."issuer_id"))));



CREATE POLICY "Users can view workflows they are involved in" ON "public"."document_workflows" FOR SELECT USING ((("auth"."uid"() = ANY ("required_signers")) OR ("auth"."uid"() IN ( SELECT "issuer_access_roles"."user_id"
   FROM "public"."issuer_access_roles"
  WHERE ("issuer_access_roles"."issuer_id" = ( SELECT "issuer_documents"."issuer_id"
           FROM "public"."issuer_documents"
          WHERE ("issuer_documents"."id" = "document_workflows"."document_id")))))));



ALTER TABLE "public"."compliance_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_approvals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_versions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_workflows" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."issuer_access_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."issuer_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."onboarding_restrictions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transaction_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transaction_notifications" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."investors";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."notifications";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."organizations";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."projects";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."rules";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."subscriptions";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."system_settings";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."token_allocations";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."token_deployments";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."tokens";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."wallet_transactions";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




















































































































































































GRANT ALL ON FUNCTION "public"."add_policy_approver"("p_policy_id" "uuid", "p_user_id" "text", "p_created_by" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."add_policy_approver"("p_policy_id" "uuid", "p_user_id" "text", "p_created_by" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_policy_approver"("p_policy_id" "uuid", "p_user_id" "text", "p_created_by" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."add_policy_approver"("policy_id" "text", "user_id" "text", "created_by" "text", "status_val" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."add_policy_approver"("policy_id" "text", "user_id" "text", "created_by" "text", "status_val" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_policy_approver"("policy_id" "text", "user_id" "text", "created_by" "text", "status_val" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."add_policy_approver_with_cast"("policy_id" "text", "user_id" "text", "created_by_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."add_policy_approver_with_cast"("policy_id" "text", "user_id" "text", "created_by_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_policy_approver_with_cast"("policy_id" "text", "user_id" "text", "created_by_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."add_rule_to_approval_queue"() TO "anon";
GRANT ALL ON FUNCTION "public"."add_rule_to_approval_queue"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_rule_to_approval_queue"() TO "service_role";



GRANT ALL ON FUNCTION "public"."add_table_to_realtime"("table_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."add_table_to_realtime"("table_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_table_to_realtime"("table_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."add_template_to_approval_queue"() TO "anon";
GRANT ALL ON FUNCTION "public"."add_template_to_approval_queue"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_template_to_approval_queue"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_all_approvals"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_all_approvals"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_all_approvals"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_document_expiry"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_document_expiry"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_document_expiry"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_permission"("p_role_name" "text", "p_resource" "text", "p_action" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_permission"("p_role_name" "text", "p_resource" "text", "p_action" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_permission"("p_role_name" "text", "p_resource" "text", "p_action" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_role_exists"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_role_exists"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_role_exists"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_user_permission"("user_id" "uuid", "permission" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_user_permission"("user_id" "uuid", "permission" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_user_permission"("user_id" "uuid", "permission" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_document_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_document_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_document_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_token_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_token_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_token_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_transaction_events_table"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_transaction_events_table"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_transaction_events_table"() TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_user_with_privileges"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_user_with_privileges"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_user_with_privileges"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."disable_rls_for_deletion"() TO "anon";
GRANT ALL ON FUNCTION "public"."disable_rls_for_deletion"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."disable_rls_for_deletion"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enable_rls_after_deletion"() TO "anon";
GRANT ALL ON FUNCTION "public"."enable_rls_after_deletion"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enable_rls_after_deletion"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_users_with_any_permission"("permission_names" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."get_users_with_any_permission"("permission_names" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_users_with_any_permission"("permission_names" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_users_with_permission"("permission_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_users_with_permission"("permission_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_users_with_permission"("permission_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_users_with_permission_simple"("p_permission_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_users_with_permission_simple"("p_permission_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_users_with_permission_simple"("p_permission_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_auth_user_created"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_auth_user_created"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_auth_user_created"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_rule_rejection"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_rule_rejection"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_rule_rejection"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_user_deletion"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_user_deletion"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_user_deletion"() TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_policy_approver"("p_policy_id" "uuid", "p_user_id" "text", "p_created_by" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."insert_policy_approver"("p_policy_id" "uuid", "p_user_id" "text", "p_created_by" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_policy_approver"("p_policy_id" "uuid", "p_user_id" "text", "p_created_by" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."list_tables"() TO "anon";
GRANT ALL ON FUNCTION "public"."list_tables"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."list_tables"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_audit"("p_action" "text", "p_user_id" "uuid", "p_entity_type" "text", "p_entity_id" "text", "p_details" "text", "p_status" "text", "p_metadata" "jsonb", "p_old_data" "jsonb", "p_new_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."log_audit"("p_action" "text", "p_user_id" "uuid", "p_entity_type" "text", "p_entity_id" "text", "p_details" "text", "p_status" "text", "p_metadata" "jsonb", "p_old_data" "jsonb", "p_new_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_audit"("p_action" "text", "p_user_id" "uuid", "p_entity_type" "text", "p_entity_id" "text", "p_details" "text", "p_status" "text", "p_metadata" "jsonb", "p_old_data" "jsonb", "p_new_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_auth_event"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_auth_event"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_auth_event"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_user_action"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_user_action"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_user_action"() TO "service_role";



GRANT ALL ON FUNCTION "public"."projects_audit_function"() TO "anon";
GRANT ALL ON FUNCTION "public"."projects_audit_function"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."projects_audit_function"() TO "service_role";



GRANT ALL ON FUNCTION "public"."safe_cast_to_uuid"("input" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."safe_cast_to_uuid"("input" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."safe_cast_to_uuid"("input" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."safe_uuid_cast"("text_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."safe_uuid_cast"("text_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."safe_uuid_cast"("text_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."save_consensus_config"("p_consensus_type" "text", "p_required_approvals" integer, "p_eligible_roles" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."save_consensus_config"("p_consensus_type" "text", "p_required_approvals" integer, "p_eligible_roles" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."save_consensus_config"("p_consensus_type" "text", "p_required_approvals" integer, "p_eligible_roles" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_consensus_settings_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_consensus_settings_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_consensus_settings_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_role"("p_user_id" "uuid", "p_role" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_role"("p_user_id" "uuid", "p_role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_role"("p_user_id" "uuid", "p_role" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."user_has_delete_permission"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."user_has_delete_permission"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_has_delete_permission"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_blockchain_address"("blockchain" "text", "address" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_blockchain_address"("blockchain" "text", "address" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_blockchain_address"("blockchain" "text", "address" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_token_data"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_token_data"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_token_data"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_wallet_address"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_wallet_address"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_wallet_address"() TO "service_role";


















GRANT ALL ON TABLE "public"."approval_configs" TO "anon";
GRANT ALL ON TABLE "public"."approval_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."approval_configs" TO "service_role";



GRANT ALL ON TABLE "public"."approval_requests" TO "anon";
GRANT ALL ON TABLE "public"."approval_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."approval_requests" TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."auth_events" TO "anon";
GRANT ALL ON TABLE "public"."auth_events" TO "authenticated";
GRANT ALL ON TABLE "public"."auth_events" TO "service_role";



GRANT ALL ON TABLE "public"."bulk_operations" TO "anon";
GRANT ALL ON TABLE "public"."bulk_operations" TO "authenticated";
GRANT ALL ON TABLE "public"."bulk_operations" TO "service_role";



GRANT ALL ON TABLE "public"."cap_table_investors" TO "anon";
GRANT ALL ON TABLE "public"."cap_table_investors" TO "authenticated";
GRANT ALL ON TABLE "public"."cap_table_investors" TO "service_role";



GRANT ALL ON TABLE "public"."cap_tables" TO "anon";
GRANT ALL ON TABLE "public"."cap_tables" TO "authenticated";
GRANT ALL ON TABLE "public"."cap_tables" TO "service_role";



GRANT ALL ON TABLE "public"."compliance_checks" TO "anon";
GRANT ALL ON TABLE "public"."compliance_checks" TO "authenticated";
GRANT ALL ON TABLE "public"."compliance_checks" TO "service_role";



GRANT ALL ON TABLE "public"."compliance_reports" TO "anon";
GRANT ALL ON TABLE "public"."compliance_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."compliance_reports" TO "service_role";



GRANT ALL ON TABLE "public"."compliance_settings" TO "anon";
GRANT ALL ON TABLE "public"."compliance_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."compliance_settings" TO "service_role";



GRANT ALL ON TABLE "public"."consensus_settings" TO "anon";
GRANT ALL ON TABLE "public"."consensus_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."consensus_settings" TO "service_role";



GRANT ALL ON TABLE "public"."document_approvals" TO "anon";
GRANT ALL ON TABLE "public"."document_approvals" TO "authenticated";
GRANT ALL ON TABLE "public"."document_approvals" TO "service_role";



GRANT ALL ON TABLE "public"."document_versions" TO "anon";
GRANT ALL ON TABLE "public"."document_versions" TO "authenticated";
GRANT ALL ON TABLE "public"."document_versions" TO "service_role";



GRANT ALL ON TABLE "public"."document_workflows" TO "anon";
GRANT ALL ON TABLE "public"."document_workflows" TO "authenticated";
GRANT ALL ON TABLE "public"."document_workflows" TO "service_role";



GRANT ALL ON TABLE "public"."documents" TO "anon";
GRANT ALL ON TABLE "public"."documents" TO "authenticated";
GRANT ALL ON TABLE "public"."documents" TO "service_role";



GRANT ALL ON TABLE "public"."investor_group_members" TO "anon";
GRANT ALL ON TABLE "public"."investor_group_members" TO "authenticated";
GRANT ALL ON TABLE "public"."investor_group_members" TO "service_role";



GRANT ALL ON TABLE "public"."investor_groups" TO "anon";
GRANT ALL ON TABLE "public"."investor_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."investor_groups" TO "service_role";



GRANT ALL ON TABLE "public"."investor_groups_investors" TO "anon";
GRANT ALL ON TABLE "public"."investor_groups_investors" TO "authenticated";
GRANT ALL ON TABLE "public"."investor_groups_investors" TO "service_role";



GRANT ALL ON TABLE "public"."investors" TO "anon";
GRANT ALL ON TABLE "public"."investors" TO "authenticated";
GRANT ALL ON TABLE "public"."investors" TO "service_role";



GRANT ALL ON TABLE "public"."invoices" TO "anon";
GRANT ALL ON TABLE "public"."invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."invoices" TO "service_role";



GRANT ALL ON TABLE "public"."issuer_access_roles" TO "anon";
GRANT ALL ON TABLE "public"."issuer_access_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."issuer_access_roles" TO "service_role";



GRANT ALL ON TABLE "public"."issuer_documents" TO "anon";
GRANT ALL ON TABLE "public"."issuer_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."issuer_documents" TO "service_role";



GRANT ALL ON TABLE "public"."kyc_screening_logs" TO "anon";
GRANT ALL ON TABLE "public"."kyc_screening_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."kyc_screening_logs" TO "service_role";



GRANT ALL ON TABLE "public"."mfa_policies" TO "anon";
GRANT ALL ON TABLE "public"."mfa_policies" TO "authenticated";
GRANT ALL ON TABLE "public"."mfa_policies" TO "service_role";



GRANT ALL ON TABLE "public"."multi_sig_confirmations" TO "anon";
GRANT ALL ON TABLE "public"."multi_sig_confirmations" TO "authenticated";
GRANT ALL ON TABLE "public"."multi_sig_confirmations" TO "service_role";



GRANT ALL ON TABLE "public"."multi_sig_transactions" TO "anon";
GRANT ALL ON TABLE "public"."multi_sig_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."multi_sig_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."multi_sig_wallets" TO "anon";
GRANT ALL ON TABLE "public"."multi_sig_wallets" TO "authenticated";
GRANT ALL ON TABLE "public"."multi_sig_wallets" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."onboarding_restrictions" TO "anon";
GRANT ALL ON TABLE "public"."onboarding_restrictions" TO "authenticated";
GRANT ALL ON TABLE "public"."onboarding_restrictions" TO "service_role";



GRANT ALL ON TABLE "public"."organizations" TO "anon";
GRANT ALL ON TABLE "public"."organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";



GRANT ALL ON TABLE "public"."permissions" TO "anon";
GRANT ALL ON TABLE "public"."permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."permissions" TO "service_role";



GRANT ALL ON TABLE "public"."policy_rule_approvers" TO "anon";
GRANT ALL ON TABLE "public"."policy_rule_approvers" TO "authenticated";
GRANT ALL ON TABLE "public"."policy_rule_approvers" TO "service_role";



GRANT ALL ON TABLE "public"."policy_template_approvers" TO "anon";
GRANT ALL ON TABLE "public"."policy_template_approvers" TO "authenticated";
GRANT ALL ON TABLE "public"."policy_template_approvers" TO "service_role";



GRANT ALL ON TABLE "public"."policy_templates" TO "anon";
GRANT ALL ON TABLE "public"."policy_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."policy_templates" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON TABLE "public"."redemption_approvers" TO "anon";
GRANT ALL ON TABLE "public"."redemption_approvers" TO "authenticated";
GRANT ALL ON TABLE "public"."redemption_approvers" TO "service_role";



GRANT ALL ON TABLE "public"."redemption_requests" TO "anon";
GRANT ALL ON TABLE "public"."redemption_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."redemption_requests" TO "service_role";



GRANT ALL ON TABLE "public"."redemption_rules" TO "anon";
GRANT ALL ON TABLE "public"."redemption_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."redemption_rules" TO "service_role";



GRANT ALL ON TABLE "public"."restriction_statistics" TO "anon";
GRANT ALL ON TABLE "public"."restriction_statistics" TO "authenticated";
GRANT ALL ON TABLE "public"."restriction_statistics" TO "service_role";



GRANT ALL ON TABLE "public"."role_permissions" TO "anon";
GRANT ALL ON TABLE "public"."role_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."role_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";



GRANT ALL ON TABLE "public"."rules" TO "anon";
GRANT ALL ON TABLE "public"."rules" TO "authenticated";
GRANT ALL ON TABLE "public"."rules" TO "service_role";



GRANT ALL ON TABLE "public"."signatures" TO "anon";
GRANT ALL ON TABLE "public"."signatures" TO "authenticated";
GRANT ALL ON TABLE "public"."signatures" TO "service_role";



GRANT ALL ON TABLE "public"."stage_requirements" TO "anon";
GRANT ALL ON TABLE "public"."stage_requirements" TO "authenticated";
GRANT ALL ON TABLE "public"."stage_requirements" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."system_settings" TO "anon";
GRANT ALL ON TABLE "public"."system_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."system_settings" TO "service_role";



GRANT ALL ON TABLE "public"."token_allocations" TO "anon";
GRANT ALL ON TABLE "public"."token_allocations" TO "authenticated";
GRANT ALL ON TABLE "public"."token_allocations" TO "service_role";



GRANT ALL ON TABLE "public"."token_deployments" TO "anon";
GRANT ALL ON TABLE "public"."token_deployments" TO "authenticated";
GRANT ALL ON TABLE "public"."token_deployments" TO "service_role";



GRANT ALL ON TABLE "public"."token_designs" TO "anon";
GRANT ALL ON TABLE "public"."token_designs" TO "authenticated";
GRANT ALL ON TABLE "public"."token_designs" TO "service_role";



GRANT ALL ON TABLE "public"."token_templates" TO "anon";
GRANT ALL ON TABLE "public"."token_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."token_templates" TO "service_role";



GRANT ALL ON TABLE "public"."token_versions" TO "anon";
GRANT ALL ON TABLE "public"."token_versions" TO "authenticated";
GRANT ALL ON TABLE "public"."token_versions" TO "service_role";



GRANT ALL ON TABLE "public"."tokens" TO "anon";
GRANT ALL ON TABLE "public"."tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."tokens" TO "service_role";



GRANT ALL ON TABLE "public"."transaction_events" TO "anon";
GRANT ALL ON TABLE "public"."transaction_events" TO "authenticated";
GRANT ALL ON TABLE "public"."transaction_events" TO "service_role";



GRANT ALL ON TABLE "public"."transaction_notifications" TO "anon";
GRANT ALL ON TABLE "public"."transaction_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."transaction_notifications" TO "service_role";



GRANT ALL ON TABLE "public"."transaction_proposals" TO "anon";
GRANT ALL ON TABLE "public"."transaction_proposals" TO "authenticated";
GRANT ALL ON TABLE "public"."transaction_proposals" TO "service_role";



GRANT ALL ON TABLE "public"."user_mfa_settings" TO "anon";
GRANT ALL ON TABLE "public"."user_mfa_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."user_mfa_settings" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."user_permissions_view" TO "anon";
GRANT ALL ON TABLE "public"."user_permissions_view" TO "authenticated";
GRANT ALL ON TABLE "public"."user_permissions_view" TO "service_role";



GRANT ALL ON TABLE "public"."user_sessions" TO "anon";
GRANT ALL ON TABLE "public"."user_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."wallet_details" TO "anon";
GRANT ALL ON TABLE "public"."wallet_details" TO "authenticated";
GRANT ALL ON TABLE "public"."wallet_details" TO "service_role";



GRANT ALL ON TABLE "public"."wallet_transactions" TO "anon";
GRANT ALL ON TABLE "public"."wallet_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."wallet_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."whitelist_settings" TO "anon";
GRANT ALL ON TABLE "public"."whitelist_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."whitelist_settings" TO "service_role";



GRANT ALL ON TABLE "public"."whitelist_signatories" TO "anon";
GRANT ALL ON TABLE "public"."whitelist_signatories" TO "authenticated";
GRANT ALL ON TABLE "public"."whitelist_signatories" TO "service_role";



GRANT ALL ON TABLE "public"."workflow_stages" TO "anon";
GRANT ALL ON TABLE "public"."workflow_stages" TO "authenticated";
GRANT ALL ON TABLE "public"."workflow_stages" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
