-- Create investors table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.investors (
    investor_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    company TEXT,
    type TEXT NOT NULL,
    kyc_status TEXT NOT NULL DEFAULT 'not_started',
    kyc_expiry_date TIMESTAMP WITH TIME ZONE,
    wallet_address TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable row-level security
ALTER TABLE public.investors ENABLE ROW LEVEL SECURITY;

-- Create policy for public access
DROP POLICY IF EXISTS "Public access" ON public.investors;
CREATE POLICY "Public access"
    ON public.investors FOR SELECT
    USING (true);

-- Create policy for authenticated users to insert/update/delete
DROP POLICY IF EXISTS "Authenticated users can manage investors" ON public.investors;
CREATE POLICY "Authenticated users can manage investors"
    ON public.investors FOR ALL
    USING (auth.role() = 'authenticated');

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.investors;
