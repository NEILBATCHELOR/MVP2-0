# Pages Directory

This directory contains page components that serve as the entry points for different routes in the application. These pages typically compose multiple components together and handle route-specific logic.

## Structure and Organization

Pages are organized according to their functionality and route hierarchy:

- Top-level pages are defined directly in this directory
- Feature-specific pages are organized into subdirectories

## Key Files

### Top-Level Pages

- **UserMFAPage.tsx**: Page for handling user multi-factor authentication
- **ActivityMonitorPage.tsx**: Dashboard for monitoring system activity
- **MFASettingsPage.tsx**: Page for managing MFA settings
- **ApproverPortalPage.tsx**: Portal for policy approvers
- **ResetPasswordPage.tsx**: Page for password reset functionality
- **NotificationSettingsPage.tsx**: Page for managing notification preferences

### Subdirectories

#### token/
Pages related to token management:
- **TokenManagementPage.tsx**: Main page for token management
- **TokenDetailPage.tsx**: Detailed view of a specific token
- **TokenFormPage.tsx**: Form for creating or editing tokens
- **TokenTemplateListPage.tsx**: List of token templates
- **TokenTemplateFormPage.tsx**: Form for creating or editing token templates

#### wallet/
Pages related to wallet functionality:
- **WalletDashboardPage.tsx**: Dashboard for wallet overview
- **MultiSigWalletPage.tsx**: Management of multi-signature wallets
- **KeyManagementPage.tsx**: Management of cryptographic keys
- **TokenManagementPage.tsx**: Token management specific to wallets

## Page Component Pattern

Page components follow a consistent pattern:

1. Import necessary components and hooks
2. Define the page component that composes UI components
3. Handle page-specific state and side effects
4. Export the component as default

Example:
```tsx
import React from "react";
import ActivityMonitor from "@/components/activity/ActivityMonitor";

const ActivityMonitorPage: React.FC = () => {
  return <ActivityMonitor />;
};

export default ActivityMonitorPage;
```

## Routing Integration

Pages are integrated with the application's routing system in the main `App.tsx` file. Most pages are wrapped with `ProtectedRoute` components to enforce authentication and authorization requirements.

## Best Practices

1. Keep page components focused on composition and routing concerns
2. Delegate business logic to custom hooks and services
3. Use consistent naming convention (PageName + Page)
4. Implement proper loading states and error handling
5. Use React Router's features for managing route parameters
6. Maintain separation of concerns between pages and their child components