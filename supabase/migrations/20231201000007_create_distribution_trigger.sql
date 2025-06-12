-- Create function to handle token distributions
CREATE OR REPLACE FUNCTION handle_token_distribution()
RETURNS TRIGGER AS $$
DECLARE
  tx_proposal transaction_proposals%ROWTYPE;
  investor_wallet text;
BEGIN
  -- Only process when distributed is changed from false to true
  IF (OLD.distributed = false AND NEW.distributed = true) THEN
    -- Find the transaction proposal using distribution_tx_hash if it exists
    IF NEW.distribution_tx_hash IS NOT NULL THEN
      SELECT * INTO tx_proposal 
      FROM transaction_proposals 
      WHERE id::text = NEW.distribution_tx_hash::text
         OR (NEW.distribution_tx_hash ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND id = NEW.distribution_tx_hash::uuid)
      LIMIT 1;
    END IF;
    
    -- Get investor wallet address
    SELECT wallet_address INTO investor_wallet 
    FROM investors 
    WHERE investor_id = NEW.investor_id;
    
    -- Insert record into distributions table
    INSERT INTO distributions (
      token_allocation_id,
      investor_id,
      subscription_id,
      project_id,
      token_type,
      token_amount,
      distribution_date,
      distribution_tx_hash,
      wallet_id,
      blockchain,
      token_address,
      token_symbol,
      to_address,
      notes,
      remaining_amount
    ) VALUES (
      NEW.id,
      NEW.investor_id,
      NEW.subscription_id,
      NEW.project_id,
      NEW.token_type,
      NEW.token_amount,
      COALESCE(NEW.distribution_date, now()),
      COALESCE(NEW.distribution_tx_hash, ''),
      tx_proposal.wallet_id,
      COALESCE(tx_proposal.blockchain, 'ethereum'),
      tx_proposal.token_address,
      COALESCE(NEW.symbol, tx_proposal.token_symbol),
      COALESCE(tx_proposal.to_address, investor_wallet, ''),
      NEW.notes,
      NEW.token_amount
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on token_allocations table
CREATE TRIGGER after_token_allocation_distributed
AFTER UPDATE ON token_allocations
FOR EACH ROW
WHEN (OLD.distributed = false AND NEW.distributed = true)
EXECUTE FUNCTION handle_token_distribution(); 