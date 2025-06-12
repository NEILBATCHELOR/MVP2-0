# Cap Table Components

## Overview
The Cap Table components manage and visualize capitalization tables, token allocations, investor relationships, and financial scenarios for projects. These components form the core financial management system of the application.

## Components

### Cap Table Core Components
- **CapTableView.tsx**: Main component for displaying the complete cap table with filtering and sorting.
- **CapTableManager.tsx**: Management interface for cap table operations (empty file, likely deprecated).
- **CapTableManagerNew.tsx**: New implementation of the cap table management interface.
- **CapTableDashboard.tsx**: Dashboard with key cap table metrics and visualizations.
- **CapTableSummary.tsx**: Summary component showing key cap table statistics and insights.
- **CapTableNavigation.tsx**: Top Navigation component for the cap table section.
- **CapTableReports.tsx**: Component for generating various cap table reports.
- **CapTableReportExport.tsx**: Export functionality for cap table reports.

### Token Management Components
- **TokenAllocationManager.tsx**: Interface for managing token allocations.
- **TokenAllocationTable.tsx**: Table view of all token allocations with filtering and sorting.
- **TokenAllocationForm.tsx**: Form for creating and editing token allocations.
- **TokenAllocationUploadDialog.tsx**: Dialog for bulk importing token allocations.
- **TokenAllocationExportDialog.tsx**: Dialog for exporting token allocation data.
- **TokenMintingManager.tsx**: Component for managing the token minting process.
- **TokenMintingPanel.tsx**: Panel displaying token minting information and controls.
- **TokenMintingDialog.tsx**: Dialog for initiating token minting operations.
- **TokenDistributionManager.tsx**: Component for managing token distribution to investors.
- **TokenDistributionDialog.tsx**: Dialog for configuring token distribution operations.

### Investor Components
- **InvestorTable.tsx**: Table displaying all investors with filtering and sorting capabilities.
- **InvestorDialog.tsx**: Dialog for creating and editing investor information.
- **InvestorImportDialog.tsx**: Dialog for bulk importing investor data.

### Subscription Components
- **SubscriptionManager.tsx**: Management interface for investor subscriptions.
- **SubscriptionDialog.tsx**: Dialog for creating and editing subscriptions.
- **SubscriptionConfirmationDialog.tsx**: Confirmation dialog for subscription actions.
- **SubscriptionUploadDialog.tsx**: Dialog for bulk importing subscription data.
- **SubscriptionExportDialog.tsx**: Dialog for exporting subscription data.

### Financial and Compliance Components
- **ScenarioPlanner.tsx**: Component for modeling financial scenarios and outcomes.
- **WaterfallModel.tsx**: Component for visualizing and managing distribution waterfalls.
- **CompliancePanel.tsx**: Panel displaying compliance information and controls.
- **DocumentManager.tsx**: Component for managing documents associated with the cap table.

### Utility Components
- **BulkOperationsMenu.tsx**: Menu for performing operations on multiple selections.
- **BulkStatusUpdateDialog.tsx**: Dialog for updating status on multiple items.
- **TagsDialog.tsx**: Dialog for managing and applying tags.
- **ProjectSelector.tsx**: Component for selecting projects.
- **AllocationConfirmationDialog.tsx**: Confirmation dialog for allocation actions.

## Type Definitions
- **types.ts**: Contains TypeScript type definitions specific to cap table functionality.

## Configuration
The folder contains a `tsconfig.json` for TypeScript configuration specific to the cap table components.

## Usage
These components form the financial management section of the application, allowing users to manage cap tables, track token allocations, handle investor relationships, and model financial scenarios.

## Dependencies
- React
- UI component library
- Form validation libraries
- Financial calculation utilities