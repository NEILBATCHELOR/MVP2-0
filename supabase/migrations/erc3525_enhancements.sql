-- ERC3525 Schema Enhancements
-- This migration adds new fields to better align with the form implementation

-- Add new fields to token_erc3525_properties
ALTER TABLE public.token_erc3525_properties
ADD COLUMN IF NOT EXISTS dynamic_metadata boolean NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS allows_slot_enumeration boolean NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS value_aggregation boolean NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS permissioning_enabled boolean NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS updatable_values boolean NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS supply_tracking boolean NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS custom_extensions text NULL;

-- Rename some columns for better semantic meaning
-- Note: Only perform these if you're sure they don't break existing functionality
-- ALTER TABLE public.token_erc3525_properties
-- RENAME COLUMN slot_transfer_validation TO slot_transferability;

-- Add value_units to token_erc3525_slots for better metadata
ALTER TABLE public.token_erc3525_slots
ADD COLUMN IF NOT EXISTS value_units text NULL;

-- Add recipient to token_erc3525_allocations for tracking ownership
ALTER TABLE public.token_erc3525_allocations
ADD COLUMN IF NOT EXISTS recipient text NULL;

-- Add comments for better schema documentation
COMMENT ON COLUMN public.token_erc3525_properties.dynamic_metadata IS 'Whether the token supports dynamic metadata updates';
COMMENT ON COLUMN public.token_erc3525_properties.allows_slot_enumeration IS 'Whether slots can be enumerated';
COMMENT ON COLUMN public.token_erc3525_properties.value_aggregation IS 'Whether token values can be aggregated';
COMMENT ON COLUMN public.token_erc3525_properties.slot_transfer_validation IS 'JSON configuration for slot transfer validation rules';
COMMENT ON COLUMN public.token_erc3525_properties.mergable IS 'Whether tokens can be merged';
COMMENT ON COLUMN public.token_erc3525_properties.splittable IS 'Whether tokens can be split';