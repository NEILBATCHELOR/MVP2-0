-- Update the handle_token_distribution function to include transaction_signatures lookup
CREATE OR REPLACE FUNCTION handle_token_distribution()
RETURNS TRIGGER AS $$
DECLARE
  tx_proposal transaction_proposals%ROWTYPE;
BEGIN
  -- Only process when distributed is changed from false to true
  IF (OLD.distributed = false AND NEW.distributed = true) THEN
    -- Find the transaction proposal using distribution_tx_hash if it exists
    IF NEW.distribution_tx_hash IS NOT NULL THEN
      SELECT * INTO tx_proposal 
      FROM transaction_proposals 
      WHERE id::text = NEW.distribution_tx_hash 
         OR id IN (
           SELECT proposal_id FROM transaction_signatures 
           WHERE transaction_hash = NEW.distribution_tx_hash
         )
      LIMIT 1;
    END IF;
    
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
      tx_proposal.token_symbol,
      COALESCE(tx_proposal.to_address, ''),
      NEW.notes,
      NEW.token_amount
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql; 