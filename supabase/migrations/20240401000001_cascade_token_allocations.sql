-- Create function to handle cascading deletion of token allocations
CREATE OR REPLACE FUNCTION handle_token_allocation_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- If allocation was already distributed, don't allow deletion
  IF OLD.distributed = true THEN
    RAISE EXCEPTION 'Cannot delete token allocation that has already been distributed';
  END IF;
  
  -- Update the subscriptions table to mark as not allocated
  UPDATE subscriptions 
  SET allocated = false,
      updated_at = NOW()
  WHERE id = OLD.subscription_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger for before deleting token allocations
CREATE TRIGGER before_token_allocation_delete
BEFORE DELETE ON token_allocations
FOR EACH ROW
EXECUTE FUNCTION handle_token_allocation_deletion();

-- Create function to handle token allocation distribution
CREATE OR REPLACE FUNCTION handle_token_distribution()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the subscriptions table to mark as distributed
  UPDATE subscriptions 
  SET distributed = true,
      updated_at = NOW()
  WHERE id = NEW.subscription_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql; 