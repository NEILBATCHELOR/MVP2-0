-- Insert Bridgewater Associates (Global Macro Strategy)
WITH new_investor1 AS (
  INSERT INTO investors (
    name,
    email,
    type,
    kyc_status,
    verification_details,
    kyc_expiry_date,
    company,
    notes,
    investor_status,
    investor_type,
    onboarding_completed,
    risk_assessment,
    profile_data,
    investment_preferences,
    accreditation_status,
    accreditation_expiry_date,
    accreditation_type,
    tax_residency,
    tax_id_number,
    last_compliance_check
  ) VALUES (
    'Bridgewater Associates',
    'contact@bridgewater.com',
    'entity',
    'approved',
    '{"method": "manual", "verifier": "John Doe"}',
    '2026-04-19 00:00:00+00',
    'Bridgewater Associates',
    'Global macro hedge fund with $98.5B AUM',
    'active',
    'hedge_fund',
    true,
    '{"risk_level": "medium", "assessment_date": "2025-04-01"}',
    '{"aum": "98500000000", "strategy": "global macro"}',
    '{"preferred_sectors": ["macro", "fixed_income"], "min_investment": 10000000}',
    'approved',
    '2026-04-19 00:00:00+00',
    'verified',
    'USA',
    '123-45-6789',
    '2025-04-01 00:00:00+00'
  )
  RETURNING investor_id
),
doc1_1 AS (
  INSERT INTO documents (
    entity_id,
    entity_type,
    name,
    type,
    status,
    file_url,
    expiry_date
  )
  SELECT
    investor_id,
    'investor',
    'Incorporation Certificate',
    'incorporation_certificate',
    'approved',
    'https://example.com/docs/bridgewater_incorporation.pdf',
    NULL
  FROM new_investor1
),
doc1_2 AS (
  INSERT INTO documents (
    entity_id,
    entity_type,
    name,
    type,
    status,
    file_url,
    expiry_date
  )
  SELECT
    investor_id,
    'investor',
    'Accreditation Certificate',
    'accreditation_certificate',
    'approved',
    'https://example.com/docs/bridgewater_accreditation.pdf',
    '2026-04-19 00:00:00+00'
  FROM new_investor1
),
approval1_1 AS (
  INSERT INTO investor_approvals (
    investor_id,
    approval_type,
    status,
    submission_date,
    approval_date,
    required_documents
  )
  SELECT
    investor_id,
    'KYC',
    'approved',
    '2025-03-01 00:00:00+00',
    '2025-03-15 00:00:00+00',
    '["incorporation_certificate", "proof_of_address"]'
  FROM new_investor1
),
approval1_2 AS (
  INSERT INTO investor_approvals (
    investor_id,
    approval_type,
    status,
    submission_date,
    approval_date,
    required_documents
  )
  SELECT
    investor_id,
    'accreditation',
    'approved',
    '2025-03-01 00:00:00+00',
    '2025-03-15 00:00:00+00',
    '["accreditation_certificate"]'
  FROM new_investor1
),
log1 AS (
  INSERT INTO kyc_screening_logs (
    investor_id,
    previous_status,
    new_status,
    method,
    performed_by,
    created_at
  )
  SELECT
    investor_id,
    'pending',
    'approved',
    'manual_review',
    'John Doe',
    '2025-03-15 00:00:00+00'
  FROM new_investor1
),

-- Insert Citadel (Multi-Strategy)
new_investor2 AS (
  INSERT INTO investors (
    name,
    email,
    type,
    kyc_status,
    verification_details,
    kyc_expiry_date,
    company,
    notes,
    investor_status,
    investor_type,
    onboarding_completed,
    risk_assessment,
    profile_data,
    investment_preferences,
    accreditation_status,
    accreditation_expiry_date,
    accreditation_type,
    tax_residency,
    tax_id_number,
    last_compliance_check
  ) VALUES (
    'Citadel',
    'contact@citadel.com',
    'entity',
    'approved',
    '{"method": "manual", "verifier": "Jane Smith"}',
    '2026-04-19 00:00:00+00',
    'Citadel',
    'Multi-strategy hedge fund with $78B AUM',
    'active',
    'hedge_fund',
    true,
    '{"risk_level": "high", "assessment_date": "2025-04-01"}',
    '{"aum": "78000000000", "strategy": "multi-strategy"}',
    '{"preferred_sectors": ["equities", "credit", "macro"], "min_investment": 5000000}',
    'approved',
    '2026-04-19 00:00:00+00',
    'verified',
    'USA',
    '987-65-4321',
    '2025-04-01 00:00:00+00'
  )
  RETURNING investor_id
),
doc2_1 AS (
  INSERT INTO documents (
    entity_id,
    entity_type,
    name,
    type,
    status,
    file_url,
    expiry_date
  )
  SELECT
    investor_id,
    'investor',
    'Incorporation Certificate',
    'incorporation_certificate',
    'approved',
    'https://example.com/docs/citadel_incorporation.pdf',
    NULL
  FROM new_investor2
),
doc2_2 AS (
  INSERT INTO documents (
    entity_id,
    entity_type,
    name,
    type,
    status,
    file_url,
    expiry_date
  )
  SELECT
    investor_id,
    'investor',
    'Accreditation Certificate',
    'accreditation_certificate',
    'approved',
    'https://example.com/docs/citadel_accreditation.pdf',
    '2026-04-19 00:00:00+00'
  FROM new_investor2
),
approval2_1 AS (
  INSERT INTO investor_approvals (
    investor_id,
    approval_type,
    status,
    submission_date,
    approval_date,
    required_documents
  )
  SELECT
    investor_id,
    'KYC',
    'approved',
    '2025-03-01 00:00:00+00',
    '2025-03-15 00:00:00+00',
    '["incorporation_certificate", "proof_of_address"]'
  FROM new_investor2
),
approval2_2 AS (
  INSERT INTO investor_approvals (
    investor_id,
    approval_type,
    status,
    submission_date,
    approval_date,
    required_documents
  )
  SELECT
    investor_id,
    'accreditation',
    'approved',
    '2025-03-01 00:00:00+00',
    '2025-03-15 00:00:00+00',
    '["accreditation_certificate"]'
  FROM new_investor2
),
log2 AS (
  INSERT INTO kyc_screening_logs (
    investor_id,
    previous_status,
    new_status,
    method,
    performed_by,
    created_at
  )
  SELECT
    investor_id,
    'pending',
    'approved',
    'manual_review',
    'Jane Smith',
    '2025-03-15 00:00:00+00'
  FROM new_investor2
),

-- Insert Renaissance Technologies (Quantitative Strategy)
new_investor3 AS (
  INSERT INTO investors (
    name,
    email,
    type,
    kyc_status,
    verification_details,
    kyc_expiry_date,
    company,
    notes,
    investor_status,
    investor_type,
    onboarding_completed,
    risk_assessment,
    profile_data,
    investment_preferences,
    accreditation_status,
    accreditation_expiry_date,
    accreditation_type,
    tax_residency,
    tax_id_number,
    last_compliance_check
  ) VALUES (
    'Renaissance Technologies',
    'contact@renfund.com',
    'entity',
    'approved',
    '{"method": "manual", "verifier": "Alice Johnson"}',
    '2026-04-19 00:00:00+00',
    'Renaissance Technologies',
    'Quantitative hedge fund with $60B AUM',
    'active',
    'hedge_fund',
    true,
    '{"risk_level": "low", "assessment_date": "2025-04-01"}',
    '{"aum": "60000000000", "strategy": "quantitative"}',
    '{"preferred_sectors": ["equities", "futures"], "min_investment": 20000000}',
    'approved',
    '2026-04-19 00:00:00+00',
    'verified',
    'USA',
    '456-78-9012',
    '2025-04-01 00:00:00+00'
  )
  RETURNING investor_id
),
doc3_1 AS (
  INSERT INTO documents (
    entity_id,
    entity_type,
    name,
    type,
    status,
    file_url,
    expiry_date
  )
  SELECT
    investor_id,
    'investor',
    'Incorporation Certificate',
    'incorporation_certificate',
    'approved',
    'https://example.com/docs/renfund_incorporation.pdf',
    NULL
  FROM new_investor3
),
doc3_2 AS (
  INSERT INTO documents (
    entity_id,
    entity_type,
    name,
    type,
    status,
    file_url,
    expiry_date
  )
  SELECT
    investor_id,
    'investor',
    'Accreditation Certificate',
    'accreditation_certificate',
    'approved',
    'https://example.com/docs/renfund_accreditation.pdf',
    '2026-04-19 00:00:00+00'
  FROM new_investor3
),
approval3_1 AS (
  INSERT INTO investor_approvals (
    investor_id,
    approval_type,
    status,
    submission_date,
    approval_date,
    required_documents
  )
  SELECT
    investor_id,
    'KYC',
    'approved',
    '2025-03-01 00:00:00+00',
    '2025-03-15 00:00:00+00',
    '["incorporation_certificate", "proof_of_address"]'
  FROM new_investor3
),
approval3_2 AS (
  INSERT INTO investor_approvals (
    investor_id,
    approval_type,
    status,
    submission_date,
    approval_date,
    required_documents
  )
  SELECT
    investor_id,
    'accreditation',
    'approved',
    '2025-03-01 00:00:00+00',
    '2025-03-15 00:00:00+00',
    '["accreditation_certificate"]'
  FROM new_investor3
),
log3 AS (
  INSERT INTO kyc_screening_logs (
    investor_id,
    previous_status,
    new_status,
    method,
    performed_by,
    created_at
  )
  SELECT
    investor_id,
    'pending',
    'approved',
    'manual_review',
    'Alice Johnson',
    '2025-03-15 00:00:00+00'
  FROM new_investor3
)
SELECT 1;