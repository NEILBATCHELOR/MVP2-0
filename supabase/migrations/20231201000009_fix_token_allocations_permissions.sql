-- Ensure proper RLS policies for token_allocations table

-- Check if RLS is enabled using a more compatible approach
DO $$
BEGIN
  -- Enable RLS if not already enabled, using the proper catalog views
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'token_allocations'
    AND n.nspname = 'public'
    AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE public.token_allocations ENABLE ROW LEVEL SECURITY;
  END IF;
END$$;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Allow token_allocations read access" ON public.token_allocations;
DROP POLICY IF EXISTS "Allow token_allocations insert access" ON public.token_allocations;
DROP POLICY IF EXISTS "Allow token_allocations update access" ON public.token_allocations;
DROP POLICY IF EXISTS "Allow token_allocations delete access" ON public.token_allocations;

-- Create comprehensive policies
CREATE POLICY "Allow token_allocations read access"
  ON public.token_allocations
  FOR SELECT
  USING (TRUE); -- Allow any authenticated user to read

CREATE POLICY "Allow token_allocations insert access"
  ON public.token_allocations
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL); -- Allow any authenticated user to insert

CREATE POLICY "Allow token_allocations update access"
  ON public.token_allocations
  FOR UPDATE
  USING (auth.uid() IS NOT NULL); -- Allow any authenticated user to update

CREATE POLICY "Allow token_allocations delete access"
  ON public.token_allocations
  FOR DELETE
  USING (auth.uid() IS NOT NULL); -- Allow any authenticated user to delete

-- Make sure the public role has proper access to the table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.token_allocations TO authenticated;
GRANT SELECT ON public.token_allocations TO anon;

-- Verify the new distributions table has proper permissions as well
DROP POLICY IF EXISTS "Allow distributions read access" ON public.distributions;
DROP POLICY IF EXISTS "Allow distributions insert access" ON public.distributions;
DROP POLICY IF EXISTS "Allow distributions update access" ON public.distributions;

CREATE POLICY "Allow distributions read access"
  ON public.distributions
  FOR SELECT
  USING (TRUE);

CREATE POLICY "Allow distributions insert access"
  ON public.distributions
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow distributions update access"
  ON public.distributions
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

GRANT SELECT, INSERT, UPDATE ON public.distributions TO authenticated;
GRANT SELECT ON public.distributions TO anon; 