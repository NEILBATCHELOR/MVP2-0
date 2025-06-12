-- Check if transaction_signatures table already exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'transaction_signatures') THEN
        -- Create transaction_signatures table
        CREATE TABLE public.transaction_signatures (
            id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
            proposal_id uuid NOT NULL,
            transaction_hash text,
            signer uuid NOT NULL,
            signature text NOT NULL,
            created_at timestamp with time zone NOT NULL DEFAULT now(),
            updated_at timestamp with time zone NULL DEFAULT now(),
            
            CONSTRAINT transaction_signatures_pkey PRIMARY KEY (id),
            CONSTRAINT transaction_signatures_proposal_fkey FOREIGN KEY (proposal_id) REFERENCES transaction_proposals (id) ON DELETE CASCADE,
            CONSTRAINT transaction_signatures_signer_fkey FOREIGN KEY (signer) REFERENCES auth.users (id) ON DELETE CASCADE
        );
        
        -- Add comment
        COMMENT ON TABLE public.transaction_signatures IS 'Signatures for multi-signature transactions';
        
        -- Create RLS policies
        ALTER TABLE public.transaction_signatures ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Allow transaction_signatures read access"
            ON public.transaction_signatures
            FOR SELECT
            USING (TRUE);
            
        CREATE POLICY "Allow transaction_signatures insert access"
            ON public.transaction_signatures
            FOR INSERT
            WITH CHECK (auth.uid() IS NOT NULL);
            
        CREATE POLICY "Allow transaction_signatures update access"
            ON public.transaction_signatures
            FOR UPDATE
            USING (auth.uid() IS NOT NULL);
        
        -- Grant permissions
        GRANT SELECT, INSERT, UPDATE ON public.transaction_signatures TO authenticated;
        GRANT SELECT ON public.transaction_signatures TO anon;
    END IF;
END
$$; 