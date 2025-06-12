-- Add approved_at column to redemption_requests table
-- This column tracks when a redemption request was approved

ALTER TABLE redemption_requests 
ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;

-- Add comment for documentation
COMMENT ON COLUMN redemption_requests.approved_at IS 'Timestamp when the redemption request was approved';
