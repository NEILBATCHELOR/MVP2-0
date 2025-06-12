# Infrastructure and Types Reorganization Plan

## Overview

This document outlines the comprehensive reorganization of `/src/infrastructure`, `/src/infrastructure/web3`, and `/src/types` directories to improve logical organization by function, remove duplication, and enhance maintainability.

## New Directory Structure

```
src/core/
├── auth/                   # Authentication & authorization
│   ├── providers/         # Auth providers (Supabase, OAuth, etc.)
│   ├── middleware/        # Auth middleware & guards
│   └── services/          # Auth services & utilities
├── blockchain/            # All blockchain/web3 functionality
│   ├── adapters/          # Blockchain network adapters
│   ├── wallets/           # Wallet management & connections
│   ├── tokens/            # Token standards & operations
│   ├── transactions/      # Transaction handling & monitoring
│   └── contracts/         # Smart contract interactions
├── compliance/            # Compliance & regulatory
│   ├── rules/             # Compliance rules & validation
│   ├── kyc/               # KYC/AML integration
│   └── reporting/         # Compliance reporting
├── data/                  # Database & data persistence
│   ├── supabase/          # Supabase client & config
│   ├── migrations/        # Database migrations
│   └── models/            # Data access models
├── integrations/          # Third-party integrations
│   ├── guardian/          # Guardian Medex API
│   ├── dfns/              # DFNS wallet services
│   ├── cube3/             # Cube3 security
│   └── onchainid/         # OnChain ID services
├── messaging/             # Notifications & messaging
│   ├── notifications/     # Push notifications
│   ├── emails/            # Email services
│   └── realtime/          # Real-time messaging
├── security/              # Encryption & key management
│   ├── encryption/        # Encryption utilities
│   ├── keyVault/          # Key vault management
│   └── signing/           # Digital signing
└── types/                 # All type definitions
    ├── database/          # Database-related types
    ├── domain/            # Business domain types
    └── api/               # API request/response types

src/shared/
├── components/            # Shared React components
├── hooks/                 # Shared React hooks
└── utils/                 # Shared utilities
```

## Phase 1: File Mapping and Movement

### 1. Authentication Files

**From:** `src/infrastructure/auth/`
**To:** `src/core/auth/providers/`

- `auth.ts` → `src/core/auth/services/authService.ts`
- `authClient.ts` → `src/core/auth/providers/supabaseAuth.ts`
- `AuthProvider.tsx` → `src/shared/components/AuthProvider.tsx`
- `index.ts` → `src/core/auth/index.ts`

### 2. Blockchain/Web3 Files

**From:** `src/infrastructure/web3/`
**To:** `src/core/blockchain/`

#### Adapters
- `adapters/*.ts` → `src/core/blockchain/adapters/`
- `BlockchainFactory.ts` → `src/core/blockchain/adapters/BlockchainFactory.ts`

#### Wallets
- `WalletManager.ts` → `src/core/blockchain/wallets/WalletManager.ts`
- `MultiSigWallet.ts` → `src/core/blockchain/wallets/MultiSigWallet.ts`
- `MultiSigWalletManager.ts` → `src/core/blockchain/wallets/MultiSigWalletManager.ts`
- `wallet/*.ts` → `src/core/blockchain/wallets/connectors/`

#### Tokens
- `tokens/*.ts` → `src/core/blockchain/tokens/`
- `TokenManager.ts` → `src/core/blockchain/tokens/TokenManager.ts`
- `TokenInterfaces.ts` → `src/core/blockchain/tokens/interfaces.ts`

#### Transactions
- `transactions/*.ts` → `src/core/blockchain/transactions/`
- `TransactionMonitor.ts` → `src/core/blockchain/transactions/TransactionMonitor.ts`

#### Contracts
- `contracts/` → `src/core/blockchain/contracts/`
- `factories/` → `src/core/blockchain/contracts/factories/`

#### Configuration & Services
- `config.ts` → `src/core/blockchain/config/networks.ts`
- `ProviderManager.ts` → `src/core/blockchain/providers/ProviderManager.ts`
- `services/*.ts` → `src/core/blockchain/services/`

### 3. Security & Key Management

**From:** `src/infrastructure/keyVault/`
**To:** `src/core/security/keyVault/`

- `keyVaultClient.ts` → `src/core/security/keyVault/keyVaultClient.ts`
- `keyVaultInterface.ts` → `src/core/security/keyVault/interfaces.ts`

**From:** `src/infrastructure/web3/signing/`
**To:** `src/core/security/signing/`

- `MessageSigner.ts` → `src/core/security/signing/MessageSigner.ts`

### 4. Third-Party Integrations

#### Guardian Integration
**From:** `src/infrastructure/guardian/`
**To:** `src/core/integrations/guardian/`

- All guardian files move to new location

#### DFNS Integration
**From:** `src/infrastructure/dfns/`
**To:** `src/core/integrations/dfns/`

- All dfns files move to new location

#### OnChain ID
**From:** `src/infrastructure/onchainid/`
**To:** `src/core/integrations/onchainid/`

- All onchainid files move to new location

### 5. Data & Database

**From:** `src/infrastructure/`
**To:** `src/core/data/supabase/`

- `supabase.ts` → `src/core/data/supabase/client.ts`
- `supabaseClient.ts` → `src/core/data/supabase/config.ts`

### 6. Messaging & Notifications

**From:** `src/infrastructure/`
**To:** `src/core/messaging/`

- `realtime.ts` → `src/core/messaging/realtime/realtimeService.ts`
- `subscriptions.ts` → `src/core/messaging/notifications/subscriptionService.ts`
- `shared/NotificationContext.tsx` → `src/shared/components/NotificationContext.tsx`

### 7. API & Validation

**From:** `src/infrastructure/api/`
**To:** `src/core/data/api/`

- All API files move to data layer as they handle data operations

**From:** `src/infrastructure/validation/`
**To:** `src/shared/utils/validation/`

### 8. Types Reorganization

#### Core Types (keep centralized)
**From:** `src/types/centralModels.ts`
**To:** `src/core/types/domain/models.ts`

**From:** `src/types/database.ts`
**To:** `src/core/types/database/tables.ts`

**From:** `src/types/supabase.ts`
**To:** `src/core/types/database/supabase.ts`

#### Domain-specific Types
**From:** `src/types/`
**To:** `src/core/types/domain/`

- `blockchain.ts` → `src/core/types/domain/blockchain.ts`
- `compliance.ts` → `src/core/types/domain/compliance.ts`
- `wallet.ts` → `src/core/types/domain/wallet.ts`
- `user.ts` → `src/core/types/domain/user.ts`
- `permissions.ts` → `src/core/types/domain/permissions.ts`
- `policy.ts` → `src/core/types/domain/policy.ts`

#### Integration Types
**From:** `src/types/guardian/`
**To:** `src/core/types/api/guardian.ts`

**From:** `src/types/dfns/`
**To:** `src/core/types/api/dfns.ts`

#### Token Types
**From:** `src/types/tokens/`
**To:** `src/core/types/domain/tokens.ts`

**From:** `src/types/deployment/`
**To:** `src/core/types/domain/deployment.ts`

## Phase 2: Find and Replace Operations

### Update Import Statements

#### 1. Authentication Imports
```bash
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|@/infrastructure/auth|@/core/auth|g' {} +
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|../infrastructure/auth|../core/auth|g' {} +
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|../../infrastructure/auth|../../core/auth|g' {} +
```

#### 2. Blockchain/Web3 Imports
```bash
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|@/infrastructure/web3|@/core/blockchain|g' {} +
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|../infrastructure/web3|../core/blockchain|g' {} +
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|../../infrastructure/web3|../../core/blockchain|g' {} +
```

#### 3. Security/KeyVault Imports
```bash
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|@/infrastructure/keyVault|@/core/security/keyVault|g' {} +
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|../infrastructure/keyVault|../core/security/keyVault|g' {} +
```

#### 4. Integration Imports
```bash
# Guardian
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|@/infrastructure/guardian|@/core/integrations/guardian|g' {} +

# DFNS
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|@/infrastructure/dfns|@/core/integrations/dfns|g' {} +

# OnChain ID
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|@/infrastructure/onchainid|@/core/integrations/onchainid|g' {} +
```

#### 5. Data/Supabase Imports
```bash
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|@/infrastructure/supabase|@/core/data/supabase|g' {} +
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|../infrastructure/supabase|../core/data/supabase|g' {} +
```

#### 6. Types Imports
```bash
# Core types
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|@/types/centralModels|@/core/types/domain/models|g' {} +
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|@/types/database|@/core/types/database/tables|g' {} +
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|@/types/supabase|@/core/types/database/supabase|g' {} +

# Domain types
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|@/types/blockchain|@/core/types/domain/blockchain|g' {} +
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|@/types/compliance|@/core/types/domain/compliance|g' {} +
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|@/types/wallet|@/core/types/domain/wallet|g' {} +

# Integration types
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|@/types/guardian|@/core/types/api/guardian|g' {} +
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|@/types/dfns|@/core/types/api/dfns|g' {} +
```

#### 7. Shared Components and Utils
```bash
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|@/infrastructure/shared|@/shared|g' {} +
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|@/infrastructure/validation|@/shared/utils/validation|g' {} +
```

### Update Path Mappings in tsconfig.json

```json
{
  "compilerOptions": {
    "paths": {
      "@/core/*": ["./src/core/*"],
      "@/shared/*": ["./src/shared/*"],
      "@/components/*": ["./src/components/*"],
      "@/pages/*": ["./src/pages/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/services/*": ["./src/services/*"],
      "@/utils/*": ["./src/utils/*"]
    }
  }
}
```

## Phase 3: Create Index Files

### Core Index Files

#### `src/core/index.ts`
```typescript
export * from './auth';
export * from './blockchain';
export * from './compliance';
export * from './data';
export * from './integrations';
export * from './messaging';
export * from './security';
export * from './types';
```

#### `src/core/auth/index.ts`
```typescript
export * from './providers';
export * from './services';
export * from './middleware';
```

#### `src/core/blockchain/index.ts`
```typescript
export * from './adapters';
export * from './wallets';
export * from './tokens';
export * from './transactions';
export * from './contracts';
export * from './providers';
export * from './config';
```

#### `src/core/types/index.ts`
```typescript
export * from './domain';
export * from './database';
export * from './api';
```

### Shared Index Files

#### `src/shared/index.ts`
```typescript
export * from './components';
export * from './hooks';
export * from './utils';
```

## Phase 4: Cleanup and Validation

### Remove Empty Directories
```bash
find src/infrastructure -type d -empty -delete
find src/types -type d -empty -delete
```

### Validate TypeScript Compilation
```bash
npm run type-check
npm run build
```

### Update Documentation
- Update README files in each new directory
- Update import examples in documentation
- Update component usage guides

## Benefits of New Structure

1. **Logical Organization**: Files grouped by business domain rather than technical layers
2. **Reduced Coupling**: Clear separation of concerns between core and shared functionality
3. **Improved Discoverability**: Easier to find related functionality
4. **Better Scalability**: Clear places to add new features
5. **Enhanced Maintainability**: Reduced cross-dependencies and circular imports
6. **Type Safety**: Better organization of type definitions
7. **Consistent Patterns**: Standardized structure across all domains

## Migration Checklist

- [ ] Phase 1: Create new directory structure
- [ ] Phase 2: Move files to new locations
- [ ] Phase 3: Execute find/replace operations
- [ ] Phase 4: Create index files
- [ ] Phase 5: Update tsconfig.json path mappings
- [ ] Phase 6: Validate TypeScript compilation
- [ ] Phase 7: Update tests and documentation
- [ ] Phase 8: Clean up empty directories
- [ ] Phase 9: Final validation and testing

## Rollback Plan

If issues arise during migration:
1. Revert git changes
2. Restore original directory structure
3. Re-apply path mappings
4. Validate compilation

This reorganization maintains all existing functionality while providing a much more logical and maintainable structure for future development.
