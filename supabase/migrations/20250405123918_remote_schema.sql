drop trigger if exists "log_rule_changes" on "public"."rules";

alter table "public"."policy_rule_approvers" drop constraint "policy_rule_approvers_template_id_fkey";

alter table "public"."approval_requests" drop constraint "approval_requests_status_check";

drop function if exists "public"."safe_uuid_cast"(value text);

create table "public"."document_approvals" (
    "id" uuid not null default uuid_generate_v4(),
    "document_id" uuid,
    "approver_id" uuid,
    "status" text not null,
    "comments" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."document_approvals" enable row level security;

create table "public"."document_versions" (
    "id" uuid not null default uuid_generate_v4(),
    "document_id" uuid,
    "version_number" integer not null,
    "file_path" text,
    "file_url" text,
    "uploaded_by" uuid,
    "metadata" jsonb,
    "created_at" timestamp with time zone default now()
);


alter table "public"."document_versions" enable row level security;

create table "public"."onboarding_restrictions" (
    "id" uuid not null default uuid_generate_v4(),
    "type" text not null,
    "value" text not null,
    "reason" text not null,
    "active" boolean not null default true,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "created_by" text not null
);


alter table "public"."onboarding_restrictions" enable row level security;

create table "public"."policy_template_approvers" (
    "template_id" uuid not null,
    "user_id" uuid not null,
    "created_by" uuid,
    "status" text default 'pending'::text,
    "timestamp" timestamp with time zone default now()
);


alter table "public"."documents" add column "expiry_date" timestamp with time zone;

alter table "public"."documents" add column "version" integer default 1;

alter table "public"."documents" add column "workflow_stage_id" text;

alter table "public"."rules" alter column "created_by" set data type uuid using "created_by"::uuid;

CREATE UNIQUE INDEX document_approvals_pkey ON public.document_approvals USING btree (id);

CREATE UNIQUE INDEX document_versions_document_id_version_number_key ON public.document_versions USING btree (document_id, version_number);

CREATE UNIQUE INDEX document_versions_pkey ON public.document_versions USING btree (id);

CREATE INDEX idx_document_approvals_document_id ON public.document_approvals USING btree (document_id);

CREATE INDEX idx_document_versions_document_id ON public.document_versions USING btree (document_id);

CREATE INDEX idx_documents_expiry_date ON public.documents USING btree (expiry_date);

CREATE INDEX idx_documents_workflow_stage ON public.documents USING btree (workflow_stage_id);

CREATE UNIQUE INDEX onboarding_restrictions_pkey ON public.onboarding_restrictions USING btree (id);

CREATE UNIQUE INDEX policy_template_approvers_pkey ON public.policy_template_approvers USING btree (template_id, user_id);

CREATE UNIQUE INDEX system_settings_key_unique ON public.system_settings USING btree (key);

alter table "public"."document_approvals" add constraint "document_approvals_pkey" PRIMARY KEY using index "document_approvals_pkey";

alter table "public"."document_versions" add constraint "document_versions_pkey" PRIMARY KEY using index "document_versions_pkey";

alter table "public"."onboarding_restrictions" add constraint "onboarding_restrictions_pkey" PRIMARY KEY using index "onboarding_restrictions_pkey";

alter table "public"."policy_template_approvers" add constraint "policy_template_approvers_pkey" PRIMARY KEY using index "policy_template_approvers_pkey";

alter table "public"."document_approvals" add constraint "document_approvals_approver_id_fkey" FOREIGN KEY (approver_id) REFERENCES users(id) not valid;

alter table "public"."document_approvals" validate constraint "document_approvals_approver_id_fkey";

alter table "public"."document_approvals" add constraint "document_approvals_document_id_fkey" FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE not valid;

alter table "public"."document_approvals" validate constraint "document_approvals_document_id_fkey";

alter table "public"."document_approvals" add constraint "document_approvals_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text]))) not valid;

alter table "public"."document_approvals" validate constraint "document_approvals_status_check";

alter table "public"."document_versions" add constraint "document_versions_document_id_fkey" FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE not valid;

alter table "public"."document_versions" validate constraint "document_versions_document_id_fkey";

alter table "public"."document_versions" add constraint "document_versions_document_id_version_number_key" UNIQUE using index "document_versions_document_id_version_number_key";

alter table "public"."document_versions" add constraint "document_versions_uploaded_by_fkey" FOREIGN KEY (uploaded_by) REFERENCES users(id) not valid;

alter table "public"."document_versions" validate constraint "document_versions_uploaded_by_fkey";

alter table "public"."documents" add constraint "documents_workflow_stage_id_fkey" FOREIGN KEY (workflow_stage_id) REFERENCES workflow_stages(id) not valid;

alter table "public"."documents" validate constraint "documents_workflow_stage_id_fkey";

alter table "public"."onboarding_restrictions" add constraint "onboarding_restrictions_type_check" CHECK ((type = ANY (ARRAY['COUNTRY'::text, 'INVESTOR_TYPE'::text]))) not valid;

alter table "public"."onboarding_restrictions" validate constraint "onboarding_restrictions_type_check";

alter table "public"."policy_template_approvers" add constraint "policy_template_approvers_template_id_fkey" FOREIGN KEY (template_id) REFERENCES policy_templates(template_id) not valid;

alter table "public"."policy_template_approvers" validate constraint "policy_template_approvers_template_id_fkey";

alter table "public"."policy_template_approvers" add constraint "policy_template_approvers_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) not valid;

alter table "public"."policy_template_approvers" validate constraint "policy_template_approvers_user_id_fkey";

alter table "public"."rules" add constraint "rules_created_by_uuid_check" CHECK (((created_by)::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'::text)) not valid;

alter table "public"."rules" validate constraint "rules_created_by_uuid_check";

alter table "public"."system_settings" add constraint "system_settings_key_unique" UNIQUE using index "system_settings_key_unique";

alter table "public"."approval_requests" add constraint "approval_requests_status_check" CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[]))) not valid;

alter table "public"."approval_requests" validate constraint "approval_requests_status_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.check_document_expiry()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    IF NEW.expiry_date IS NOT NULL AND NEW.expiry_date <= now() THEN
        UPDATE documents
        SET status = 'expired'
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_document_version()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

create or replace view "public"."restriction_statistics" as  SELECT count(*) AS total_rules,
    count(*) FILTER (WHERE (onboarding_restrictions.active = true)) AS active_rules,
    count(*) FILTER (WHERE ((onboarding_restrictions.type = 'COUNTRY'::text) AND (onboarding_restrictions.active = true))) AS blocked_countries,
    count(*) FILTER (WHERE ((onboarding_restrictions.type = 'INVESTOR_TYPE'::text) AND (onboarding_restrictions.active = true))) AS blocked_investor_types
   FROM onboarding_restrictions;


CREATE OR REPLACE FUNCTION public.safe_uuid_cast(text_id text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.add_policy_approver(policy_id text, user_id text, created_by text, status_val text DEFAULT 'pending'::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.add_rule_to_approval_queue()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.add_template_to_approval_queue()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$function$
;

grant delete on table "public"."document_approvals" to "anon";

grant insert on table "public"."document_approvals" to "anon";

grant references on table "public"."document_approvals" to "anon";

grant select on table "public"."document_approvals" to "anon";

grant trigger on table "public"."document_approvals" to "anon";

grant truncate on table "public"."document_approvals" to "anon";

grant update on table "public"."document_approvals" to "anon";

grant delete on table "public"."document_approvals" to "authenticated";

grant insert on table "public"."document_approvals" to "authenticated";

grant references on table "public"."document_approvals" to "authenticated";

grant select on table "public"."document_approvals" to "authenticated";

grant trigger on table "public"."document_approvals" to "authenticated";

grant truncate on table "public"."document_approvals" to "authenticated";

grant update on table "public"."document_approvals" to "authenticated";

grant delete on table "public"."document_approvals" to "service_role";

grant insert on table "public"."document_approvals" to "service_role";

grant references on table "public"."document_approvals" to "service_role";

grant select on table "public"."document_approvals" to "service_role";

grant trigger on table "public"."document_approvals" to "service_role";

grant truncate on table "public"."document_approvals" to "service_role";

grant update on table "public"."document_approvals" to "service_role";

grant delete on table "public"."document_versions" to "anon";

grant insert on table "public"."document_versions" to "anon";

grant references on table "public"."document_versions" to "anon";

grant select on table "public"."document_versions" to "anon";

grant trigger on table "public"."document_versions" to "anon";

grant truncate on table "public"."document_versions" to "anon";

grant update on table "public"."document_versions" to "anon";

grant delete on table "public"."document_versions" to "authenticated";

grant insert on table "public"."document_versions" to "authenticated";

grant references on table "public"."document_versions" to "authenticated";

grant select on table "public"."document_versions" to "authenticated";

grant trigger on table "public"."document_versions" to "authenticated";

grant truncate on table "public"."document_versions" to "authenticated";

grant update on table "public"."document_versions" to "authenticated";

grant delete on table "public"."document_versions" to "service_role";

grant insert on table "public"."document_versions" to "service_role";

grant references on table "public"."document_versions" to "service_role";

grant select on table "public"."document_versions" to "service_role";

grant trigger on table "public"."document_versions" to "service_role";

grant truncate on table "public"."document_versions" to "service_role";

grant update on table "public"."document_versions" to "service_role";

grant delete on table "public"."onboarding_restrictions" to "anon";

grant insert on table "public"."onboarding_restrictions" to "anon";

grant references on table "public"."onboarding_restrictions" to "anon";

grant select on table "public"."onboarding_restrictions" to "anon";

grant trigger on table "public"."onboarding_restrictions" to "anon";

grant truncate on table "public"."onboarding_restrictions" to "anon";

grant update on table "public"."onboarding_restrictions" to "anon";

grant delete on table "public"."onboarding_restrictions" to "authenticated";

grant insert on table "public"."onboarding_restrictions" to "authenticated";

grant references on table "public"."onboarding_restrictions" to "authenticated";

grant select on table "public"."onboarding_restrictions" to "authenticated";

grant trigger on table "public"."onboarding_restrictions" to "authenticated";

grant truncate on table "public"."onboarding_restrictions" to "authenticated";

grant update on table "public"."onboarding_restrictions" to "authenticated";

grant delete on table "public"."onboarding_restrictions" to "service_role";

grant insert on table "public"."onboarding_restrictions" to "service_role";

grant references on table "public"."onboarding_restrictions" to "service_role";

grant select on table "public"."onboarding_restrictions" to "service_role";

grant trigger on table "public"."onboarding_restrictions" to "service_role";

grant truncate on table "public"."onboarding_restrictions" to "service_role";

grant update on table "public"."onboarding_restrictions" to "service_role";

grant delete on table "public"."policy_template_approvers" to "anon";

grant insert on table "public"."policy_template_approvers" to "anon";

grant references on table "public"."policy_template_approvers" to "anon";

grant select on table "public"."policy_template_approvers" to "anon";

grant trigger on table "public"."policy_template_approvers" to "anon";

grant truncate on table "public"."policy_template_approvers" to "anon";

grant update on table "public"."policy_template_approvers" to "anon";

grant delete on table "public"."policy_template_approvers" to "authenticated";

grant insert on table "public"."policy_template_approvers" to "authenticated";

grant references on table "public"."policy_template_approvers" to "authenticated";

grant select on table "public"."policy_template_approvers" to "authenticated";

grant trigger on table "public"."policy_template_approvers" to "authenticated";

grant truncate on table "public"."policy_template_approvers" to "authenticated";

grant update on table "public"."policy_template_approvers" to "authenticated";

grant delete on table "public"."policy_template_approvers" to "service_role";

grant insert on table "public"."policy_template_approvers" to "service_role";

grant references on table "public"."policy_template_approvers" to "service_role";

grant select on table "public"."policy_template_approvers" to "service_role";

grant trigger on table "public"."policy_template_approvers" to "service_role";

grant truncate on table "public"."policy_template_approvers" to "service_role";

grant update on table "public"."policy_template_approvers" to "service_role";

create policy "Users can create and update their own approvals"
on "public"."document_approvals"
as permissive
for all
to public
using (((approver_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM (user_roles ur
     JOIN role_permissions rp ON ((rp.role_id = ur.role_id)))
  WHERE ((ur.user_id = auth.uid()) AND (rp.permission_name = 'document:approve'::text))))))
with check (((approver_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM (user_roles ur
     JOIN role_permissions rp ON ((rp.role_id = ur.role_id)))
  WHERE ((ur.user_id = auth.uid()) AND (rp.permission_name = 'document:approve'::text))))));


create policy "Users can view document approvals they have access to"
on "public"."document_approvals"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM ((documents d
     JOIN user_roles ur ON ((ur.user_id = auth.uid())))
     JOIN role_permissions rp ON ((rp.role_id = ur.role_id)))
  WHERE ((d.id = document_approvals.document_id) AND (rp.permission_name = 'document:read'::text)))));


create policy "Users can create document versions they have access to"
on "public"."document_versions"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM ((documents d
     JOIN user_roles ur ON ((ur.user_id = auth.uid())))
     JOIN role_permissions rp ON ((rp.role_id = ur.role_id)))
  WHERE ((d.id = document_versions.document_id) AND (rp.permission_name = 'document:write'::text)))));


create policy "Users can view document versions they have access to"
on "public"."document_versions"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM ((documents d
     JOIN user_roles ur ON ((ur.user_id = auth.uid())))
     JOIN role_permissions rp ON ((rp.role_id = ur.role_id)))
  WHERE ((d.id = document_versions.document_id) AND (rp.permission_name = 'document:read'::text)))));


create policy "Enable delete for authenticated users only"
on "public"."onboarding_restrictions"
as permissive
for delete
to public
using ((auth.role() = 'authenticated'::text));


create policy "Enable insert for authenticated users only"
on "public"."onboarding_restrictions"
as permissive
for insert
to public
with check ((auth.role() = 'authenticated'::text));


create policy "Enable read access for all users"
on "public"."onboarding_restrictions"
as permissive
for select
to public
using (true);


create policy "Enable update for authenticated users only"
on "public"."onboarding_restrictions"
as permissive
for update
to public
using ((auth.role() = 'authenticated'::text));


CREATE TRIGGER document_expiry_trigger AFTER INSERT OR UPDATE OF expiry_date ON public.documents FOR EACH ROW EXECUTE FUNCTION check_document_expiry();

CREATE TRIGGER document_version_trigger BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION create_document_version();

CREATE TRIGGER update_onboarding_restrictions_updated_at BEFORE UPDATE ON public.onboarding_restrictions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


