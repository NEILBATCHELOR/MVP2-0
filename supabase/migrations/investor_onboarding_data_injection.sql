-- Investor Onboarding Data Injection
-- This script generates sample data for investor onboarding-related tables

-- Individual Investor 1 - Complete onboarding
WITH new_investor_1 AS (
  INSERT INTO investors (
    name,
    email,
    type,
    kyc_status,
    wallet_address,
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
    'Robert Maxwell',
    'robert.maxwell@magnacorp.com',
    'individual',
    'approved',
    '0x8a2b7426d67b46db825fabbf6169b9801b7c59ba',
    '{"method": "electronic", "verifier": "KYC Provider Inc", "reference_id": "KYC-123456"}',
    (CURRENT_DATE + INTERVAL '1 year')::timestamp with time zone,
    'Magna Corp',
    'Executive at Magna Corp with significant investment experience',
    'active',
    'individual',
    true,
    '{"risk_level": "medium", "assessment_date": "2023-10-15", "score": 82}',
    '{"occupation": "Chief Investment Officer", "net_worth": "8500000", "source_of_funds": "Employment and Investments"}',
    '{"preferred_sectors": ["technology", "real estate", "energy"], "investment_horizon": "long_term", "min_investment": 250000}',
    'approved',
    (CURRENT_DATE + INTERVAL '1 year')::timestamp with time zone,
    'verified_income',
    'United States',
    '435-78-1290',
    (CURRENT_DATE - INTERVAL '1 month')::timestamp with time zone
  )
  RETURNING investor_id
),
-- Documents for Individual Investor 1
doc_1_1 AS (
  INSERT INTO documents (
    entity_id,
    entity_type,
    name,
    type,
    status,
    file_url,
    expiry_date,
    category,
    metadata
  )
  SELECT
    investor_id,
    'investor',
    'Passport',
    'passport',
    'approved',
    'https://storage.example.com/documents/passport-robert-maxwell.pdf',
    (CURRENT_DATE + INTERVAL '5 years')::timestamp with time zone,
    'identification',
    '{"country": "USA", "document_number": "P78542109"}'
  FROM new_investor_1
),
doc_1_2 AS (
  INSERT INTO documents (
    entity_id,
    entity_type,
    name,
    type,
    status,
    file_url,
    category,
    metadata
  )
  SELECT
    investor_id,
    'investor',
    'Proof of Address',
    'proof_of_address',
    'approved',
    'https://storage.example.com/documents/address-robert-maxwell.pdf',
    'verification',
    '{"document_type": "utility_bill", "issue_date": "2023-09-01"}'
  FROM new_investor_1
),
doc_1_3 AS (
  INSERT INTO documents (
    entity_id,
    entity_type,
    name,
    type,
    status,
    file_url,
    category,
    metadata
  )
  SELECT
    investor_id,
    'investor',
    'Income Verification',
    'income_verification',
    'approved',
    'https://storage.example.com/documents/income-robert-maxwell.pdf',
    'accreditation',
    '{"document_type": "tax_return", "year": "2022"}'
  FROM new_investor_1
),
-- Approvals for Individual Investor 1
approval_1_1 AS (
  INSERT INTO investor_approvals (
    investor_id,
    approval_type,
    status,
    submission_date,
    approval_date,
    required_documents,
    review_notes
  )
  SELECT
    investor_id,
    'KYC',
    'approved',
    (CURRENT_DATE - INTERVAL '2 months')::timestamp with time zone,
    (CURRENT_DATE - INTERVAL '1 month')::timestamp with time zone,
    '["passport", "proof_of_address"]',
    'All documents verified successfully'
  FROM new_investor_1
),
approval_1_2 AS (
  INSERT INTO investor_approvals (
    investor_id,
    approval_type,
    status,
    submission_date,
    approval_date,
    required_documents,
    review_notes
  )
  SELECT
    investor_id,
    'accreditation',
    'approved',
    (CURRENT_DATE - INTERVAL '2 months')::timestamp with time zone,
    (CURRENT_DATE - INTERVAL '1 month')::timestamp with time zone,
    '["income_verification"]',
    'Income verification complete'
  FROM new_investor_1
),
-- KYC Logs for Individual Investor 1
log_1_1 AS (
  INSERT INTO kyc_screening_logs (
    investor_id,
    previous_status,
    new_status,
    method,
    notes,
    performed_by
  )
  SELECT
    investor_id,
    'not_started',
    'pending',
    'electronic_submission',
    'Documents submitted for review',
    'System'
  FROM new_investor_1
),
log_1_2 AS (
  INSERT INTO kyc_screening_logs (
    investor_id,
    previous_status,
    new_status,
    method,
    notes,
    performed_by
  )
  SELECT
    investor_id,
    'pending',
    'approved',
    'manual_review',
    'All documents verified',
    'Sarah Compliance'
  FROM new_investor_1
),

-- Institutional Investor - State Pension Fund
new_investor_2 AS (
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
    'State Pension Fund',
    'contact@statepensionfund.com',
    'entity',
    'approved',
    '{"method": "manual", "verifier": "John Doe"}',
    '2024-10-01 00:00:00+00',
    'State Pension Fund',
    'Large pension fund with $10B AUM',
    'active',
    'pension_fund',
    true,
    '{"risk_level": "low", "assessment_date": "2023-09-01"}',
    '{"aum": "10000000000", "investment_strategy": "conservative"}',
    '{"preferred_sectors": ["technology", "healthcare"], "min_investment": 1000000}',
    'approved',
    '2025-10-01 00:00:00+00',
    'verified',
    'USA',
    '123-45-6789',
    '2023-09-15 00:00:00+00'
  )
  RETURNING investor_id
),
-- Documents for State Pension Fund
doc_2_1 AS (
  INSERT INTO documents (
    entity_id,
    entity_type,
    name,
    type,
    status,
    file_url,
    expiry_date,
    category,
    metadata
  )
  SELECT
    investor_id,
    'investor',
    'Accreditation Certificate',
    'accreditation_certificate',
    'approved',
    'https://example.com/docs/accreditation.pdf',
    '2025-10-01 00:00:00+00',
    'accreditation',
    '{"certification_authority": "Investment Commission", "certification_id": "SPF-2023-ACC"}'
  FROM new_investor_2
),
doc_2_2 AS (
  INSERT INTO documents (
    entity_id,
    entity_type,
    name,
    type,
    status,
    file_url,
    category,
    metadata
  )
  SELECT
    investor_id,
    'investor',
    'Incorporation Certificate',
    'incorporation_certificate',
    'approved',
    'https://example.com/docs/incorporation.pdf',
    'entity_documents',
    '{"jurisdiction": "Federal", "registration_number": "SPF-12345"}'
  FROM new_investor_2
),
doc_2_3 AS (
  INSERT INTO documents (
    entity_id,
    entity_type,
    name,
    type,
    status,
    file_url,
    category,
    metadata
  )
  SELECT
    investor_id,
    'investor',
    'Authorized Signatory List',
    'authorized_signatory_list',
    'approved',
    'https://example.com/docs/signatory-list.pdf',
    'entity_documents',
    '{"last_updated": "2023-08-15", "signatories_count": 4}'
  FROM new_investor_2
),
-- Approvals for State Pension Fund
approval_2_1 AS (
  INSERT INTO investor_approvals (
    investor_id,
    approval_type,
    status,
    submission_date,
    approval_date,
    required_documents,
    review_notes
  )
  SELECT
    investor_id,
    'KYC',
    'approved',
    '2023-09-01 00:00:00+00',
    '2023-09-10 00:00:00+00',
    '["incorporation_certificate", "authorized_signatory_list"]',
    'All entity documents verified successfully'
  FROM new_investor_2
),
approval_2_2 AS (
  INSERT INTO investor_approvals (
    investor_id,
    approval_type,
    status,
    submission_date,
    approval_date,
    required_documents,
    review_notes
  )
  SELECT
    investor_id,
    'accreditation',
    'approved',
    '2023-09-01 00:00:00+00',
    '2023-09-10 00:00:00+00',
    '["accreditation_certificate"]',
    'Qualified purchaser status confirmed'
  FROM new_investor_2
),
-- KYC Logs for State Pension Fund
log_2_1 AS (
  INSERT INTO kyc_screening_logs (
    investor_id,
    previous_status,
    new_status,
    method,
    notes,
    performed_by,
    created_at
  )
  SELECT
    investor_id,
    'pending',
    'approved',
    'manual_review',
    'Entity structure verified and validated',
    'John Doe',
    '2023-09-10 00:00:00+00'
  FROM new_investor_2
),

-- Individual Investor 2 - Pending approval
new_investor_3 AS (
  INSERT INTO investors (
    name,
    email,
    type,
    kyc_status,
    wallet_address,
    verification_details,
    company,
    notes,
    investor_status,
    investor_type,
    onboarding_completed,
    risk_assessment,
    profile_data,
    investment_preferences,
    accreditation_status,
    tax_residency,
    tax_id_number
  ) VALUES (
    'Priya Sharma',
    'priya.sharma@innovatech.co.uk',
    'individual',
    'pending',
    '0x9c3b5a6d8e7f4a2b1c0d9e8f7a6b5c4d3e2f1a0b',
    '{"method": "electronic", "submission_date": "2023-12-01"}',
    'InnovaTech Solutions',
    'Tech entrepreneur with several successful exits',
    'pending',
    'individual',
    false,
    '{"risk_level": "medium", "assessment_date": "2023-12-01", "score": 70}',
    '{"occupation": "CEO", "net_worth": "4200000", "source_of_funds": "Business Sale"}',
    '{"preferred_sectors": ["fintech", "AI", "biotech"], "investment_horizon": "medium_term", "min_investment": 100000}',
    'pending',
    'United Kingdom',
    'UK9287654321'
  )
  RETURNING investor_id
),
-- Documents for Individual Investor 2
doc_3_1 AS (
  INSERT INTO documents (
    entity_id,
    entity_type,
    name,
    type,
    status,
    file_url,
    expiry_date,
    category,
    metadata
  )
  SELECT
    investor_id,
    'investor',
    'Passport',
    'passport',
    'pending',
    'https://storage.example.com/documents/passport-priya-sharma.pdf',
    (CURRENT_DATE + INTERVAL '7 years')::timestamp with time zone,
    'identification',
    '{"country": "UK", "document_number": "P567891234"}'
  FROM new_investor_3
),
doc_3_2 AS (
  INSERT INTO documents (
    entity_id,
    entity_type,
    name,
    type,
    status,
    file_url,
    category,
    metadata
  )
  SELECT
    investor_id,
    'investor',
    'Bank Statement',
    'proof_of_address',
    'pending',
    'https://storage.example.com/documents/bank-statement-priya.pdf',
    'verification',
    '{"document_type": "bank_statement", "issue_date": "2023-11-15"}'
  FROM new_investor_3
),
doc_3_3 AS (
  INSERT INTO documents (
    entity_id,
    entity_type,
    name,
    type,
    status,
    file_url,
    category,
    metadata
  )
  SELECT
    investor_id,
    'investor',
    'Net Worth Certification',
    'net_worth_certification',
    'pending',
    'https://storage.example.com/documents/net-worth-priya.pdf',
    'accreditation',
    '{"certification_date": "2023-11-20", "certified_by": "Deloitte LLP"}'
  FROM new_investor_3
),
-- Approvals for Individual Investor 2
approval_3_1 AS (
  INSERT INTO investor_approvals (
    investor_id,
    approval_type,
    status,
    submission_date,
    required_documents,
    review_notes
  )
  SELECT
    investor_id,
    'KYC',
    'pending',
    (CURRENT_DATE - INTERVAL '1 week')::timestamp with time zone,
    '["passport", "proof_of_address"]',
    'Awaiting document verification'
  FROM new_investor_3
),
approval_3_2 AS (
  INSERT INTO investor_approvals (
    investor_id,
    approval_type,
    status,
    submission_date,
    required_documents,
    review_notes
  )
  SELECT
    investor_id,
    'accreditation',
    'pending',
    (CURRENT_DATE - INTERVAL '1 week')::timestamp with time zone,
    '["net_worth_certification"]',
    'Awaiting accreditation review'
  FROM new_investor_3
),
-- KYC Logs for Individual Investor 2
log_3_1 AS (
  INSERT INTO kyc_screening_logs (
    investor_id,
    previous_status,
    new_status,
    method,
    notes,
    performed_by
  )
  SELECT
    investor_id,
    'not_started',
    'pending',
    'electronic_submission',
    'Initial documents submitted',
    'System'
  FROM new_investor_3
),

-- Sovereign Wealth Fund - Complete onboarding
new_investor_4 AS (
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
    'Gulf Investment Authority',
    'investments@gulfinvestmentauthority.com',
    'entity',
    'approved',
    '{"method": "manual", "verifier": "David Thompson", "reference_id": "KYC-789012"}',
    (CURRENT_DATE + INTERVAL '18 months')::timestamp with time zone,
    'Gulf Investment Authority',
    'Major sovereign wealth fund with $350B AUM',
    'active',
    'sovereign_wealth_fund',
    true,
    '{"risk_level": "low", "assessment_date": "2023-10-10", "score": 88}',
    '{"aum": "350000000000", "established": "1996", "headquarters": "Abu Dhabi"}',
    '{"preferred_sectors": ["infrastructure", "energy", "technology", "healthcare"], "investment_horizon": "long_term", "min_investment": 10000000}',
    'approved',
    (CURRENT_DATE + INTERVAL '2 years')::timestamp with time zone,
    'qualified_purchaser',
    'United Arab Emirates',
    'UAE-654321-SWF',
    (CURRENT_DATE - INTERVAL '3 weeks')::timestamp with time zone
  )
  RETURNING investor_id
),
-- Documents for Sovereign Wealth Fund
doc_4_1 AS (
  INSERT INTO documents (
    entity_id,
    entity_type,
    name,
    type,
    status,
    file_url,
    category,
    metadata
  )
  SELECT
    investor_id,
    'investor',
    'Royal Decree of Establishment',
    'incorporation_certificate',
    'approved',
    'https://storage.example.com/documents/decree-gia.pdf',
    'entity_documents',
    '{"jurisdiction": "UAE", "document_id": "RD-1996-042"}'
  FROM new_investor_4
),
doc_4_2 AS (
  INSERT INTO documents (
    entity_id,
    entity_type,
    name,
    type,
    status,
    file_url,
    category,
    metadata
  )
  SELECT
    investor_id,
    'investor',
    'Board of Directors',
    'authorized_signatories',
    'approved',
    'https://storage.example.com/documents/board-gia.pdf',
    'entity_documents',
    '{"updated_date": "2023-05-20", "members_count": 7}'
  FROM new_investor_4
),
doc_4_3 AS (
  INSERT INTO documents (
    entity_id,
    entity_type,
    name,
    type,
    status,
    file_url,
    category,
    metadata
  )
  SELECT
    investor_id,
    'investor',
    'Investment Authority Certification',
    'accreditation_certificate',
    'approved',
    'https://storage.example.com/documents/certification-gia.pdf',
    'accreditation',
    '{"certification_date": "2023-09-01", "certified_by": "International Investment Commission"}'
  FROM new_investor_4
),
-- Approvals for Sovereign Wealth Fund
approval_4_1 AS (
  INSERT INTO investor_approvals (
    investor_id,
    approval_type,
    status,
    submission_date,
    approval_date,
    required_documents,
    review_notes
  )
  SELECT
    investor_id,
    'KYC',
    'approved',
    (CURRENT_DATE - INTERVAL '8 weeks')::timestamp with time zone,
    (CURRENT_DATE - INTERVAL '6 weeks')::timestamp with time zone,
    '["incorporation_certificate", "authorized_signatories", "ownership_structure"]',
    'Enhanced due diligence completed successfully'
  FROM new_investor_4
),
approval_4_2 AS (
  INSERT INTO investor_approvals (
    investor_id,
    approval_type,
    status,
    submission_date,
    approval_date,
    required_documents,
    review_notes
  )
  SELECT
    investor_id,
    'accreditation',
    'approved',
    (CURRENT_DATE - INTERVAL '8 weeks')::timestamp with time zone,
    (CURRENT_DATE - INTERVAL '6 weeks')::timestamp with time zone,
    '["accreditation_certificate"]',
    'Sovereign wealth fund automatically qualifies'
  FROM new_investor_4
),
-- KYC Logs for Sovereign Wealth Fund
log_4_1 AS (
  INSERT INTO kyc_screening_logs (
    investor_id,
    previous_status,
    new_status,
    method,
    notes,
    performed_by
  )
  SELECT
    investor_id,
    'not_started',
    'pending',
    'document_upload',
    'Initial documents submitted',
    'System'
  FROM new_investor_4
),
log_4_2 AS (
  INSERT INTO kyc_screening_logs (
    investor_id,
    previous_status,
    new_status,
    method,
    notes,
    performed_by
  )
  SELECT
    investor_id,
    'pending',
    'approved',
    'enhanced_due_diligence',
    'Full due diligence completed for sovereign entity',
    'David Thompson'
  FROM new_investor_4
),

-- Insurance Company - Expired KYC
new_investor_5 AS (
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
    'Atlantic Insurance Group',
    'investments@atlanticinsurance.com',
    'entity',
    'expired',
    '{"method": "manual", "verifier": "Emily Roberts", "expiry_notification_sent": true}',
    (CURRENT_DATE - INTERVAL '1 month')::timestamp with time zone,
    'Atlantic Insurance Group Inc.',
    'Major insurance company with significant alternative investments',
    'needs_review',
    'insurance_company',
    true,
    '{"risk_level": "low", "assessment_date": "2022-10-15", "score": 85}',
    '{"aum": "45000000000", "established": "1978", "headquarters": "Boston"}',
    '{"preferred_sectors": ["fixed income", "real estate", "infrastructure"], "investment_horizon": "long_term", "min_investment": 5000000}',
    'approved',
    (CURRENT_DATE + INTERVAL '6 months')::timestamp with time zone,
    'qualified_purchaser',
    'United States',
    '74-3625189',
    (CURRENT_DATE - INTERVAL '13 months')::timestamp with time zone
  )
  RETURNING investor_id
),
-- Documents for Insurance Company
doc_5_1 AS (
  INSERT INTO documents (
    entity_id,
    entity_type,
    name,
    type,
    status,
    file_url,
    expiry_date,
    category,
    metadata
  )
  SELECT
    investor_id,
    'investor',
    'Insurance License',
    'identification',
    'expired',
    'https://storage.example.com/documents/license-atlantic.pdf',
    (CURRENT_DATE - INTERVAL '1 month')::timestamp with time zone,
    'identification',
    '{"document_type": "license", "expiry_notification_sent": true}'
  FROM new_investor_5
),
doc_5_2 AS (
  INSERT INTO documents (
    entity_id,
    entity_type,
    name,
    type,
    status,
    file_url,
    category,
    metadata
  )
  SELECT
    investor_id,
    'investor',
    'Certificate of Incorporation',
    'formation_documents',
    'approved',
    'https://storage.example.com/documents/incorporation-atlantic.pdf',
    'entity_documents',
    '{"jurisdiction": "Delaware", "registration_number": "DE-7891234"}'
  FROM new_investor_5
),
-- Approvals for Insurance Company
approval_5_1 AS (
  INSERT INTO investor_approvals (
    investor_id,
    approval_type,
    status,
    submission_date,
    approval_date,
    required_documents,
    review_notes
  )
  SELECT
    investor_id,
    'KYC',
    'expired',
    (CURRENT_DATE - INTERVAL '13 months')::timestamp with time zone,
    (CURRENT_DATE - INTERVAL '13 months')::timestamp with time zone,
    '["identification", "formation_documents"]',
    'KYC approved but now expired'
  FROM new_investor_5
),
approval_5_2 AS (
  INSERT INTO investor_approvals (
    investor_id,
    approval_type,
    status,
    submission_date,
    approval_date,
    required_documents,
    review_notes
  )
  SELECT
    investor_id,
    'accreditation',
    'approved',
    (CURRENT_DATE - INTERVAL '7 months')::timestamp with time zone,
    (CURRENT_DATE - INTERVAL '6 months')::timestamp with time zone,
    '["net_worth_certification", "aum_statement"]',
    'Qualified purchaser status confirmed'
  FROM new_investor_5
),
-- KYC Logs for Insurance Company
log_5_1 AS (
  INSERT INTO kyc_screening_logs (
    investor_id,
    previous_status,
    new_status,
    method,
    notes,
    performed_by
  )
  SELECT
    investor_id,
    'not_started',
    'pending',
    'document_upload',
    'Initial documents submitted',
    'System'
  FROM new_investor_5
),
log_5_2 AS (
  INSERT INTO kyc_screening_logs (
    investor_id,
    previous_status,
    new_status,
    method,
    notes,
    performed_by
  )
  SELECT
    investor_id,
    'pending',
    'approved',
    'manual_review',
    'All documents verified',
    'Emily Roberts'
  FROM new_investor_5
),
log_5_3 AS (
  INSERT INTO kyc_screening_logs (
    investor_id,
    previous_status,
    new_status,
    method,
    notes,
    performed_by
  )
  SELECT
    investor_id,
    'approved',
    'expired',
    'scheduled_check',
    'KYC documents have expired',
    'System'
  FROM new_investor_5
)

SELECT 'Successfully added 5 investors with their associated records' as result; 