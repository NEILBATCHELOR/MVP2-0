# Dashboard Components

## Overview
The Dashboard components provide administrative and user dashboards, data visualization, and status monitoring functionality. These components form the central control panel and reporting interface of the application.

## Components

### Core Dashboard Components
- **Dashboard.tsx**: Main dashboard component that integrates various sections and widgets.
- **DashboardHeader.tsx**: Header component for the dashboard with title, actions, and navigation.
- **DashboardTabs.tsx**: Tab navigation for switching between different dashboard views.

### Data Grid Components
- **InvestorGrid.tsx**: Grid component for displaying investor data.
- **GridToolbar.tsx**: Toolbar for data grids with filtering, sorting, and action buttons.
- **KYCStatusCell.tsx**: Grid cell component for displaying KYC status with appropriate indicators.

### Status and Compliance Components
- **StatusSummary.tsx**: Visual summary of system and user statuses with statistics.
- **ComplianceSection.tsx**: Dashboard section focused on compliance metrics and actions.
- **WorkflowVisualization.tsx**: Visual representation of workflow processes and statuses.

### Document and Wallet Components
- **DocumentSection.tsx**: Dashboard section for document management and status.
- **WalletSection.tsx**: Dashboard section for wallet management and cryptocurrency operations.

### Verification Components
- **OnfidoVerificationDialog.tsx**: Dialog for Onfido identity verification integration.
- **ScreeningDialog.tsx**: Dialog for screening individual investors or entities.
- **BatchScreeningDialog.tsx**: Dialog for screening multiple investors or entities simultaneously.

### Notification Components
- **NotificationSection.tsx**: Dashboard section displaying notifications and alerts.

### Type Definitions
- **InvestorTypes.ts**: TypeScript type definitions specific to investor functionality in the dashboard.

## Configuration
The folder contains a `tsconfig.json` for TypeScript configuration specific to the dashboard components.

## Usage
These components are used to create the main dashboard interfaces of the application, providing administrators and users with insights, controls, and visualizations of system data.

## Dependencies
- React
- UI component library
- Data visualization libraries
- Grid/table components
- Notification systems