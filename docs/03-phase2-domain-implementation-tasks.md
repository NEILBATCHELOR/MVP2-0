# Phase 2 Tasks: Domain Implementation

## Task 2.1: Implement Domain Hooks

### Overview
Create domain-specific React hooks that encapsulate business logic and state management for each domain, replacing centralized hooks with domain-local implementations.

### Current State Analysis
**Existing Hook Issues:**
- Hooks scattered across different directories
- Mixed domain concerns in single hooks
- Tight coupling to central types
- No clear ownership or boundaries
- Difficult to test in isolation

**Current Hook Locations:**
- Authentication hooks in various locations
- Investor hooks in `src/components/investors/`
- Project hooks mixed with components
- Compliance hooks spread across compliance folders
- No consistent patterns or structure

### Target Hook Architecture

#### 1. Auth Domain Hooks (`src/features/auth/hooks/`)

**useAuth.ts** - Core authentication hook
```typescript
export interface UseAuthResult {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (credentials: LoginCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  updateProfile: (updates: Partial<AuthUser>) => Promise<void>;
}

export const useAuth = (): UseAuthResult => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const signIn = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const result = await authService.signIn(credentials);
      setUser(result.user);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ... other auth methods

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    signIn,
    signOut,
    refreshSession,
    updateProfile
  };
};
```

**usePermissions.ts** - Permission checking hook
```typescript
export interface UsePermissionsResult {
  hasPermission: (permission: string) => boolean;
  hasRole: (role: UserRole) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  canAccess: (resource: string, action: string) => boolean;
}

export const usePermissions = (): UsePermissionsResult => {
  const { user } = useAuth();
  
  const hasPermission = useCallback((permission: string) => {
    return user?.permissions?.includes(permission) ?? false;
  }, [user]);

  const hasRole = useCallback((role: UserRole) => {
    return user?.role === role;
  }, [user]);

  // ... other permission methods

  return {
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions,
    canAccess
  };
};
```

**useSession.ts** - Session management hook
```typescript
export interface UseSessionResult {
  session: AuthSession | null;
  isValid: boolean;
  expiresAt: Date | null;
  refreshSession: () => Promise<void>;
  clearSession: () => void;
  timeUntilExpiry: number;
}

export const useSession = (): UseSessionResult => {
  // Session management logic
};
```

#### 2. Investor Domain Hooks (`src/features/investors/hooks/`)

**useInvestors.ts** - Investor list management
```typescript
export interface UseInvestorsResult {
  investors: Investor[];
  loading: boolean;
  error: string | null;
  pagination: PaginationState;
  filters: InvestorFilters;
  
  // Actions
  fetchInvestors: () => Promise<void>;
  createInvestor: (data: CreateInvestorData) => Promise<Investor>;
  updateInvestor: (id: string, data: UpdateInvestorData) => Promise<Investor>;
  deleteInvestor: (id: string) => Promise<void>;
  
  // Filtering and pagination
  setFilters: (filters: Partial<InvestorFilters>) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  
  // Selection
  selectedInvestors: string[];
  selectInvestor: (id: string) => void;
  deselectInvestor: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  
  // Bulk operations
  bulkUpdate: (ids: string[], data: Partial<Investor>) => Promise<void>;
  bulkDelete: (ids: string[]) => Promise<void>;
}

export const useInvestors = (options?: UseInvestorsOptions): UseInvestorsResult => {
  // Implementation with React Query or SWR
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // ... implementation
};
```

**useInvestorProfile.ts** - Individual investor management
```typescript
export interface UseInvestorProfileResult {
  investor: Investor | null;
  loading: boolean;
  error: string | null;
  
  // Profile actions
  updateProfile: (updates: Partial<Investor>) => Promise<void>;
  updateKYC: (kycData: KYCUpdateData) => Promise<void>;
  updateAccreditation: (accredData: AccreditationData) => Promise<void>;
  
  // Related data
  subscriptions: Subscription[];
  allocations: TokenAllocation[];
  documents: InvestorDocument[];
  
  // Status checks
  isKYCCompliant: boolean;
  isAccredited: boolean;
  riskLevel: RiskLevel;
}

export const useInvestorProfile = (investorId: string): UseInvestorProfileResult => {
  // Implementation
};
```

**useInvestorOnboarding.ts** - Onboarding flow management
```typescript
export interface UseInvestorOnboardingResult {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  canProceedToNext: boolean;
  onboardingData: OnboardingData;
  
  // Navigation
  goToStep: (step: OnboardingStep) => void;
  nextStep: () => void;
  previousStep: () => void;
  
  // Data management
  updateStepData: <T>(step: OnboardingStep, data: T) => void;
  submitStep: (step: OnboardingStep) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  
  // Validation
  validateStep: (step: OnboardingStep) => Promise<ValidationResult>;
  getStepErrors: (step: OnboardingStep) => string[];
}

export const useInvestorOnboarding = (investorId?: string): UseInvestorOnboardingResult => {
  // Implementation
};
```

#### 3. Project Domain Hooks (`src/features/projects/hooks/`)

**useProjects.ts** - Project list management
```typescript
export interface UseProjectsResult {
  projects: Project[];
  loading: boolean;
  error: string | null;
  
  // CRUD operations
  createProject: (data: CreateProjectData) => Promise<Project>;
  updateProject: (id: string, data: UpdateProjectData) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  duplicateProject: (id: string) => Promise<Project>;
  
  // Filtering and search
  filteredProjects: Project[];
  searchTerm: string;
  filters: ProjectFilters;
  setSearchTerm: (term: string) => void;
  setFilters: (filters: Partial<ProjectFilters>) => void;
  
  // Status management
  updateProjectStatus: (id: string, status: ProjectStatus) => Promise<void>;
  archiveProject: (id: string) => Promise<void>;
  restoreProject: (id: string) => Promise<void>;
}

export const useProjects = (): UseProjectsResult => {
  // Implementation
};
```

**useProjectDetails.ts** - Individual project management
```typescript
export interface UseProjectDetailsResult {
  project: Project | null;
  loading: boolean;
  error: string | null;
  
  // Related data
  investors: InvestorReference[];
  tokens: TokenReference[];
  documents: ProjectDocument[];
  metrics: ProjectMetrics;
  
  // Actions
  updateProject: (updates: Partial<Project>) => Promise<void>;
  addInvestor: (investorId: string) => Promise<void>;
  removeInvestor: (investorId: string) => Promise<void>;
  generateReport: (type: ReportType) => Promise<Blob>;
}

export const useProjectDetails = (projectId: string): UseProjectDetailsResult => {
  // Implementation
};
```

#### 4. Token Domain Hooks (`src/features/tokens/hooks/`)

**useTokens.ts** - Token management
```typescript
export interface UseTokensResult {
  tokens: Token[];
  loading: boolean;
  error: string | null;
  
  // CRUD operations
  createToken: (data: CreateTokenData) => Promise<Token>;
  updateToken: (id: string, data: UpdateTokenData) => Promise<Token>;
  deleteToken: (id: string) => Promise<void>;
  
  // Deployment
  deployToken: (id: string, networkId: string) => Promise<TokenDeployment>;
  checkDeploymentStatus: (deploymentId: string) => Promise<DeploymentStatus>;
  
  // Operations
  mintTokens: (tokenId: string, amount: number, recipient: string) => Promise<void>;
  burnTokens: (tokenId: string, amount: number) => Promise<void>;
  transferTokens: (tokenId: string, from: string, to: string, amount: number) => Promise<void>;
}

export const useTokens = (projectId?: string): UseTokensResult => {
  // Implementation
};
```

#### 5. Cross-Domain Communication Hooks

**useEventBus.ts** - Domain event communication
```typescript
export interface UseEventBusResult {
  publish: <T>(event: DomainEvent<T>) => void;
  subscribe: <T>(eventType: string, handler: (event: DomainEvent<T>) => void) => () => void;
  unsubscribe: (eventType: string) => void;
}

export const useEventBus = (): UseEventBusResult => {
  // Event bus implementation for cross-domain communication
};
```

### Implementation Guidelines

#### 1. State Management Pattern
```typescript
// Standard hook state pattern
const useStandardDomainHook = () => {
  // State
  const [data, setData] = useState<DataType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Services
  const service = useMemo(() => new DomainService(), []);
  
  // Effects
  useEffect(() => {
    // Initial data loading
  }, []);
  
  // Actions
  const actions = useMemo(() => ({
    create: async (data: CreateData) => {
      setLoading(true);
      try {
        const result = await service.create(data);
        setData(prev => [...prev, result]);
        return result;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    // ... other actions
  }), [service]);
  
  return {
    data,
    loading,
    error,
    ...actions
  };
};
```

#### 2. Error Handling Pattern
```typescript
const useDomainErrorHandling = () => {
  const [error, setError] = useState<DomainError | null>(null);
  
  const handleError = useCallback((error: unknown) => {
    if (error instanceof DomainError) {
      setError(error);
    } else {
      setError(new DomainError('Unknown error occurred', error));
    }
  }, []);
  
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  return {
    error,
    handleError,
    clearError
  };
};
```

#### 3. Caching and Optimization Pattern
```typescript
const useOptimizedDomainHook = () => {
  // Use React Query or SWR for caching
  const {
    data,
    error,
    isLoading,
    mutate
  } = useSWR(
    'domain-key',
    () => domainService.fetchData(),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000
    }
  );
  
  // Optimistic updates
  const optimisticUpdate = useCallback(async (updateData) => {
    // Update local state immediately
    mutate(
      (currentData) => updateLocalData(currentData, updateData),
      false
    );
    
    try {
      // Perform actual update
      await domainService.update(updateData);
      // Revalidate to ensure consistency
      mutate();
    } catch (error) {
      // Rollback on error
      mutate();
      throw error;
    }
  }, [mutate]);
  
  return {
    data,
    error,
    isLoading,
    optimisticUpdate
  };
};
```

#### 4. Testing Pattern
```typescript
// Hook testing utility
const renderDomainHook = <T>(hook: () => T, options?: RenderHookOptions) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <DomainProvider>
      <QueryClient client={testQueryClient}>
        {children}
      </QueryClient>
    </DomainProvider>
  );
  
  return renderHook(hook, {
    wrapper: Wrapper,
    ...options
  });
};

// Example test
describe('useInvestors', () => {
  it('should fetch investors on mount', async () => {
    const { result, waitFor } = renderDomainHook(() => useInvestors());
    
    expect(result.current.loading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.investors).toHaveLength(2);
  });
});
```

### Migration Strategy

#### 1. Phase 1: Create New Hooks (2 days)
- Create all domain hook files
- Implement basic structure and interfaces
- No functionality yet, just structure

#### 2. Phase 2: Implement Core Functionality (2 days)
- Add actual business logic to hooks
- Integrate with domain services
- Add proper error handling

#### 3. Phase 3: Update Components (2 days)
- Replace existing hook usage with new domain hooks
- Update import statements
- Ensure all functionality preserved

#### 4. Phase 4: Testing and Optimization (1 day)
- Add comprehensive tests for all hooks
- Performance optimization
- Documentation

### Hook Dependencies

#### Internal Dependencies (within domain)
```typescript
// Auth hooks can depend on each other
export const useAuthActions = () => {
  const { user } = useAuth(); // ✅ Same domain
  // ...
};
```

#### Cross-Domain Dependencies (minimize)
```typescript
// Use references, not full types
export const useInvestorProjects = (investorId: string) => {
  // ✅ Use reference type
  const { projects } = useProjectReferences({ investorId });
  
  // ❌ Don't import full project domain
  // const { projects } = useProjects();
};
```

#### Shared Dependencies
```typescript
// Shared hooks for common functionality
export const useApi = () => {
  // API client hook - can be used by all domains
};

export const useDebounce = (value: any, delay: number) => {
  // Utility hook - can be used by all domains
};
```

### Acceptance Criteria
- [ ] All domain hooks created with consistent interfaces
- [ ] Hooks follow established patterns for state, error handling, and caching
- [ ] No circular dependencies between domain hooks
- [ ] Comprehensive test coverage for all hooks
- [ ] Performance optimized with proper memoization
- [ ] Documentation includes usage examples
- [ ] Migration from old hooks completed without regressions
- [ ] TypeScript types properly defined for all hook returns

### Deliverables
1. Complete set of domain hooks for all 10 domains
2. Hook testing utilities and test suites
3. Migration guide from old hooks to new hooks
4. Performance optimization documentation
5. Hook usage examples and best practices

### Time Estimate: 3 days (24 hours)
- Day 1: Auth and Investor hooks (8 hours)
- Day 2: Project, Token, and Captable hooks (8 hours)  
- Day 3: Compliance, Document, Wallet, Redemption, Reporting hooks (8 hours)

---

## Task 2.2: Create Domain Components

### Overview
Organize existing components into domain-specific locations and update their dependencies to use domain-local types, hooks, and services.

### Current State Analysis
**Component Organization Issues:**
- Components scattered across `src/components/` without clear domain boundaries
- Mixed domain concerns in single components
- Components importing from centralized types and services
- No consistent naming or organizational patterns
- Difficult to find and maintain related components

**Current Component Locations:**
```
src/components/
├── auth/ (some auth components)
├── investors/ (investor management)
├── captable/ (cap table components)
├── compliance/ (compliance workflows)
├── dashboard/ (mixed domain dashboard)
├── projects/ (project management)
├── tokens/ (token management)
├── wallet/ (wallet components)
├── shared/ (truly shared UI components)
└── [many other mixed folders]
```

### Target Component Organization

#### 1. Auth Domain Components (`src/features/auth/components/`)
```
src/features/auth/components/
├── forms/
│   ├── LoginForm.tsx
│   ├── SignUpForm.tsx
│   ├── ForgotPasswordForm.tsx
│   ├── ResetPasswordForm.tsx
│   └── index.ts
├── mfa/
│   ├── MFASetup.tsx
│   ├── MFAVerification.tsx
│   ├── TOTPForm.tsx
│   └── index.ts
├── profile/
│   ├── UserProfile.tsx
│   ├── ProfileSettings.tsx
│   ├── ChangePassword.tsx
│   └── index.ts
├── guards/
│   ├── AuthGuard.tsx
│   ├── PermissionGuard.tsx
│   ├── RoleGuard.tsx
│   └── index.ts
└── index.ts
```

**Example Component Migration:**
```typescript
// OLD: src/components/auth/LoginForm.tsx
import { User } from '@/types/centralModels';
import { loginUser } from '@/services/auth/authService';

// NEW: src/features/auth/components/forms/LoginForm.tsx
import { AuthUser, LoginCredentials } from '../types';
import { useAuth } from '../hooks';
import { loginSchema } from '../validation';

export interface LoginFormProps {
  onSuccess?: (user: AuthUser) => void;
  onError?: (error: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ 
  onSuccess, 
  onError 
}) => {
  const { signIn, isLoading } = useAuth();
  
  const form = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = async (data: LoginCredentials) => {
    try {
      await signIn(data);
      onSuccess?.(user);
    } catch (error) {
      onError?.(error.message);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields */}
      </form>
    </Form>
  );
};
```

#### 2. Investor Domain Components (`src/features/investors/components/`)
```
src/features/investors/components/
├── list/
│   ├── InvestorTable.tsx
│   ├── InvestorCard.tsx
│   ├── InvestorFilters.tsx
│   └── index.ts
├── forms/
│   ├── InvestorDialog.tsx
│   ├── InvestorForm.tsx
│   ├── BulkUploadDialog.tsx
│   └── index.ts
├── profile/
│   ├── InvestorProfile.tsx
│   ├── ProfileSummary.tsx
│   ├── InvestmentHistory.tsx
│   └── index.ts
├── kyc/
│   ├── KYCVerification.tsx
│   ├── KYCStatusBadge.tsx
│   ├── DocumentUpload.tsx
│   └── index.ts
├── onboarding/
│   ├── OnboardingFlow.tsx
│   ├── OnboardingSteps.tsx
│   ├── WelcomeStep.tsx
│   ├── ProfileStep.tsx
│   ├── DocumentStep.tsx
│   ├── VerificationStep.tsx
│   └── index.ts
└── index.ts
```

#### 3. Project Domain Components (`src/features/projects/components/`)
```
src/features/projects/components/
├── list/
│   ├── ProjectsList.tsx
│   ├── ProjectCard.tsx
│   ├── ProjectFilters.tsx
│   └── index.ts
├── forms/
│   ├── ProjectDialog.tsx
│   ├── ProjectForm.tsx
│   ├── ProjectWizard.tsx
│   └── index.ts
├── details/
│   ├── ProjectDetails.tsx
│   ├── ProjectOverview.tsx
│   ├── ProjectMetrics.tsx
│   ├── ProjectTimeline.tsx
│   └── index.ts
├── management/
│   ├── ProjectSettings.tsx
│   ├── ProjectTeam.tsx
│   ├── ProjectDocuments.tsx
│   └── index.ts
└── index.ts
```

### Component Migration Process

#### Step 1: Create Domain Component Structure (Day 1)
```bash
# Create all domain component directories
for domain in auth investors projects tokens compliance captable redemption documents wallet reporting; do
  mkdir -p src/features/$domain/components
done

# Create logical subdirectories for each domain
mkdir -p src/features/auth/components/{forms,mfa,profile,guards}
mkdir -p src/features/investors/components/{list,forms,profile,kyc,onboarding}
mkdir -p src/features/projects/components/{list,forms,details,management}
# Continue for all domains...
```

#### Step 2: Move Components to Domain Folders (Day 2-3)
```bash
# Example moves
mv src/components/auth/LoginForm.tsx src/features/auth/components/forms/
mv src/components/auth/SignUpForm.tsx src/features/auth/components/forms/
mv src/components/investors/InvestorTable.tsx src/features/investors/components/list/
mv src/components/investors/InvestorDialog.tsx src/features/investors/components/forms/
# Continue for all components...
```

#### Step 3: Update Component Imports (Day 3-4)
Create automated script to update imports:
```typescript
// scripts/updateComponentImports.ts
const componentMoves = {
  // Old path -> New path
  '@/components/auth/LoginForm': '@/features/auth/components/forms/LoginForm',
  '@/components/investors/InvestorTable': '@/features/investors/components/list/InvestorTable',
  '@/components/projects/ProjectCard': '@/features/projects/components/list/ProjectCard',
  // ... all component moves
};

function updateImports(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  for (const [oldPath, newPath] of Object.entries(componentMoves)) {
    // Update named imports
    const importRegex = new RegExp(`import\\s*{([^}]+)}\\s*from\\s*['"]${oldPath}['"]`, 'g');
    content = content.replace(importRegex, `import { $1 } from '${newPath}'`);
    
    // Update default imports
    const defaultImportRegex = new RegExp(`import\\s+([^\\s]+)\\s+from\\s*['"]${oldPath}['"]`, 'g');
    content = content.replace(defaultImportRegex, `import $1 from '${newPath}'`);
  }
  
  fs.writeFileSync(filePath, content);
}

// Run on all TypeScript files
const files = glob.sync('src/**/*.{ts,tsx}');
files.forEach(updateImports);
```

#### Step 4: Update Component Dependencies (Day 4-5)
Update each moved component to use domain-local dependencies:

**Before:**
```typescript
// src/features/investors/components/forms/InvestorDialog.tsx
import { Investor } from '@/types/centralModels';
import { createInvestor, updateInvestor } from '@/services/investor/investors';
import { useInvestorState } from '@/hooks/useInvestorState';
```

**After:**
```typescript
// src/features/investors/components/forms/InvestorDialog.tsx
import { Investor, CreateInvestorData } from '../../types';
import { useInvestors } from '../../hooks';
import { investorSchema } from '../../validation';
```

### Component Interface Standardization

#### 1. Standard Component Props Pattern
```typescript
// Base props for all domain components
interface BaseDomainComponentProps {
  className?: string;
  'data-testid'?: string;
}

// List component props
interface DomainListProps<T> extends BaseDomainComponentProps {
  items: T[];
  loading?: boolean;
  error?: string | null;
  onItemSelect?: (item: T) => void;
  onItemEdit?: (item: T) => void;
  onItemDelete?: (item: T) => void;
}

// Form component props
interface DomainFormProps<T> extends BaseDomainComponentProps {
  initialData?: Partial<T>;
  onSubmit: (data: T) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  isLoading?: boolean;
}

// Dialog component props
interface DomainDialogProps<T> extends BaseDomainComponentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit' | 'view';
  initialData?: T;
  onSubmit?: (data: T) => Promise<void>;
}
```

#### 2. Standard Component Structure
```typescript
export const DomainComponent: React.FC<DomainComponentProps> = ({
  prop1,
  prop2,
  className,
  'data-testid': testId,
  ...props
}) => {
  // 1. Hooks (domain hooks first, then utility hooks)
  const { data, actions } = useDomainHook();
  const [localState, setLocalState] = useState();
  
  // 2. Derived state and memoized values
  const computedValue = useMemo(() => {
    return expensiveComputation(data);
  }, [data]);
  
  // 3. Event handlers
  const handleAction = useCallback(async () => {
    try {
      await actions.performAction();
    } catch (error) {
      // Handle error
    }
  }, [actions]);
  
  // 4. Effects
  useEffect(() => {
    // Side effects
  }, []);
  
  // 5. Render
  return (
    <div 
      className={cn('default-styles', className)}
      data-testid={testId}
      {...props}
    >
      {/* Component content */}
    </div>
  );
};

// 6. Display name for debugging
DomainComponent.displayName = 'DomainComponent';
```

#### 3. Component Testing Pattern
```typescript
// Domain component test utilities
const renderDomainComponent = (
  component: React.ReactElement,
  options?: RenderOptions
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <DomainProvider>
      <QueryClient client={testQueryClient}>
        {children}
      </QueryClient>
    </DomainProvider>
  );
  
  return render(component, {
    wrapper: Wrapper,
    ...options
  });
};

// Example component test
describe('InvestorDialog', () => {
  it('should create investor when form is submitted', async () => {
    const onSubmit = jest.fn();
    
    renderDomainComponent(
      <InvestorDialog
        open={true}
        mode="create"
        onSubmit={onSubmit}
        onOpenChange={() => {}}
      />
    );
    
    // Fill form
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'John Doe' }
    });
    
    // Submit
    fireEvent.click(screen.getByRole('button', { name: /create/i }));
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'John Doe'
        })
      );
    });
  });
});
```

### Component Index Files

Each domain component directory needs organized exports:

```typescript
// src/features/investors/components/index.ts
export * from './list';
export * from './forms';
export * from './profile';
export * from './kyc';
export * from './onboarding';

// src/features/investors/components/list/index.ts
export { InvestorTable } from './InvestorTable';
export { InvestorCard } from './InvestorCard';
export { InvestorFilters } from './InvestorFilters';

// src/features/investors/index.ts
export * from './components';
export * from './hooks';
export * from './types';
export * from './services';
export * from './utils';
```

### Shared Component Guidelines

#### Components That Stay in Shared
- Base UI components (Button, Input, Modal, etc.)
- Layout components (Header, Sidebar, Footer)
- Common utility components (LoadingSpinner, ErrorBoundary)
- Generic form components (DatePicker, FileUpload)

#### Components That Move to Domains
- Business logic components
- Domain-specific forms and dialogs
- Data display components
- Workflow components

### Validation and Testing

#### 1. Component Migration Verification
```typescript
// scripts/verifyComponentMigration.ts
function verifyAllComponentsMoved() {
  const oldComponentDirs = [
    'src/components/auth',
    'src/components/investors',
    'src/components/projects',
    // ... other old directories
  ];
  
  const remainingComponents = oldComponentDirs
    .filter(dir => fs.existsSync(dir))
    .map(dir => fs.readdirSync(dir))
    .flat();
  
  if (remainingComponents.length > 0) {
    throw new Error(`Components not moved: ${remainingComponents.join(', ')}`);
  }
}
```

#### 2. Import Validation
```typescript
// scripts/validateComponentImports.ts
function validateNoOldImports() {
  const files = glob.sync('src/**/*.{ts,tsx}');
  const oldImportPattern = /@\/components\/(auth|investors|projects|tokens|compliance|captable|redemption|documents|wallet|reporting)\//;
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    if (oldImportPattern.test(content)) {
      throw new Error(`Old component import found in ${file}`);
    }
  });
}
```

#### 3. Component Functionality Testing
```bash
# Run full test suite to ensure functionality preserved
npm run test:components

# Run specific domain tests
npm run test src/features/auth/components
npm run test src/features/investors/components
```

### Acceptance Criteria
- [ ] All components moved to appropriate domain folders
- [ ] Component imports updated throughout codebase
- [ ] No components importing from centralized locations
- [ ] All components use domain-local types, hooks, and services
- [ ] Component structure follows established patterns
- [ ] Comprehensive test coverage maintained
- [ ] No functionality regressions
- [ ] Index files provide organized exports
- [ ] Documentation updated

### Deliverables
1. Reorganized component structure for all domains
2. Updated component imports throughout codebase
3. Component migration scripts and verification tools
4. Updated component testing utilities
5. Component organization documentation

### Time Estimate: 5 days (40 hours)
- Day 1: Create domain component structure (8 hours)
- Day 2: Move auth and investor components (8 hours)
- Day 3: Move project, token, captable components (8 hours)
- Day 4: Move remaining components and update imports (8 hours)
- Day 5: Testing, validation, documentation (8 hours)
