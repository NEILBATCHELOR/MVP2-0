# Bulk Investor Upload

The Bulk Investor Upload functionality allows users to import multiple investors at once using CSV files.

## Recent Changes

### Email Validation Removal (2023-XX-XX)

- Removed email format validation to allow for more flexible imports
- Email field is still required but accepts any format
- This allows for importing data from various external systems with different email formats
- The change was implemented in:
  - `src/components/investors/BulkInvestorUpload.tsx`
  - `src/components/compliance/operations/investor/InvestorBulkUpload.tsx`

### Duplicate Email Detection Fix (2023-XX-XX)

- Fixed an issue where emails were incorrectly flagged as duplicates
- Removed case-insensitive comparison that was causing false positives
- Improved the error display UI for validation errors
- Enhanced the readability of validation error messages
- Fixed dialog heading spacing for better visual appearance

## How It Works

1. Users can upload a CSV file via drag-and-drop or file selection
2. The system validates:
   - Required fields (name, email)
   - Investor type format
   - KYC status validity
   - Wallet address format
   - Duplicate emails
3. If validation passes, investors are added to the database
4. If an investor with the same email already exists, the system attempts to update them

## Data Format

The CSV file should include the following fields:
- `Name` (required)
- `Email` (required)
- `Company` (optional)
- `Type` (optional, defaults to "hnwi")
- `KYC Status` (optional, defaults to "not_started")
- `Wallet Address` (optional, should be in format 0x...)

## Template

Users can download a template CSV file that provides the correct format and example data. 