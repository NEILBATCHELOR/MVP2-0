-- Add estimated_yield_percentage column to projects table
ALTER TABLE "public"."projects" ADD COLUMN "estimated_yield_percentage" NUMERIC;

-- Create enum for project duration
CREATE TYPE "public"."project_duration" AS ENUM (
  '1_month',
  '3_months',
  '6_months',
  '9_months',
  '12_months',
  'over_12_months'
);

-- Add duration column to projects table using the new enum
ALTER TABLE "public"."projects" ADD COLUMN "duration" "public"."project_duration";

-- Update RLS policy for the new columns
ALTER POLICY "Enable read access for all users" ON "public"."projects"
    USING (true);

-- Add comment for better documentation
COMMENT ON COLUMN "public"."projects"."estimated_yield_percentage" IS 'The estimated yield percentage for the project';
COMMENT ON COLUMN "public"."projects"."duration" IS 'The expected duration of the project (1, 3, 6, 9, 12, or >12 months)';