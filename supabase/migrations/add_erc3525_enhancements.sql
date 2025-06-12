-- Add additional fields to token_erc3525_properties
ALTER TABLE public.token_erc3525_properties
ADD COLUMN IF NOT EXISTS dynamic_metadata boolean NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS allows_slot_enumeration boolean NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS value_aggregation boolean NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS permissioning_enabled boolean NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS supply_tracking boolean NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS updatable_values boolean NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS custom_extensions text NULL,
ADD COLUMN IF NOT EXISTS fractionalizable boolean NULL DEFAULT false;

-- Add value_units to token_erc3525_slots
ALTER TABLE public.token_erc3525_slots
ADD COLUMN IF NOT EXISTS value_units text NULL;

-- Add recipient to token_erc3525_allocations
ALTER TABLE public.token_erc3525_allocations
ADD COLUMN IF NOT EXISTS recipient text NULL;

-- Add a more detailed slot_transfer_validation column
-- If this column already exists, we're just documenting the expected schema
COMMENT ON COLUMN public.token_erc3525_properties.slot_transfer_validation IS 'JSON configuration for slot transfer validation rules';