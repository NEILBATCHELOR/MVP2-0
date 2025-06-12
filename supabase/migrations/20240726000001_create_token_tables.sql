-- Create tokens table
CREATE TABLE IF NOT EXISTS public.tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  name text NOT NULL,
  symbol text NOT NULL,
  decimals integer NOT NULL DEFAULT 18,
  standard text NOT NULL,
  blocks jsonb NOT NULL,
  metadata jsonb NULL,
  status text NOT NULL DEFAULT 'DRAFT'::text,
  reviewers text[] NULL DEFAULT '{}'::text[],
  approvals text[] NULL DEFAULT '{}'::text[],
  contract_preview text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT tokens_pkey PRIMARY KEY (id),
  CONSTRAINT tokens_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tokens_project_id ON public.tokens USING btree (project_id);
CREATE INDEX IF NOT EXISTS idx_tokens_standard ON public.tokens USING btree (standard);
CREATE INDEX IF NOT EXISTS idx_tokens_status ON public.tokens USING btree (status);

-- Create token_versions table
CREATE TABLE IF NOT EXISTS public.token_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  token_id uuid NOT NULL,
  version integer NOT NULL,
  data jsonb NOT NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  created_by text NULL,
  CONSTRAINT token_versions_pkey PRIMARY KEY (id),
  CONSTRAINT token_versions_token_id_fkey FOREIGN KEY (token_id) REFERENCES tokens (id) ON DELETE CASCADE
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_token_versions_token_id ON public.token_versions USING btree (token_id);

-- Create token_designs table
CREATE TABLE IF NOT EXISTS public.token_designs (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  created_at timestamp with time zone NULL DEFAULT now(),
  name text NOT NULL,
  type text NOT NULL,
  status text NOT NULL DEFAULT 'draft'::text,
  total_supply numeric NOT NULL,
  contract_address text NULL,
  deployment_date timestamp with time zone NULL,
  CONSTRAINT token_designs_pkey PRIMARY KEY (id),
  CONSTRAINT token_designs_status_check CHECK (
    (status = ANY (ARRAY['draft'::text, 'ready'::text, 'minted'::text]))
  ),
  CONSTRAINT token_designs_type_check CHECK (
    (type = ANY (ARRAY[
      'ERC-20'::text,
      'ERC-721'::text,
      'ERC-1155'::text,
      'ERC-1400'::text,
      'ERC-3525'::text,
      'ERC-4626'::text
    ]))
  )
);

-- Create token_deployments table
CREATE TABLE IF NOT EXISTS public.token_deployments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  token_id uuid NOT NULL,
  network text NOT NULL,
  contract_address text NOT NULL,
  transaction_hash text NOT NULL,
  deployed_at timestamp with time zone NULL DEFAULT now(),
  deployed_by text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING'::text,
  deployment_data jsonb NULL,
  CONSTRAINT token_deployments_pkey PRIMARY KEY (id),
  CONSTRAINT token_deployments_token_id_fkey FOREIGN KEY (token_id) REFERENCES tokens (id) ON DELETE CASCADE
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_token_deployments_token_id ON public.token_deployments USING btree (token_id);

-- Create token_comments table
CREATE TABLE IF NOT EXISTS public.token_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  token_id uuid NOT NULL,
  user_id text NOT NULL,
  comment text NOT NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT token_comments_pkey PRIMARY KEY (id),
  CONSTRAINT token_comments_token_id_fkey FOREIGN KEY (token_id) REFERENCES tokens (id) ON DELETE CASCADE
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_token_comments_token_id ON public.token_comments USING btree (token_id);

-- Enable row level security
ALTER TABLE public.tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_comments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON public.tokens
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.tokens
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users only" ON public.tokens
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users only" ON public.tokens
  FOR DELETE USING (true);

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.tokens;
ALTER PUBLICATION supabase_realtime ADD TABLE public.token_versions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.token_designs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.token_deployments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.token_comments;
