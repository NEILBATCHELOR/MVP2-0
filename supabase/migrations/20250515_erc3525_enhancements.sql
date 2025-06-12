-- Migration: 20250515_erc3525_enhancements.sql
-- Description: Add missing fields to ERC-3525 token tables to align with UI components and mappers

-- Add missing fields to token_erc3525_properties
ALTER TABLE public.token_erc3525_properties
ADD COLUMN IF NOT EXISTS dynamic_metadata boolean NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS allows_slot_enumeration boolean NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS value_aggregation boolean NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS permissioning_enabled boolean NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS updatable_values boolean NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS supply_tracking boolean NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS custom_extensions text NULL;

-- Add value_units to token_erc3525_slots
ALTER TABLE public.token_erc3525_slots
ADD COLUMN IF NOT EXISTS value_units text NULL;

-- Add recipient to token_erc3525_allocations
ALTER TABLE public.token_erc3525_allocations
ADD COLUMN IF NOT EXISTS recipient text NULL;

-- Add a more detailed slot_transfer_validation column comment
COMMENT ON COLUMN public.token_erc3525_properties.slot_transfer_validation IS 'JSON configuration for slot transfer validation rules';

-- Ensure indexes exist for improved query performance
CREATE INDEX IF NOT EXISTS idx_token_erc3525_properties_token_id ON public.token_erc3525_properties (token_id);
CREATE INDEX IF NOT EXISTS idx_token_erc3525_slots_token_id ON public.token_erc3525_slots (token_id);
CREATE INDEX IF NOT EXISTS idx_token_erc3525_allocations_token_id ON public.token_erc3525_allocations (token_id);