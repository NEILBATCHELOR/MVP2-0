-- Add missing columns to the investors table
ALTER TABLE public.investors
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;
