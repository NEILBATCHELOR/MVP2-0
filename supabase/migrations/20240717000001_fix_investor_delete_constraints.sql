-- Remove any foreign key constraints that might be preventing deletion
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Find all foreign keys referencing the investors table
    FOR r IN SELECT con.conname, con.conrelid::regclass AS table_name
             FROM pg_constraint con
             JOIN pg_class rel ON rel.oid = con.conrelid
             JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
             WHERE con.contype = 'f'
               AND con.confrelid = 'public.investors'::regclass::oid
               AND nsp.nspname = 'public'
    LOOP
        -- Drop the constraint
        EXECUTE 'ALTER TABLE ' || r.table_name || ' DROP CONSTRAINT IF EXISTS ' || r.conname || ' CASCADE;';
    END LOOP;
END$$;

-- Add ON DELETE CASCADE to any tables that reference investors
ALTER TABLE IF EXISTS public.subscriptions
    DROP CONSTRAINT IF EXISTS subscriptions_investor_id_fkey,
    ADD CONSTRAINT subscriptions_investor_id_fkey
    FOREIGN KEY (investor_id)
    REFERENCES public.investors(investor_id)
    ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.cap_table_investors
    DROP CONSTRAINT IF EXISTS cap_table_investors_investor_id_fkey,
    ADD CONSTRAINT cap_table_investors_investor_id_fkey
    FOREIGN KEY (investor_id)
    REFERENCES public.investors(investor_id)
    ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.compliance_checks
    DROP CONSTRAINT IF EXISTS compliance_checks_investor_id_fkey,
    ADD CONSTRAINT compliance_checks_investor_id_fkey
    FOREIGN KEY (investor_id)
    REFERENCES public.investors(investor_id)
    ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.investor_groups_investors
    DROP CONSTRAINT IF EXISTS investor_groups_investors_investor_id_fkey,
    ADD CONSTRAINT investor_groups_investors_investor_id_fkey
    FOREIGN KEY (investor_id)
    REFERENCES public.investors(investor_id)
    ON DELETE CASCADE;
