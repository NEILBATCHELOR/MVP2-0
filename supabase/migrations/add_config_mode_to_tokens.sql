-- Add config_mode column to tokens table
ALTER TABLE tokens ADD COLUMN IF NOT EXISTS config_mode TEXT DEFAULT 'min';

-- Update comment to explain what config_mode does
COMMENT ON COLUMN tokens.config_mode IS 'Indicates if token uses minimal or maximal configuration (values: min, max)';