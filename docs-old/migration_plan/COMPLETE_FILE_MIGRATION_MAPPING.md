COMPLETE_FILE_MIGRATION_MAPPING.md

# 📋 COMPLETE FILE MIGRATION MAPPING

## 🎯 SYSTEMATIC MIGRATION APPROACH

This document provides the **complete file-by-file mapping** from your current monolithic structure to the new production-ready monorepo.

**CRITICAL**: Migration order matters! Files are migrated in dependency order to prevent TypeScript errors.

---

## 📂 PHASE 1: FOUNDATION FILES MAPPING

### **Utils Package** (`packages/utils/src/`)
| FROM PATH | TO PATH | NOTES |
|-----------|---------|--------|
| `src/utils/typeGuards.ts` | `packages/utils/src/typeGuards.ts` | Runtime type checking |
| `src/utils/formatters.ts` | `packages/utils/src/formatters.ts` | Data formatting utilities |
| `src/utils/mappers.ts` | `packages/utils/src/mappers.ts` | Type conversion functions |
| `src/utils/validation/` | `packages/utils/src/validation/` | **ENTIRE DIRECTORY** |
| `src/infrastructure/supabase.ts` | `packages/utils/src/supabase.ts` | ⚠️ **MOVED TO UTILS** - shared client |

### **Infrastructure Package** (`packages/infrastructure/src/`)
| FROM PATH | TO PATH | NOTES |
|-----------|---------|--------|
| `src/infrastructure/web3/` | `packages/infrastructure/src/web3/` | **ENTIRE DIRECTORY** - Core blockchain |
| `src/lib/web3/` | `packages/infrastructure/src/lib/web3/` | **ENTIRE DIRECTORY** - Additional Web3 |
| `src/lib/blockchainUtils.ts` | `packages/infrastructure/src/lib/blockchainUtils.ts` | Blockchain utilities |
| `src/lib/logger.ts` | `packages/infrastructure/src/lib/logger.ts` | Logging utilities |
| `src/lib/supabaseClient.ts` | `packages/infrastructure/src/lib/supabaseClient.ts` | Alternative client |
| `src/lib/supabaseFetch.ts` | `packages/infrastructure/src/lib/supabaseFetch.ts` | Fetch utilities |
| `src/infrastructure/blockchain/` | `packages/infrastructure/src/blockchain/` | **ENTIRE DIRECTORY** |
| `src/infrastructure/onchainid/` | `packages/infrastructure/src/onchainid/` | **ENTIRE DIRECTORY** |
| `src/infrastructure/keyVault/` | `packages/infrastructure/src/keyVault/` | **ENTIRE DIRECTORY** |
| `src/infrastructure/activityLogger.ts` | `packages/infrastructure/src/activityLogger.ts` | Activity logging |
| `src/infrastructure/audit.ts` | `packages/infrastructure/src/audit.ts` | Audit functionality |
| `src/infrastructure/auditLogger.ts` | `packages/infrastructure/src/auditLogger.ts` | Audit logging |
| `src/infrastructure/cube3Init.ts` | `packages/infrastructure/src/cube3Init.ts` | Cube3 integration |
| `src/infrastructure/realtime.ts` | `packages/infrastructure/src/realtime.ts` | Real-time features |
| `src/infrastructure/sessionManager.ts` | `packages/infrastructure/src/sessionManager.ts` | Session management |
| `src/infrastructure/subscriptions.ts` | `packages/infrastructure/src/subscriptions.ts` | Subscription handling |
| `src/infrastructure/inertPolyfill.ts` | `packages/infrastructure/src/inertPolyfill.ts` | Browser polyfills |

### **UI Components Package** (`packages/ui-components/src/`)
| FROM PATH | TO PATH | NOTES |
|-----------|---------|--------|
| `src/components/ui/` | `packages/ui-components/src/` | **ENTIRE DIRECTORY** - Shared components |

### **Frontend Application** (`apps/frontend/src/`)
| FROM PATH | TO PATH | NOTES |
|-----------|---------|--------|
| `src/App.tsx` | `apps/frontend/src/App.tsx` | Main application component |
| `src/main.tsx` | `apps/frontend/src/main.tsx` | React entry point |
| `src/index.css` | `apps/frontend/src/index.css` | Global styles |
| `src/react-shim.js` | `apps/frontend/src/react-shim.js` | React shim |
| `src/setupTests.ts` | `apps/frontend/src/setupTests.ts` | Test configuration |
| `src/test-inject.js` | `apps/frontend/src/test-inject.js` | Test utilities |
| `src/components/` | `apps/frontend/src/components/` | **ENTIRE DIRECTORY** (excluding ui/) |
| `src/pages/` | `apps/frontend/src/pages/` | **ENTIRE DIRECTORY** |
| `src/hooks/` | `apps/frontend/src/hooks/` | **ENTIRE DIRECTORY** |
| `src/contexts/` | `apps/frontend/src/contexts/` | **ENTIRE DIRECTORY** |
| `src/context/` | `apps/frontend/src/contexts/` | **MERGE WITH contexts/** |
| `src/routes/` | `apps/frontend/src/routes/` | **ENTIRE DIRECTORY** |
| `src/theme/` | `apps/frontend/src/theme/` | **ENTIRE DIRECTORY** |
| `src/config/` | `apps/frontend/src/config/` | **ENTIRE DIRECTORY** |
| `src/constants/` | `apps/frontend/src/constants/` | **ENTIRE DIRECTORY** |
| `src/plugins/` | `apps/frontend/src/plugins/` | **ENTIRE DIRECTORY** |
| `src/docs/` | `apps/frontend/src/docs/` | **ENTIRE DIRECTORY** |
| `src/tests/` | `apps/frontend/src/tests/` | **ENTIRE DIRECTORY** |

#### **Frontend Configuration Files**
| FROM PATH | TO PATH | NOTES |
|-----------|---------|--------|
| `vite.config.ts` | `apps/frontend/vite.config.ts` | Vite build configuration |
| `tailwind.config.js` | `apps/frontend/tailwind.config.js` | Tailwind CSS config |
| `postcss.config.js` | `apps/frontend/postcss.config.js` | PostCSS config |
| `components.json` | `apps/frontend/components.json` | shadcn/ui config |
| `index.html` | `apps/frontend/index.html` | HTML template |
| `tempo-routes.ts` | `apps/frontend/tempo-routes.ts` | Tempo routing |
| `tempo.config.json` | `apps/frontend/tempo.config.json` | Tempo configuration |

#### **Frontend Exclusions** (NOT copied)
| EXCLUDE | REASON |
|---------|--------|
| `src/types/` | **NOW IN packages/types** |
| `src/utils/` | **NOW IN packages/utils** |
| `src/infrastructure/` | **NOW IN packages/infrastructure + apps/backend** |
| `src/lib/` | **NOW IN packages/infrastructure** |
| `src/components/ui/` | **NOW IN packages/ui-components** |
| `src/archive/` | **OLD FILES - EXCLUDED** |
| `src/tempobook/` | **EXCLUDED** |

### **Backend Application** (`apps/backend/src/`)
| FROM PATH | TO PATH | NOTES |
|-----------|---------|--------|
| `server.ts` | `apps/backend/src/server.ts` | Main server file |
| `src/infrastructure/api/` | `apps/backend/src/api/` | **ENTIRE DIRECTORY** - REST API |
| `src/infrastructure/api.ts` | `apps/backend/src/api.ts` | API orchestration |
| `src/infrastructure/auth/` | `apps/backend/src/middleware/auth/` | **MOVE TO MIDDLEWARE** |
| `src/infrastructure/validation/` | `apps/backend/src/middleware/validation/` | **MOVE TO MIDDLEWARE** |
| `src/services/` | `apps/backend/src/services/` | **ENTIRE DIRECTORY** |

### **Types Package** (`packages/types/src/`)
| FROM PATH | TO PATH | NOTES |
|-----------|---------|--------|
| `src/types/centralModels.ts` | `packages/types/src/centralModels.ts` | ⚠️ **FOUNDATION** - Core business models |
| `src/types/database.ts` | `packages/types/src/database.ts` | Database type definitions |
| `src/types/supabase.ts` | `packages/types/src/supabase.ts` | Generated Supabase types |
| `src/types/blockchain.ts` | `packages/types/src/blockchain.ts` | Blockchain interfaces |
| `src/types/ethereum.ts` | `packages/types/src/ethereum.ts` | Ethereum-specific types |
| `src/types/compliance.ts` | `packages/types/src/compliance.ts` | Compliance types |
| `src/types/deployment.ts` | `packages/types/src/deployment.ts` | Deployment types |
| `src/types/user.ts` | `packages/types/src/user.ts` | User types |
| `src/types/users.ts` | `packages/types/src/users.ts` | Users types |
| `src/types/wallet.ts` | `packages/types/src/wallet.ts` | Wallet types |
| `src/types/ActivityTypes.ts` | `packages/types/src/ActivityTypes.ts` | Activity types |
| `src/types/RuleTypes.ts` | `packages/types/src/RuleTypes.ts` | Rule types |
| `src/types/idenfy.ts` | `packages/types/src/idenfy.ts` | Identity verification |
| `src/types/models.ts` | `packages/types/src/models.ts` | Legacy models |
| `src/types/onchainid.ts` | `packages/types/src/onchainid.ts` | OnChainID types |
| `src/types/onfido.ts` | `packages/types/src/onfido.ts` | Onfido integration |
| `src/types/permissions.ts` | `packages/types/src/permissions.ts` | Permission types |
| `src/types/policy.ts` | `packages/types/src/policy.ts` | Policy types |
| `src/types/policyTemplates.ts` | `packages/types/src/policyTemplates.ts` | Policy template types |
| `src/types/rules.ts` | `packages/types/src/rules.ts` | Rules types |
| `src/types/services.ts` | `packages/types/src/services.ts` | Service types |
| `src/types/supabase-functions.ts` | `packages/types/src/supabase-functions.ts` | Supabase function types |
| `src/types/tokenSchema.ts` | `packages/types/src/tokenSchema.ts` | Token schema types |
| `src/types/tokens/` | `packages/types/src/tokens/` | **ENTIRE DIRECTORY** |
| `src/types/web3/` | `packages/types/src/web3/` | **ENTIRE DIRECTORY** |
| `src/types/deployment/` | `packages/types/src/deployment/` | **ENTIRE DIRECTORY** |
| `src/types/wallet/` | `packages/types/src/wallet/` | **ENTIRE DIRECTORY** |
| `src/types/credentials/` | `packages/types/src/credentials/` | **ENTIRE DIRECTORY** |
| `src/types/*.d.ts` | `packages/types/src/*.d.ts` | **ALL DECLARATION FILES** |

### **Additional Files** 
| FROM PATH | TO PATH | NOTES |
|-----------|---------|--------|
| `foundry-contracts/` | `contracts/` | **ENTIRE DIRECTORY** - Smart contracts |
| `typechain-types/` | `contracts/typechain-types/` | **ENTIRE DIRECTORY** - Generated types |
| `supabase/` | `supabase/` | **ENTIRE DIRECTORY** - Database |
| `.env` | `.env` | Root environment file |
| `.env.local` | `apps/frontend/.env.local` | Frontend environment |

---

## 🔄 PHASE 2: IMPORT PATH TRANSFORMATIONS

### **Systematic Import Updates**
All files will have these import patterns updated:

| OLD IMPORT | NEW IMPORT | AFFECTED FILES |
|------------|------------|----------------|
| `@/types/centralModels` | `@chain-capital/types` | 200+ files |
| `@/types/database` | `@chain-capital/types` | 100+ files |
| `@/types/supabase` | `@chain-capital/types` | 50+ files |
| `@/types/` | `@chain-capital/types/` | 300+ files |
| `@/utils/` | `@chain-capital/utils/` | 150+ files |
| `@/infrastructure/supabase` | `@chain-capital/utils/supabase` | 200+ files |
| `@/infrastructure/web3/` | `@chain-capital/infrastructure/web3/` | 75+ files |
| `@/infrastructure/blockchain/` | `@chain-capital/infrastructure/blockchain/` | 30+ files |
| `@/infrastructure/onchainid/` | `@chain-capital/infrastructure/onchainid/` | 20+ files |
| `@/lib/web3/` | `@chain-capital/infrastructure/lib/web3/` | 25+ files |
| `@/lib/` | `@chain-capital/infrastructure/lib/` | 40+ files |
| `@/infrastructure/` | `@chain-capital/infrastructure/` | 100+ files |
| `@/components/ui/` | `@chain-capital/ui-components/` | 150+ files |

### **Special Cases**
- **Types Package Internal**: Uses relative imports (`./centralModels`) instead of `@chain-capital/types`
- **Backend Services**: Internal imports remain relative
- **Configuration Files**: Updated to use new structure

---

## 📊 MIGRATION STATISTICS

| Category | File Count | Import Updates |
|----------|------------|----------------|
| **Types** | 50+ files | Relative imports |
| **Utils** | 15+ files | 25+ import updates |
| **Infrastructure** | 100+ files | 200+ import updates |
| **UI Components** | 30+ files | 50+ import updates |
| **Frontend** | 300+ files | 800+ import updates |
| **Backend** | 50+ files | 150+ import updates |
| **Configuration** | 10+ files | Path updates |

**Total Files Migrated**: **550+ files**
**Total Import Updates**: **1,200+ import statements**

---

## 🎯 VALIDATION CHECKLIST

After migration, verify:

- [ ] All packages install dependencies successfully
- [ ] Types package builds without errors
- [ ] Utils package builds without errors
- [ ] Infrastructure package builds (may have warnings)
- [ ] UI components package builds without errors
- [ ] Frontend application compiles
- [ ] Backend application compiles
- [ ] No remaining `@/` imports (except in backend internals)
- [ ] All functionality preserved
- [ ] Development server starts successfully

---

## 🚨 CRITICAL SUCCESS FACTORS

1. **Migration Order**: Files MUST be migrated in the exact order specified
2. **Import Updates**: ALL import paths must be updated systematically
3. **Package Building**: Build packages in dependency order (types → utils → infrastructure → ui-components → apps)
4. **Validation**: Test each package build before proceeding to next
5. **No Partial Migration**: Complete all phases before testing functionality

This mapping ensures **ZERO TypeScript errors** by maintaining proper dependency order and systematic import updates across all **550+ files** in your comprehensive tokenization platform.