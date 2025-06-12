-- Issuer Onboarding Data Population Script

-- Set a default admin user ID for created_by/updated_by fields
DO $$
DECLARE
    admin_user_id UUID := '00000000-0000-0000-0000-000000000000'; -- Replace with an actual admin user ID if needed
BEGIN

-- Insert into organizations
INSERT INTO public.organizations (
    id,
    name,
    legal_name,
    registration_number,
    registration_date,
    tax_id,
    jurisdiction,
    business_type,
    status,
    compliance_status,
    onboarding_completed,
    contact_email,
    contact_phone,
    website,
    address,
    legal_representatives
) VALUES
(
    'e1da5355-f5f7-4a9d-9c1a-bb8243448fa1',
    'RealFi Capital',
    'RealFi Capital Partners LLC',
    'RF-9876543',
    '2015-06-15',
    '85-7654321',
    'United States',
    'Limited Liability Company',
    'active',
    'approved',
    true,
    'contact@realficapital.com',
    '+1-415-555-1234',
    'https://www.realficapital.com',
    '{"street": "101 Market Street", "city": "San Francisco", "state": "CA", "zip": "94105", "country": "USA"}',
    '[{"name": "Sarah Johnson", "position": "Managing Partner"}, {"name": "Michael Chen", "position": "Chief Investment Officer"}]'
),
(
    'f2be6466-a0e8-4b1b-8ea2-cc5987fe21a2',
    'Horizon Investments',
    'Horizon Global Investments Ltd.',
    'HGI-7654321',
    '2010-03-22',
    '74-6543210',
    'United Kingdom',
    'Limited Company',
    'active',
    'approved',
    true,
    'info@horizoninvest.com',
    '+44-20-7123-4567',
    'https://www.horizoninvestments.com',
    '{"street": "25 Canary Wharf", "city": "London", "state": "", "zip": "E14 5AB", "country": "United Kingdom"}',
    '[{"name": "James Wilson", "position": "CEO"}, {"name": "Emma Clarke", "position": "CFO"}]'
),
(
    'a3df7577-b1f9-4c2c-9db3-dd6898fd32b3',
    'Quantum Assets',
    'Quantum Strategic Assets Management Inc.',
    'QSA-5432198',
    '2018-11-05',
    '63-5432198',
    'United States',
    'Corporation',
    'active',
    'approved',
    true,
    'contact@quantumassets.com',
    '+1-212-555-6789',
    'https://www.quantumassets.com',
    '{"street": "350 Park Avenue", "city": "New York", "state": "NY", "zip": "10022", "country": "USA"}',
    '[{"name": "Robert Zhang", "position": "President"}, {"name": "Sophia Patel", "position": "Chief Operating Officer"}]'
),
(
    'b4ef8688-c2fa-4d3d-ae4c-ee7909fe43c4',
    'Alpine Securities',
    'Alpine Securities Group AG',
    'ASG-4321987',
    '2005-08-12',
    'CHE-123.456.789',
    'Switzerland',
    'Aktiengesellschaft',
    'active',
    'approved',
    true,
    'info@alpinesecurities.com',
    '+41-44-555-7890',
    'https://www.alpinesecurities.com',
    '{"street": "Bahnhofstrasse 45", "city": "Zurich", "state": "", "zip": "8001", "country": "Switzerland"}',
    '[{"name": "Thomas Mueller", "position": "CEO"}, {"name": "Anna Schmidt", "position": "Head of Compliance"}]'
),
(
    'c5fg9799-d3eb-4e4f-bf5d-ff0a10gf54d5',
    'Meridian Fund Management',
    'Meridian International Fund Management Ltd.',
    'MIF-3219876',
    '2012-04-30',
    '52-3219876',
    'Singapore',
    'Private Limited Company',
    'active',
    'approved',
    true,
    'contact@meridianfunds.com',
    '+65-6123-4567',
    'https://www.meridianfundmanagement.com',
    '{"street": "12 Marina Boulevard", "city": "Singapore", "state": "", "zip": "018982", "country": "Singapore"}',
    '[{"name": "David Tan", "position": "Managing Director"}, {"name": "Michelle Wong", "position": "Chief Investment Strategist"}]'
);

-- Insert into issuer_documents for RealFi Capital
INSERT INTO public.issuer_documents (
    issuer_id,
    document_type,
    file_url,
    status,
    uploaded_at,
    expires_at,
    last_reviewed_at,
    reviewed_by,
    version,
    metadata,
    created_by,
    updated_by
) VALUES
(
    'e1da5355-f5f7-4a9d-9c1a-bb8243448fa1',
    'certificate_incorporation',
    'https://storage.example.com/documents/realfi_cert_incorp.pdf',
    'approved',
    now() - interval '30 days',
    now() + interval '5 years',
    now() - interval '25 days',
    admin_user_id,
    1,
    '{"issuer_name": "RealFi Capital", "document_name": "Certificate of Incorporation", "page_count": 5}',
    admin_user_id,
    admin_user_id
),
(
    'e1da5355-f5f7-4a9d-9c1a-bb8243448fa1',
    'memorandum_articles',
    'https://storage.example.com/documents/realfi_mem_articles.pdf',
    'approved',
    now() - interval '30 days',
    now() + interval '5 years',
    now() - interval '25 days',
    admin_user_id,
    1,
    '{"issuer_name": "RealFi Capital", "document_name": "Memorandum and Articles", "page_count": 22}',
    admin_user_id,
    admin_user_id
),
(
    'e1da5355-f5f7-4a9d-9c1a-bb8243448fa1',
    'proof_address',
    'https://storage.example.com/documents/realfi_proof_address.pdf',
    'approved',
    now() - interval '30 days',
    now() + interval '1 year',
    now() - interval '25 days',
    admin_user_id,
    1,
    '{"issuer_name": "RealFi Capital", "document_name": "Proof of Address", "page_count": 2}',
    admin_user_id,
    admin_user_id
),
(
    'e1da5355-f5f7-4a9d-9c1a-bb8243448fa1',
    'tax_id_certificate',
    'https://storage.example.com/documents/realfi_tax_id.pdf',
    'approved',
    now() - interval '30 days',
    now() + interval '5 years',
    now() - interval '25 days',
    admin_user_id,
    1,
    '{"issuer_name": "RealFi Capital", "document_name": "Tax ID Certificate", "page_count": 1}',
    admin_user_id,
    admin_user_id
);

-- Insert into issuer_documents for Horizon Investments
INSERT INTO public.issuer_documents (
    issuer_id,
    document_type,
    file_url,
    status,
    uploaded_at,
    expires_at,
    last_reviewed_at,
    reviewed_by,
    version,
    metadata,
    created_by,
    updated_by
) VALUES
(
    'f2be6466-a0e8-4b1b-8ea2-cc5987fe21a2',
    'certificate_incorporation',
    'https://storage.example.com/documents/horizon_cert_incorp.pdf',
    'approved',
    now() - interval '45 days',
    now() + interval '5 years',
    now() - interval '40 days',
    admin_user_id,
    1,
    '{"issuer_name": "Horizon Investments", "document_name": "Certificate of Incorporation", "page_count": 4}',
    admin_user_id,
    admin_user_id
),
(
    'f2be6466-a0e8-4b1b-8ea2-cc5987fe21a2',
    'memorandum_articles',
    'https://storage.example.com/documents/horizon_mem_articles.pdf',
    'approved',
    now() - interval '45 days',
    now() + interval '5 years',
    now() - interval '40 days',
    admin_user_id,
    1,
    '{"issuer_name": "Horizon Investments", "document_name": "Memorandum and Articles", "page_count": 18}',
    admin_user_id,
    admin_user_id
),
(
    'f2be6466-a0e8-4b1b-8ea2-cc5987fe21a2',
    'proof_address',
    'https://storage.example.com/documents/horizon_proof_address.pdf',
    'approved',
    now() - interval '45 days',
    now() + interval '1 year',
    now() - interval '40 days',
    admin_user_id,
    1,
    '{"issuer_name": "Horizon Investments", "document_name": "Proof of Address", "page_count": 2}',
    admin_user_id,
    admin_user_id
),
(
    'f2be6466-a0e8-4b1b-8ea2-cc5987fe21a2',
    'tax_id_certificate',
    'https://storage.example.com/documents/horizon_tax_id.pdf',
    'approved',
    now() - interval '45 days',
    now() + interval '5 years',
    now() - interval '40 days',
    admin_user_id,
    1,
    '{"issuer_name": "Horizon Investments", "document_name": "Tax ID Certificate", "page_count": 1}',
    admin_user_id,
    admin_user_id
);

-- Insert into issuer_documents for Quantum Assets
INSERT INTO public.issuer_documents (
    issuer_id,
    document_type,
    file_url,
    status,
    uploaded_at,
    expires_at,
    last_reviewed_at,
    reviewed_by,
    version,
    metadata,
    created_by,
    updated_by
) VALUES
(
    'a3df7577-b1f9-4c2c-9db3-dd6898fd32b3',
    'certificate_incorporation',
    'https://storage.example.com/documents/quantum_cert_incorp.pdf',
    'approved',
    now() - interval '60 days',
    now() + interval '5 years',
    now() - interval '55 days',
    admin_user_id,
    1,
    '{"issuer_name": "Quantum Assets", "document_name": "Certificate of Incorporation", "page_count": 3}',
    admin_user_id,
    admin_user_id
),
(
    'a3df7577-b1f9-4c2c-9db3-dd6898fd32b3',
    'memorandum_articles',
    'https://storage.example.com/documents/quantum_mem_articles.pdf',
    'approved',
    now() - interval '60 days',
    now() + interval '5 years',
    now() - interval '55 days',
    admin_user_id,
    1,
    '{"issuer_name": "Quantum Assets", "document_name": "Memorandum and Articles", "page_count": 20}',
    admin_user_id,
    admin_user_id
),
(
    'a3df7577-b1f9-4c2c-9db3-dd6898fd32b3',
    'proof_address',
    'https://storage.example.com/documents/quantum_proof_address.pdf',
    'approved',
    now() - interval '60 days',
    now() + interval '1 year',
    now() - interval '55 days',
    admin_user_id,
    1,
    '{"issuer_name": "Quantum Assets", "document_name": "Proof of Address", "page_count": 2}',
    admin_user_id,
    admin_user_id
),
(
    'a3df7577-b1f9-4c2c-9db3-dd6898fd32b3',
    'tax_id_certificate',
    'https://storage.example.com/documents/quantum_tax_id.pdf',
    'approved',
    now() - interval '60 days',
    now() + interval '5 years',
    now() - interval '55 days',
    admin_user_id,
    1,
    '{"issuer_name": "Quantum Assets", "document_name": "Tax ID Certificate", "page_count": 1}',
    admin_user_id,
    admin_user_id
);

-- Insert into issuer_documents for Alpine Securities
INSERT INTO public.issuer_documents (
    issuer_id,
    document_type,
    file_url,
    status,
    uploaded_at,
    expires_at,
    last_reviewed_at,
    reviewed_by,
    version,
    metadata,
    created_by,
    updated_by
) VALUES
(
    'b4ef8688-c2fa-4d3d-ae4c-ee7909fe43c4',
    'certificate_incorporation',
    'https://storage.example.com/documents/alpine_cert_incorp.pdf',
    'approved',
    now() - interval '75 days',
    now() + interval '5 years',
    now() - interval '70 days',
    admin_user_id,
    1,
    '{"issuer_name": "Alpine Securities", "document_name": "Certificate of Incorporation", "page_count": 4}',
    admin_user_id,
    admin_user_id
),
(
    'b4ef8688-c2fa-4d3d-ae4c-ee7909fe43c4',
    'memorandum_articles',
    'https://storage.example.com/documents/alpine_mem_articles.pdf',
    'approved',
    now() - interval '75 days',
    now() + interval '5 years',
    now() - interval '70 days',
    admin_user_id,
    1,
    '{"issuer_name": "Alpine Securities", "document_name": "Memorandum and Articles", "page_count": 25}',
    admin_user_id,
    admin_user_id
),
(
    'b4ef8688-c2fa-4d3d-ae4c-ee7909fe43c4',
    'proof_address',
    'https://storage.example.com/documents/alpine_proof_address.pdf',
    'approved',
    now() - interval '75 days',
    now() + interval '1 year',
    now() - interval '70 days',
    admin_user_id,
    1,
    '{"issuer_name": "Alpine Securities", "document_name": "Proof of Address", "page_count": 2}',
    admin_user_id,
    admin_user_id
),
(
    'b4ef8688-c2fa-4d3d-ae4c-ee7909fe43c4',
    'tax_id_certificate',
    'https://storage.example.com/documents/alpine_tax_id.pdf',
    'approved',
    now() - interval '75 days',
    now() + interval '5 years',
    now() - interval '70 days',
    admin_user_id,
    1,
    '{"issuer_name": "Alpine Securities", "document_name": "Tax ID Certificate", "page_count": 1}',
    admin_user_id,
    admin_user_id
);

-- Insert into issuer_documents for Meridian Fund Management
INSERT INTO public.issuer_documents (
    issuer_id,
    document_type,
    file_url,
    status,
    uploaded_at,
    expires_at,
    last_reviewed_at,
    reviewed_by,
    version,
    metadata,
    created_by,
    updated_by
) VALUES
(
    'c5fg9799-d3eb-4e4f-bf5d-ff0a10gf54d5',
    'certificate_incorporation',
    'https://storage.example.com/documents/meridian_cert_incorp.pdf',
    'approved',
    now() - interval '90 days',
    now() + interval '5 years',
    now() - interval '85 days',
    admin_user_id,
    1,
    '{"issuer_name": "Meridian Fund Management", "document_name": "Certificate of Incorporation", "page_count": 3}',
    admin_user_id,
    admin_user_id
),
(
    'c5fg9799-d3eb-4e4f-bf5d-ff0a10gf54d5',
    'memorandum_articles',
    'https://storage.example.com/documents/meridian_mem_articles.pdf',
    'approved',
    now() - interval '90 days',
    now() + interval '5 years',
    now() - interval '85 days',
    admin_user_id,
    1,
    '{"issuer_name": "Meridian Fund Management", "document_name": "Memorandum and Articles", "page_count": 18}',
    admin_user_id,
    admin_user_id
),
(
    'c5fg9799-d3eb-4e4f-bf5d-ff0a10gf54d5',
    'proof_address',
    'https://storage.example.com/documents/meridian_proof_address.pdf',
    'approved',
    now() - interval '90 days',
    now() + interval '1 year',
    now() - interval '85 days',
    admin_user_id,
    1,
    '{"issuer_name": "Meridian Fund Management", "document_name": "Proof of Address", "page_count": 2}',
    admin_user_id,
    admin_user_id
),
(
    'c5fg9799-d3eb-4e4f-bf5d-ff0a10gf54d5',
    'tax_id_certificate',
    'https://storage.example.com/documents/meridian_tax_id.pdf',
    'approved',
    now() - interval '90 days',
    now() + interval '5 years',
    now() - interval '85 days',
    admin_user_id,
    1,
    '{"issuer_name": "Meridian Fund Management", "document_name": "Tax ID Certificate", "page_count": 1}',
    admin_user_id,
    admin_user_id
);

-- Create some projects for these issuers (needed for issuer_detail_documents)
INSERT INTO public.projects (
    id,
    name,
    description,
    issuer_id,
    status,
    created_at,
    updated_at
) VALUES
(
    'a1b2c3d4-e5f6-4a5b-8c7d-9e8f7a6b5c4d',
    'RealFi Growth Fund',
    'A diversified growth fund focusing on emerging markets',
    'e1da5355-f5f7-4a9d-9c1a-bb8243448fa1',
    'active',
    now() - interval '25 days',
    now() - interval '25 days'
),
(
    'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e',
    'Horizon Global Opportunities',
    'International equity fund with focus on sustainable businesses',
    'f2be6466-a0e8-4b1b-8ea2-cc5987fe21a2',
    'active',
    now() - interval '40 days',
    now() - interval '40 days'
),
(
    'c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f',
    'Quantum Strategic Fund',
    'Alternative investments with focus on technology and healthcare',
    'a3df7577-b1f9-4c2c-9db3-dd6898fd32b3',
    'active',
    now() - interval '55 days',
    now() - interval '55 days'
),
(
    'd4e5f6a7-b8c9-7d0e-1f2a-3b4c5d6e7f8a',
    'Alpine Fixed Income',
    'European fixed income securities with focus on capital preservation',
    'b4ef8688-c2fa-4d3d-ae4c-ee7909fe43c4',
    'active',
    now() - interval '70 days',
    now() - interval '70 days'
),
(
    'e5f6a7b8-c9d0-8e1f-2a3b-4c5d6e7f8a9b',
    'Meridian Asia Growth',
    'Focus on high-growth Asian markets with emphasis on technology',
    'c5fg9799-d3eb-4e4f-bf5d-ff0a10gf54d5',
    'active',
    now() - interval '85 days',
    now() - interval '85 days'
);

-- Insert into issuer_detail_documents
INSERT INTO public.issuer_detail_documents (
    project_id,
    document_type,
    document_url,
    document_name,
    uploaded_at,
    updated_at,
    uploaded_by,
    status,
    metadata,
    is_public
) VALUES
-- RealFi Growth Fund documents
(
    'a1b2c3d4-e5f6-4a5b-8c7d-9e8f7a6b5c4d',
    'term_sheet',
    'https://storage.example.com/documents/realfi_growth_term_sheet.pdf',
    'RealFi Growth Fund Term Sheet',
    now() - interval '24 days',
    now() - interval '24 days',
    admin_user_id,
    'active',
    '{"version": "1.0", "page_count": 15, "fund_type": "Growth"}',
    true
),
(
    'a1b2c3d4-e5f6-4a5b-8c7d-9e8f7a6b5c4d',
    'offering_details',
    'https://storage.example.com/documents/realfi_growth_offering.pdf',
    'RealFi Growth Fund Offering Details',
    now() - interval '24 days',
    now() - interval '24 days',
    admin_user_id,
    'active',
    '{"version": "1.0", "page_count": 45, "total_offering": "$50,000,000"}',
    true
),
(
    'a1b2c3d4-e5f6-4a5b-8c7d-9e8f7a6b5c4d',
    'due_diligence',
    'https://storage.example.com/documents/realfi_growth_dd.pdf',
    'RealFi Growth Fund Due Diligence',
    now() - interval '24 days',
    now() - interval '24 days',
    admin_user_id,
    'active',
    '{"version": "1.0", "page_count": 25, "classification": "Internal"}',
    false
),
-- Horizon Global Opportunities documents
(
    'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e',
    'term_sheet',
    'https://storage.example.com/documents/horizon_global_term_sheet.pdf',
    'Horizon Global Opportunities Term Sheet',
    now() - interval '39 days',
    now() - interval '39 days',
    admin_user_id,
    'active',
    '{"version": "1.0", "page_count": 12, "fund_type": "Equity"}',
    true
),
(
    'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e',
    'offering_details',
    'https://storage.example.com/documents/horizon_global_offering.pdf',
    'Horizon Global Opportunities Offering Details',
    now() - interval '39 days',
    now() - interval '39 days',
    admin_user_id,
    'active',
    '{"version": "1.0", "page_count": 40, "total_offering": "£35,000,000"}',
    true
),
(
    'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e',
    'due_diligence',
    'https://storage.example.com/documents/horizon_global_dd.pdf',
    'Horizon Global Opportunities Due Diligence',
    now() - interval '39 days',
    now() - interval '39 days',
    admin_user_id,
    'active',
    '{"version": "1.0", "page_count": 22, "classification": "Internal"}',
    false
);

-- Insert into document_workflows
INSERT INTO public.document_workflows (
    document_id,
    required_signers,
    completed_signers,
    status,
    deadline,
    metadata,
    created_by,
    updated_by
) 
-- Select a few issuer_documents to create workflows for
WITH selected_docs AS (
    SELECT id 
    FROM public.issuer_documents 
    WHERE issuer_id IN (
        'e1da5355-f5f7-4a9d-9c1a-bb8243448fa1',
        'f2be6466-a0e8-4b1b-8ea2-cc5987fe21a2'
    )
    LIMIT 4
)
SELECT 
    sd.id,
    ARRAY[admin_user_id, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid],
    ARRAY[admin_user_id],
    CASE WHEN random() > 0.5 THEN 'completed'::public.workflow_status ELSE 'in_progress'::public.workflow_status END,
    now() + interval '30 days',
    '{"priority": "high", "notes": "Please review and approve this document", "department": "Compliance"}',
    admin_user_id,
    admin_user_id
FROM selected_docs sd;

-- Insert into compliance_settings
INSERT INTO public.compliance_settings (
    organization_id,
    kyc_status,
    require_accreditation,
    minimum_investment,
    jurisdictions,
    investor_count
) VALUES
(
    'e1da5355-f5f7-4a9d-9c1a-bb8243448fa1',
    'completed',
    true,
    25000,
    ARRAY['United States', 'Canada', 'United Kingdom'],
    0
),
(
    'f2be6466-a0e8-4b1b-8ea2-cc5987fe21a2',
    'completed',
    true,
    50000,
    ARRAY['United Kingdom', 'Germany', 'France', 'Italy', 'Spain'],
    0
),
(
    'a3df7577-b1f9-4c2c-9db3-dd6898fd32b3',
    'completed',
    true,
    100000,
    ARRAY['United States', 'Canada'],
    0
),
(
    'b4ef8688-c2fa-4d3d-ae4c-ee7909fe43c4',
    'completed',
    true,
    250000,
    ARRAY['Switzerland', 'Germany', 'France', 'United Kingdom'],
    0
),
(
    'c5fg9799-d3eb-4e4f-bf5d-ff0a10gf54d5',
    'completed',
    true,
    150000,
    ARRAY['Singapore', 'Hong Kong', 'Japan', 'Australia'],
    0
);

END $$;