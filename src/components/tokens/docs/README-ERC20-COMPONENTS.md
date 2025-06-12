# ERC20 Token Components

This document provides an overview of the ERC20 token components implemented in the system.

## Overview

The ERC20 token components provide a comprehensive set of functionality for creating, editing, and viewing ERC20 tokens. These components are designed to work with the token system's architecture and integrate with the Supabase database.

## Components

### ERC20EditForm

A form component for editing ERC20 tokens with the following features:

- Basic information editing (name, symbol, decimals, supply)
- Core token features (mintable, burnable, pausable)
- Advanced features for maximum configuration mode:
  - Access control model selection
  - Allowance management
  - Permit support (EIP-2612)
  - Snapshot support
- Extensions for maximum configuration mode:
  - Fee on transfer
  - Rebasing mechanism
  - Governance features

**Location:** `src/components/tokens/forms/ERC20EditForm.tsx`

### ERC20DetailView

A view component for displaying ERC20 token details with the following sections:

- Basic token information
- Token features
- Fee on transfer details (if enabled)
- Rebasing details (if enabled)
- Governance details (if enabled)

**Location:** `src/components/tokens/components/ERC20DetailView.tsx`

## Services

### tokenUpdateService

A service for updating tokens and their standard-specific properties:

- `updateToken`: Updates a token and its properties
- `updateStandardProperties`: Updates standard-specific properties for a token
- `updateStandardArrays`: Updates standard-specific array data for a token

**Location:** `src/components/tokens/services/tokenUpdateService.ts`

### erc20Service

A service specifically for ERC20 token operations:

- `getERC20Token`: Retrieves an ERC20 token with its properties
- `updateERC20Properties`: Updates ERC20 token properties
- `getProjectERC20Tokens`: Gets all ERC20 tokens for a project

**Location:** `src/components/tokens/services/erc20Service.ts`

## Mappers

### erc20Mapper

A mapper for converting between database and UI representations of ERC20 tokens:

- `mapERC20PropertiesToUI`: Maps database properties to UI format
- `mapERC20PropertiesToDB`: Maps UI properties to database format
- `enhanceTokenWithERC20Properties`: Enhances a token with its ERC20 properties
- `extractERC20PropertiesFromBlocks`: Extracts ERC20 properties from token blocks

**Location:** `src/components/tokens/mappers/erc20Mapper.ts`

## Database Schema

The ERC20 token properties are stored in the `token_erc20_properties` table with the following structure:

```sql
create table public.token_erc20_properties (
  id uuid not null default gen_random_uuid(),
  token_id uuid not null,
  initial_supply text null,
  cap text null,
  is_mintable boolean null default false,
  is_burnable boolean null default false,
  is_pausable boolean null default false,
  token_type text null default 'utility'::text,
  access_control text null default 'ownable'::text,
  allow_management boolean null default false,
  permit boolean null default false,
  snapshot boolean null default false,
  fee_on_transfer jsonb null,
  rebasing jsonb null,
  governance_features jsonb null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  transfer_config jsonb null,
  gas_config jsonb null,
  compliance_config jsonb null,
  whitelist_config jsonb null,
  constraint token_erc20_properties_pkey primary key (id),
  constraint one_property_per_token unique (token_id),
  constraint token_erc20_properties_token_id_fkey foreign key (token_id) references tokens (id) on delete cascade
);
```

## Usage

### Editing an ERC20 Token

```tsx
import ERC20EditForm from '@/components/tokens/forms/ERC20EditForm';
import { getERC20Token } from '@/components/tokens/services/erc20Service';

// Get the token with its properties
const token = await getERC20Token(tokenId);

// Render the edit form
<ERC20EditForm
  token={token}
  onSave={handleSave}
  configMode="max"
  useAdvancedConfig={true}
/>
```

### Viewing an ERC20 Token

```tsx
import ERC20DetailView from '@/components/tokens/components/ERC20DetailView';
import { getERC20Token } from '@/components/tokens/services/erc20Service';

// Get the token with its properties
const token = await getERC20Token(tokenId);

// Render the detail view
<ERC20DetailView
  token={token}
  showActions={true}
  onEdit={handleEdit}
/>
```

## Implementation Notes

1. The ERC20 components use the Zod validation schema from `erc20Schema.ts` to ensure data integrity.
2. The components are designed to work with both minimum and maximum configuration modes.
3. The services handle the mapping between UI and database representations of tokens.
4. The components are fully integrated with the existing token system architecture.

## Future Enhancements

1. Add support for custom token features
2. Implement token simulation and testing
3. Add support for token upgradability
4. Enhance governance features with proposal creation and voting