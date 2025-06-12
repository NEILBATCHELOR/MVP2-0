create type "public"."compliance_status" as enum ('compliant', 'non_compliant', 'pending_review');

create type "public"."document_status" as enum ('pending', 'approved', 'rejected', 'expired');

create type "public"."document_type" as enum ('commercial_register', 'certificate_incorporation', 'memorandum_articles', 'director_list', 'shareholder_register', 'financial_statements', 'regulatory_status', 'qualification_summary', 'business_description', 'organizational_chart', 'key_people_cv', 'aml_kyc_description');

create type "public"."issuer_role" as enum ('admin', 'editor', 'viewer', 'compliance_officer');

create type "public"."workflow_status" as enum ('pending', 'completed', 'rejected');

alter table "public"."approval_requests" drop constraint "approval_requests_status_check";

create table "public"."compliance_reports" (
    "id" uuid not null default gen_random_uuid(),
    "issuer_id" uuid not null,
    "generated_at" timestamp with time zone not null default now(),
    "status" compliance_status not null default 'pending_review'::compliance_status,
    "findings" jsonb not null default '[]'::jsonb,
    "metadata" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "created_by" uuid not null,
    "updated_by" uuid not null
);


alter table "public"."compliance_reports" enable row level security;

create table "public"."document_workflows" (
    "id" uuid not null default gen_random_uuid(),
    "document_id" uuid not null,
    "required_signers" uuid[] not null,
    "completed_signers" uuid[] not null default '{}'::uuid[],
    "status" workflow_status not null default 'pending'::workflow_status,
    "deadline" timestamp with time zone,
    "metadata" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "created_by" uuid not null,
    "updated_by" uuid not null
);


alter table "public"."document_workflows" enable row level security;

create table "public"."issuer_access_roles" (
    "id" uuid not null default gen_random_uuid(),
    "issuer_id" uuid not null,
    "user_id" uuid not null,
    "role" issuer_role not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "created_by" uuid not null,
    "updated_by" uuid not null
);


alter table "public"."issuer_access_roles" enable row level security;

create table "public"."issuer_documents" (
    "id" uuid not null default gen_random_uuid(),
    "issuer_id" uuid not null,
    "document_type" document_type not null,
    "file_url" text not null,
    "status" document_status not null default 'pending'::document_status,
    "uploaded_at" timestamp with time zone not null default now(),
    "expires_at" timestamp with time zone,
    "last_reviewed_at" timestamp with time zone,
    "reviewed_by" uuid,
    "version" integer not null default 1,
    "metadata" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "created_by" uuid not null,
    "updated_by" uuid not null
);


alter table "public"."issuer_documents" enable row level security;

CREATE UNIQUE INDEX compliance_reports_pkey ON public.compliance_reports USING btree (id);

CREATE UNIQUE INDEX document_workflows_pkey ON public.document_workflows USING btree (id);

CREATE INDEX idx_compliance_reports_generated_at ON public.compliance_reports USING btree (generated_at);

CREATE INDEX idx_compliance_reports_issuer_id ON public.compliance_reports USING btree (issuer_id);

CREATE INDEX idx_compliance_reports_status ON public.compliance_reports USING btree (status);

CREATE INDEX idx_document_workflows_document_id ON public.document_workflows USING btree (document_id);

CREATE INDEX idx_document_workflows_status ON public.document_workflows USING btree (status);

CREATE INDEX idx_issuer_access_roles_issuer_id ON public.issuer_access_roles USING btree (issuer_id);

CREATE INDEX idx_issuer_access_roles_role ON public.issuer_access_roles USING btree (role);

CREATE INDEX idx_issuer_access_roles_user_id ON public.issuer_access_roles USING btree (user_id);

CREATE INDEX idx_issuer_documents_issuer_id ON public.issuer_documents USING btree (issuer_id);

CREATE INDEX idx_issuer_documents_status ON public.issuer_documents USING btree (status);

CREATE INDEX idx_issuer_documents_type ON public.issuer_documents USING btree (document_type);

CREATE UNIQUE INDEX issuer_access_roles_issuer_id_user_id_key ON public.issuer_access_roles USING btree (issuer_id, user_id);

CREATE UNIQUE INDEX issuer_access_roles_pkey ON public.issuer_access_roles USING btree (id);

CREATE UNIQUE INDEX issuer_documents_pkey ON public.issuer_documents USING btree (id);

alter table "public"."compliance_reports" add constraint "compliance_reports_pkey" PRIMARY KEY using index "compliance_reports_pkey";

alter table "public"."document_workflows" add constraint "document_workflows_pkey" PRIMARY KEY using index "document_workflows_pkey";

alter table "public"."issuer_access_roles" add constraint "issuer_access_roles_pkey" PRIMARY KEY using index "issuer_access_roles_pkey";

alter table "public"."issuer_documents" add constraint "issuer_documents_pkey" PRIMARY KEY using index "issuer_documents_pkey";

alter table "public"."compliance_reports" add constraint "compliance_reports_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."compliance_reports" validate constraint "compliance_reports_created_by_fkey";

alter table "public"."compliance_reports" add constraint "compliance_reports_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id) not valid;

alter table "public"."compliance_reports" validate constraint "compliance_reports_updated_by_fkey";

alter table "public"."document_workflows" add constraint "document_workflows_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."document_workflows" validate constraint "document_workflows_created_by_fkey";

alter table "public"."document_workflows" add constraint "document_workflows_document_id_fkey" FOREIGN KEY (document_id) REFERENCES issuer_documents(id) ON DELETE CASCADE not valid;

alter table "public"."document_workflows" validate constraint "document_workflows_document_id_fkey";

alter table "public"."document_workflows" add constraint "document_workflows_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id) not valid;

alter table "public"."document_workflows" validate constraint "document_workflows_updated_by_fkey";

alter table "public"."document_workflows" add constraint "valid_deadline" CHECK ((deadline > created_at)) not valid;

alter table "public"."document_workflows" validate constraint "valid_deadline";

alter table "public"."document_workflows" add constraint "valid_signers" CHECK (((array_length(completed_signers, 1) <= array_length(required_signers, 1)) AND (completed_signers <@ required_signers))) not valid;

alter table "public"."document_workflows" validate constraint "valid_signers";

alter table "public"."issuer_access_roles" add constraint "issuer_access_roles_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."issuer_access_roles" validate constraint "issuer_access_roles_created_by_fkey";

alter table "public"."issuer_access_roles" add constraint "issuer_access_roles_issuer_id_user_id_key" UNIQUE using index "issuer_access_roles_issuer_id_user_id_key";

alter table "public"."issuer_access_roles" add constraint "issuer_access_roles_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id) not valid;

alter table "public"."issuer_access_roles" validate constraint "issuer_access_roles_updated_by_fkey";

alter table "public"."issuer_access_roles" add constraint "issuer_access_roles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."issuer_access_roles" validate constraint "issuer_access_roles_user_id_fkey";

alter table "public"."issuer_documents" add constraint "issuer_documents_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."issuer_documents" validate constraint "issuer_documents_created_by_fkey";

alter table "public"."issuer_documents" add constraint "issuer_documents_reviewed_by_fkey" FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) not valid;

alter table "public"."issuer_documents" validate constraint "issuer_documents_reviewed_by_fkey";

alter table "public"."issuer_documents" add constraint "issuer_documents_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id) not valid;

alter table "public"."issuer_documents" validate constraint "issuer_documents_updated_by_fkey";

alter table "public"."issuer_documents" add constraint "valid_expiry_date" CHECK ((expires_at > uploaded_at)) not valid;

alter table "public"."issuer_documents" validate constraint "valid_expiry_date";

alter table "public"."issuer_documents" add constraint "valid_review_date" CHECK ((last_reviewed_at >= uploaded_at)) not valid;

alter table "public"."issuer_documents" validate constraint "valid_review_date";

alter table "public"."approval_requests" add constraint "approval_requests_status_check" CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[]))) not valid;

alter table "public"."approval_requests" validate constraint "approval_requests_status_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

grant delete on table "public"."compliance_reports" to "anon";

grant insert on table "public"."compliance_reports" to "anon";

grant references on table "public"."compliance_reports" to "anon";

grant select on table "public"."compliance_reports" to "anon";

grant trigger on table "public"."compliance_reports" to "anon";

grant truncate on table "public"."compliance_reports" to "anon";

grant update on table "public"."compliance_reports" to "anon";

grant delete on table "public"."compliance_reports" to "authenticated";

grant insert on table "public"."compliance_reports" to "authenticated";

grant references on table "public"."compliance_reports" to "authenticated";

grant select on table "public"."compliance_reports" to "authenticated";

grant trigger on table "public"."compliance_reports" to "authenticated";

grant truncate on table "public"."compliance_reports" to "authenticated";

grant update on table "public"."compliance_reports" to "authenticated";

grant delete on table "public"."compliance_reports" to "service_role";

grant insert on table "public"."compliance_reports" to "service_role";

grant references on table "public"."compliance_reports" to "service_role";

grant select on table "public"."compliance_reports" to "service_role";

grant trigger on table "public"."compliance_reports" to "service_role";

grant truncate on table "public"."compliance_reports" to "service_role";

grant update on table "public"."compliance_reports" to "service_role";

grant delete on table "public"."document_workflows" to "anon";

grant insert on table "public"."document_workflows" to "anon";

grant references on table "public"."document_workflows" to "anon";

grant select on table "public"."document_workflows" to "anon";

grant trigger on table "public"."document_workflows" to "anon";

grant truncate on table "public"."document_workflows" to "anon";

grant update on table "public"."document_workflows" to "anon";

grant delete on table "public"."document_workflows" to "authenticated";

grant insert on table "public"."document_workflows" to "authenticated";

grant references on table "public"."document_workflows" to "authenticated";

grant select on table "public"."document_workflows" to "authenticated";

grant trigger on table "public"."document_workflows" to "authenticated";

grant truncate on table "public"."document_workflows" to "authenticated";

grant update on table "public"."document_workflows" to "authenticated";

grant delete on table "public"."document_workflows" to "service_role";

grant insert on table "public"."document_workflows" to "service_role";

grant references on table "public"."document_workflows" to "service_role";

grant select on table "public"."document_workflows" to "service_role";

grant trigger on table "public"."document_workflows" to "service_role";

grant truncate on table "public"."document_workflows" to "service_role";

grant update on table "public"."document_workflows" to "service_role";

grant delete on table "public"."issuer_access_roles" to "anon";

grant insert on table "public"."issuer_access_roles" to "anon";

grant references on table "public"."issuer_access_roles" to "anon";

grant select on table "public"."issuer_access_roles" to "anon";

grant trigger on table "public"."issuer_access_roles" to "anon";

grant truncate on table "public"."issuer_access_roles" to "anon";

grant update on table "public"."issuer_access_roles" to "anon";

grant delete on table "public"."issuer_access_roles" to "authenticated";

grant insert on table "public"."issuer_access_roles" to "authenticated";

grant references on table "public"."issuer_access_roles" to "authenticated";

grant select on table "public"."issuer_access_roles" to "authenticated";

grant trigger on table "public"."issuer_access_roles" to "authenticated";

grant truncate on table "public"."issuer_access_roles" to "authenticated";

grant update on table "public"."issuer_access_roles" to "authenticated";

grant delete on table "public"."issuer_access_roles" to "service_role";

grant insert on table "public"."issuer_access_roles" to "service_role";

grant references on table "public"."issuer_access_roles" to "service_role";

grant select on table "public"."issuer_access_roles" to "service_role";

grant trigger on table "public"."issuer_access_roles" to "service_role";

grant truncate on table "public"."issuer_access_roles" to "service_role";

grant update on table "public"."issuer_access_roles" to "service_role";

grant delete on table "public"."issuer_documents" to "anon";

grant insert on table "public"."issuer_documents" to "anon";

grant references on table "public"."issuer_documents" to "anon";

grant select on table "public"."issuer_documents" to "anon";

grant trigger on table "public"."issuer_documents" to "anon";

grant truncate on table "public"."issuer_documents" to "anon";

grant update on table "public"."issuer_documents" to "anon";

grant delete on table "public"."issuer_documents" to "authenticated";

grant insert on table "public"."issuer_documents" to "authenticated";

grant references on table "public"."issuer_documents" to "authenticated";

grant select on table "public"."issuer_documents" to "authenticated";

grant trigger on table "public"."issuer_documents" to "authenticated";

grant truncate on table "public"."issuer_documents" to "authenticated";

grant update on table "public"."issuer_documents" to "authenticated";

grant delete on table "public"."issuer_documents" to "service_role";

grant insert on table "public"."issuer_documents" to "service_role";

grant references on table "public"."issuer_documents" to "service_role";

grant select on table "public"."issuer_documents" to "service_role";

grant trigger on table "public"."issuer_documents" to "service_role";

grant truncate on table "public"."issuer_documents" to "service_role";

grant update on table "public"."issuer_documents" to "service_role";

create policy "Compliance officers can create reports"
on "public"."compliance_reports"
as permissive
for insert
to public
with check ((auth.uid() IN ( SELECT issuer_access_roles.user_id
   FROM issuer_access_roles
  WHERE ((issuer_access_roles.issuer_id = compliance_reports.issuer_id) AND (issuer_access_roles.role = ANY (ARRAY['admin'::issuer_role, 'compliance_officer'::issuer_role]))))));


create policy "Compliance officers can update reports"
on "public"."compliance_reports"
as permissive
for update
to public
using ((auth.uid() IN ( SELECT issuer_access_roles.user_id
   FROM issuer_access_roles
  WHERE ((issuer_access_roles.issuer_id = compliance_reports.issuer_id) AND (issuer_access_roles.role = ANY (ARRAY['admin'::issuer_role, 'compliance_officer'::issuer_role]))))));


create policy "Users can view reports for their issuers"
on "public"."compliance_reports"
as permissive
for select
to public
using ((auth.uid() IN ( SELECT issuer_access_roles.user_id
   FROM issuer_access_roles
  WHERE (issuer_access_roles.issuer_id = compliance_reports.issuer_id))));


create policy "Users can create workflows for their documents"
on "public"."document_workflows"
as permissive
for insert
to public
with check ((auth.uid() IN ( SELECT issuer_access_roles.user_id
   FROM issuer_access_roles
  WHERE ((issuer_access_roles.issuer_id = ( SELECT issuer_documents.issuer_id
           FROM issuer_documents
          WHERE (issuer_documents.id = document_workflows.document_id))) AND (issuer_access_roles.role = ANY (ARRAY['admin'::issuer_role, 'editor'::issuer_role]))))));


create policy "Users can update workflows they are involved in"
on "public"."document_workflows"
as permissive
for update
to public
using (((auth.uid() = ANY (required_signers)) OR (auth.uid() IN ( SELECT issuer_access_roles.user_id
   FROM issuer_access_roles
  WHERE ((issuer_access_roles.issuer_id = ( SELECT issuer_documents.issuer_id
           FROM issuer_documents
          WHERE (issuer_documents.id = document_workflows.document_id))) AND (issuer_access_roles.role = ANY (ARRAY['admin'::issuer_role, 'editor'::issuer_role])))))));


create policy "Users can view workflows they are involved in"
on "public"."document_workflows"
as permissive
for select
to public
using (((auth.uid() = ANY (required_signers)) OR (auth.uid() IN ( SELECT issuer_access_roles.user_id
   FROM issuer_access_roles
  WHERE (issuer_access_roles.issuer_id = ( SELECT issuer_documents.issuer_id
           FROM issuer_documents
          WHERE (issuer_documents.id = document_workflows.document_id)))))));


create policy "Admins can manage roles"
on "public"."issuer_access_roles"
as permissive
for all
to public
using ((auth.uid() IN ( SELECT issuer_access_roles_1.user_id
   FROM issuer_access_roles issuer_access_roles_1
  WHERE ((issuer_access_roles_1.issuer_id = issuer_access_roles_1.issuer_id) AND (issuer_access_roles_1.role = 'admin'::issuer_role)))));


create policy "Users can view roles for their issuers"
on "public"."issuer_access_roles"
as permissive
for select
to public
using ((auth.uid() IN ( SELECT issuer_access_roles_1.user_id
   FROM issuer_access_roles issuer_access_roles_1
  WHERE (issuer_access_roles_1.issuer_id = issuer_access_roles_1.issuer_id))));


create policy "Users can insert documents for their issuers"
on "public"."issuer_documents"
as permissive
for insert
to public
with check ((auth.uid() IN ( SELECT issuer_access_roles.user_id
   FROM issuer_access_roles
  WHERE ((issuer_access_roles.issuer_id = issuer_documents.issuer_id) AND (issuer_access_roles.role = ANY (ARRAY['admin'::issuer_role, 'editor'::issuer_role]))))));


create policy "Users can update documents for their issuers"
on "public"."issuer_documents"
as permissive
for update
to public
using ((auth.uid() IN ( SELECT issuer_access_roles.user_id
   FROM issuer_access_roles
  WHERE ((issuer_access_roles.issuer_id = issuer_documents.issuer_id) AND (issuer_access_roles.role = ANY (ARRAY['admin'::issuer_role, 'editor'::issuer_role]))))));


create policy "Users can view documents they have access to"
on "public"."issuer_documents"
as permissive
for select
to public
using ((auth.uid() IN ( SELECT issuer_access_roles.user_id
   FROM issuer_access_roles
  WHERE (issuer_access_roles.issuer_id = issuer_documents.issuer_id))));


CREATE TRIGGER update_compliance_reports_updated_at BEFORE UPDATE ON public.compliance_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_workflows_updated_at BEFORE UPDATE ON public.document_workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_issuer_access_roles_updated_at BEFORE UPDATE ON public.issuer_access_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_issuer_documents_updated_at BEFORE UPDATE ON public.issuer_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


