-- Migration: Enhance redemption_approvers table for comprehensive approval workflow
-- Date: 2025-06-09
-- Purpose: Add missing fields to support the full approval service functionality

-- Add missing columns to redemption_approvers table
ALTER TABLE redemption_approvers 
ADD COLUMN IF NOT EXISTS approver_id TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'delegated')),
ADD COLUMN IF NOT EXISTS comments TEXT,
ADD COLUMN IF NOT EXISTS decision_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update existing records to set approver_id if null
UPDATE redemption_approvers 
SET approver_id = COALESCE(approver_id, 'system-user')
WHERE approver_id IS NULL;

-- Make approver_id NOT NULL after setting values
ALTER TABLE redemption_approvers 
ALTER COLUMN approver_id SET NOT NULL;

-- Add trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_redemption_approvers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER redemption_approvers_updated_at
  BEFORE UPDATE ON redemption_approvers
  FOR EACH ROW
  EXECUTE FUNCTION update_redemption_approvers_updated_at();

-- Update existing records to sync status with approved field
UPDATE redemption_approvers 
SET status = CASE 
  WHEN approved = true THEN 'approved'
  ELSE 'pending'
END,
decision_date = CASE 
  WHEN approved = true THEN approved_at
  ELSE NULL
END,
updated_at = COALESCE(approved_at, created_at);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_redemption_approvers_status ON redemption_approvers(status);
CREATE INDEX IF NOT EXISTS idx_redemption_approvers_approver_id ON redemption_approvers(approver_id);
CREATE INDEX IF NOT EXISTS idx_redemption_approvers_redemption_id_status ON redemption_approvers(redemption_id, status);

-- Add foreign key constraint for redemption_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_redemption_approvers_redemption_id'
  ) THEN
    ALTER TABLE redemption_approvers 
    ADD CONSTRAINT fk_redemption_approvers_redemption_id 
    FOREIGN KEY (redemption_id) REFERENCES redemption_requests(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add comment to table
COMMENT ON TABLE redemption_approvers IS 'Comprehensive approval tracking for redemption requests with multi-signature workflow support';
COMMENT ON COLUMN redemption_approvers.approver_id IS 'ID of the user who needs to approve this request';
COMMENT ON COLUMN redemption_approvers.status IS 'Current approval status: pending, approved, rejected, delegated';
COMMENT ON COLUMN redemption_approvers.comments IS 'Optional comments from the approver';
COMMENT ON COLUMN redemption_approvers.decision_date IS 'When the approval decision was made';
COMMENT ON COLUMN redemption_approvers.updated_at IS 'Last update timestamp, automatically maintained';
