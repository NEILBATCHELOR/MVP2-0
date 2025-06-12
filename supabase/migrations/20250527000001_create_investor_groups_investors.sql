-- Create investor_groups_investors table
CREATE TABLE IF NOT EXISTS public.investor_groups_investors (
  id uuid not null default gen_random_uuid(),
  group_id uuid not null,
  investor_id uuid not null,
  created_at timestamp with time zone null default now(),
  constraint investor_groups_investors_pkey primary key (id),
  constraint investor_groups_investors_group_id_investor_id_key unique (group_id, investor_id),
  constraint investor_groups_investors_group_id_fkey foreign KEY (group_id) references investor_groups (id) on delete CASCADE,
  constraint investor_groups_investors_investor_id_fkey foreign KEY (investor_id) references investors (investor_id) on delete CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_investor_groups_investors_group_id 
ON public.investor_groups_investors USING btree (group_id);

CREATE INDEX IF NOT EXISTS idx_investor_groups_investors_investor_id 
ON public.investor_groups_investors USING btree (investor_id);

-- Enable row level security
ALTER TABLE public.investor_groups_investors ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON public.investor_groups_investors
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.investor_groups_investors
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users only" ON public.investor_groups_investors
  FOR DELETE USING (true);

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.investor_groups_investors;

-- Add a migration to copy data from old table if exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'investor_group_members') THEN
    INSERT INTO public.investor_groups_investors (group_id, investor_id, created_at)
    SELECT group_id, investor_id, created_at
    FROM public.investor_group_members
    ON CONFLICT (group_id, investor_id) DO NOTHING;
  END IF;
END
$$; 