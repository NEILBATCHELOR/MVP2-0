-- Create transaction events table

CREATE TABLE IF NOT EXISTS transaction_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data JSONB NOT NULL,
  actor TEXT,
  actor_role TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_transaction_events_request_id ON transaction_events(request_id);
CREATE INDEX IF NOT EXISTS idx_transaction_events_event_type ON transaction_events(event_type);

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE transaction_events;

-- Create helper functions for dynamic table creation
CREATE OR REPLACE FUNCTION create_transaction_events_table()
RETURNS void AS $$
BEGIN
  -- Table is created in the migration, this is just a placeholder
  -- for the API to call to ensure the table exists
  RETURN;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION add_table_to_realtime(table_name text)
RETURNS void AS $$
BEGIN
  -- This function is just a placeholder
  -- The actual ALTER PUBLICATION is done in the migration
  RETURN;
END;
$$ LANGUAGE plpgsql;
