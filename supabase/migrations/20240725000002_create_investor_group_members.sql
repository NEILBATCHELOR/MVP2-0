-- Create investor group members table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.investor_group_members (
  group_id uuid NOT NULL,
  investor_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT investor_group_members_pkey PRIMARY KEY (group_id, investor_id),
  CONSTRAINT investor_group_members_group_fkey FOREIGN KEY (group_id)
    REFERENCES public.investor_groups (id) ON DELETE CASCADE,
  CONSTRAINT investor_group_members_investor_fkey FOREIGN KEY (investor_id)
    REFERENCES public.investors (investor_id) ON DELETE CASCADE
);

-- Enable row level security
ALTER TABLE public.investor_group_members ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.investor_group_members;
CREATE POLICY "Enable read access for all users" ON public.investor_group_members
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.investor_group_members;
CREATE POLICY "Enable insert for authenticated users only" ON public.investor_group_members
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.investor_group_members;
CREATE POLICY "Enable delete for authenticated users only" ON public.investor_group_members
  FOR DELETE USING (true);

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.investor_group_members;
