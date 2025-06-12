-- Insert sample policy templates if none exist
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