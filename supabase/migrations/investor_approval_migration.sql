-- Migration SQL for Investor Approvals
-- Enhancement to organizations table for issuer onboarding
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS legal_name TEXT,
ADD COLUMN IF NOT EXISTS registration_number TEXT,
ADD COLUMN IF NOT EXISTS registration_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS tax_id TEXT,
ADD COLUMN IF NOT EXISTS jurisdiction TEXT,
ADD COLUMN IF NOT EXISTS business_type TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS address JSONB,
ADD COLUMN IF NOT EXISTS legal_representatives JSONB,
ADD COLUMN IF NOT EXISTS compliance_status TEXT DEFAULT 'pending_review',
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create investor_approvals table
CREATE TABLE IF NOT EXISTS investor_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investor_id UUID NOT NULL REFERENCES investors(investor_id),
    reviewer_id UUID REFERENCES auth.users(id),
    status TEXT NOT NULL DEFAULT 'pending',
    rejection_reason TEXT,
    approval_date TIMESTAMP WITH TIME ZONE,
    submission_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    approval_type TEXT NOT NULL, -- 'kyc', 'accreditation', 'wallet', 'general'
    required_documents JSONB,
    review_notes TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index on investor_approvals
CREATE INDEX IF NOT EXISTS idx_investor_approvals_investor_id ON investor_approvals(investor_id);
CREATE INDEX IF NOT EXISTS idx_investor_approvals_status ON investor_approvals(status);
CREATE INDEX IF NOT EXISTS idx_investor_approvals_approval_type ON investor_approvals(approval_type);

-- Update investors table with additional fields if not present
ALTER TABLE investors
ADD COLUMN IF NOT EXISTS investor_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS investor_type TEXT DEFAULT 'individual',
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS risk_assessment JSONB,
ADD COLUMN IF NOT EXISTS profile_data JSONB,
ADD COLUMN IF NOT EXISTS accreditation_status TEXT DEFAULT 'not_started',
ADD COLUMN IF NOT EXISTS accreditation_expiry_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS accreditation_type TEXT,
ADD COLUMN IF NOT EXISTS tax_residency TEXT,
ADD COLUMN IF NOT EXISTS tax_id_number TEXT,
ADD COLUMN IF NOT EXISTS investment_preferences JSONB,
ADD COLUMN IF NOT EXISTS last_compliance_check TIMESTAMP WITH TIME ZONE;

-- Create a trigger function to update timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for timestamp updates
DROP TRIGGER IF EXISTS update_investor_approvals_timestamp ON investor_approvals;
CREATE TRIGGER update_investor_approvals_timestamp
BEFORE UPDATE ON investor_approvals
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();

DROP TRIGGER IF EXISTS update_organizations_timestamp ON organizations;
CREATE TRIGGER update_organizations_timestamp
BEFORE UPDATE ON organizations
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();

-- Update the triggers on investors table if not already present
DROP TRIGGER IF EXISTS update_investors_timestamp ON investors;
CREATE TRIGGER update_investors_timestamp
BEFORE UPDATE ON investors
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();

-- Create RLS policies for investor_approvals
ALTER TABLE investor_approvals ENABLE ROW LEVEL SECURITY;

-- Policy for the authenticated users
CREATE POLICY investor_approvals_select_policy ON investor_approvals
FOR SELECT
USING (
    -- Admins can see all
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid() AND users.role = 'admin'
    )
    OR
    -- User can see their own approvals
    EXISTS (
        SELECT 1 FROM investors
        WHERE investors.investor_id = investor_approvals.investor_id
        AND investors.email = auth.email()
    )
    OR
    -- Reviewers can see the approvals they're assigned to review
    reviewer_id = auth.uid()
);

-- Policy for inserting new investor approvals
CREATE POLICY investor_approvals_insert_policy ON investor_approvals
FOR INSERT
WITH CHECK (
    -- Admins can insert
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid() AND users.role = 'admin'
    )
    OR
    -- Users can submit their own approvals
    EXISTS (
        SELECT 1 FROM investors
        WHERE investors.investor_id = investor_approvals.investor_id
        AND investors.email = auth.email()
    )
);

-- Policy for updating investor approvals
CREATE POLICY investor_approvals_update_policy ON investor_approvals
FOR UPDATE
USING (
    -- Admins can update
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid() AND users.role = 'admin'
    )
    OR
    -- Reviewers can update the approvals they're assigned to
    reviewer_id = auth.uid()
    OR
    -- Users can update their own approvals if still pending
    (
        status = 'pending' AND 
        EXISTS (
            SELECT 1 FROM investors
            WHERE investors.investor_id = investor_approvals.investor_id
            AND investors.email = auth.email()
        )
    )
);

-- Create a trigger function to audit approval actions
CREATE OR REPLACE FUNCTION audit_investor_approval_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND NEW.status != OLD.status) THEN
        INSERT INTO audit_logs (
            entity_id,
            entity_type,
            action,
            user_id,
            details,
            status,
            created_at
        ) VALUES (
            NEW.id,
            'investor_approval',
            'status_change',
            auth.uid(),
            jsonb_build_object(
                'old_status', OLD.status,
                'new_status', NEW.status,
                'investor_id', NEW.investor_id,
                'approval_type', NEW.approval_type
            ),
            'success',
            now()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add the trigger to investor_approvals
DROP TRIGGER IF EXISTS investor_approval_audit_trigger ON investor_approvals;
CREATE TRIGGER investor_approval_audit_trigger
AFTER UPDATE ON investor_approvals
FOR EACH ROW
EXECUTE PROCEDURE audit_investor_approval_changes();