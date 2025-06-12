-- Add transaction_events table if it doesn't exist
CREATE TABLE IF NOT EXISTS "transaction_events" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "request_id" TEXT,
  "event_type" TEXT NOT NULL,
  "timestamp" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  "data" JSONB,
  "actor" TEXT,
  "actor_role" TEXT,
  "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index on transaction events
CREATE INDEX IF NOT EXISTS "idx_transaction_events_request_id" ON "transaction_events" ("request_id");
CREATE INDEX IF NOT EXISTS "idx_transaction_events_actor" ON "transaction_events" ("actor");
CREATE INDEX IF NOT EXISTS "idx_transaction_events_event_type" ON "transaction_events" ("event_type");
CREATE INDEX IF NOT EXISTS "idx_transaction_events_timestamp" ON "transaction_events" ("timestamp");

-- Add column for tx_hash to wallet_transactions if it doesn't exist
ALTER TABLE "wallet_transactions" 
ADD COLUMN IF NOT EXISTS "tx_hash" TEXT,
ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS "token_symbol" TEXT,
ADD COLUMN IF NOT EXISTS "token_address" TEXT,
ADD COLUMN IF NOT EXISTS "confirmation_count" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ DEFAULT NOW();

-- Create index on tx_hash
CREATE INDEX IF NOT EXISTS "idx_wallet_transactions_tx_hash" ON "wallet_transactions" ("tx_hash");
CREATE INDEX IF NOT EXISTS "idx_wallet_transactions_status" ON "wallet_transactions" ("status");
CREATE INDEX IF NOT EXISTS "idx_wallet_transactions_from_address" ON "wallet_transactions" ("from_address");

-- Add function to update timestamp on update
CREATE OR REPLACE FUNCTION update_modified_column()   
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;   
END;
$$ language 'plpgsql';

-- Create trigger for wallet_transactions updated_at
DROP TRIGGER IF EXISTS update_wallet_transactions_updated_at ON wallet_transactions;
CREATE TRIGGER update_wallet_transactions_updated_at
BEFORE UPDATE ON wallet_transactions
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Create notifications table for transaction alerts
CREATE TABLE IF NOT EXISTS "transaction_notifications" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "transaction_id" TEXT,
  "wallet_address" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "read" BOOLEAN DEFAULT FALSE,
  "action_url" TEXT,
  "data" JSONB,
  "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add index for notifications
CREATE INDEX IF NOT EXISTS "idx_transaction_notifications_wallet" ON "transaction_notifications" ("wallet_address");
CREATE INDEX IF NOT EXISTS "idx_transaction_notifications_transaction" ON "transaction_notifications" ("transaction_id");
CREATE INDEX IF NOT EXISTS "idx_transaction_notifications_read" ON "transaction_notifications" ("read");

-- RLS Policies for transaction events and notifications
ALTER TABLE "transaction_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "transaction_notifications" ENABLE ROW LEVEL SECURITY;

-- Policies for transaction events
CREATE POLICY "Users can see their own transaction events"
ON "transaction_events"
FOR SELECT
USING (actor = auth.uid()::text);

-- Policies for transaction notifications
CREATE POLICY "Users can see their own transaction notifications"
ON "transaction_notifications"
FOR SELECT
USING (wallet_address = auth.uid()::text);

CREATE POLICY "Users can update their own transaction notifications"
ON "transaction_notifications"
FOR UPDATE
USING (wallet_address = auth.uid()::text);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT ON "transaction_events" TO authenticated;
GRANT SELECT, UPDATE ON "transaction_notifications" TO authenticated; 