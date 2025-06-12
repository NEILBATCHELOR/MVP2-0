-- Create a function to save consensus configs without needing permission_id
CREATE OR REPLACE FUNCTION public.save_consensus_config(
  p_consensus_type TEXT,
  p_required_approvals INTEGER,
  p_eligible_roles TEXT[]
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_config_id UUID;
  v_existing_id UUID;
BEGIN
  -- Check if we already have a config with this consensus type
  SELECT id INTO v_existing_id 
  FROM approval_configs 
  WHERE consensus_type = p_consensus_type;
  
  IF v_existing_id IS NOT NULL THEN
    -- Update existing record
    UPDATE approval_configs
    SET 
      required_approvals = p_required_approvals,
      eligible_roles = p_eligible_roles,
      updated_at = now()
    WHERE id = v_existing_id;
  ELSE
    -- Create a new standalone consensus config entry
    INSERT INTO consensus_settings (
      consensus_type,
      required_approvals,
      eligible_roles
    ) VALUES (
      p_consensus_type,
      p_required_approvals,
      p_eligible_roles
    );
  END IF;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in save_consensus_config: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Create a simpler table for consensus settings if it doesn't exist
CREATE TABLE IF NOT EXISTS public.consensus_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consensus_type TEXT NOT NULL,
  required_approvals INTEGER NOT NULL,
  eligible_roles TEXT[] NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(consensus_type)
);

-- Add trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_consensus_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_consensus_settings_updated_at ON consensus_settings;
CREATE TRIGGER trigger_consensus_settings_updated_at
BEFORE UPDATE ON consensus_settings
FOR EACH ROW
EXECUTE FUNCTION update_consensus_settings_updated_at(); 