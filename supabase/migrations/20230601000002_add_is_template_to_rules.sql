-- Add is_template field to rules table
ALTER TABLE rules ADD COLUMN is_template BOOLEAN DEFAULT false;

-- Create an index on is_template for faster template queries
CREATE INDEX idx_rules_is_template ON rules (is_template);

-- Update existing rules to have is_template = false
UPDATE rules SET is_template = false WHERE is_template IS NULL; 