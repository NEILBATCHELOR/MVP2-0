-- Create a junction table to link distributions to redemption requests
CREATE TABLE public.distribution_redemptions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  distribution_id uuid NOT NULL,
  redemption_request_id uuid NOT NULL,
  amount_redeemed numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  
  CONSTRAINT distribution_redemptions_pkey PRIMARY KEY (id),
  CONSTRAINT distribution_redemptions_distribution_fkey FOREIGN KEY (distribution_id) REFERENCES distributions (id) ON DELETE CASCADE,
  CONSTRAINT distribution_redemptions_redemption_fkey FOREIGN KEY (redemption_request_id) REFERENCES redemption_requests (id) ON DELETE CASCADE,
  CONSTRAINT distribution_redemptions_unique UNIQUE (distribution_id, redemption_request_id),
  CONSTRAINT distribution_redemptions_amount_check CHECK ((amount_redeemed > (0)::numeric))
) TABLESPACE pg_default;

COMMENT ON TABLE public.distribution_redemptions IS 'Tracks which distributions have been included in redemption requests';

-- Create trigger for logging changes
CREATE TRIGGER log_distribution_redemption_changes
AFTER INSERT OR DELETE OR UPDATE ON distribution_redemptions
FOR EACH ROW EXECUTE FUNCTION log_user_action();

-- Add a remaining_amount column to distributions to track available tokens for redemption
ALTER TABLE public.distributions
ADD COLUMN remaining_amount numeric NULL,
ADD COLUMN fully_redeemed boolean NOT NULL DEFAULT false;

-- Set initial remaining_amount to token_amount for existing records
UPDATE public.distributions
SET remaining_amount = token_amount
WHERE remaining_amount IS NULL;

-- Add constraint to ensure remaining_amount is valid
ALTER TABLE public.distributions
ADD CONSTRAINT distributions_remaining_amount_check CHECK ((remaining_amount >= (0)::numeric)),
ALTER COLUMN remaining_amount SET NOT NULL;

-- Create function to update remaining_amount when redemptions are added
CREATE OR REPLACE FUNCTION update_distribution_remaining_amount()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the remaining amount in the distribution
  UPDATE distributions
  SET 
    remaining_amount = remaining_amount - NEW.amount_redeemed,
    fully_redeemed = CASE WHEN (remaining_amount - NEW.amount_redeemed) <= 0 THEN true ELSE false END,
    updated_at = now()
  WHERE id = NEW.distribution_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER after_distribution_redemption_insert
AFTER INSERT ON distribution_redemptions
FOR EACH ROW
EXECUTE FUNCTION update_distribution_remaining_amount(); 