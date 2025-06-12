-- Add total_notional column to projects table
ALTER TABLE projects 
ADD COLUMN total_notional numeric null;

-- Update RLS policies to include the new column
ALTER POLICY "Enable read access for all users" ON public.projects
  USING (true)
  WITH CHECK (false);