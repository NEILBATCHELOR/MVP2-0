# Captable Domain Migration Strategy

## Overview

This document outlines the comprehensive strategy for migrating captable components from the centralized architecture (`/src/components/captable/`) to the domain-local dependency architecture (`/src/features/captable/` and `/src/shared/`), following the Coding Best Practice guidelines.

## Migration Goals

- **Domain Isolation:** Contain captable logic within its dedicated domain
- **Reduced Coupling:** Create clear interfaces with other domains
- **Improved Maintainability:** Group related components logically
- **Enhanced Testability:** Enable isolated component testing
- **Better Organization:** Follow feature-based folder structure

## Current State Analysis

### Source Directory: `/src/components/captable/`
- **Total Files:** 38 components
- **Complexity Range:** Simple forms (50 lines) to complex managers (1200+ lines)
- **Key Dependencies:** 
  - `@/components/ui/*` (UI components)
  - `@/infrastructure/supabase` (Database access)
  - `@/types/centralModels` (Business types)
- **Cross-Domain Dependencies:**
  - Investor management
  - Token operations
  - Project data
  - Document management

### Target Architecture

```
src/features/captable/
├── components/
│   ├── managers/           # Core business logic components
│   ├── dialogs/           # Modal dialogs and forms
│   ├── tables/            # Data display tables
│   ├── dashboard/         # Dashboard and reporting
│   ├── forms/             # Input forms
│   ├── panels/            # Side panels and widgets
│   ├── navigation/        # Navigation components
│   ├── tools/             # Planning and modeling tools
│   └── misc/              # Supporting components
├── hooks/                 # Domain-specific React hooks
├── services/              # Business logic services
├── types/                 # Domain type definitions
├── utils/                 # Domain utility functions
├── validation/            # Form validation schemas
├── mappers/               # Data transformation
└── pages/                 # Page-level components
```

## Migration Phases

### Phase 1: Foundation Setup (Week 1)
**Priority:** Critical
**Estimated Time:** 5 days

#### Task 1.1: Domain Structure Creation
```bash
# Create domain directory structure
mkdir -p src/features/captable/{components/{managers,dialogs,tables,dashboard,forms,panels,navigation,tools,misc},hooks,services,types,utils,validation,mappers,pages}

# Create index files for organized exports
touch src/features/captable/{components,hooks,services,types,utils,validation,mappers,pages}/index.ts
```

#### Task 1.2: Types Migration
**Source → Target:**
- `types.ts` → `src/features/captable/types/captableTypes.ts`

**Changes Required:**
```typescript
// OLD: src/components/captable/types.ts
import { TokenAllocation } from '@/types/centralModels';

// NEW: src/features/captable/types/captableTypes.ts  
export interface CaptableAllocation {
  id: string;
  investorName: string;
  investorEmail?: string;
  tokenType: string;
  allocatedAmount: number;
  subscribedAmount: number;
  walletAddress?: string;
  allocationConfirmed: boolean;
  // Add domain-specific fields
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionData {
  // Define subscription-specific types
}

export interface DistributionData {
  // Define distribution-specific types
}
```

#### Task 1.3: Service Layer Creation
**Services to Create:**

```typescript
// src/features/captable/services/subscriptionService.ts
export class SubscriptionService {
  async getProjectSubscriptions(projectId: string): Promise<Subscription[]> {}
  async createSubscription(data: CreateSubscriptionData): Promise<Subscription> {}
  async updateSubscription(id: string, data: UpdateSubscriptionData): Promise<Subscription> {}
  async deleteSubscription(id: string): Promise<void> {}
  async confirmSubscriptions(ids: string[], projectId: string): Promise<void> {}
}

// src/features/captable/services/allocationService.ts
export class AllocationService {
  async getTokenAllocations(projectId: string): Promise<TokenAllocation[]> {}
  async createAllocation(data: CreateAllocationData): Promise<TokenAllocation> {}
  async updateAllocation(id: string, data: UpdateAllocationData): Promise<TokenAllocation> {}
  async confirmAllocations(ids: string[]): Promise<void> {}
}

// src/features/captable/services/distributionService.ts
export class DistributionService {
  async getDistributions(projectId: string): Promise<Distribution[]> {}
  async createDistribution(data: CreateDistributionData): Promise<Distribution> {}
  async processDistribution(id: string): Promise<void> {}
}

// src/features/captable/services/mintingService.ts
export class MintingService {
  async mintTokens(data: MintingData): Promise<MintingResult> {}
  async getMintingHistory(projectId: string): Promise<MintingHistory[]> {}
}

// src/features/captable/services/reportingService.ts
export class ReportingService {
  async generateCapTableReport(projectId: string): Promise<CapTableReport> {}
  async exportCapTableData(format: ExportFormat): Promise<Blob> {}
}
```

### Phase 2: Core Management Components (Week 2-3)
**Priority:** Critical
**Estimated Time:** 10 days

#### Task 2.1: SubscriptionManager Migration
**Source:** `SubscriptionManager.tsx` (800+ lines)
**Target:** `src/features/captable/components/managers/SubscriptionManager.tsx`

**Migration Steps:**
1. **Extract Business Logic:**
   ```typescript
   // Extract to useSubscriptions hook
   const {
     subscriptions,
     isLoading,
     selectedSubscriptionIds,
     handleAddSubscription,
     handleUpdateSubscription,
     handleDeleteSubscription,
     handleConfirmSubscriptions
   } = useSubscriptions(projectId);
   ```

2. **Update Import Paths:**
   ```typescript
   // OLD
   import { useToast } from "@/components/ui/use-toast";
   import { supabase } from "@/infrastructure/supabase";
   
   // NEW
   import { useToast } from "@/shared/components/ui/use-toast";
   import { supabase } from "@/shared/infrastructure/supabase";
   import { useSubscriptions } from "../../hooks/useSubscriptions";
   import { SubscriptionService } from "../../services/subscriptionService";
   ```

3. **Component Refactoring:**
   - Split large component into smaller, focused components
   - Extract table logic to `SubscriptionTable` component
   - Extract filtering logic to `SubscriptionFilters` component
   - Move bulk operations to separate component

#### Task 2.2: TokenAllocationManager Migration
**Source:** `TokenAllocationManager.tsx` (1200+ lines)
**Target:** `src/features/captable/components/managers/TokenAllocationManager.tsx`

**Migration Steps:**
1. **Component Decomposition:**
   ```typescript
   // Main manager component
   const TokenAllocationManager = ({ projectId }) => {
     const { allocations, isLoading } = useTokenAllocations(projectId);
     
     return (
       <div>
         <AllocationFilters />
         <AllocationTable allocations={allocations} />
         <AllocationSummary />
       </div>
     );
   };
   
   // Extract to separate components
   - AllocationFilters.tsx
   - AllocationTable.tsx  
   - AllocationSummary.tsx
   - AllocationBulkActions.tsx
   ```

2. **Hook Extraction:**
   ```typescript
   // src/features/captable/hooks/useTokenAllocations.ts
   export const useTokenAllocations = (projectId: string) => {
     const [allocations, setAllocations] = useState([]);
     const [isLoading, setIsLoading] = useState(true);
     
     const allocationService = useMemo(() => new AllocationService(), []);
     
     const fetchAllocations = useCallback(async () => {
       const data = await allocationService.getTokenAllocations(projectId);
       setAllocations(data);
     }, [projectId, allocationService]);
     
     return {
       allocations,
       isLoading,
       fetchAllocations,
       updateAllocation: allocationService.updateAllocation,
       confirmAllocations: allocationService.confirmAllocations
     };
   };
   ```

### Phase 3: Dialog Components (Week 4)
**Priority:** High
**Estimated Time:** 5 days

#### Dialog Components Migration Table

| Source File | Target Location | Complexity | Key Changes |
|------------|----------------|------------|-------------|
| `SubscriptionDialog.tsx` | `dialogs/SubscriptionDialog.tsx` | Medium | Update imports, use domain hooks |
| `SubscriptionUploadDialog.tsx` | `dialogs/SubscriptionUploadDialog.tsx` | Medium | Extract upload service |
| `SubscriptionExportDialog.tsx` | `dialogs/SubscriptionExportDialog.tsx` | Medium | Use domain export service |
| `SubscriptionConfirmationDialog.tsx` | `dialogs/SubscriptionConfirmationDialog.tsx` | Low | Minimal changes |
| `TokenAllocationUploadDialog.tsx` | `dialogs/TokenAllocationUploadDialog.tsx` | Medium | Extract upload logic |
| `TokenAllocationExportDialog.tsx` | `dialogs/TokenAllocationExportDialog.tsx` | Medium | Use export service |
| `AllocationConfirmationDialog.tsx` | `dialogs/AllocationConfirmationDialog.tsx` | Low | Update hooks |
| `TokenDistributionDialog.tsx` | `dialogs/TokenDistributionDialog.tsx` | Medium | Use distribution service |
| `TokenMintingDialog.tsx` | `dialogs/TokenMintingDialog.tsx` | Medium | Use minting service |
| `InvestorDialog.tsx` | `dialogs/InvestorDialog.tsx` | Medium | **Consider moving to investors domain** |
| `InvestorImportDialog.tsx` | `dialogs/InvestorImportDialog.tsx` | Medium | **Consider moving to investors domain** |
| `BulkStatusUpdateDialog.tsx` | `dialogs/BulkStatusUpdateDialog.tsx` | Low | Generic bulk update |
| `TagsDialog.tsx` | `dialogs/TagsDialog.tsx` | Low | Tag management |

**Standard Migration Pattern for Dialogs:**
```typescript
// OLD Pattern
import { Button } from "@/components/ui/button";
import { supabase } from "@/infrastructure/supabase";

// NEW Pattern  
import { Button } from "@/shared/components/ui/button";
import { useSubscriptions } from "../../hooks/useSubscriptions";
import { SubscriptionService } from "../../services/subscriptionService";

const SubscriptionDialog = ({ open, onOpenChange, onSubmit, projectId }) => {
  const { createSubscription } = useSubscriptions(projectId);
  
  // Component logic remains the same
  // Only imports and service usage changes
};
```

### Phase 4: Table & Display Components (Week 5)
**Priority:** High
**Estimated Time:** 3 days

#### Task 4.1: Table Components Migration

| Source File | Target Location | Complexity | Migration Notes |
|------------|----------------|------------|----------------|
| `InvestorTable.tsx` | **DECISION NEEDED** | Medium | Move to `investors` domain or keep reference |
| `TokenAllocationTable.tsx` | `tables/TokenAllocationTable.tsx` | High | Complex table with inline editing |

**TokenAllocationTable Migration:**
```typescript
// Extract table logic to separate hook
const useAllocationTable = () => {
  const [sortColumn, setSortColumn] = useState('investorName');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filters, setFilters] = useState({});
  
  const handleSort = useCallback((column) => {
    if (sortColumn === column) {
      setSortDirection(direction === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  }, [sortColumn, sortDirection]);
  
  return { sortColumn, sortDirection, filters, handleSort };
};
```

### Phase 5: Dashboard & Reporting (Week 5)
**Priority:** Medium
**Estimated Time:** 3 days

#### Dashboard Components Migration

| Source File | Target Location | Complexity | Dependencies |
|------------|----------------|------------|-------------|
| `CapTableDashboard.tsx` | `dashboard/CapTableDashboard.tsx` | Medium | Projects, Investors |
| `CapTableView.tsx` | `dashboard/CapTableView.tsx` | Medium | Display aggregation |
| `CapTableSummary.tsx` | `dashboard/CapTableSummary.tsx` | Medium | Data summarization |
| `CapTableReports.tsx` | `dashboard/CapTableReports.tsx` | Medium | Report generation |
| `CapTableReportExport.tsx` | `dashboard/CapTableReportExport.tsx` | Medium | Export functionality |

**Dashboard Migration Pattern:**
```typescript
// Create dashboard-specific hooks
const useCapTableDashboard = (projectId: string) => {
  const { subscriptions } = useSubscriptions(projectId);
  const { allocations } = useTokenAllocations(projectId);
  const { distributions } = useDistributions(projectId);
  
  const summary = useMemo(() => ({
    totalSubscriptions: subscriptions.length,
    totalAllocations: allocations.length,
    totalDistributed: distributions.filter(d => d.completed).length,
    // ... other calculations
  }), [subscriptions, allocations, distributions]);
  
  return { summary };
};
```

### Phase 6: Supporting Components (Week 6)
**Priority:** Low
**Estimated Time:** 4 days

#### Supporting Components Migration

| Source File | Target Location | Complexity | Notes |
|------------|----------------|------------|--------|
| `TokenAllocationForm.tsx` | `forms/TokenAllocationForm.tsx` | Medium | Form validation |
| `BulkOperationsMenu.tsx` | `misc/BulkOperationsMenu.tsx` | Low | Menu component |
| `ProjectSelector.tsx` | `misc/ProjectSelector.tsx` | Low | **Consider moving to shared** |
| `CompliancePanel.tsx` | `panels/CompliancePanel.tsx` | Medium | **Cross-domain dependency** |
| `DocumentManager.tsx` | `panels/DocumentManager.tsx` | Medium | **Cross-domain dependency** |
| `ScenarioPlanner.tsx` | `tools/ScenarioPlanner.tsx` | Medium | Planning tool |
| `WaterfallModel.tsx` | `tools/WaterfallModel.tsx` | Medium | Financial modeling |
| `CapTableNavigation.tsx` | `navigation/CapTableNavigation.tsx` | Low | Navigation |
| `TokenMintingPanel.tsx` | `panels/TokenMintingPanel.tsx` | Medium | Panel component |

### Phase 7: Domain Hooks Creation (Week 2-6)
**Priority:** Critical (Created alongside components)

#### Hook Structure

```typescript
// src/features/captable/hooks/index.ts
export { useSubscriptions } from './useSubscriptions';
export { useTokenAllocations } from './useTokenAllocations';
export { useDistributions } from './useDistributions';
export { useMinting } from './useMinting';
export { useCapTableData } from './useCapTableData';
export { useBulkOperations } from './useBulkOperations';
export { useCapTableReports } from './useCapTableReports';

// src/features/captable/hooks/useSubscriptions.ts
export const useSubscriptions = (projectId: string) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const subscriptionService = useMemo(() => new SubscriptionService(), []);
  
  const fetchSubscriptions = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const data = await subscriptionService.getProjectSubscriptions(projectId);
      setSubscriptions(data);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, subscriptionService]);
  
  const createSubscription = useCallback(async (data: CreateSubscriptionData) => {
    const subscription = await subscriptionService.createSubscription(data);
    setSubscriptions(prev => [...prev, subscription]);
    return subscription;
  }, [subscriptionService]);
  
  const updateSubscription = useCallback(async (id: string, data: UpdateSubscriptionData) => {
    const updated = await subscriptionService.updateSubscription(id, data);
    setSubscriptions(prev => prev.map(s => s.id === id ? updated : s));
    return updated;
  }, [subscriptionService]);
  
  const deleteSubscription = useCallback(async (id: string) => {
    await subscriptionService.deleteSubscription(id);
    setSubscriptions(prev => prev.filter(s => s.id !== id));
  }, [subscriptionService]);
  
  const confirmSubscriptions = useCallback(async (ids: string[]) => {
    await subscriptionService.confirmSubscriptions(ids, projectId);
    await fetchSubscriptions(); // Refresh data
  }, [subscriptionService, projectId, fetchSubscriptions]);
  
  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);
  
  return {
    subscriptions,
    isLoading,
    selectedIds,
    setSelectedIds,
    fetchSubscriptions,
    createSubscription,
    updateSubscription, 
    deleteSubscription,
    confirmSubscriptions
  };
};
```

### Phase 8: Pages Creation (Week 6)
**Priority:** Low
**Estimated Time:** 2 days

#### Page Components

```typescript
// src/features/captable/pages/SubscriptionsPage.tsx
export const SubscriptionsPage = () => {
  const { projectId } = useParams();
  
  return (
    <div className="space-y-6">
      <SubscriptionManager projectId={projectId} />
    </div>
  );
};

// src/features/captable/pages/TokenAllocationsPage.tsx
export const TokenAllocationsPage = () => {
  const { projectId } = useParams();
  
  return (
    <div className="space-y-6">
      <TokenAllocationManager projectId={projectId} />
    </div>
  );
};

// src/features/captable/pages/CapTableDashboardPage.tsx
export const CapTableDashboardPage = () => {
  const { projectId } = useParams();
  
  return (
    <div className="space-y-6">
      <CapTableDashboard projectId={projectId} />
    </div>
  );
};
```

## Cross-Domain Dependencies Resolution

### 1. Investor Domain Dependencies

**Current Issue:** 
- `InvestorTable.tsx` and `InvestorDialog.tsx` are in captable but should belong to investors domain

**Resolution Strategy:**
```typescript
// Option A: Move to investors domain
// Move InvestorTable.tsx → src/features/investors/components/tables/InvestorTable.tsx  
// Move InvestorDialog.tsx → src/features/investors/components/dialogs/InvestorDialog.tsx

// Option B: Create interface in captable domain
// src/features/captable/types/investorInterface.ts
export interface InvestorReference {
  id: string;
  name: string;
  email: string;
  walletAddress?: string;
}

// Use cross-domain query service
const { investors } = useCrossDomainQuery('investors', 'getInvestorsByProject', { projectId });
```

**Recommended:** Option A - Move investor components to investors domain

### 2. Projects Domain Dependencies

**Current Issue:**
- `ProjectSelector.tsx` requires project data

**Resolution Strategy:**
```typescript
// Move to shared components or use cross-domain interface
// src/shared/components/selectors/ProjectSelector.tsx

// Or use project references
export interface ProjectReference {
  id: string;
  name: string;
  status: string;
}

const { projects } = useCrossDomainQuery('projects', 'getProjectReferences');
```

### 3. Token Domain Dependencies

**Current Issue:**
- Token operations scattered throughout captable components

**Resolution Strategy:**
```typescript
// Create token interface for captable domain
export interface TokenOperationInterface {
  mintTokens(data: MintingData): Promise<MintingResult>;
  getTokenInfo(tokenId: string): Promise<TokenInfo>;
  validateTokenAllocation(data: AllocationData): Promise<ValidationResult>;
}

// Captable domain uses token operations through interface
const tokenOperations = useTokenOperations();
await tokenOperations.mintTokens(mintingData);
```

### 4. Document Domain Dependencies

**Current Issue:**
- `DocumentManager.tsx` in captable manages documents

**Resolution Strategy:**
```typescript
// Option A: Move to documents domain
// Option B: Create document interface for captable
export interface DocumentInterface {
  getProjectDocuments(projectId: string): Promise<Document[]>;
  uploadDocument(data: UploadData): Promise<Document>;
}

// Use in captable
const { documents } = useDocuments(projectId);
```

## Import Path Updates

### Standard Import Transformations

```typescript
// UI Components
// OLD: @/components/ui/button
// NEW: @/shared/components/ui/button

// Infrastructure  
// OLD: @/infrastructure/supabase
// NEW: @/shared/infrastructure/supabase

// Types
// OLD: @/types/centralModels  
// NEW: ../types/captableTypes (or @/features/captable/types)

// Services
// OLD: Direct supabase calls in components
// NEW: ../services/subscriptionService

// Hooks
// OLD: Custom hooks in components
// NEW: ../hooks/useSubscriptions
```

### Import Update Script

```typescript
// scripts/updateCaptableImports.ts
const importTransformations = {
  '@/components/ui/': '@/shared/components/ui/',
  '@/infrastructure/supabase': '@/shared/infrastructure/supabase',
  '@/types/centralModels': '../types/captableTypes',
  // Add other transformations
};

function updateImports(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  for (const [oldPath, newPath] of Object.entries(importTransformations)) {
    content = content.replace(new RegExp(oldPath, 'g'), newPath);
  }
  
  fs.writeFileSync(filePath, content);
}
```

## Testing Strategy

### 1. Component Testing
```typescript
// src/features/captable/components/__tests__/SubscriptionManager.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { SubscriptionManager } from '../managers/SubscriptionManager';
import { CaptableProvider } from '../../context/CaptableProvider';

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <CaptableProvider>
      {component}
    </CaptableProvider>
  );
};

describe('SubscriptionManager', () => {
  it('should load and display subscriptions', async () => {
    renderWithProvider(<SubscriptionManager projectId="test-project" />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Subscription Management')).toBeInTheDocument();
    });
  });
});
```

### 2. Hook Testing
```typescript
// src/features/captable/hooks/__tests__/useSubscriptions.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useSubscriptions } from '../useSubscriptions';

describe('useSubscriptions', () => {
  it('should fetch subscriptions for project', async () => {
    const { result } = renderHook(() => useSubscriptions('test-project'));
    
    expect(result.current.isLoading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.subscriptions).toHaveLength(2);
  });
});
```

### 3. Service Testing
```typescript
// src/features/captable/services/__tests__/subscriptionService.test.ts
import { SubscriptionService } from '../subscriptionService';

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  
  beforeEach(() => {
    service = new SubscriptionService();
  });
  
  it('should create subscription', async () => {
    const data = { projectId: 'test', investorId: 'investor1', amount: 1000 };
    const result = await service.createSubscription(data);
    
    expect(result.id).toBeDefined();
    expect(result.amount).toBe(1000);
  });
});
```

## Performance Considerations

### 1. Code Splitting
```typescript
// Lazy load heavy components
const TokenAllocationManager = lazy(() => 
  import('./components/managers/TokenAllocationManager')
);

const CapTableDashboard = lazy(() => 
  import('./components/dashboard/CapTableDashboard')
);
```

### 2. Hook Optimization
```typescript
// Use React Query for caching
export const useSubscriptions = (projectId: string) => {
  return useQuery({
    queryKey: ['subscriptions', projectId],
    queryFn: () => subscriptionService.getProjectSubscriptions(projectId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
```

### 3. Component Memoization
```typescript
// Memoize expensive components
const TokenAllocationTable = memo(({ allocations, onUpdate }) => {
  // Table rendering logic
});

// Use callback optimization
const SubscriptionManager = ({ projectId }) => {
  const handleUpdate = useCallback((id, data) => {
    // Update logic
  }, []);
  
  return <SubscriptionTable onUpdate={handleUpdate} />;
};
```

## Risk Mitigation

### 1. Gradual Migration
- Migrate one component type at a time
- Keep original components until new ones are tested
- Use feature flags to switch between old and new components

### 2. Functionality Preservation
- Maintain exact same user experience
- Comprehensive testing after each migration phase
- User acceptance testing for critical workflows

### 3. Rollback Strategy
```typescript
// Keep original components as backup
// src/components/captable-backup/
// Quick rollback by updating import paths

// Feature flag implementation
const USE_NEW_CAPTABLE = process.env.REACT_APP_USE_NEW_CAPTABLE === 'true';

export const CaptableManager = USE_NEW_CAPTABLE 
  ? NewCaptableManager 
  : LegacyCaptableManager;
```

### 4. Integration Testing
- Test cross-domain communication
- Verify data flow between components
- Performance regression testing

## Success Metrics

### Technical Metrics
- [ ] **Reduced Coupling:** <20% cross-domain dependencies
- [ ] **Improved Test Coverage:** >90% per component
- [ ] **Bundle Size:** No increase in total bundle size
- [ ] **Build Time:** No regression in build performance

### Development Metrics
- [ ] **Component Isolation:** Each component can be developed independently
- [ ] **Testing Efficiency:** Unit tests run in <10 seconds
- [ ] **Code Reusability:** Services shared within domain
- [ ] **Maintainability:** New features can be added without touching other domains

### Business Metrics
- [ ] **Feature Parity:** 100% functionality preserved
- [ ] **Performance:** No degradation in user experience
- [ ] **Reliability:** Zero bugs introduced during migration
- [ ] **User Experience:** Identical interface and workflows

## Implementation Checklist

### Pre-Migration Setup
- [ ] Create migration branch
- [ ] Set up domain directory structure
- [ ] Create base index files
- [ ] Set up testing framework for domain

### Phase 1: Foundation (Week 1)
- [ ] Migrate types to domain
- [ ] Create service layer
- [ ] Set up domain hooks structure
- [ ] Create shared infrastructure imports

### Phase 2: Core Components (Week 2-3)
- [ ] Migrate SubscriptionManager
- [ ] Extract subscription hooks and services
- [ ] Migrate TokenAllocationManager
- [ ] Extract allocation hooks and services
- [ ] Test core functionality

### Phase 3: Supporting Components (Week 4-5)
- [ ] Migrate all dialog components
- [ ] Migrate table components
- [ ] Migrate dashboard components
- [ ] Test UI interactions

### Phase 4: Cleanup (Week 6)
- [ ] Migrate remaining components
- [ ] Update all import paths
- [ ] Resolve cross-domain dependencies
- [ ] Comprehensive testing
- [ ] Performance optimization
- [ ] Documentation updates

### Post-Migration
- [ ] Remove old components
- [ ] Update routing
- [ ] Deploy to staging
- [ ] User acceptance testing
- [ ] Production deployment

## Benefits Achieved

### 1. Domain Isolation
- Captable logic contained within its domain
- Clear boundaries with other business domains
- Reduced risk of unintended side effects

### 2. Improved Organization
- Related components grouped logically
- Easier to find and modify captable features
- Clear separation of concerns

### 3. Enhanced Testability
- Components can be tested in isolation
- Easier to mock dependencies
- Faster test execution

### 4. Better Maintainability
- Changes isolated to specific domains
- Reduced coupling between features
- Easier onboarding for new developers

### 5. Increased Reusability
- Services can be shared within domain
- Hooks provide consistent data access patterns
- Components can be composed more easily

## Future Enhancements

### 1. Advanced Features
- Real-time collaboration on cap table
- Advanced financial modeling tools
- Integration with external accounting systems

### 2. Performance Optimizations
- Virtual scrolling for large datasets
- Background data synchronization
- Optimistic updates for better UX

### 3. Domain Expansion
- Cap table versioning and history
- Advanced reporting and analytics
- Automated compliance checking

---

**Migration Lead:** [Assign team member]
**Review Date:** [Set review schedule]
**Target Completion:** 6 weeks from start date

This migration strategy provides a comprehensive roadmap for transforming the captable feature from centralized to domain-local architecture while maintaining all functionality and improving code organization.
