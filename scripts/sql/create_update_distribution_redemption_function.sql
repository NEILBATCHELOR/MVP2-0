-- Create function for atomic distribution updates during redemption
-- This ensures thread-safe updates to remaining_amount and fully_redeemed status

CREATE OR REPLACE FUNCTION update_distribution_redemption(
  distribution_id UUID,
  amount_redeemed NUMERIC
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE distributions 
  SET 
    remaining_amount = remaining_amount - amount_redeemed,
    fully_redeemed = (remaining_amount - amount_redeemed) <= 0,
    updated_at = NOW()
  WHERE id = distribution_id;
  
  -- Ensure remaining_amount doesn't go below 0
  UPDATE distributions 
  SET remaining_amount = 0
  WHERE id = distribution_id AND remaining_amount < 0;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_distribution_redemption(UUID, NUMERIC) TO authenticated;
