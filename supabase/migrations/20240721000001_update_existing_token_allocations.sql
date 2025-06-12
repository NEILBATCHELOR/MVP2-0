-- Update existing token allocations to be confirmed if they have a valid subscription amount
UPDATE token_allocations
SET allocation_date = NOW()
WHERE allocation_date IS NULL
AND subscription_id IN (
  SELECT id FROM subscriptions WHERE fiat_amount > 0
);
