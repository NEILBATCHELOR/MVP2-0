# Chain Capital Production - Folder Structure Reorganization Plan

## **Executive Summary**

This reorganization consolidates scattered functionality into a clean, domain-based structure that mirrors the well-organized `services/` folder pattern. The goal is to eliminate duplication, improve maintainability, and establish consistent organization across the codebase.

## **Current Issues Addressed**

### **1. Folder Duplication**
- ❌ `context/` and `contexts/` (duplicate responsibility)
- ✅ Consolidated into domain-specific locations

### **2. Scattered Functionality**  
- ❌ Related files spread across multiple generic folders
- ✅ Grouped by business domain (auth, compliance, wallet, etc.)

### **3. Inconsistent Organization**
- ❌ Mix of domain-based and generic folder structures
- ✅ Uniform domain-based organization following services pattern

## **Reorganization Strategy**

### **Domain-Based Organization Pattern**
Following the successful `services/` folder structure:
```
services/
├── auth/
├── compliance/
├── wallet/
├── document/
├── project/
└── ...
```

Applied to all supporting folders:
```
infrastructure/, hooks/, utils/, config/
├── auth/
├── compliance/  
├── wallet/
├── document/
├── project/
├── shared/
└── ...
```

## **Phase-by-Phase Implementation**

### **Phase 1: Infrastructure Consolidation**
**Target:** Organize `infrastructure/`, `context/`, `contexts/` folders

**Actions:**
- ✅ Create domain-based infrastructure structure
- ✅ Move `context/WalletContext.tsx` → `infrastructure/wallet/`
- ✅ Move `context/Web3Context.tsx` → `infrastructure/wallet/`
- ✅ Move `context/NotificationContext.tsx` → `infrastructure/shared/`
- ✅ Move `contexts/AuthProvider.tsx` → `infrastructure/auth/`
- ✅ Organize blockchain/web3 under wallet domain
- ✅ Remove empty `context/` and `contexts/` folders

**Find/Replace Commands:**
```bash
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|@/context/WalletContext|@/infrastructure/wallet/WalletContext|g' {} +
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|@/contexts/AuthProvider|@/infrastructure/auth/AuthProvider|g' {} +
```

### **Phase 2: Hooks Organization**
**Target:** Organize `hooks/` folder by business domain

**Actions:**
- ✅ Create domain-based hook structure
- ✅ Move authentication hooks → `hooks/auth/`
- ✅ Move compliance hooks → `hooks/compliance/`
- ✅ Move document hooks → `hooks/document/`
- ✅ Move rule/policy hooks → `hooks/rule/`
- ✅ Move project hooks → `hooks/project/`
- ✅ Move wallet hooks → `hooks/wallet/`
- ✅ Move shared utility hooks → `hooks/shared/`

**Key Moves:**
- `useAuth.ts` → `hooks/auth/useAuth.ts`
- `useRules.ts` → `hooks/rule/useRules.ts`
- `usePrimaryProject.ts` → `hooks/project/usePrimaryProject.ts`
- `useToast.ts` → `hooks/shared/useToast.ts`

**Find/Replace Commands:**
```bash
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|@/hooks/useAuth|@/hooks/auth/useAuth|g' {} +
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|@/hooks/useRules|@/hooks/rule/useRules|g' {} +
```

### **Phase 3: Utils and Config Organization**
**Target:** Organize `utils/`, `config/`, `constants/` folders

**Actions:**
- ✅ Create domain-based utils structure  
- ✅ Move authentication utilities → `utils/auth/`
- ✅ Move compliance utilities → `utils/compliance/`
- ✅ Move wallet utilities → `utils/wallet/`
- ✅ Move shared utilities → `utils/shared/`
- ✅ Reorganize config by domain
- ✅ Consolidate constants into appropriate domains

**Key Moves:**
- `roleUtils.ts` → `utils/auth/roleUtils.ts`
- `countries.ts` → `utils/compliance/countries.ts`
- `crypto.ts` → `utils/wallet/crypto.ts`
- `csv.ts` → `utils/shared/formatting/csv.ts`
- `constants/roles.ts` → `utils/auth/constants.ts`

**Find/Replace Commands:**
```bash
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|@/utils/roleUtils|@/utils/auth/roleUtils|g' {} +
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|@/utils/countries|@/utils/compliance/countries|g' {} +
```

## **Final Folder Structure**

### **Before Reorganization:**
```
src/
├── config/
├── constants/
├── context/          # ❌ Duplicate
├── contexts/         # ❌ Duplicate  
├── hooks/            # ❌ Flat structure
├── infrastructure/   # ❌ Mixed organization
├── lib/
├── utils/            # ❌ Flat structure
└── ...
```

### **After Reorganization:**
```
src/
├── infrastructure/
│   ├── auth/
│   ├── compliance/
│   ├── wallet/
│   ├── document/
│   ├── project/
│   ├── shared/
│   └── index.ts
├── hooks/
│   ├── auth/
│   ├── compliance/
│   ├── wallet/
│   ├── document/
│   ├── project/
│   ├── rule/
│   ├── shared/
│   └── index.ts
├── utils/
│   ├── auth/
│   ├── compliance/
│   ├── wallet/
│   ├── shared/
│   └── index.ts
├── config/
│   ├── auth/
│   ├── wallet/
│   ├── rule/
│   ├── shared/
│   └── index.ts
└── ...
```

## **Benefits of Reorganization**

### **1. Consistency**
- ✅ All folders follow the same domain-based pattern
- ✅ Mirrors the successful services folder organization
- ✅ Predictable file locations

### **2. Maintainability**  
- ✅ Related functionality grouped together
- ✅ Easier to find and modify domain-specific code
- ✅ Clear separation of concerns

### **3. Scalability**
- ✅ Easy to add new domains
- ✅ Consistent pattern for new features
- ✅ Reduced coupling between domains

### **4. Developer Experience**
- ✅ Intuitive folder structure
- ✅ Faster navigation and discovery
- ✅ Cleaner import statements

## **Implementation Steps**

### **1. Run Organization Scripts**
```bash
# Make scripts executable
chmod +x scripts/organize-folders-phase*.sh
chmod +x scripts/update-import-paths.sh

# Execute in order
./scripts/organize-folders-phase1.sh
./scripts/organize-folders-phase2.sh  
./scripts/organize-folders-phase3.sh
./scripts/update-import-paths.sh
```

### **2. Create Index Files**
Each domain folder needs an `index.ts` file for clean exports:
```typescript
// hooks/auth/index.ts
export { useAuth } from './useAuth';
export { usePermissions } from './usePermissions';
```

### **3. Update Path Aliases**
Update `tsconfig.json` if needed to support new structure.

### **4. Validation**
- ✅ Run TypeScript compilation: `npm run type-check`
- ✅ Run tests: `npm test`
- ✅ Test application functionality

## **Risk Mitigation**

### **Backup Strategy**
- ✅ All scripts create backups before moving files
- ✅ Git commit before reorganization
- ✅ Incremental approach with validation

### **Rollback Plan**
- ✅ Git revert if issues occur
- ✅ Scripts can be reversed
- ✅ Import paths can be reverted

### **Testing Strategy**
- ✅ TypeScript compilation validation
- ✅ Unit test execution
- ✅ Manual application testing
- ✅ Import resolution verification

## **Success Metrics**

### **Immediate Outcomes**
- ✅ Zero duplicate folder names
- ✅ All files in domain-appropriate locations
- ✅ Consistent folder structure across src/
- ✅ All imports resolved correctly

### **Long-term Benefits**
- ✅ Faster feature development
- ✅ Easier onboarding for new developers
- ✅ Reduced maintenance overhead
- ✅ Improved code discoverability

---

**Next Steps:** Execute the reorganization scripts in order and validate the results through compilation and testing.
