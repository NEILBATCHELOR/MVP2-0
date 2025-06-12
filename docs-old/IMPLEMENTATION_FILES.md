# Implementation Files

This document provides an overview of all the implementation files for the Onfido and CUBE3 services.

## Onfido Service Files

### Frontend Service
- `src/lib/services/onfidoService.ts` - Main service module containing API functions for Onfido integration

### Supabase Edge Functions
- `supabase/functions/onfido-create-applicant/index.ts` - Creates an Onfido applicant
- `supabase/functions/onfido-create-check/index.ts` - Initiates an Onfido verification check
- `supabase/functions/onfido-generate-sdk-token/index.ts` - Generates SDK tokens for frontend initialization
- `supabase/functions/onfido-get-check-status/index.ts` - Retrieves the status of an Onfido check

### Documentation
- `docs/ONFIDO_IMPLEMENTATION_GUIDE.md` - Step-by-step guide for implementing Onfido

## CUBE3 Service Files

### Frontend Service
- `src/lib/services/cube3Service.ts` - Main service module containing API functions for CUBE3 integration
- `src/lib/cube3Init.ts` - Initialization module for the CUBE3 service

### Components
- `src/components/WalletRiskCheck.tsx` - Component for displaying comprehensive wallet risk assessments
- `src/components/WalletRiskIndicator.tsx` - Lightweight component for showing risk indicators inline with wallet addresses

### Documentation
- `docs/CUBE3_IMPLEMENTATION_GUIDE.md` - Step-by-step guide for implementing CUBE3

## Shared Documentation
- `README.md` - Main project README with sections for both services
- `docs/IMPLEMENTATION_FILES.md` - This file

## Usage Examples

Each of these files contains detailed code comments explaining their functionality. For implementation examples, refer to the respective implementation guides.

## Database Schema Changes

The following database schema changes were made to support these integrations:

```sql
-- For Onfido
ALTER TABLE investors 
ADD COLUMN onfido_applicant_id TEXT,
ADD COLUMN onfido_check_id TEXT,
ADD COLUMN kyc_status TEXT DEFAULT 'not_started',
ADD COLUMN kyc_details TEXT;

-- For CUBE3 (optional, if storing risk assessments)
CREATE TABLE wallet_risk_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL,
  chain_id INTEGER NOT NULL,
  risk_score INTEGER,
  risk_level TEXT,
  risk_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(wallet_address, chain_id)
);
```

## Environment Variables

Required environment variables for both services:

```
# Onfido
ONFIDO_API_TOKEN=your_onfido_api_token
NEXT_PUBLIC_ONFIDO_API_URL=https://api.onfido.com/v3

# CUBE3
NEXT_PUBLIC_CUBE3_API_KEY=your_cube3_api_key
NEXT_PUBLIC_CUBE3_API_URL=https://api.cube3.ai/v2

# Supabase (for Edge Functions)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
``` 