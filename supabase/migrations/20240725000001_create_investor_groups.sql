-- Create investor groups table
CREATE TABLE IF NOT EXISTS public.investor_groups (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  name text NOT NULL,
  description text NULL,
  member_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT investor_groups_pkey PRIMARY KEY (id)
);

-- Create investor group members table
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
ALTER TABLE public.investor_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investor_group_members ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON public.investor_groups
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.investor_groups
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users only" ON public.investor_groups
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users only" ON public.investor_groups
  FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON public.investor_group_members
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.investor_group_members
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users only" ON public.investor_group_members
  FOR DELETE USING (true);

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.investor_groups;
ALTER PUBLICATION supabase_realtime ADD TABLE public.investor_group_members;
