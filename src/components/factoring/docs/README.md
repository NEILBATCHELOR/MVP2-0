# Factoring Components

This directory contains components related to the factoring functionality of the application.

## Recent Updates

### FactoringNavigation
- Added icons to navigation items for better visual clarity
- Updated styling to match CapTableNavigation
- Improved active tab detection to properly highlight current section
- Added better handling for nested routes

### PoolManager
- Fixed Create Pool button functionality using controlled tabs with value/onValueChange
- Completely revamped the tab management approach to be more reliable
- Added extensive console logging for easier debugging of form submission issues
- Fixed issue with the Create Pool dialog not working properly when submitting
- Added project_id to the pool creation payload to ensure proper association
- Added view, edit, and remove functionalities for pools
- Enabled removing invoices from pools (returns them to unassigned list)
- Made table tabs full-width for better visual consistency
- Added proper currency formatting with commas and currency symbols
- Added ascending/descending sort to all columns
- Added refresh functionality in the view pool page

## Troubleshooting
If the Create Pool button is not working:
1. Open your browser's developer console (F12) to see debug messages
2. Ensure there are unassigned invoices available and at least one is selected
3. Check that a pool name has been entered
4. Verify there are no errors in the console when clicking the button

## Components Overview

### FactoringNavigation
Navigation component for the factoring section.

### FactoringDashboard
Main dashboard for factoring overview.

### FactoringManager
Parent component managing the factoring workflow.

### InvoiceIngestionManager
Manages the ingestion of new invoices, including CSV import.

### PoolManager
Manages the creation and management of invoice pools.

### TokenizationManager
Handles the tokenization of invoice pools.

### TokenDistributionManager
Manages the distribution of tokens to investors.

## Usage

Components are organized in a hierarchical structure:

1. **FactoringManager** - Top-level container
   - **FactoringNavigation** - Navigation between sections
   - **FactoringDashboard** - Overview dashboard
   - **InvoiceIngestionManager** - Invoice management
   - **PoolManager** - Pool management
   - **TokenizationManager** - Tokenization
   - **TokenDistributionManager** - Distribution

Each component can be imported and used independently as needed.

# Healthcare Invoice Factoring System

This module provides a comprehensive system for bundling factored healthcare invoices into Receivables Tokens that can be distributed to investors. The system enables users to ingest multiple invoices, group them into pools or tranches, tokenize them, and allocate tokens to investors.

## Features Overview

### 1. Invoice Ingestion
- Upload invoices via CSV format
- Validate invoice data before import
- Maintain relationships with providers and payers
- View and manage all uploaded invoices

### 2. Pool Management
- Group invoices into total pools or smaller tranches
- View pool statistics including total value, invoice count, and average age
- Easily see unassigned invoices and add them to pools
- Detailed view of invoices within each pool

### 3. Tokenization
- Create Receivables Tokens backed by invoice pools
- Calculate token value based on pool value and token supply
- Define security interest details for investors
- Step-by-step tokenization wizard

### 4. Token Distribution
- Allocate tokens to investors
- Track token allocation status
- Distribute tokens to investor wallets
- View investor holdings and token allocation history

## Components

### FactoringManager.tsx
Main component that orchestrates the different sections of the factoring system. Handles routing and project context.

### FactoringNavigation.tsx
Navigation component for the factoring section with links to different features.

### InvoiceIngestionManager.tsx
Handles invoice uploads, validation, and listing of invoices.

### PoolManager.tsx
Manages the creation and viewing of invoice pools and tranches.

### TokenizationManager.tsx
Handles the tokenization of invoice pools into Receivables Tokens.

### TokenDistributionManager.tsx
Manages token allocations to investors and distribution to wallets.

### types.ts
Contains TypeScript interfaces and types for the factoring system.

## Database Schema

The system relies on the following database tables:

1. `provider` - Stores healthcare provider information
2. `payer` - Stores payer (insurance company) information
3. `pool` - Stores pool/tranche information
4. `invoice` - Stores invoice details and references provider, payer, and pool
5. `tokens` - Reuses existing tokens table with factoring-specific metadata
6. `token_allocations` - Reuses existing token allocations table
7. `wallet_transactions` - Logs token distribution transactions

## Usage

1. Start by uploading invoices via the Invoices section
2. Create pools or tranches by grouping invoices in the Pools section
3. Create tokens backed by these pools in the Tokenization section
4. Allocate and distribute tokens to investors in the Distribution section

## Future Enhancements

- Advanced filtering and sorting of invoices
- Batch operations for invoice management
- More sophisticated tokenization models
- Additional security interest features
- Automated token distribution based on investment criteria
- Advanced reporting and analytics

## Implementation Notes

This module integrates with the existing project infrastructure, reusing components like token tables, investor tables, and wallet transaction tables where appropriate. It adds specific functionality for healthcare invoice factoring while maintaining compatibility with the overall system.

## CSV Import and Validation

The system validates CSV files with the following fields:
- provider_name
- provider_address
- patient_name
- patient_dob
- service_dates
- procedure_codes
- diagnosis_codes
- billed_amount
- adjustments
- net_amount_due
- payer_name
- policy_number
- invoice_number
- invoice_date
- due_date
- factoring_discount_rate
- factoring_terms

### CSV Import Implementation Notes

The CSV import functionality uses the Papa Parse library (via the CSV utility module) to correctly handle CSV parsing, including:
- Proper handling of quoted fields with commas
- Field validation for required fields, numeric fields, and date fields
- Automatic creation of providers and payers if they don't exist

**Important**: Previously, the system used a naive approach of splitting by commas which caused issues when parsing fields that contained commas (like provider_address). This has been fixed to use the proper CSV parsing utility.

## Additional Features

- **Invoice Pooling**: Group related invoices into pools for tokenization
- **Tokenization**: Create tokens backed by invoice pools
- **Token Distribution**: Distribute tokens to investors