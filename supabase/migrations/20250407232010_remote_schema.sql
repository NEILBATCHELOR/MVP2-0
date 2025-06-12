alter table "public"."approval_requests" drop constraint "approval_requests_status_check";

alter table "public"."approval_requests" add constraint "approval_requests_status_check" CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[]))) not valid;

alter table "public"."approval_requests" validate constraint "approval_requests_status_check";


