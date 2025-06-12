# Infrastructure and Types Reorganization Guide

## Overview

This document outlines the comprehensive reorganization of the `src/infrastructure` and `src/types` folders following domain-driven design principles. The reorganization improves maintainability, reduces duplication, and establishes clear boundaries between different concerns.

## Table of Contents

1. [Before and After Structure](#before-and-after-structure)
2. [Migration Process](#migration-process)
3. [Key Changes](#key-changes)
4. [Import Path Updates](#import-path-updates)
5. [Running the Reorganization](#running-the-reorganization)
6. [Verification](#verification)
7. [Next Steps](#next-steps)
8. [Troubleshooting](#troubleshooting)

## Before and After Structure

### Before (Current Structure)
```
src/
├── infrastructure/
│   ├── auth.ts
│   ├── supabase.ts
│   ├── supabaseClient.ts
│   ├── wallet/
│   ├── web3/
│   │   ├── adapters/
│   │   ├── services/
│   │   └── [40+ files]
│   ├── compliance/
│   ├── document/
│   ├── project/
│   ├── shared/
│   └── [scattered files]
├── types/
│   ├── centralModels.ts
│   ├── database.ts
│   ├── supabase.ts
│   ├── blockchain.ts
│   ├── user.ts
│   ├── wallet.ts
│   └── [50+ type files]
```

### After (New Structure)
```
src/
├── infrastructure/
│   ├── index.ts
│   ├── database/
│   │   ├── index.ts
│   │   ├── client.ts
│   │   ├── queries/
│   │   └── migrations/
│   ├── auth/
│   │   ├── index.ts
│   │   ├── providers/
│   │   └── guards/
│   ├── blockchain/
│   │   ├── index.ts
│   │   ├── adapters/
│   │   ├── managers/
│   │   └── web3/
│   ├── services/
│   │   ├── index.ts
│   │   ├── user/
│   │   ├── investor/
│   │   ├── project/
│   │   ├── token/
│   │   ├── wallet/
│   │   ├── compliance/
│   │   └── notification/
│   ├── api/
│   │   ├── index.ts
│   │   ├── external/
│   │   └── internal/
│   ├── utils/
│   │   ├── index.ts
│   │   ├── config/
│   │   ├── helpers/
│   │   └── validation/
│   └── legacy/
├── types/
│   ├── index.ts
│   ├── core/
│   │   ├── index.ts
│   │   ├── database.ts (moved)
│   │   └── supabase.ts (moved)
│   ├── domain/
│   │   ├── index.ts
│   │   ├── user/
│   │   │   ├── index.ts
│   │   │   ├── types.ts
│   │   │   ├── mappers.ts
│   │   │   └── validation.ts
│   │   ├── investor/
│   │   ├── project/
│   │   ├── token/
│   │   ├── wallet/
│   │   ├── transaction/
│   │   ├── notification/
│   │   └── compliance/
│   ├── shared/
│   │   ├── index.ts
│   │   ├── api.ts
│   │   ├── common.ts
│   │   ├── forms.ts
│   │   └── validation.ts
│   └── legacy/
│       └── centralModels.ts (moved)
```

## Migration Process

The reorganization follows a 5-phase approach:

### Phase 1: Backup and Analysis
- Creates comprehensive backup of current structure
- Analyzes file dependencies and import patterns
- Generates detailed reports on current state

### Phase 2: Create New Structure
- Creates new directory hierarchy
- Sets up index files for clean exports
- Establishes shared type foundations

### Phase 3: File Migration
- Moves files to appropriate domain locations
- Organizes by functional responsibility
- Preserves original files in legacy folders during transition

### Phase 4: Update Imports
- Updates all import statements using systematic find/replace
- Converts relative paths to absolute path aliases
- Records all changes for audit trail

### Phase 5: Verification
- Tests TypeScript compilation
- Verifies import path correctness
- Generates final health report

## Key Changes

### Type System Architecture

#### 1. Core Types (`src/types/core/`)
- **database.ts**: Database table definitions (snake_case)
- **supabase.ts**: Generated Supabase types
- Purpose: Foundation types from external sources

#### 2. Domain Types (`src/types/domain/`)
- **Business logic types** organized by domain
- **camelCase** naming for frontend consumption
- **Type mappers** for DB ↔ Domain conversion
- **Validation schemas** for each domain

#### 3. Shared Types (`src/types/shared/`)
- **API response types**
- **Common utility types**
- **Form and validation interfaces**
- **Reusable across all domains**

### Infrastructure Organization

#### 1. Database Layer (`src/infrastructure/database/`)
- **client.ts**: Supabase client configuration
- **queries/**: Organized database queries
- **migrations/**: Database migration utilities

#### 2. Authentication (`src/infrastructure/auth/`)
- **providers/**: Auth provider implementations
- **guards/**: Route protection logic
- **middleware/**: Auth middleware

#### 3. Blockchain (`src/infrastructure/blockchain/`)
- **adapters/**: Blockchain-specific adapters
- **managers/**: High-level blockchain managers
- **web3/**: Web3 utilities and configurations

#### 4. Services (`src/infrastructure/services/`)
- **Domain-specific business logic**
- **User, investor, project, token services**
- **Clean separation of concerns**

## Import Path Updates

### Find/Replace Commands Used

```bash
# Core Types
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|@/types/database|@/types/core/database|g' {} +
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|@/types/supabase|@/types/core/supabase|g' {} +
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|@/types/centralModels|@/types/legacy/centralModels|g' {} +

# Infrastructure
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|@/infrastructure/supabase|@/infrastructure/database/client|g' {} +
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|@/infrastructure/web3/|@/infrastructure/blockchain/web3/|g' {} +
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|@/infrastructure/wallet|@/infrastructure/services/wallet|g' {} +

# Utilities
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|@/utils/typeGuards|@/infrastructure/utils/validation/type-guards|g' {} +
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|@/utils/typeMappers|@/types/domain|g' {} +
```

### New Import Patterns

#### Before
```typescript
// Old imports
import type { User } from '@/types/centralModels';
import type { Database } from '@/types/database';
import { supabase } from '@/infrastructure/supabase';
import { WalletManager } from '@/infrastructure/web3/WalletManager';
```

#### After
```typescript
// New imports
import type { User } from '@/types/domain/user';
import type { Database } from '@/types/core/database';
import { supabase } from '@/infrastructure/database/client';
import { WalletManager } from '@/infrastructure/blockchain/web3/WalletManager';
```

## Running the Reorganization

### Prerequisites
1. **Backup your code**: Commit all changes to git
2. **Review the plan**: Understand the changes being made
3. **Test environment**: Ensure you can run TypeScript compilation

### Quick Start
```bash
# Run the complete reorganization
./scripts/reorganization/run-complete-reorganization.sh
```

### Step-by-Step
```bash
# 1. Backup and analyze
./scripts/reorganization/01-backup-and-analysis.sh

# 2. Create new structure
./scripts/reorganization/02-create-new-structure.sh

# 3. Migrate files
./scripts/reorganization/03-migrate-files.sh

# 4. Update imports
./scripts/reorganization/04-update-imports.sh

# 5. Verify changes
./scripts/reorganization/05-verify-changes.sh
```

## Verification

After running the reorganization, verify the changes:

### 1. TypeScript Compilation
```bash
npx tsc --noEmit --skipLibCheck
```

### 2. Development Server
```bash
npm run dev
# or
pnpm dev
```

### 3. Test Suite
```bash
npm run test
# or
pnpm test
```

### 4. Check Reports
- **Backup location**: `backups/reorganization-YYYYMMDD_HHMMSS/`
- **Analysis reports**: `reports/reorganization/`
- **Verification report**: `reports/reorganization/verification-report.txt`

## Next Steps

### Immediate (Post-Reorganization)
1. ✅ **Fix any TypeScript errors** reported in verification
2. ✅ **Test critical application flows**
3. ✅ **Update team documentation**
4. ✅ **Commit the reorganized structure**

### Short Term (1-2 weeks)
1. **Migrate legacy imports**: Replace `@/types/legacy/centralModels` with domain-specific types
2. **Create domain type mappers**: Complete the user, investor, project type mappers
3. **Add validation schemas**: Implement validation for each domain
4. **Update service layers**: Align services with new structure

### Long Term (1 month)
1. **Remove legacy files**: Once all imports are migrated
2. **Add comprehensive type guards**: Runtime type checking
3. **Document type conventions**: Team guidelines
4. **Create automated checks**: Prevent architecture violations

## Troubleshooting

### Common Issues

#### TypeScript Compilation Errors
```typescript
// Problem: Import not found
import { User } from '@/types/user';

// Solution: Use domain-specific import
import { User } from '@/types/domain/user';
```

#### Missing Type Definitions
```typescript
// Problem: Type not found in new location
import { SomeType } from '@/types/old-location';

// Solution: Check legacy imports first
import { SomeType } from '@/types/legacy/centralModels';
// Then create domain-specific type
```

#### Circular Dependencies
- Check import chain in verification report
- Use type-only imports where possible: `import type { ... }`
- Move shared types to `@/types/shared/`

### Recovery Process

If issues arise, you can restore from backup:

```bash
# Find your backup
ls backups/reorganization-*

# Restore infrastructure
rm -rf src/infrastructure
cp -r backups/reorganization-YYYYMMDD_HHMMSS/infrastructure-original src/infrastructure

# Restore types
rm -rf src/types
cp -r backups/reorganization-YYYYMMDD_HHMMSS/types-original src/types
```

## Benefits Achieved

### 1. Maintainability
- **Clear separation of concerns**
- **Domain-driven organization**
- **Predictable file locations**

### 2. Type Safety
- **Proper type conversion between layers**
- **Consistent naming conventions**
- **Domain-specific validation**

### 3. Developer Experience
- **Better IDE autocomplete**
- **Faster file navigation**
- **Clear import patterns**

### 4. Scalability
- **Easy to add new domains**
- **Consistent structure patterns**
- **Reduced cognitive overhead**

## Team Guidelines

### Adding New Types
1. **Determine domain**: User, investor, project, etc.
2. **Create in appropriate domain folder**: `src/types/domain/[domain]/`
3. **Follow naming conventions**: camelCase for domain, snake_case for DB
4. **Add type mappers**: DB ↔ Domain conversion
5. **Update index files**: Export new types

### Adding New Infrastructure
1. **Identify category**: Database, auth, blockchain, services, utils
2. **Place in appropriate folder**: `src/infrastructure/[category]/`
3. **Follow service patterns**: Domain-specific services
4. **Update index files**: Export new functionality
5. **Add tests**: Unit tests for new services

### Import Best Practices
- **Use absolute paths**: `@/types/...` not `../types/...`
- **Import from index files**: `@/types/domain/user` not `@/types/domain/user/types`
- **Use type imports**: `import type { ... }` for types only
- **Avoid deep imports**: Use provided index files

## Support

If you encounter issues or need clarification:

1. **Check verification report**: `reports/reorganization/verification-report.txt`
2. **Review backup files**: Available in `backups/` directory
3. **Consult this documentation**: Reference import patterns and structure
4. **Check TypeScript errors**: Use IDE or `npx tsc --noEmit`

---

*This reorganization establishes a solid foundation for scalable, maintainable code following industry best practices.*
