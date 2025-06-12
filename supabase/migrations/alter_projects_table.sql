-- Alter Projects Table Migration
-- Remove funding_round column
ALTER TABLE public.projects DROP COLUMN IF EXISTS funding_round;

-- Add new date columns 
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP WITH TIME ZONE NULL;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE NULL;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS transaction_start_date TIMESTAMP WITH TIME ZONE NULL;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS maturity_date TIMESTAMP WITH TIME ZONE NULL;

-- Add comments on new columns for documentation
COMMENT ON COLUMN public.projects.subscription_start_date IS 'Date when subscription period begins';
COMMENT ON COLUMN public.projects.subscription_end_date IS 'Date when subscription period ends';
COMMENT ON COLUMN public.projects.transaction_start_date IS 'Date when the transaction/offering officially begins';
COMMENT ON COLUMN public.projects.maturity_date IS 'Maturity date for the offering'; 