# Phase 1 Task 1.1: Create Domain Directory Structure - Detailed Implementation Guide

## Task Overview
**Goal:** Create feature-based domain directories following Coding Best Practice guidelines without breaking existing functionality.
**Priority:** High  
**Risk Level:** Low (additive changes only)
**Estimated Time:** 1-2 days
**Dependencies:** None

## Current Status Analysis
- ✅ **Analysis Phase Complete** - Architecture transition plan documented
- ✅ **Current State Mapped** - 35KB centralModels.ts identified, 10+ domains mapped
- ✅ **Dependency Analysis Ready** - Scripts created for systematic analysis
- 🔄 **Ready to Begin** - Phase 1 Task 1.1 implementation

## Detailed Implementation Steps

### Step 1: Run Dependency Analysis (30 minutes)

Before creating any new structure, run the dependency analysis to understand current state:

```bash
# Navigate to Chain Capital Production project
cd "/Users/neilbatchelor/Cursor/Chain Capital Production"

# Run dependency analysis on the main project
node scripts/analyze-dependencies.mjs "/Users/neilbatchelor/Cursor/Chain Capital"

# Review generated reports
ls -la reports/
cat reports/migration-plan-*.md
```

**Expected Output:**
- Dependency analysis report in `reports/`
- Domain analysis showing file counts and dependencies
- Migration order recommendation
- Circular dependency detection

### Step 2: Create Feature-Based Directory Structure (2 hours)

Create the new domain structure alongside existing structure (no breaking changes):

#### 2.1: Create Root Features Directory
```bash
cd "/Users/neilbatchelor/Cursor/Chain Capital"
mkdir -p src/features
```

#### 2.2: Create Domain Directories with Standard Subdirectories
Based on the identified domains from analysis, create each domain with consistent subdirectory patterns:

```bash
# Create all domain directories with standard structure
for domain in auth investors projects tokens captable compliance documents wallet redemption reporting; do
  mkdir -p src/features/$domain/{components,hooks,services,types,utils,validation,mappers}
done
```

**Resulting Structure:**
```
src/features/
├── auth/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   ├── types/
│   ├── utils/
│   ├── validation/
│   └── mappers/
├── investors/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   ├── types/
│   ├── utils/
│   ├── validation/
│   └── mappers/
[... continue for all domains]
```

#### 2.3: Create Index Files for Organized Exports
Create index.ts files in each domain and subdirectory for organized exports:

**Example: src/features/auth/index.ts**
```typescript
// Auth Domain - Main Export File
// Re-exports all auth domain functionality

// Components
export * from './components';

// Hooks  
export * from './hooks';

// Services
export * from './services';

// Types
export * from './types';

// Utils
export * from './utils';

// Validation
export * from './validation';

// Mappers
export * from './mappers';
```

**Example: src/features/auth/types/index.ts**
```typescript
// Auth Types - Export File
// Export all authentication-related types

// Main types will be created in Task 1.3
// For now, create placeholder structure

// export * from './authTypes';
// export * from './sessionTypes';
// export * from './permissionTypes';

// Placeholder export to prevent empty file errors
export const AUTH_DOMAIN = 'auth' as const;
```

**Create all index files:**
```bash
# Create main domain index files
for domain in auth investors projects tokens captable compliance documents wallet redemption reporting; do
  cat > src/features/$domain/index.ts << 'EOF'
// [DOMAIN] Domain - Main Export File
// Re-exports all domain functionality

// Components
export * from './components';

// Hooks  
export * from './hooks';

// Services
export * from './services';

// Types
export * from './types';

// Utils
export * from './utils';

// Validation
export * from './validation';

// Mappers
export * from './mappers';
EOF
done

# Create subdirectory index files
for domain in auth investors projects tokens captable compliance documents wallet redemption reporting; do
  for subdir in components hooks services types utils validation mappers; do
    cat > src/features/$domain/$subdir/index.ts << EOF
// ${domain^} ${subdir^} - Export File
// Export all ${domain} ${subdir}

// Placeholder export to prevent empty file errors
export const ${domain^^}_${subdir^^}_DOMAIN = '${domain}-${subdir}' as const;
EOF
  done
done
```

#### 2.4: Create Domain README Files (1 hour)
Create README.md for each domain documenting boundaries and responsibilities:

**Example: src/features/auth/README.md**
```markdown
# Authentication Domain

## Responsibility
Handles user authentication, session management, authorization, and MFA.

## Scope
- User login/logout
- Session management  
- Permission checking
- Multi-factor authentication
- Password management
- Token refresh

## Key Exports
- `AuthUser` - User authentication data
- `useAuth()` - Authentication hook
- `AuthService` - Authentication service
- `AuthGuard` - Route protection component

## Dependencies
- **None** (foundational domain)

## External Interfaces
This domain provides authentication context for other domains but does not depend on any other domains.

## Usage Example
```typescript
import { useAuth, AuthUser, AuthGuard } from '@/features/auth';

const { user, signIn, signOut, isAuthenticated } = useAuth();
```

## Migration Status
- [ ] Types extracted from centralModels.ts
- [ ] Components moved from src/components/auth/
- [ ] Services moved from src/services/auth/
- [ ] Hooks created for domain functionality
- [ ] Validation schemas implemented
```

**Create all README files:**
```bash
# Auth domain README (foundational)
cat > src/features/auth/README.md << 'EOF'
# Authentication Domain

## Responsibility  
Handles user authentication, session management, authorization, and MFA.

## Dependencies
- **None** (foundational domain)

## Status
- [ ] Structure created
- [ ] Types to be extracted
- [ ] Components to be moved
- [ ] Services to be moved
EOF

# Investors domain README  
cat > src/features/investors/README.md << 'EOF'
# Investor Management Domain

## Responsibility
Investor profiles, KYC status, onboarding, accreditation verification, risk assessment.

## Dependencies  
- Auth (user context, permissions)

## Status
- [ ] Structure created
- [ ] Types to be extracted  
- [ ] Components to be moved
- [ ] Services to be moved
EOF

# Continue for all other domains...
```

### Step 3: Create Shared Infrastructure (1 hour)

Create shared folder for truly shared components that don't belong to any specific domain:

```bash
mkdir -p src/shared/{components,hooks,types,utils,guards,infrastructure}

# Create shared index files
cat > src/shared/index.ts << 'EOF'
// Shared Infrastructure - Main Export File
// Re-exports all shared functionality

// Components (truly shared UI components)
export * from './components';

// Hooks (shared utility hooks)
export * from './hooks';

// Types (shared base types and interfaces)
export * from './types';

// Utils (shared utility functions)
export * from './utils';

// Guards (shared route/access guards)
export * from './guards';

// Infrastructure (database, API, etc.)
export * from './infrastructure';
EOF

# Create shared subdirectory index files
for subdir in components hooks types utils guards infrastructure; do
  cat > src/shared/$subdir/index.ts << EOF
// Shared ${subdir^} - Export File
// Export all shared ${subdir}

// Placeholder export to prevent empty file errors  
export const SHARED_${subdir^^} = 'shared-${subdir}' as const;
EOF
done
```

### Step 4: Update TypeScript Configuration (30 minutes)

Update tsconfig.json to include path mappings for the new feature structure:

```json
{
  "compilerOptions": {
    "paths": {
      // Existing paths...
      "@/*": ["./src/*"],
      
      // New feature-based paths
      "@/features/*": ["./src/features/*"],
      "@/features/auth/*": ["./src/features/auth/*"],
      "@/features/investors/*": ["./src/features/investors/*"],
      "@/features/projects/*": ["./src/features/projects/*"],
      "@/features/tokens/*": ["./src/features/tokens/*"],
      "@/features/captable/*": ["./src/features/captable/*"],
      "@/features/compliance/*": ["./src/features/compliance/*"],
      "@/features/documents/*": ["./src/features/documents/*"],
      "@/features/wallet/*": ["./src/features/wallet/*"],
      "@/features/redemption/*": ["./src/features/redemption/*"],
      "@/features/reporting/*": ["./src/features/reporting/*"],
      
      // Shared infrastructure
      "@/shared/*": ["./src/shared/*"]
    }
  }
}
```

### Step 5: Create Validation Script (30 minutes)

Create a script to validate the structure was created correctly:

```javascript
// scripts/validate-structure.mjs
#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const domains = ['auth', 'investors', 'projects', 'tokens', 'captable', 'compliance', 'documents', 'wallet', 'redemption', 'reporting'];
const subdirs = ['components', 'hooks', 'services', 'types', 'utils', 'validation', 'mappers'];

function validateStructure() {
  console.log('🔍 Validating domain directory structure...\n');
  
  let allValid = true;
  
  // Check each domain
  for (const domain of domains) {
    console.log(`📁 Checking ${domain} domain...`);
    
    const domainPath = `src/features/${domain}`;
    if (!fs.existsSync(domainPath)) {
      console.log(`   ❌ Missing domain directory: ${domainPath}`);
      allValid = false;
      continue;
    }
    
    // Check main index file
    const indexPath = `${domainPath}/index.ts`;
    if (!fs.existsSync(indexPath)) {
      console.log(`   ❌ Missing index file: ${indexPath}`);
      allValid = false;
    }
    
    // Check README
    const readmePath = `${domainPath}/README.md`;
    if (!fs.existsSync(readmePath)) {
      console.log(`   ⚠️  Missing README: ${readmePath}`);
    }
    
    // Check subdirectories
    for (const subdir of subdirs) {
      const subdirPath = `${domainPath}/${subdir}`;
      if (!fs.existsSync(subdirPath)) {
        console.log(`   ❌ Missing subdirectory: ${subdirPath}`);
        allValid = false;
      } else {
        const subdirIndexPath = `${subdirPath}/index.ts`;
        if (!fs.existsSync(subdirIndexPath)) {
          console.log(`   ❌ Missing subdirectory index: ${subdirIndexPath}`);
          allValid = false;
        }
      }
    }
    
    if (allValid) {
      console.log(`   ✅ ${domain} domain structure valid`);
    }
  }
  
  // Check shared directory
  console.log('\n📁 Checking shared infrastructure...');
  const sharedPath = 'src/shared';
  if (!fs.existsSync(sharedPath)) {
    console.log(`   ❌ Missing shared directory: ${sharedPath}`);
    allValid = false;
  }
  
  console.log('\n' + (allValid ? '✅ All structures valid!' : '❌ Some structures missing!'));
  
  return allValid;
}

validateStructure();
```

### Step 6: Test Compilation (15 minutes)

Verify that the new structure doesn't break existing TypeScript compilation:

```bash
# Run TypeScript compilation check
npx tsc --noEmit

# If successful, structure is compatible with existing code
# If errors, check tsconfig.json paths configuration
```

## Acceptance Criteria

- [ ] All 10 domain directories created with consistent structure
- [ ] Each domain has components/, hooks/, services/, types/, utils/, validation/, mappers/ subdirectories
- [ ] Index files created for all directories (main domain + subdirectories)
- [ ] README files created documenting domain boundaries
- [ ] TypeScript path mappings configured for new structure
- [ ] Validation script confirms structure correctness
- [ ] TypeScript compilation succeeds (no breaking changes)
- [ ] Existing application continues to function normally

## Risk Mitigation

### No Breaking Changes
- New structure is additive only
- Existing imports continue to work
- No files are moved or modified yet

### Rollback Plan
If any issues arise:
```bash
# Remove the new structure
rm -rf src/features src/shared

# Restore original tsconfig.json paths
git checkout -- tsconfig.json
```

### Validation Steps
1. Run TypeScript compilation after each step
2. Verify application starts successfully
3. Check that no existing imports are broken
4. Run validation script to confirm structure

## Next Steps After Completion

Upon successful completion of Task 1.1:

1. **Update Progress:** Mark Task 1.1 as complete in progress tracker
2. **Document Changes:** Update architecture transition progress
3. **Prepare for Task 1.2:** Domain Boundary Definition (detailed interface specs)
4. **Team Communication:** Share new structure guidelines with development team

## Expected Timeline

- **Day 1:** Steps 1-3 (Analysis, structure creation, index files)
- **Day 2:** Steps 4-6 (Configuration, validation, testing)

**Success Indicator:** New domain structure exists alongside current structure without any breaking changes to existing functionality.

---

**Next Task:** Phase 1 Task 1.2 - Domain Boundary Definition
**Risk Assessment:** ✅ Low Risk - Additive changes only
**Ready for Implementation:** ✅ Yes
