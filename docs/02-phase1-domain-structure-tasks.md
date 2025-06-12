# Phase 1 Tasks: Domain Structure Creation

## Task 1.1: Create Domain Directory Structure

### Overview
Establish the foundational directory structure for domain-local dependencies following Coding Best Practice guidelines.

### Current State Analysis
- Existing structure has centralized components in `src/components/`
- Services are centralized in `src/services/` with domain subfolders
- Types are mixed between `src/types/centralModels.ts` and domain-specific files
- No clear domain boundaries or ownership

### Target Structure
```
src/
├── features/
│   ├── auth/
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── SignUpForm.tsx
│   │   │   ├── MFASetup.tsx
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useSession.ts
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   ├── authService.ts
│   │   │   ├── sessionService.ts
│   │   │   └── index.ts
│   │   ├── types/
│   │   │   ├── authTypes.ts
│   │   │   ├── sessionTypes.ts
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── authUtils.ts
│   │   │   ├── passwordUtils.ts
│   │   │   └── index.ts
│   │   ├── validation/
│   │   │   ├── authValidation.ts
│   │   │   └── index.ts
│   │   ├── mappers/
│   │   │   ├── authMappers.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── investors/
│   │   ├── components/
│   │   │   ├── InvestorTable.tsx
│   │   │   ├── InvestorDialog.tsx
│   │   │   ├── BulkInvestorUpload.tsx
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── useInvestors.ts
│   │   │   ├── useInvestorCrud.ts
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   ├── investorService.ts
│   │   │   ├── kycService.ts
│   │   │   └── index.ts
│   │   ├── types/
│   │   │   ├── investorTypes.ts
│   │   │   ├── kycTypes.ts
│   │   │   └── index.ts
│   │   └── [other folders...]
│   ├── projects/
│   ├── tokens/
│   ├── compliance/
│   ├── captable/
│   ├── redemption/
│   ├── documents/
│   ├── wallet/
│   └── reporting/
└── shared/
    ├── components/
    │   ├── ui/ (existing shadcn components)
    │   ├── layout/
    │   └── common/
    ├── hooks/
    │   ├── useApi.ts
    │   ├── useDebounce.ts
    │   └── index.ts
    ├── types/
    │   ├── commonTypes.ts
    │   ├── apiTypes.ts
    │   └── index.ts
    ├── utils/
    │   ├── dateUtils.ts
    │   ├── formatUtils.ts
    │   └── index.ts
    ├── guards/
    │   ├── AuthGuard.tsx
    │   └── index.ts
    └── infrastructure/
        ├── supabase/
        ├── web3/
        └── api/
```

### Implementation Steps

#### Step 1: Create Feature Directories (1 hour)
Create all feature-level directories:
```bash
mkdir -p src/features/{auth,investors,projects,tokens,compliance,captable,redemption,documents,wallet,reporting}
```

#### Step 2: Create Domain Subdirectories (1 hour)
For each domain, create the standard subdirectories:
```bash
for domain in auth investors projects tokens compliance captable redemption documents wallet reporting; do
  mkdir -p src/features/$domain/{components,hooks,services,types,utils,validation,mappers}
done
```

#### Step 3: Create Index Files (2 hours)
Create index.ts files for organized exports:

**Example: src/features/auth/index.ts**
```typescript
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
export * from './authTypes';
export * from './sessionTypes';
```

#### Step 4: Create README Files (2 hours)
Create README.md for each domain documenting:
- Domain responsibility
- Key exports
- Dependencies
- Usage examples

**Example: src/features/auth/README.md**
```markdown
# Authentication Domain

## Responsibility
Handles user authentication, session management, and authorization.

## Key Exports
- `AuthUser` - User authentication data
- `useAuth()` - Authentication hook
- `AuthService` - Authentication service

## Dependencies
- None (foundational domain)

## Usage
```typescript
import { useAuth, AuthUser } from '@/features/auth';

const { user, signIn, signOut } = useAuth();
```

### Acceptance Criteria
- [ ] All feature directories created
- [ ] All subdirectories created with consistent structure
- [ ] Index files created for all directories
- [ ] README files documenting each domain
- [ ] No circular dependencies in structure
- [ ] Follows Coding Best Practice naming conventions

### Deliverables
1. Complete directory structure
2. Index files for organized exports
3. README documentation for each domain
4. Domain boundary documentation

### Time Estimate: 1 day (8 hours)

---

## Task 1.2: Domain Boundary Definition

### Overview
Define clear boundaries, responsibilities, and interfaces for each domain to prevent coupling and ensure clean architecture.

### Domain Definitions

#### Auth Domain
**Responsibility:** User authentication, sessions, permissions, MFA
**Scope:**
- User login/logout
- Session management  
- Permission checking
- Multi-factor authentication
- Password management

**Exports:**
- `AuthUser` - Authenticated user data
- `AuthSession` - Session information
- `UserPermissions` - Permission structure
- `LoginCredentials` - Login form data
- `MFAData` - Multi-factor auth data

**Dependencies:** None (foundational)

**External Interfaces:**
```typescript
// What other domains can import from auth
export interface AuthPublicAPI {
  // Types
  AuthUser: typeof AuthUser;
  UserPermissions: typeof UserPermissions;
  
  // Hooks
  useAuth(): AuthHookResult;
  usePermissions(): PermissionsHookResult;
  
  // Guards
  AuthGuard: React.ComponentType<AuthGuardProps>;
  PermissionGuard: React.ComponentType<PermissionGuardProps>;
}
```

#### Investor Domain
**Responsibility:** Investor profiles, KYC status, onboarding, accreditation
**Scope:**
- Investor data management
- KYC/AML processing
- Investor onboarding
- Accreditation verification
- Risk assessment

**Exports:**
- `Investor` - Core investor data
- `InvestorProfile` - Extended profile
- `KYCData` - KYC information
- `AccreditationStatus` - Accreditation info
- `RiskAssessment` - Risk data

**Dependencies:** 
- Auth (user context, permissions)

**External Interfaces:**
```typescript
export interface InvestorPublicAPI {
  // Types for other domains
  InvestorReference: Pick<Investor, 'id' | 'name' | 'email'>;
  InvestorStatus: 'active' | 'pending' | 'suspended';
  
  // Minimal hooks for other domains
  useInvestorReference(id: string): InvestorReference | null;
}
```

#### Project Domain  
**Responsibility:** Project lifecycle, metadata, status, funding rounds
**Scope:**
- Project creation and management
- Project status tracking
- Funding round management
- Project metadata
- Project analytics

**Exports:**
- `Project` - Core project data
- `ProjectStatus` - Status tracking
- `FundingRound` - Funding information
- `ProjectMetrics` - Analytics data

**Dependencies:**
- Auth (ownership, permissions)

#### Token Domain
**Responsibility:** Token standards, deployment, operations, metadata
**Scope:**
- Token configuration
- Smart contract deployment
- Token operations (mint, burn, transfer)
- Token standard compliance
- Token metadata management

**Exports:**
- `Token` - Token definition
- `TokenStandard` - ERC standards
- `TokenOperation` - Operations data
- `TokenDeployment` - Deployment info

**Dependencies:**
- Project (token-project relationship)
- Auth (deployment permissions)

#### Captable Domain
**Responsibility:** Ownership structures, allocations, distributions
**Scope:**
- Cap table management
- Ownership tracking
- Token allocations
- Distribution management
- Equity calculations

**Exports:**
- `CapTable` - Ownership structure
- `Allocation` - Token allocation
- `Distribution` - Distribution data
- `Ownership` - Ownership tracking

**Dependencies:**
- Investor (ownership relationships)
- Project (project ownership)
- Token (token allocations)

#### Compliance Domain
**Responsibility:** KYC/AML, regulatory requirements, approval workflows
**Scope:**
- Compliance checking
- Regulatory requirements
- Approval workflows
- Document verification
- Risk scoring

**Exports:**
- `ComplianceCheck` - Compliance status
- `ComplianceRule` - Rule definitions
- `ApprovalWorkflow` - Approval process
- `ComplianceReport` - Reporting data

**Dependencies:**
- Investor (compliance status)
- Documents (verification)

#### Redemption Domain
**Responsibility:** Redemption requests, processing, settlements
**Scope:**
- Redemption request management
- Processing workflows
- Settlement tracking
- Redemption windows
- Fee calculations

**Exports:**
- `RedemptionRequest` - Request data
- `RedemptionStatus` - Status tracking
- `Settlement` - Settlement info
- `RedemptionWindow` - Window config

**Dependencies:**
- Token (redemption tokens)
- Investor (redemption owners)
- Captable (ownership verification)

#### Document Domain
**Responsibility:** Document storage, management, workflows, verification
**Scope:**
- Document upload/storage
- Document categorization
- Workflow management
- Version control
- Access control

**Exports:**
- `Document` - Document metadata
- `DocumentType` - Document categories
- `DocumentWorkflow` - Workflow data
- `DocumentAccess` - Access control

**Dependencies:**
- Project (project documents)
- Investor (investor documents)
- Compliance (compliance docs)

#### Wallet Domain
**Responsibility:** Blockchain interactions, wallet management, transactions
**Scope:**
- Wallet creation/management
- Transaction execution
- Blockchain interactions
- Multi-sig operations
- Gas management

**Exports:**
- `Wallet` - Wallet information
- `Transaction` - Transaction data
- `BlockchainNetwork` - Network config
- `GasEstimate` - Gas calculations

**Dependencies:**
- Auth (wallet ownership)

#### Reporting Domain
**Responsibility:** Analytics, reports, data visualization, metrics
**Scope:**
- Data aggregation
- Report generation
- Dashboard metrics
- Performance analytics
- Export functionality

**Exports:**
- `Report` - Report configuration
- `Metric` - Metric definitions
- `Dashboard` - Dashboard config
- `Analytics` - Analytics data

**Dependencies:**
- All other domains (read-only access)

### Cross-Domain Communication Rules

#### 1. Direct Dependencies
- Keep to minimum necessary
- Use interfaces, not concrete types
- Document all dependencies

#### 2. Event-Based Communication
```typescript
// Shared event system
interface DomainEvent<T> {
  type: string;
  payload: T;
  source: string;
  timestamp: Date;
}

// Example: Investor domain publishes KYC status change
export const publishKYCStatusChange = (investorId: string, status: KYCStatus) => {
  eventBus.publish({
    type: 'investor.kyc.status.changed',
    payload: { investorId, status },
    source: 'investor',
    timestamp: new Date()
  });
};
```

#### 3. Shared Interfaces
```typescript
// src/shared/interfaces/domainInterfaces.ts
export interface EntityReference {
  id: string;
  name: string;
  type: string;
}

export interface InvestorReference extends EntityReference {
  type: 'investor';
  email: string;
}

export interface ProjectReference extends EntityReference {
  type: 'project';
  status: string;
}
```

### Implementation Guidelines

#### 1. Dependency Direction Rules
- Auth ← (no dependencies)
- Investor ← Auth
- Project ← Auth  
- Token ← Project, Auth
- Captable ← Investor, Project, Token
- Compliance ← Investor, Document
- Redemption ← Token, Investor, Captable
- Document ← Project, Investor, Compliance
- Wallet ← Auth
- Reporting ← All (read-only)

#### 2. Import/Export Patterns
```typescript
// Good: Domain exports minimal interface
export interface InvestorPublicAPI {
  InvestorReference: Pick<Investor, 'id' | 'name' | 'email'>;
  useInvestorReference(id: string): InvestorReference | null;
}

// Bad: Domain exports everything
export * from './types/investorTypes';
```

#### 3. Circular Dependency Prevention
- Use shared interfaces for references
- Event-based communication for complex interactions
- Dependency injection for services

### Acceptance Criteria
- [ ] All domains have clear responsibility definitions
- [ ] Dependencies are documented and justified
- [ ] No circular dependencies in design
- [ ] Shared interfaces defined for cross-domain communication
- [ ] Event system designed for loose coupling
- [ ] Import/export patterns established

### Deliverables
1. Domain responsibility matrix
2. Dependency map and rules
3. Cross-domain interface definitions
4. Event communication patterns
5. Implementation guidelines

### Time Estimate: 3 days (24 hours)

---

## Task 1.3: Extract Central Types to Domains

### Overview
Break down the monolithic `src/types/centralModels.ts` (1,000+ lines) into domain-specific type files following the established domain boundaries.

### Current State Analysis
**Problems with centralModels.ts:**
- Single file with 1,000+ lines
- Mixed concerns across all domains
- Tight coupling between unrelated types
- Difficult to maintain and extend
- All types loaded regardless of usage
- Merge conflicts when multiple developers edit

**Current Type Categories in centralModels.ts:**
- User/Auth types (User, UserRole, UserStatus)
- Project types (Project, ProjectStatus, ProjectType)
- Investor types (Investor, InvestorEntityType, KycStatus)
- Token types (Token, TokenStandard, TokenStatus)
- Captable types (Subscription, TokenAllocation)
- Compliance types (ComplianceCheck, ApprovalStatus)
- Document types (IssuerDocument, DocumentType)
- Wallet types (Wallet, WalletType, Transaction)
- Reporting types (ActivityLog, Metrics)

### Extraction Strategy

#### Phase 1: Create Domain Type Files (Day 1)

**1. Auth Types (`src/features/auth/types/authTypes.ts`)**
```typescript
// Base auth types
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  status: UserStatus;
  mfaEnabled?: boolean;
  lastLoginAt?: string;
  preferences?: Record<string, any>;
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  INVESTOR = 'investor'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended'
}

// Session types
export interface AuthSession {
  user: AuthUser;
  token: string;
  expiresAt: Date;
  refreshToken: string;
}

// Credential types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface MFACredentials {
  token: string;
  code: string;
}
```

**2. Investor Types (`src/features/investors/types/investorTypes.ts`)**
```typescript
export interface Investor {
  id: string;
  userId?: string;
  name: string;
  email: string;
  company?: string;
  type: InvestorEntityType;
  kycStatus?: KycStatus;
  kycVerifiedAt?: string;
  kycExpiryDate?: string;
  accreditationStatus?: AccreditationStatus;
  accreditationType?: string;
  walletAddress?: string;
  riskScore?: number;
  investorStatus?: InvestorStatus;
  onboardingCompleted?: boolean;
  profileData?: Record<string, any>;
  taxResidency?: string;
  taxIdNumber?: string;
  investmentPreferences?: InvestmentPreferences;
  lastComplianceCheck?: string;
}

export enum InvestorEntityType {
  INDIVIDUAL = 'individual',
  INSTITUTIONAL = 'institutional',
  SYNDICATE = 'syndicate'
}

export enum KycStatus {
  APPROVED = 'approved',
  PENDING = 'pending',
  FAILED = 'failed',
  NOT_STARTED = 'not_started',
  EXPIRED = 'expired'
}

// Continue with other investor-related types...
```

**3. Project Types (`src/features/projects/types/projectTypes.ts`)**
```typescript
export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  projectType: ProjectType;
  tokenSymbol?: string;
  tokenPrice?: number;
  totalTokenSupply?: number;
  fundingGoal?: number;
  raisedAmount?: number;
  startDate?: string;
  endDate?: string;
  organizationId?: string;
  ownerId?: string;
  // ... other project properties
}

export enum ProjectStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  FUNDED = 'funded',
  CLOSED = 'closed',
  CANCELLED = 'cancelled'
}

export enum ProjectType {
  EQUITY = "equity",
  TOKEN = "token",
  HYBRID = "hybrid",
  RECEIVABLES = "receivables"
}
```

**Continue for all domains...**

#### Phase 2: Create Type Mapping (Day 2)

Create mapping files that help other domains import needed types:

**1. Shared Type References (`src/shared/types/references.ts`)**
```typescript
// Minimal references for cross-domain usage
export interface EntityReference {
  id: string;
  name: string;
}

export interface UserReference extends EntityReference {
  email: string;
  role: string;
}

export interface InvestorReference extends EntityReference {
  email: string;
  type: string;
}

export interface ProjectReference extends EntityReference {
  status: string;
  type: string;
}
```

**2. Type Export Maps (`src/shared/types/typeExports.ts`)**
```typescript
// Central registry of what each domain exports
export interface DomainTypeMap {
  auth: {
    AuthUser: any;
    UserRole: any;
    UserStatus: any;
    AuthSession: any;
  };
  investors: {
    Investor: any;
    InvestorReference: any;
    KycStatus: any;
  };
  projects: {
    Project: any;
    ProjectReference: any;
    ProjectStatus: any;
  };
  // ... other domains
}
```

#### Phase 3: Update Imports (Day 3-5)

**1. Create Import Transformation Script**
```typescript
// scripts/transformImports.ts
const transformations = {
  // Old import -> New import mapping
  "import { User } from '@/types/centralModels'": "import { AuthUser } from '@/features/auth/types'",
  "import { Investor } from '@/types/centralModels'": "import { Investor } from '@/features/investors/types'",
  "import { Project } from '@/types/centralModels'": "import { Project } from '@/features/projects/types'",
  // ... all type transformations
};

function transformFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  for (const [oldImport, newImport] of Object.entries(transformations)) {
    content = content.replace(new RegExp(oldImport, 'g'), newImport);
  }
  
  fs.writeFileSync(filePath, content);
}
```

**2. Systematic Import Updates**
Run transformation script on all TypeScript files:
```bash
find src -name "*.ts" -o -name "*.tsx" | xargs node scripts/transformImports.ts
```

**3. Manual Cleanup**
Review and manually fix complex import scenarios:
- Multiple types from same import
- Type-only imports
- Conditional imports
- Dynamic imports

### Handling Complex Scenarios

#### 1. Circular Dependencies
**Problem:** Token types need Project types, Project types need Token types

**Solution:** Use shared interfaces
```typescript
// src/shared/types/relationships.ts
export interface TokenProjectRelationship {
  tokenId: string;
  projectId: string;
  relationship: 'primary' | 'secondary' | 'utility';
}

// In token domain
import { TokenProjectRelationship } from '@/shared/types/relationships';
```

#### 2. Shared Base Types
**Problem:** Multiple domains need BaseModel, timestamps, etc.

**Solution:** Keep in shared types
```typescript
// src/shared/types/baseTypes.ts
export interface BaseModel {
  id: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TimestampedModel extends BaseModel {
  createdAt: string;
  updatedAt: string;
}
```

#### 3. Database Type Integration
**Problem:** Database types need to align with domain types

**Solution:** Create database type extensions per domain
```typescript
// src/features/investors/types/investorDatabaseTypes.ts
import type { Database } from '@/shared/types/supabase';
import { Investor } from './investorTypes';

export type InvestorTable = Database['public']['Tables']['investors']['Row'];
export type InvestorInsert = Database['public']['Tables']['investors']['Insert'];
export type InvestorUpdate = Database['public']['Tables']['investors']['Update'];

// Mapper between database and domain types
export const mapDbInvestorToInvestor = (dbInvestor: InvestorTable): Investor => {
  return {
    id: dbInvestor.id,
    name: dbInvestor.name,
    email: dbInvestor.email,
    // ... mapping logic
  };
};
```

### Validation and Testing

#### 1. Type Coverage Verification
```typescript
// scripts/verifyTypeExtraction.ts
// Verify all types from centralModels.ts are moved
const centralModelsTypes = extractTypesFromFile('src/types/centralModels.ts');
const domainTypes = extractTypesFromDomains();

const missingTypes = centralModelsTypes.filter(type => 
  !domainTypes.includes(type)
);

if (missingTypes.length > 0) {
  throw new Error(`Missing types: ${missingTypes.join(', ')}`);
}
```

#### 2. Import Validation
```typescript
// scripts/validateImports.ts
// Check that all imports resolve correctly
function validateImports(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf8');
  const imports = extractImports(content);
  
  imports.forEach(importPath => {
    if (!fs.existsSync(resolveImportPath(importPath))) {
      throw new Error(`Invalid import in ${filePath}: ${importPath}`);
    }
  });
}
```

#### 3. Compilation Testing
```bash
# Verify TypeScript compilation after changes
npm run type-check

# Run tests to ensure functionality maintained
npm run test
```

### Rollback Strategy

#### 1. Preserve Original File
```bash
cp src/types/centralModels.ts src/types/centralModels.ts.backup
```

#### 2. Gradual Migration
- Migrate one domain at a time
- Keep both old and new imports working temporarily
- Validate each domain before proceeding

#### 3. Emergency Rollback
```bash
# Restore original file if needed
cp src/types/centralModels.ts.backup src/types/centralModels.ts
git checkout -- src/features/*/types/
```

### Acceptance Criteria
- [ ] All types from centralModels.ts extracted to appropriate domains
- [ ] No circular dependencies between domain types
- [ ] All existing imports updated to new locations
- [ ] TypeScript compilation succeeds
- [ ] All tests pass
- [ ] No functionality regressions
- [ ] Import transformation script works correctly
- [ ] Documentation updated

### Deliverables
1. Domain-specific type files for all 10 domains
2. Import transformation script
3. Type dependency documentation
4. Validation scripts
5. Migration rollback plan

### Time Estimate: 5 days (40 hours)
- Day 1: Create domain type files (8 hours)
- Day 2: Type mapping and shared interfaces (8 hours)
- Day 3-4: Import transformation and updates (16 hours)
- Day 5: Validation, testing, documentation (8 hours)
