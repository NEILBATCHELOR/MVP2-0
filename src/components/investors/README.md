# Investor Components

## Overview
The Investors components handle all aspects of investor management, onboarding, KYC (Know Your Customer) verification, and investor-related operations. These components form the investor relationship management system of the application.

## Components

### Investor Management Components
- **InvestorsList.tsx**: Main component for displaying, filtering, and managing investors with comprehensive functionality.
- **InvestorManagement.tsx**: Administrative interface for investor management.
- **InvestorDialog.tsx**: Dialog for creating and editing investor information.
- **InvestorProfile.tsx**: Component for displaying and editing detailed investor profile information.
- **InvestorDashboard.tsx**: Dashboard view displaying investor metrics and activities.
- **ManageGroupsDialog.tsx**: Dialog for managing investor groups and categorization.
- **ProjectSelectionDialog.tsx**: Dialog for associating investors with specific projects.

### Investor Onboarding Components
- **InvestorOnboardingFlow.tsx**: Component that manages the step-by-step investor onboarding process.
- **InvestorOnboardingIndex.ts**: Index file for onboarding-related components exports.
- **InvestorRegistration.tsx**: Registration form for investors to join the platform.
- **InvestorWalletSetup.tsx**: Component for setting up investor cryptocurrency wallets.
- **InvestorLayout.tsx**: Layout wrapper for investor-specific pages.

### KYC and Verification Components
- **InvestorKYC.tsx**: KYC form and process management component.
- **InvestorVerification.tsx**: Component for managing investor identity verification.
- **KycStatusBadge.tsx**: Visual indicator of an investor's KYC status.
- **OnfidoVerificationDialog.tsx**: Integration with Onfido for identity verification.
- **InvestorApprovalPending.tsx**: Status view for investors awaiting approval.
- **BatchScreeningDialog.tsx**: Dialog for screening multiple investors simultaneously.

### Data Import/Export Components
- **InvestorUpload.tsx**: Component for uploading individual investor data.
- **BulkInvestorUpload.tsx**: Component for uploading multiple investors at once with validation.

### Context Providers
- **InvestorContext.tsx**: React context provider for investor-related state and functions.

## Configuration
The folder contains a `tsconfig.json` for TypeScript configuration specific to the investor components.

## Usage
These components are used throughout the investor-facing and admin sections of the application, enabling investor onboarding, verification, and management.

## Dependencies
- React
- UI component library
- Form validation
- KYC/identity verification services (Onfido)
- Wallet integration libraries