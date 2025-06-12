-- Ensure the investors table exists with all required fields
CREATE TABLE IF NOT EXISTS public.investors (
  investor_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  kyc_status TEXT NOT NULL DEFAULT 'not_started',
  kyc_expiry_date TIMESTAMP WITH TIME ZONE,
  wallet_address TEXT,
  company TEXT,
  verification_details JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable row-level security
ALTER TABLE public.investors ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (in a real app, you'd want more restrictive policies)
DROP POLICY IF EXISTS "Public access" ON public.investors;
CREATE POLICY "Public access"
  ON public.investors
  USING (true);

-- Enable realtime subscriptions (only if not already added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'investors'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.investors;
  END IF;
END $$;