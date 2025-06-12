# Chain Capital - Codebase Documentation

This document provides a comprehensive overview of the key directories, components, hooks, contexts, and configuration elements used in the Chain Capital application.

## Table of Contents

- [Rules Components](#rules-components)
- [Configuration](#configuration)
- [Constants](#constants)
- [Context System](#context-system)
- [Hooks](#hooks)

---

## Rules Components

The `@/components/rules` directory contains components for managing and displaying policy and rule-related UI elements in the application. These components handle everything from policy creation and management to specific rule implementations.

### Key Components

#### Policy Management

| Component | Description | Key Props/Features |
|-----------|-------------|-------------------|
| `PolicyCreationModal.tsx` | Modal interface for creating and editing policies | `onSubmit`, `onClose`, validation, rule management |
| `PolicyCard.tsx` | Card component for displaying policy information | `policy`, status indicators, action buttons |
| `PolicyTemplateDashboard.tsx` | Dashboard view for managing policy templates | Template CRUD, filtering, search |
| `PolicyList.tsx` | Table-based list view of policies | Filtering, sorting, pagination |
| `PolicyDetailsPanel.tsx` | Detailed view of a single policy | Rule listing, metadata, approvers |
| `PolicyExportDialog.tsx` | Dialog for exporting policy data | Format selection, export options |
| `PolicyVersionHistory.tsx` | Shows version history for a policy | Comparison, timestamp tracking |

#### Rule Implementation Components

| Component | Description | Key Props/Features |
|-----------|-------------|-------------------|
| `KYCVerificationRule.tsx` | UI for KYC verification rule configuration | Verification levels, requirements |
| `AMLSanctionsRule.tsx` | UI for AML & sanctions rule configuration | Sanctions lists, screening options |
| `AccreditedInvestorRule.tsx` | UI for accredited investor verification | Threshold configuration, documentation |
| `LockUpPeriodRule.tsx` | UI for configuring time-based lock-up periods | Duration settings, exemptions |
| `TransferLimitRule.tsx` | UI for transfer amount limitations | Amount config, currency selection |
| `VelocityLimitRule.tsx` | UI for time-based transaction volume limits | Time frames, maximum amounts |
| `WhitelistTransferRule.tsx` | UI for whitelist-based transfer controls | Address management, permissions |
| `RiskProfileRule.tsx` | UI for risk-based profiling rules | Risk level settings, thresholds |
| `TokenizedFundRule.tsx` | UI for fund tokenization rules | Fund type, investment limits |

#### Rule Management

| Component | Description | Key Props/Features |
|-----------|-------------|-------------------|
| `RuleBuilder.tsx` | Main interface for building custom rules | Rule type selection, field configuration |
| `RuleManagementDashboard.tsx` | Dashboard for managing all rules | CRUD operations, filtering, search |
| `RuleLogicCombiner.tsx` | Interface for combining rules with AND/OR logic | Logical operators, rule grouping |
| `RuleConflictDetector.tsx` | Detects and shows potential rule conflicts | Conflict highlighting, resolution |

#### Approval Workflow

| Component | Description | Key Props/Features |
|-----------|-------------|-------------------|
| `ApprovalWorkflow.tsx` | Workflow interface for policy approvals | Multi-step approval process |
| `ApprovalDashboard.tsx` | Dashboard for approval requests | Status tracking, filtering |
| `ApproverSelection.tsx` | Interface for selecting policy approvers | Role-based selection, hierarchy |
| `ApprovalNotifications.tsx` | Notification component for approval events | Status updates, alerts |

### Directory Structure

```
components/rules/
├── PolicyCreationModal.tsx       # Modal for creating policies
├── PolicyCard.tsx                # Card component for displaying policies
├── PolicyTemplateDashboard.tsx   # Dashboard for policy templates
├── PolicyTemplateList.tsx        # List view for policy templates
├── RuleManagementDashboard.tsx   # Dashboard for managing rules
├── KYCVerificationRule.tsx       # KYC rule configuration
├── AMLSanctionsRule.tsx          # AML/Sanctions rule configuration
├── ...                           # Other specific rule components
├── RuleBuilder.tsx               # Interface for building custom rules
├── ApprovalWorkflow.tsx          # Approval workflow interface
├── Stories/                      # Storybook stories for components
│   ├── ApprovalDashboardStory.tsx
│   ├── KYCVerificationRuleStory.tsx
│   └── ...
└── index.ts                      # Exports for all rule components
```

### Dependencies

- **UI Components**: @radix-ui/react-* components for UI elements
- **Forms**: react-hook-form for form handling
- **Hooks**: useRules, usePolicies for data management
- **Contexts**: Uses AuthProvider for user authentication

### Integration Points

- Interacts with policy and rule services for CRUD operations
- Uses centralized rule registry from @/config/ruleRegistry
- Implements constants from @/constants/policyTypes

---

## Configuration

The `@/config` directory contains configuration files that define global settings, registries, and configuration objects used throughout the application.

### Key Files

#### ruleRegistry.ts

A central registry for all rule configurations and metadata in the system.

**Key Features:**
- Defines `RuleTypeConfig` interface for rule type configuration
- Provides `ruleTypeRegistry` object containing all available rule types
- Implements utility functions for accessing and manipulating the registry

**Rule Types Defined:**

| Category | Rule Types |
|----------|------------|
| Transaction | transfer_limit, velocity_limit, whitelist_transfer |
| Compliance | kyc_verification, aml_sanctions, accredited_investor |
| Asset | lock_up_period, volume_supply_limit |
| Investor | investor_position_limit, investor_transaction_limit |
| Fund | tokenized_fund, standard_redemption, interval_fund_redemption |

**Utility Functions:**
- `getRuleTypeConfig(type)`: Get configuration for a specific rule type
- `getRuleTypesByCategory()`: Group rule types by category
- `getRuleTypeBadgeColor(type)`: Get the color for a rule type badge
- `getRuleTypeDisplayName(type)`: Get a user-friendly name for a rule type
- `getPriorityBadgeColor(priority)`: Get the color for a priority badge

**Integration Points:**
- Used by rule components to render appropriate UI
- Utilized by rule creation flows to validate configurations
- Referenced by policy management components

### Usage Example

```typescript
import { getRuleTypeConfig } from '@/config/ruleRegistry';

// Get configuration for a specific rule type
const ruleConfig = getRuleTypeConfig('transfer_limit');

// Access configuration properties
console.log(`Name: ${ruleConfig.name}`);
console.log(`Description: ${ruleConfig.description}`);
console.log(`Required fields: ${ruleConfig.fields.join(', ')}`);
```

---

## Constants

The `@/constants` directory contains constant definitions and enumerations used throughout the application to ensure consistent terminology and behavior.

### Key Files

#### policyTypes.ts

Defines standard policy-related constants and utility functions.

**Key Constants:**

| Constant | Description | Examples |
|----------|-------------|----------|
| `POLICY_TYPES` | Standard policy type identifiers | TRANSFER_LIMIT, KYC_VERIFICATION, LOCK_UP_PERIOD |
| `RULE_TYPES` | Categories for rules | TRANSACTION, WALLET, ASSET, USER |
| `POLICY_STATUS` | Possible policy statuses | ACTIVE, INACTIVE, DRAFT, PENDING |
| `JURISDICTIONS` | Standard jurisdictions | GLOBAL, US, EU, UK, ASIA_PACIFIC |
| `REVIEW_FREQUENCIES` | Policy review frequency options | MONTHLY, QUARTERLY, ANNUALLY |

**Helper Functions:**
- `getPolicyTypeName(type)`: Convert policy type code to human-readable name
- `getJurisdictionName(jurisdiction)`: Convert jurisdiction code to name
- `getReviewFrequencyName(frequency)`: Convert frequency code to name
- `getPoliciesForDashboard()`: Get policy types formatted for dashboard
- `getJurisdictionsForDashboard()`: Get jurisdictions formatted for dashboard
- `getReviewFrequenciesForDashboard()`: Get frequencies formatted for dashboard

**Usage Example:**

```typescript
import { POLICY_TYPES, getPolicyTypeName } from '@/constants/policyTypes';

// Using a constant
const policyType = POLICY_TYPES.TRANSFER_LIMIT;

// Using a helper function
const displayName = getPolicyTypeName(policyType); // Returns "Transfer Limit"

// For select components
const policyOptions = getPoliciesForDashboard();
```

---

## Context System

The Chain Capital application uses React Context for state management across components. Context providers are split between two directories that have now been merged conceptually: `@/context` and `@/contexts`.

### Key Context Providers

#### Authentication (AuthProvider.tsx)

**Location:** `@/contexts/AuthProvider.tsx`  
**Purpose:** Manages authentication state and user sessions

**Key Features:**
- Authentication state management (session, user, loading)
- Authentication methods (signIn, signOut)
- Integration with Supabase authentication
- Session persistence

**API:**
- `session`: Current user session
- `user`: Current authenticated user
- `signIn(email, password)`: Sign in with credentials
- `signOut()`: Sign out the current user
- `loading`: Authentication loading state

**Usage:**
```typescript
import { useAuth } from '@/contexts/AuthProvider';

function MyComponent() {
  const { user, signOut } = useAuth();
  
  return (
    <div>
      {user ? (
        <>
          <p>Welcome, {user.email}</p>
          <button onClick={signOut}>Sign Out</button>
        </>
      ) : (
        <p>Please sign in</p>
      )}
    </div>
  );
}
```

#### Wallet Management (WalletContext.tsx)

**Location:** `@/context/WalletContext.tsx`  
**Purpose:** Manages blockchain wallet interactions and state

**Key Features:**
- Wallet connection state
- Managing multiple wallet types (EOA, multisig)
- WebSocket integration for real-time updates
- Wallet creation, import, and selection

**API:**
- `wallets`: Array of available wallets
- `selectedWallet`: Currently selected wallet
- `createWallet(name, type, network)`: Create a new wallet
- `selectWallet(walletId)`: Select a wallet
- `importWallet(privateKey, name, network)`: Import an existing wallet
- `wsConnected`: WebSocket connection status

**Usage:**
```typescript
import { useWallet } from '@/context/WalletContext';

function WalletComponent() {
  const { wallets, selectedWallet, selectWallet } = useWallet();
  
  return (
    <div>
      <h2>Your Wallets</h2>
      {wallets.map(wallet => (
        <div 
          key={wallet.id}
          onClick={() => selectWallet(wallet.id)}
          className={selectedWallet?.id === wallet.id ? 'selected' : ''}
        >
          {wallet.name}: {wallet.address}
        </div>
      ))}
    </div>
  );
}
```

#### Web3 Integration (Web3Context.tsx)

**Location:** `@/context/Web3Context.tsx`  
**Purpose:** Provides blockchain/web3 functionality

**Key Features:**
- Wallet connection state
- Chain ID information
- Message signing
- Connection/disconnection logic

**API:**
- `account`: Connected account address
- `chainId`: Current blockchain network ID
- `connect()`: Connect to a wallet
- `disconnect()`: Disconnect the wallet
- `signMessage(message)`: Sign a message with connected wallet

#### Notifications (NotificationContext.tsx)

**Location:** `@/context/NotificationContext.tsx`  
**Purpose:** Manages application notifications

**Key Features:**
- Managing notification state
- Adding notifications with UUID generation
- Dismissing/marking notifications as read
- Local storage persistence
- Browser notification integration

**API:**
- `notifications`: Array of current notifications
- `addNotification(notification)`: Add a new notification
- `dismissNotification(id)`: Remove notification by ID
- `markAsRead(id)`: Mark notification as read
- `clearAll()`: Remove all notifications

### Integration Between Contexts

- `AuthProvider` wraps `PermissionsProvider` for role-based access control
- All contexts are typically provided near the root of the application
- Contexts can be consumed independently via their custom hooks

---

## Hooks

The `@/hooks` directory contains custom React hooks that encapsulate reusable logic for components.

### Key Hooks

#### useRules.ts

**Purpose:** Manages rule-related state and operations

**Key Functions:**
- `loadRules()`: Load all rules, optionally filtered by status
- `createNewRule(rule)`: Create a new rule
- `updateExistingRule(rule)`: Update an existing rule
- `deleteExistingRule(id)`: Delete a rule
- `loadTemplates(forceRefresh)`: Load all rule templates
- `createNewRuleTemplate(template)`: Create a new rule template
- `applyTemplate(templateId, customData)`: Apply a template to create a rule

**State:**
- `rules`: Array of rules
- `templates`: Array of rule templates
- `loading`: Loading state
- `error`: Error state

**Usage:**
```typescript
import { useRules } from '@/hooks/useRules';

function RulesComponent() {
  const { 
    rules, 
    loading, 
    createNewRule,
    deleteExistingRule 
  } = useRules();
  
  if (loading) return <p>Loading...</p>;
  
  return (
    <div>
      <h2>Rules ({rules.length})</h2>
      <ul>
        {rules.map(rule => (
          <li key={rule.id}>
            {rule.name}
            <button onClick={() => deleteExistingRule(rule.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

#### usePolicies.ts

**Purpose:** Manages policy-related state and operations

**Key Functions:**
- `loadPolicies()`: Load all policies
- `getById(id)`: Get a single policy by ID
- `savePolicy(policy)`: Create or update a policy
- `deletePolicy(id)`: Delete a policy

**State:**
- `policies`: Array of policies
- `loading`: Loading state
- `error`: Error state

**Usage:**
```typescript
import { usePolicies } from '@/hooks/usePolicies';

function PoliciesComponent() {
  const { 
    policies, 
    loading, 
    savePolicy,
    deletePolicy 
  } = usePolicies();
  
  if (loading) return <p>Loading...</p>;
  
  return (
    <div>
      <h2>Policies ({policies.length})</h2>
      <ul>
        {policies.map(policy => (
          <li key={policy.id}>
            {policy.name}
            <button onClick={() => deletePolicy(policy.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

#### usePolicyTemplates.ts

**Purpose:** Manages policy template state and operations

**Key Functions:**
- `loadTemplates()`: Load all policy templates
- `createTemplate(template)`: Create a new policy template
- `updateTemplate(template)`: Update an existing template
- `deleteTemplate(id)`: Delete a template
- `applyTemplate(templateId)`: Apply a template to create a policy

#### useApprovers.ts

**Purpose:** Handles policy approval workflow state

**Key Functions:**
- `loadApprovers()`: Load all available approvers
- `assignApprovers(policyId, approvers)`: Assign approvers to a policy
- `approvePolicy(policyId)`: Approve a policy
- `rejectPolicy(policyId, reason)`: Reject a policy
- `loadApprovalRequests()`: Load pending approval requests

#### useEnhancedRules.ts

**Purpose:** Provides extended rule management capabilities

**Key Functions:**
- `detectRuleConflicts(rules)`: Detect conflicts between rules
- `analyzeRuleImpact(rule)`: Analyze the impact of a rule
- `categorizeRules(rules)`: Group rules by category
- `validateRuleCompatibility(ruleA, ruleB)`: Check if rules are compatible

#### usePermissions.ts

**Purpose:** Manages user permissions and access control

**Key Functions:**
- `checkPermission(permission)`: Check if user has a specific permission
- `hasAccess(feature)`: Check if user has access to a feature
- `getUserRole()`: Get the current user's role
- `isAdmin()`: Check if user is an administrator

### Common Patterns

1. All hooks follow the naming convention `useXxx`
2. Most hooks implement loading, error, and data states
3. Debounce patterns are used to prevent duplicate API calls
4. Refs are used to track loading state and avoid race conditions
5. Callbacks are memoized to prevent unnecessary re-renders
6. Local state updates are optimistic for better UX
7. Each hook focuses on a specific domain or feature

### Dependencies

- React hooks (useState, useEffect, useCallback, useRef)
- Service functions from the `services` directory
- Context providers (AuthProvider, etc.)
- TypeScript types from the `types` directory

---

## Authentication and Permissions

The rules system integrates with the application's authentication and permissions system:

### Authentication

- Uses `@/contexts/AuthProvider` for user authentication
- Provides user context and session management
- Integrates with Supabase Auth

```typescript
import { useAuth } from '@/contexts/AuthProvider';

const MyComponent = () => {
  const { user } = useAuth();
  // ... component logic
};
```

### Permissions

- Role-based access control through PermissionsProvider
- Permission checks for rule management
- Integration with Supabase for permission storage

```typescript
import { usePermissions } from '@/hooks/usePermissions';

const MyComponent = () => {
  const { hasPermission } = usePermissions();
  // ... component logic
};
```

### Security Flow

1. AuthProvider manages user authentication
2. PermissionsProvider checks user roles and permissions
3. Rule components verify permissions before operations
4. All operations are validated on both client and server

---

## Bringing It All Together

The Chain Capital application architecture follows a well-structured pattern:

1. **Components** in `@/components/rules` provide the UI
2. **Hooks** in `@/hooks` manage state and business logic
3. **Contexts** in `@/context` and `@/contexts` provide global state
4. **Configuration** in `@/config` defines system-wide settings
5. **Constants** in `@/constants` ensure consistent terminology

This architecture allows for:

- **Separation of concerns**: UI is separate from business logic
- **Reusability**: Hooks and contexts can be used across components
- **Maintainability**: Each piece has a clear, focused responsibility
- **Scalability**: New features can be added following existing patterns