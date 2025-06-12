# Utils Organization Pattern - Shared vs Domain-Specific

## Consistent Pattern Established

After removing duplicate folders, we now have a clear, consistent pattern for organizing utilities:

## 📁 Current Structure

```
src/utils/
├── auth/                    # 🎯 Domain-specific (Auth only)
│   ├── constants.ts
│   ├── roleNormalizer.ts
│   └── roleUtils.ts
├── compliance/              # 🎯 Domain-specific (Compliance only)
│   ├── constants/
│   ├── countries.ts
│   ├── investorTypes.ts
│   └── kyc.ts
├── wallet/                  # 🎯 Domain-specific (Wallet only)
│   ├── blockchain.ts
│   ├── crypto.ts
│   └── web3/
├── shared/                  # 🌐 Cross-domain (Used everywhere)
│   ├── formatting/          # ✅ Database mappers, formatters, export
│   │   ├── typeMappers.ts   # DB ↔ Model conversions
│   │   ├── formatters.ts    # Date, currency, address formatting
│   │   ├── exportUtils.ts   # CSV, Excel, PDF export
│   │   ├── uuidUtils.ts     # UUID generation
│   │   └── workflowMappers.ts
│   ├── logging/             # ✅ Activity logging, system logging
│   │   ├── activityLogger.ts
│   │   ├── contextLogger.ts
│   │   └── systemActivityLogger.ts
│   ├── utils.ts             # Common utilities (cn function)
│   └── ...
└── index.ts                 # Main exports
```

## 🎯 Decision Rules

### Use `shared/` when utilities are:
- **Cross-domain**: Used by multiple domains (auth, compliance, wallet, etc.)
- **Foundation-level**: Core functionality needed everywhere
- **Framework-level**: Database mapping, logging, formatting

**Examples:**
- `typeMappers.ts` → Used by auth, compliance, wallet services
- `activityLogger.ts` → Used by all domains for audit trails  
- `formatters.ts` → Used by all UI components for display
- `exportUtils.ts` → Used by all domains for data export

### Use `domain/` when utilities are:
- **Domain-specific**: Only used within one domain
- **Business-logic**: Specific to domain rules/requirements
- **Isolated**: No dependencies on other domains

**Examples:**
- `roleUtils.ts` → Only used by auth domain
- `countries.ts` → Only used by compliance domain
- `blockchain.ts` → Only used by wallet domain

## 📋 Import Path Standards

### ✅ Correct Import Patterns
```typescript
// Cross-domain utilities (used everywhere)
import { toCamelCase } from '@/utils/shared/formatting/typeMappers';
import { logUserActivity } from '@/utils/shared/logging/activityLogger';
import { formatCurrency } from '@/utils/shared/formatting/formatters';
import { downloadCsv } from '@/utils/shared/formatting/exportUtils';

// Domain-specific utilities  
import { getAllRoles } from '@/utils/auth/roleUtils';
import { getCountryByCode } from '@/utils/compliance/countries';
import { generateWalletAddress } from '@/utils/wallet/crypto';

// Common framework utilities
import { cn } from '@/lib/utils';
```

### ❌ Wrong Import Patterns
```typescript
// DON'T create these paths (removed duplicates)
import { } from '@/utils/formatting/typeMappers';    // ❌ Removed
import { } from '@/utils/logging/activityLogger';    // ❌ Removed

// DON'T use relative paths
import { } from '../../utils/shared/formatting/';    // ❌ Use @/ alias
```

## 🔄 Migration Applied

### Files Removed (Duplicates)
- ❌ `src/utils/formatting/` → Use `src/utils/shared/formatting/`
- ❌ `src/utils/logging/` → Use `src/utils/shared/logging/`

### Import Paths Updated
All references now point to the existing shared structure:
- `@/utils/formatting/typeMappers` → `@/utils/shared/formatting/typeMappers`
- `@/utils/logging/activityLogger` → `@/utils/shared/logging/activityLogger`
- `@/utils/formatting/exportUtils` → `@/utils/shared/formatting/exportUtils`

## 🎯 Benefits of This Pattern

### 1. **No Duplication**
- Single source of truth for each utility
- Eliminates maintenance overhead
- Prevents version conflicts

### 2. **Clear Intent**
- `shared/` = Used across domains
- `domain/` = Domain-specific logic
- Easy to understand file purpose

### 3. **Scalable Architecture**
- New domains follow same pattern
- Shared utilities remain centralized
- Domain utilities stay isolated

### 4. **Import Clarity**
- Path indicates scope of utility
- `@/utils/shared/` = Cross-domain
- `@/utils/[domain]/` = Domain-specific

## 🚀 Future Development Guidelines

### Adding New Utilities

**Ask yourself:**
1. "Will this be used by multiple domains?" → `shared/`
2. "Is this specific to one domain?" → `domain/`
3. "Is this a framework concern?" → `shared/`

**Examples:**
```typescript
// Multi-domain utility → shared/
function validateEmail(email: string) { /* used everywhere */ }
// Location: @/utils/shared/validation/emailUtils.ts

// Domain-specific utility → domain folder
function calculateComplianceScore(investor: Investor) { /* compliance only */ }
// Location: @/utils/compliance/scoring.ts

// Framework utility → shared/
function debounce(fn: Function, delay: number) { /* used everywhere */ }
// Location: @/utils/shared/performance.ts
```

## ✅ Verification

To verify the pattern is working:

```bash
# Should find files in shared locations
ls src/utils/shared/formatting/
ls src/utils/shared/logging/

# Should NOT find these (removed duplicates)
ls src/utils/formatting/     # Should not exist
ls src/utils/logging/        # Should not exist

# Domain-specific folders should exist
ls src/utils/auth/
ls src/utils/compliance/
ls src/utils/wallet/
```

This pattern ensures consistency, eliminates duplication, and provides clear guidelines for all future development.
