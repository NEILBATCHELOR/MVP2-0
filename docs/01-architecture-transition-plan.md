# Chain Capital Architecture Transition Plan
## From Centralized to Domain-Local Dependency Architecture

### Executive Summary

This document outlines the transition from the current centralized dependency architecture in Chain Capital to a domain-local dependency architecture, following the Coding Best Practice guidelines. The transition will improve maintainability, reduce coupling, and enable better scaling while preserving all existing functionality.

### Current Architecture Analysis

#### Centralized Dependencies Identified

**Central Types System:**
- `src/types/centralModels.ts`: 1,000+ line file with all domain models
- `src/types/database.ts`: Central database type extensions  
- `src/types/supabase.ts`: Generated schema types
- Multiple domain-specific type files scattered in central location

**Central Services Architecture:**
- `src/services/` directory with centralized service organization
- Cross-domain service dependencies
- Shared infrastructure services used globally
- Mixed business logic in centralized locations

**Central Infrastructure:**
- `src/lib/` with shared utilities and clients
- Centralized Supabase client configuration
- Global infrastructure components
- Shared context and state management

**Monorepo Packages:**
- `packages/` directory structure exists but largely empty
- No clear domain boundaries in package organization
- Missing domain-specific exports and boundaries

#### Problems with Current Architecture

1. **Tight Coupling**: All domains depend on central types file
2. **Scaling Issues**: Single file modifications affect multiple features
3. **Testing Complexity**: Difficult to test domains in isolation
4. **Development Friction**: Multiple developers editing same central files
5. **Bundle Size**: All types loaded regardless of feature usage
6. **Maintenance Overhead**: Changes ripple across entire codebase

### Target Architecture: Domain-Local Dependencies

#### Core Principles

1. **Domain Autonomy**: Each domain manages its own types, services, and utilities
2. **Interface Segregation**: Domains expose only necessary interfaces to others
3. **Dependency Inversion**: Domains depend on abstractions, not concretions
4. **Minimal Coupling**: Cross-domain dependencies are explicit and minimal
5. **Local Optimization**: Each domain can optimize internally without affecting others

#### Domain Identification

Based on analysis of existing codebase, core domains are:

1. **Authentication & Authorization**
2. **Investor Management**
3. **Project Management** 
4. **Token & Asset Management**
5. **Compliance & KYC**
6. **Captable Management**
7. **Redemption & Distribution**
8. **Document Management**
9. **Wallet & Blockchain**
10. **Reporting & Analytics**

### Detailed Transition Tasks

## Phase 1: Domain Structure Creation (2-3 weeks)

### Task 1.1: Create Domain Directory Structure
**Priority: High**
**Estimated Time: 2 days**

Create feature-based domain directories following the established pattern:

```
src/
├── features/
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── validation/
│   │   ├── mappers/
│   │   └── index.ts
│   ├── investors/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── validation/
│   │   ├── mappers/
│   │   └── index.ts
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
    ├── hooks/
    ├── types/
    ├── utils/
    ├── guards/
    └── infrastructure/
```

**Deliverables:**
- Complete directory structure
- Index files for each domain
- README files documenting domain boundaries

### Task 1.2: Domain Boundary Definition
**Priority: High**
**Estimated Time: 3 days**

Define clear boundaries and interfaces for each domain:

**Auth Domain:**
- User authentication, sessions, permissions
- Exports: AuthUser, LoginCredentials, AuthState
- Dependencies: None (foundational)

**Investor Domain:**
- Investor profiles, KYC status, onboarding
- Exports: Investor, InvestorProfile, KYCStatus
- Dependencies: Auth (user context)

**Project Domain:**
- Project lifecycle, metadata, status management
- Exports: Project, ProjectStatus, ProjectMetrics
- Dependencies: Auth (ownership)

**Token Domain:**
- Token standards, deployment, operations
- Exports: Token, TokenStandard, TokenOperation
- Dependencies: Project (token-project relationship)

**Captable Domain:**
- Ownership structures, allocations, distributions
- Exports: CapTable, Allocation, Ownership
- Dependencies: Investor, Project, Token

**Compliance Domain:**
- KYC/AML, regulatory requirements, approvals
- Exports: ComplianceCheck, KYCData, AMLResult
- Dependencies: Investor

**Redemption Domain:**
- Redemption requests, processing, settlements
- Exports: RedemptionRequest, RedemptionStatus
- Dependencies: Token, Investor, Captable

**Document Domain:**
- Document storage, management, workflows
- Exports: Document, DocumentType, DocumentStatus
- Dependencies: Project, Investor, Compliance

**Wallet Domain:**
- Blockchain interactions, wallet management
- Exports: Wallet, Transaction, BlockchainNetwork
- Dependencies: Auth (wallet ownership)

**Reporting Domain:**
- Analytics, reports, data visualization
- Exports: Report, Metric, Dashboard
- Dependencies: All other domains (read-only)

**Deliverables:**
- Domain interface specifications
- Dependency map documentation
- Cross-domain communication protocols

### Task 1.3: Extract Central Types to Domains
**Priority: High**  
**Estimated Time: 5 days**

Break down the monolithic `centralModels.ts` into domain-specific types:

**1. Auth Types (`src/features/auth/types/`):**
```typescript
// authTypes.ts
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  // ... auth-specific properties
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
}
```

**2. Investor Types (`src/features/investors/types/`):**
```typescript
// investorTypes.ts
export interface Investor {
  id: string;
  userId?: string;
  name: string;
  email: string;
  // ... investor-specific properties
}

export interface InvestorProfile {
  investorId: string;
  kycStatus: KycStatus;
  accreditationStatus: AccreditationStatus;
  // ... profile properties
}
```

**3. Project Types (`src/features/projects/types/`):**
```typescript
// projectTypes.ts
export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  projectType: ProjectType;
  // ... project-specific properties
}
```

**Continue for all domains...**

**Deliverables:**
- Domain-specific type files
- Type mapping documentation
- Circular dependency resolution

### Task 1.4: Create Domain Services
**Priority: High**
**Estimated Time: 4 days**

Move services from central location to domain-specific locations:

**1. Auth Services (`src/features/auth/services/`):**
```typescript
// authService.ts
export class AuthService {
  async signIn(credentials: LoginCredentials): Promise<AuthUser> {}
  async signOut(): Promise<void> {}
  async getCurrentUser(): Promise<AuthUser | null> {}
  // ... auth-specific methods
}
```

**2. Investor Services (`src/features/investors/services/`):**
```typescript
// investorService.ts
export class InvestorService {
  async getInvestor(id: string): Promise<Investor> {}
  async createInvestor(data: CreateInvestorData): Promise<Investor> {}
  async updateInvestor(id: string, data: UpdateInvestorData): Promise<Investor> {}
  // ... investor-specific methods
}
```

**Deliverables:**
- Domain service classes
- Service interface definitions
- Dependency injection patterns

## Phase 2: Domain Implementation (3-4 weeks)

### Task 2.1: Implement Domain Hooks
**Priority: High**
**Estimated Time: 3 days**

Create domain-specific hooks for state management:

**Auth Hooks:**
```typescript
// useAuth.ts
export const useAuth = () => {
  // Auth-specific hook logic
}

// usePermissions.ts
export const usePermissions = () => {
  // Permission-specific hook logic
}
```

**Investor Hooks:**
```typescript
// useInvestors.ts
export const useInvestors = () => {
  // Investor management hook logic
}

// useInvestorProfile.ts
export const useInvestorProfile = (investorId: string) => {
  // Individual investor hook logic
}
```

**Deliverables:**
- Domain hook implementations
- Hook documentation
- State management patterns

### Task 2.2: Create Domain Components
**Priority: Medium**
**Estimated Time: 5 days**

Organize existing components into domain-specific locations:

**Move components following the pattern:**
- `src/components/auth/` → `src/features/auth/components/`
- `src/components/investors/` → `src/features/investors/components/`
- `src/components/projects/` → `src/features/projects/components/`

**Update imports and exports systematically**

**Deliverables:**
- Organized component structure
- Updated import paths
- Component documentation

### Task 2.3: Implement Domain Validation
**Priority: Medium**
**Estimated Time: 2 days**

Create domain-specific validation schemas:

```typescript
// src/features/auth/validation/authValidation.ts
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// src/features/investors/validation/investorValidation.ts
export const investorSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  type: z.enum(['individual', 'institutional']),
});
```

**Deliverables:**
- Domain validation schemas
- Validation hook implementations
- Error handling patterns

### Task 2.4: Create Domain Mappers
**Priority: Medium**
**Estimated Time: 2 days**

Implement type mapping functions for each domain:

```typescript
// src/features/investors/mappers/investorMappers.ts
export const mapDbInvestorToInvestor = (dbInvestor: DbInvestor): Investor => {
  return {
    id: dbInvestor.id,
    name: dbInvestor.name,
    email: dbInvestor.email,
    // ... mapping logic
  };
};
```

**Deliverables:**
- Domain mapper functions
- Database to domain type conversion
- Domain to API type conversion

### Task 2.5: Implement Domain Utilities
**Priority: Low**
**Estimated Time: 2 days**

Create domain-specific utility functions:

```typescript
// src/features/auth/utils/authUtils.ts
export const generateSecureToken = (): string => {}
export const validatePasswordStrength = (password: string): boolean => {}

// src/features/investors/utils/investorUtils.ts
export const calculateInvestorRiskScore = (investor: Investor): number => {}
export const formatInvestorName = (investor: Investor): string => {}
```

**Deliverables:**
- Domain utility functions
- Utility documentation
- Testing strategies

## Phase 3: Dependency Resolution (2-3 weeks)

### Task 3.1: Implement Cross-Domain Interfaces
**Priority: High**
**Estimated Time: 4 days**

Create interfaces for cross-domain communication:

```typescript
// src/shared/interfaces/domainInterfaces.ts
export interface DomainEventBus {
  publish<T>(event: DomainEvent<T>): void;
  subscribe<T>(eventType: string, handler: (event: T) => void): void;
}

export interface DomainEvent<T> {
  type: string;
  payload: T;
  timestamp: Date;
  domainId: string;
}
```

**Deliverables:**
- Cross-domain interface definitions
- Event bus implementation
- Communication protocols

### Task 3.2: Resolve Circular Dependencies
**Priority: High**
**Estimated Time: 3 days**

Identify and resolve circular dependencies:

1. **Dependency Analysis**: Map all current dependencies
2. **Interface Extraction**: Create shared interfaces for cross-domain types
3. **Dependency Inversion**: Use abstractions instead of concrete types

**Example Resolution:**
```typescript
// Instead of direct dependency
import { Investor } from '../investors/types';

// Use shared interface
import { InvestorReference } from '../../shared/interfaces';
```

**Deliverables:**
- Dependency analysis report
- Resolved circular dependencies
- Shared interface definitions

### Task 3.3: Create Shared Infrastructure
**Priority: Medium**
**Estimated Time: 3 days**

Maintain truly shared infrastructure in `src/shared/`:

```typescript
// src/shared/infrastructure/
├── supabase/
│   ├── client.ts
│   └── types.ts
├── web3/
│   ├── providers.ts
│   └── adapters.ts
└── api/
    ├── client.ts
    └── types.ts
```

**Deliverables:**
- Shared infrastructure components
- Infrastructure documentation
- Usage guidelines

### Task 3.4: Update Import Paths
**Priority: High**
**Estimated Time: 2 days**

Systematically update import paths across the codebase:

**Create import transformation script:**
```typescript
// scripts/update-imports.ts
const importTransformations = {
  '@/types/centralModels': {
    'Investor': '@/features/investors/types',
    'Project': '@/features/projects/types',
    'Token': '@/features/tokens/types'
  }
};
```

**Deliverables:**
- Updated import paths
- Import transformation script
- Validation of import consistency

## Phase 4: Testing & Validation (1-2 weeks)

### Task 4.1: Domain Unit Testing
**Priority: High**
**Estimated Time: 3 days**

Create comprehensive tests for each domain:

```typescript
// src/features/investors/tests/investorService.test.ts
describe('InvestorService', () => {
  test('should create investor with valid data', async () => {
    // Test implementation
  });
});
```

**Deliverables:**
- Domain unit tests
- Integration tests
- Test coverage reports

### Task 4.2: Cross-Domain Integration Testing
**Priority: High**
**Estimated Time: 3 days**

Test interactions between domains:

```typescript
// tests/integration/investor-project.test.ts
describe('Investor-Project Integration', () => {
  test('should create project subscription for investor', async () => {
    // Integration test implementation
  });
});
```

**Deliverables:**
- Integration test suite
- End-to-end test scenarios
- Performance benchmarks

### Task 4.3: Migration Validation
**Priority: High**
**Estimated Time: 2 days**

Validate that all functionality works after migration:

1. **Feature Parity Check**: Ensure all existing features work
2. **Performance Validation**: Verify no performance regressions
3. **Data Integrity**: Confirm all data operations work correctly

**Deliverables:**
- Migration validation report
- Performance comparison
- Bug tracking and resolution

## Phase 5: Documentation & Optimization (1 week)

### Task 5.1: Documentation Update
**Priority: Medium**
**Estimated Time: 2 days**

Update all documentation to reflect new architecture:

1. **Developer Guide**: Domain-based development patterns
2. **API Documentation**: Domain interface specifications
3. **Architecture Decision Records**: Document architectural changes

**Deliverables:**
- Updated documentation
- Developer onboarding guide
- Architecture diagrams

### Task 5.2: Performance Optimization
**Priority: Medium**
**Estimated Time: 2 days**

Optimize the new architecture:

1. **Bundle Analysis**: Ensure proper code splitting by domain
2. **Lazy Loading**: Implement domain-based lazy loading
3. **Caching Strategy**: Domain-specific caching patterns

**Deliverables:**
- Performance optimization report
- Bundle size analysis
- Caching implementation

### Task 5.3: Monitoring & Analytics
**Priority: Low**
**Estimated Time**: 1 day**

Implement monitoring for the new architecture:

1. **Domain Metrics**: Track domain-specific performance
2. **Dependency Monitoring**: Monitor cross-domain calls
3. **Error Tracking**: Domain-specific error reporting

**Deliverables:**
- Monitoring implementation
- Analytics dashboard
- Alert configuration

## Success Metrics

### Technical Metrics
- **Reduced Coupling**: < 20% cross-domain dependencies
- **Improved Test Coverage**: > 90% per domain
- **Bundle Size Optimization**: 30% reduction in initial load
- **Build Time**: 50% improvement in incremental builds

### Development Metrics  
- **Feature Development Speed**: 40% faster new feature implementation
- **Bug Resolution Time**: 60% reduction in bug fix time
- **Code Review Efficiency**: 50% faster review cycles
- **Developer Onboarding**: 70% faster for new team members

### Business Metrics
- **System Reliability**: 99.9% uptime maintained
- **Feature Delivery**: 100% feature parity maintained
- **Performance**: No degradation in user experience
- **Maintenance Cost**: 40% reduction in maintenance overhead

## Risk Mitigation

### Technical Risks
1. **Breaking Changes**: Comprehensive testing and staged rollout
2. **Performance Regression**: Continuous monitoring and optimization
3. **Circular Dependencies**: Careful dependency analysis and interface design

### Business Risks
1. **Feature Disruption**: Maintain feature parity throughout transition
2. **Development Velocity**: Parallel development during transition
3. **Knowledge Transfer**: Comprehensive documentation and training

### Mitigation Strategies
1. **Feature Flags**: Use feature flags for gradual rollout
2. **Rollback Plan**: Maintain ability to rollback changes
3. **Monitoring**: Comprehensive monitoring during transition
4. **Team Training**: Regular training sessions on new patterns

## Next Steps

1. **Review and Approval**: Stakeholder review of transition plan
2. **Team Assignment**: Assign domain ownership to team members
3. **Sprint Planning**: Break down tasks into development sprints
4. **Environment Setup**: Prepare development environments
5. **Communication Plan**: Regular updates to stakeholders

## Conclusion

This transition plan will transform Chain Capital from a centralized dependency architecture to a domain-local dependency architecture, improving maintainability, scalability, and development velocity while maintaining all existing functionality. The phased approach ensures minimal disruption to ongoing development and provides clear milestones for tracking progress.

The new architecture will enable faster feature development, easier testing, better code organization, and improved system reliability, positioning Chain Capital for future growth and scaling requirements.
