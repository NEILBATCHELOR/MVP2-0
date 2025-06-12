-- Add consensus_type column to approval_configs table
ALTER TABLE approval_configs ADD COLUMN consensus_type TEXT NOT NULL DEFAULT '2of3';

-- Update existing rows to have a default consensus type
UPDATE approval_configs SET consensus_type = '2of3' WHERE consensus_type IS NULL; 