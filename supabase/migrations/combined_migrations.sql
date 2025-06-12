-- Begin transaction to ensure all-or-nothing execution
BEGIN;

-- Add is_template field to rules table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'rules' AND column_name = 'is_template'
    ) THEN
        ALTER TABLE rules ADD COLUMN is_template BOOLEAN DEFAULT false;
        
        -- Create an index on is_template for faster template queries
        CREATE INDEX idx_rules_is_template ON rules (is_template);
        
        -- Update existing rules to have is_template = false
        UPDATE rules SET is_template = false WHERE is_template IS NULL;
    END IF;
END
$$;

-- Create policy_templates table if it doesn't exist
CREATE TABLE IF NOT EXISTS policy_templates (
  template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  description TEXT,
  template_data JSONB NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  template_type TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN template_data->>'type' IS NOT NULL THEN template_data->>'type'
      ELSE 'general'
    END
  ) STORED
);

-- Create indexes for faster querying if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'idx_policy_templates_name'
    ) THEN
        CREATE INDEX idx_policy_templates_name ON policy_templates(template_name);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'idx_policy_templates_type'
    ) THEN
        CREATE INDEX idx_policy_templates_type ON policy_templates(template_type);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'idx_policy_templates_created_at'
    ) THEN
        CREATE INDEX idx_policy_templates_created_at ON policy_templates(created_at DESC);
    END IF;
END
$$;

-- Add comment to table
COMMENT ON TABLE policy_templates IS 'Stores reusable policy templates';

-- Create audit_logs table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'audit_logs') THEN
    CREATE TABLE audit_logs (
      log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      action_type TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      user_id TEXT,
      changes JSONB,
      occurred_at TIMESTAMPTZ DEFAULT NOW()
    );
  ELSE
    -- Check if the columns exist and add them if they don't
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'action_type') THEN
      ALTER TABLE audit_logs ADD COLUMN action_type TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'entity_type') THEN
      ALTER TABLE audit_logs ADD COLUMN entity_type TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'entity_id') THEN
      ALTER TABLE audit_logs ADD COLUMN entity_id TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'user_id') THEN
      ALTER TABLE audit_logs ADD COLUMN user_id TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'changes') THEN
      ALTER TABLE audit_logs ADD COLUMN changes JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'occurred_at') THEN
      ALTER TABLE audit_logs ADD COLUMN occurred_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
  END IF;
END
$$;

-- Fix the log_user_action() trigger function to handle different ID column names
CREATE OR REPLACE FUNCTION log_user_action()
RETURNS trigger AS $$
DECLARE
  entity_id TEXT;
  action_type TEXT;
  table_exists BOOLEAN;
BEGIN
  -- Check if audit_logs table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'audit_logs'
  ) INTO table_exists;
  
  -- If audit_logs table doesn't exist, just return and do nothing
  IF NOT table_exists THEN
    RETURN COALESCE(new, old);
  END IF;

  -- Determine the action type
  IF TG_OP = 'INSERT' THEN
    action_type := 'create';
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := 'update';
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'delete';
  END IF;
  
  -- Get the entity ID based on the table's primary key column
  IF TG_TABLE_NAME = 'policy_templates' THEN
    IF TG_OP = 'DELETE' THEN
      entity_id := old.template_id::text;
    ELSE
      entity_id := new.template_id::text;
    END IF;
  ELSIF TG_TABLE_NAME = 'rules' THEN
    IF TG_OP = 'DELETE' THEN
      entity_id := old.rule_id::text;
    ELSE
      entity_id := new.rule_id::text;
    END IF;
  ELSE
    -- Default fallback for other tables with 'id' column
    IF TG_OP = 'DELETE' THEN
      BEGIN
        entity_id := old.id::text;
      EXCEPTION WHEN undefined_column THEN
        entity_id := 'unknown';
      END;
    ELSE
      BEGIN
        entity_id := new.id::text;
      EXCEPTION WHEN undefined_column THEN
        entity_id := 'unknown';
      END;
    END IF;
  END IF;
  
  -- Use TRY-CATCH to prevent errors during insert
  BEGIN
    -- Insert action into audit_logs table
    INSERT INTO audit_logs (
      action_type,
      entity_type,
      entity_id,
      user_id,
      changes,
      occurred_at
    ) VALUES (
      action_type,
      TG_TABLE_NAME,
      entity_id,
      COALESCE(auth.uid()::text, 'system'),
      CASE
        WHEN TG_OP = 'INSERT' THEN to_jsonb(new)
        WHEN TG_OP = 'UPDATE' THEN jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new))
        WHEN TG_OP = 'DELETE' THEN to_jsonb(old)
        ELSE NULL
      END,
      NOW()
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but continue (don't let trigger failure block main operation)
      RAISE NOTICE 'Failed to log action: %', SQLERRM;
  END;
  
  RETURN COALESCE(new, old);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace audit triggers for policy_templates and rules
-- First, drop existing triggers if they exist
DO $$
BEGIN
  -- Drop policy_templates audit trigger if it exists
  BEGIN
    IF EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'policy_templates_audit_trigger'
      AND tgrelid = 'policy_templates'::regclass
    ) THEN
      DROP TRIGGER IF EXISTS policy_templates_audit_trigger ON policy_templates;
    END IF;
  EXCEPTION
    WHEN undefined_table THEN
      -- Table doesn't exist yet, so no trigger to drop
      NULL;
    WHEN undefined_object THEN
      -- Trigger doesn't exist, nothing to do
      NULL;
  END;
  
  -- Drop rules audit trigger if it exists
  BEGIN
    IF EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'rules_audit_trigger'
      AND tgrelid = 'rules'::regclass
    ) THEN
      DROP TRIGGER IF EXISTS rules_audit_trigger ON rules;
    END IF;
  EXCEPTION
    WHEN undefined_table THEN
      -- Table doesn't exist yet, so no trigger to drop
      NULL;
    WHEN undefined_object THEN
      -- Trigger doesn't exist, nothing to do
      NULL;
  END;
END
$$;

-- Create new audit triggers
DO $$
BEGIN
  -- Create trigger for policy_templates table if it exists
  BEGIN
    CREATE TRIGGER policy_templates_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON policy_templates
    FOR EACH ROW EXECUTE FUNCTION log_user_action();
  EXCEPTION
    WHEN undefined_table THEN
      RAISE NOTICE 'Table policy_templates does not exist, skipping trigger creation';
    WHEN duplicate_object THEN
      RAISE NOTICE 'Trigger policy_templates_audit_trigger already exists';
  END;
  
  -- Create trigger for rules table if it exists
  BEGIN
    CREATE TRIGGER rules_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON rules
    FOR EACH ROW EXECUTE FUNCTION log_user_action();
  EXCEPTION
    WHEN undefined_table THEN
      RAISE NOTICE 'Table rules does not exist, skipping trigger creation';
    WHEN duplicate_object THEN
      RAISE NOTICE 'Trigger rules_audit_trigger already exists';
  END;
END
$$;

-- Insert some sample rule templates for testing
INSERT INTO rules (rule_name, rule_type, rule_details, created_by, status, is_template)
VALUES 
('High Value Transfer', 'transaction', 
 jsonb_build_object(
    'name', 'High Value Transfer',
    'type', 'transaction',
    'description', 'Require approval for transfers above a certain amount',
    'condition', jsonb_build_object(
      'field', 'amount',
      'operator', 'greater_than',
      'value', '10000'
    ),
    'action', jsonb_build_object(
      'type', 'require_approval',
      'params', jsonb_build_object(
        'level', 'compliance',
        'threshold', 'all'
      )
    ),
    'priority', 'high',
    'enabled', true
 ),
 'admin', 'active', true
)
ON CONFLICT DO NOTHING;

INSERT INTO rules (rule_name, rule_type, rule_details, created_by, status, is_template)
VALUES 
('Restricted Asset Transfer', 'asset', 
 jsonb_build_object(
    'name', 'Restricted Asset Transfer',
    'type', 'asset',
    'description', 'Block transfers of restricted assets',
    'condition', jsonb_build_object(
      'field', 'asset_type',
      'operator', 'equals',
      'value', 'restricted'
    ),
    'action', jsonb_build_object(
      'type', 'block_transaction',
      'params', jsonb_build_object()
    ),
    'priority', 'high',
    'enabled', true
 ),
 'admin', 'active', true
)
ON CONFLICT DO NOTHING;

INSERT INTO rules (rule_name, rule_type, rule_details, created_by, status, is_template)
VALUES 
('New Wallet Monitoring', 'wallet', 
 jsonb_build_object(
    'name', 'New Wallet Monitoring',
    'type', 'wallet',
    'description', 'Flag transactions from newly created wallets',
    'condition', jsonb_build_object(
      'field', 'wallet_age',
      'operator', 'less_than',
      'value', '30'
    ),
    'action', jsonb_build_object(
      'type', 'flag_for_review',
      'params', jsonb_build_object(
        'reason', 'New wallet activity'
      )
    ),
    'priority', 'medium',
    'enabled', true
 ),
 'admin', 'active', true
)
ON CONFLICT DO NOTHING;

-- Sample policy templates
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.policy_templates LIMIT 1) THEN
        -- Transaction Monitoring Template
        INSERT INTO public.policy_templates (template_name, description, template_data, created_by)
        VALUES (
          'Transaction Monitoring Template',
          'Pre-configured rules for monitoring high-risk transactions',
          jsonb_build_object(
            'name', 'Transaction Monitoring Policy',
            'description', 'Standard policy for monitoring high-risk transactions',
            'type', 'compliance',
            'jurisdiction', 'Global',
            'effectiveDate', to_char(now(), 'YYYY-MM-DD'),
            'expirationDate', to_char(now() + interval '1 year', 'YYYY-MM-DD'),
            'tags', array['compliance', 'monitoring', 'transactions'],
            'rules', jsonb_build_array(
              jsonb_build_object(
                'id', gen_random_uuid(),
                'name', 'High Value Transfer',
                'type', 'transaction',
                'description', 'Require approval for high-value transfers',
                'condition', jsonb_build_object(
                  'field', 'amount',
                  'operator', 'greater_than',
                  'value', '10000'
                ),
                'action', jsonb_build_object(
                  'type', 'require_approval',
                  'params', jsonb_build_object(
                    'level', 'compliance',
                    'threshold', 'all'
                  )
                ),
                'priority', 'high',
                'enabled', true
              ),
              jsonb_build_object(
                'id', gen_random_uuid(),
                'name', 'International Transfer',
                'type', 'transaction',
                'description', 'Flag international transfers for review',
                'condition', jsonb_build_object(
                  'field', 'transaction_type',
                  'operator', 'equals',
                  'value', 'international'
                ),
                'action', jsonb_build_object(
                  'type', 'flag_for_review',
                  'params', jsonb_build_object(
                    'reason', 'International transfer requires review'
                  )
                ),
                'priority', 'medium',
                'enabled', true
              )
            ),
            'approvers', jsonb_build_array(),
            'reviewFrequency', 'quarterly',
            'isActive', true,
            'status', 'active'
          ),
          'admin'
        );

        -- AML Policy Template
        INSERT INTO public.policy_templates (template_name, description, template_data, created_by)
        VALUES (
          'AML Compliance Template',
          'Anti-Money Laundering compliance rules',
          jsonb_build_object(
            'name', 'AML Compliance Policy',
            'description', 'Anti-Money Laundering compliance policy',
            'type', 'aml',
            'jurisdiction', 'Global',
            'effectiveDate', to_char(now(), 'YYYY-MM-DD'),
            'expirationDate', to_char(now() + interval '2 years', 'YYYY-MM-DD'),
            'tags', array['aml', 'compliance', 'regulatory'],
            'rules', jsonb_build_array(
              jsonb_build_object(
                'id', gen_random_uuid(),
                'name', 'Suspicious Activity Detection',
                'type', 'transaction',
                'description', 'Flag suspicious transaction patterns',
                'condition', jsonb_build_object(
                  'field', 'transaction_type',
                  'operator', 'equals',
                  'value', 'suspicious'
                ),
                'action', jsonb_build_object(
                  'type', 'flag_for_review',
                  'params', jsonb_build_object(
                    'reason', 'Suspicious transaction pattern detected'
                  )
                ),
                'priority', 'high',
                'enabled', true
              ),
              jsonb_build_object(
                'id', gen_random_uuid(),
                'name', 'New Wallet Monitoring',
                'type', 'wallet',
                'description', 'Monitor transactions from newly created wallets',
                'condition', jsonb_build_object(
                  'field', 'wallet_age',
                  'operator', 'less_than',
                  'value', '30'
                ),
                'action', jsonb_build_object(
                  'type', 'notify_admin',
                  'params', jsonb_build_object(
                    'message', 'New wallet activity detected'
                  )
                ),
                'priority', 'medium',
                'enabled', true
              )
            ),
            'approvers', jsonb_build_array(),
            'reviewFrequency', 'monthly',
            'isActive', true,
            'status', 'active'
          ),
          'admin'
        );

        -- KYC Policy Template
        INSERT INTO public.policy_templates (template_name, description, template_data, created_by)
        VALUES (
          'KYC Verification Template',
          'Know Your Customer verification rules',
          jsonb_build_object(
            'name', 'KYC Verification Policy',
            'description', 'Standard KYC verification policy',
            'type', 'kyc',
            'jurisdiction', 'Global',
            'effectiveDate', to_char(now(), 'YYYY-MM-DD'),
            'expirationDate', null,
            'tags', array['kyc', 'verification', 'compliance'],
            'rules', jsonb_build_array(
              jsonb_build_object(
                'id', gen_random_uuid(),
                'name', 'Identity Verification',
                'type', 'user',
                'description', 'Require ID verification before transactions',
                'condition', jsonb_build_object(
                  'field', 'user_verification',
                  'operator', 'not_equals',
                  'value', 'verified'
                ),
                'action', jsonb_build_object(
                  'type', 'block_transaction',
                  'params', jsonb_build_object()
                ),
                'priority', 'high',
                'enabled', true
              ),
              jsonb_build_object(
                'id', gen_random_uuid(),
                'name', 'High Risk User Monitoring',
                'type', 'user',
                'description', 'Additional verification for high-risk users',
                'condition', jsonb_build_object(
                  'field', 'user_risk_score',
                  'operator', 'greater_than',
                  'value', '75'
                ),
                'action', jsonb_build_object(
                  'type', 'require_additional_verification',
                  'params', jsonb_build_object()
                ),
                'priority', 'high',
                'enabled', true
              )
            ),
            'approvers', jsonb_build_array(),
            'reviewFrequency', 'quarterly',
            'isActive', true,
            'status', 'active'
          ),
          'admin'
        );
    END IF;
END
$$;

-- Commit all changes
COMMIT; 