# Phase 3 Tasks: Dependency Resolution

## Task 3.1: Implement Cross-Domain Interfaces

### Overview
Create standardized interfaces and communication patterns that allow domains to interact without tight coupling, using event-driven architecture and shared abstractions.

### Current State Analysis
**Cross-Domain Communication Issues:**
- Direct imports between unrelated domains
- Tight coupling through shared types
- No standardized communication patterns
- Complex dependency chains
- Circular dependency risks

**Examples of Current Problematic Patterns:**
```typescript
// Bad: Direct cross-domain imports
import { Investor } from '@/features/investors/types';
import { Project } from '@/features/projects/types';
import { Token } from '@/features/tokens/types';

// Component tightly coupled to multiple domains
const CapTableComponent = () => {
  const investors = useInvestors(); // Direct dependency
  const projects = useProjects();   // Direct dependency
  const tokens = useTokens();       // Direct dependency
};
```

### Target Architecture: Event-Driven Communication

#### 1. Domain Event System (`src/shared/events/`)

**Event Bus Implementation:**
```typescript
// src/shared/events/eventBus.ts
export interface DomainEvent<T = any> {
  id: string;
  type: string;
  source: string;
  payload: T;
  timestamp: Date;
  version: string;
  metadata?: Record<string, any>;
}

export interface EventSubscription {
  id: string;
  eventType: string;
  handler: (event: DomainEvent) => Promise<void> | void;
  options?: {
    once?: boolean;
    priority?: number;
  };
}

export class DomainEventBus {
  private subscriptions = new Map<string, EventSubscription[]>();
  private eventHistory: DomainEvent[] = [];
  
  async publish<T>(event: Omit<DomainEvent<T>, 'id' | 'timestamp'>): Promise<void> {
    const fullEvent: DomainEvent<T> = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date()
    };
    
    // Store in history
    this.eventHistory.push(fullEvent);
    
    // Get subscribers for this event type
    const subscribers = this.subscriptions.get(event.type) || [];
    
    // Execute handlers in priority order
    const sortedSubscribers = subscribers.sort((a, b) => 
      (b.options?.priority || 0) - (a.options?.priority || 0)
    );
    
    for (const subscription of sortedSubscribers) {
      try {
        await subscription.handler(fullEvent);
        
        // Remove one-time subscriptions
        if (subscription.options?.once) {
          this.unsubscribe(subscription.id);
        }
      } catch (error) {
        console.error(`Event handler error for ${event.type}:`, error);
      }
    }
  }
  
  subscribe(
    eventType: string,
    handler: (event: DomainEvent) => Promise<void> | void,
    options?: EventSubscription['options']
  ): string {
    const subscription: EventSubscription = {
      id: crypto.randomUUID(),
      eventType,
      handler,
      options
    };
    
    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, []);
    }
    
    this.subscriptions.get(eventType)!.push(subscription);
    return subscription.id;
  }
  
  unsubscribe(subscriptionId: string): void {
    for (const [eventType, subscriptions] of this.subscriptions.entries()) {
      const index = subscriptions.findIndex(sub => sub.id === subscriptionId);
      if (index >= 0) {
        subscriptions.splice(index, 1);
        if (subscriptions.length === 0) {
          this.subscriptions.delete(eventType);
        }
        break;
      }
    }
  }
  
  getEventHistory(eventType?: string): DomainEvent[] {
    if (!eventType) return [...this.eventHistory];
    return this.eventHistory.filter(event => event.type === eventType);
  }
}

// Global event bus instance
export const eventBus = new DomainEventBus();
```

**Event Type Definitions:**
```typescript
// src/shared/events/eventTypes.ts
export namespace AuthEvents {
  export const USER_SIGNED_IN = 'auth.user.signed_in';
  export const USER_SIGNED_OUT = 'auth.user.signed_out';
  export const USER_UPDATED = 'auth.user.updated';
  export const PERMISSION_CHANGED = 'auth.permission.changed';
  
  export interface UserSignedInPayload {
    userId: string;
    email: string;
    role: string;
    sessionId: string;
  }
  
  export interface UserUpdatedPayload {
    userId: string;
    changes: Record<string, any>;
    updatedBy: string;
  }
}

export namespace InvestorEvents {
  export const INVESTOR_CREATED = 'investor.created';
  export const INVESTOR_UPDATED = 'investor.updated';
  export const KYC_STATUS_CHANGED = 'investor.kyc.status_changed';
  export const ACCREDITATION_UPDATED = 'investor.accreditation.updated';
  
  export interface InvestorCreatedPayload {
    investorId: string;
    name: string;
    email: string;
    type: string;
    createdBy: string;
  }
  
  export interface KYCStatusChangedPayload {
    investorId: string;
    oldStatus: string;
    newStatus: string;
    verifiedBy?: string;
    notes?: string;
  }
}

export namespace ProjectEvents {
  export const PROJECT_CREATED = 'project.created';
  export const PROJECT_UPDATED = 'project.updated';
  export const PROJECT_STATUS_CHANGED = 'project.status.changed';
  export const FUNDING_ROUND_STARTED = 'project.funding.round_started';
  
  export interface ProjectCreatedPayload {
    projectId: string;
    name: string;
    type: string;
    ownerId: string;
    organizationId?: string;
  }
}

export namespace TokenEvents {
  export const TOKEN_CREATED = 'token.created';
  export const TOKEN_DEPLOYED = 'token.deployed';
  export const TOKEN_MINTED = 'token.minted';
  export const TOKEN_TRANSFERRED = 'token.transferred';
  
  export interface TokenDeployedPayload {
    tokenId: string;
    contractAddress: string;
    network: string;
    deployedBy: string;
    transactionHash: string;
  }
}

// Continue for all domains...
```

#### 2. Shared Interface Abstractions (`src/shared/interfaces/`)

**Entity References:**
```typescript
// src/shared/interfaces/entityReferences.ts
export interface BaseEntityReference {
  id: string;
  name: string;
  type: string;
}

export interface UserReference extends BaseEntityReference {
  type: 'user';
  email: string;
  role: string;
}

export interface InvestorReference extends BaseEntityReference {
  type: 'investor';
  email: string;
  investorType: string;
  kycStatus: string;
}

export interface ProjectReference extends BaseEntityReference {
  type: 'project';
  status: string;
  projectType: string;
  ownerId: string;
}

export interface TokenReference extends BaseEntityReference {
  type: 'token';
  symbol: string;
  standard: string;
  projectId: string;
  contractAddress?: string;
}

// Reference lookup service
export interface ReferenceService {
  getUserReference(id: string): Promise<UserReference | null>;
  getInvestorReference(id: string): Promise<InvestorReference | null>;
  getProjectReference(id: string): Promise<ProjectReference | null>;
  getTokenReference(id: string): Promise<TokenReference | null>;
}
```

**Domain Capabilities:**
```typescript
// src/shared/interfaces/domainCapabilities.ts
export interface DomainCapability {
  domain: string;
  version: string;
  capabilities: string[];
}

export interface AuthCapabilities extends DomainCapability {
  domain: 'auth';
  capabilities: [
    'user_authentication',
    'session_management',
    'permission_checking',
    'mfa_verification'
  ];
}

export interface InvestorCapabilities extends DomainCapability {
  domain: 'investor';
  capabilities: [
    'investor_management',
    'kyc_verification',
    'accreditation_tracking',
    'risk_assessment'
  ];
}

// Capability registry
export interface CapabilityRegistry {
  register(capability: DomainCapability): void;
  getCapabilities(domain: string): DomainCapability | null;
  hasCapability(domain: string, capability: string): boolean;
  getAllCapabilities(): DomainCapability[];
}
```

#### 3. Cross-Domain Query Interface

**Query Pattern for Cross-Domain Data Access:**
```typescript
// src/shared/interfaces/crossDomainQuery.ts
export interface QueryRequest {
  domain: string;
  operation: string;
  parameters: Record<string, any>;
  requestId: string;
  requestedBy: string;
}

export interface QueryResponse<T = any> {
  requestId: string;
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, any>;
}

export interface DomainQueryHandler {
  domain: string;
  handle(request: QueryRequest): Promise<QueryResponse>;
}

export class CrossDomainQueryService {
  private handlers = new Map<string, DomainQueryHandler>();
  
  registerHandler(handler: DomainQueryHandler): void {
    this.handlers.set(handler.domain, handler);
  }
  
  async query<T>(request: Omit<QueryRequest, 'requestId'>): Promise<QueryResponse<T>> {
    const fullRequest: QueryRequest = {
      ...request,
      requestId: crypto.randomUUID()
    };
    
    const handler = this.handlers.get(request.domain);
    if (!handler) {
      return {
        requestId: fullRequest.requestId,
        success: false,
        error: `No handler registered for domain: ${request.domain}`
      };
    }
    
    try {
      return await handler.handle(fullRequest);
    } catch (error) {
      return {
        requestId: fullRequest.requestId,
        success: false,
        error: error.message
      };
    }
  }
}

// Global query service
export const crossDomainQuery = new CrossDomainQueryService();
```

### Implementation Strategy

#### Phase 3.1.1: Event System Setup (Day 1)
```typescript
// 1. Create event bus infrastructure
// 2. Define standard event types for all domains
// 3. Create event publishing utilities
// 4. Set up event history and debugging

// Example usage in domains:
// src/features/auth/hooks/useAuth.ts
export const useAuth = () => {
  const signIn = async (credentials: LoginCredentials) => {
    const user = await authService.signIn(credentials);
    
    // Publish event for other domains
    await eventBus.publish({
      type: AuthEvents.USER_SIGNED_IN,
      source: 'auth',
      payload: {
        userId: user.id,
        email: user.email,
        role: user.role,
        sessionId: user.sessionId
      }
    });
    
    return user;
  };
};
```

#### Phase 3.1.2: Reference System (Day 2)
```typescript
// Create reference services for each domain
// src/features/investors/services/investorReferenceService.ts
export class InvestorReferenceService implements ReferenceService {
  async getInvestorReference(id: string): Promise<InvestorReference | null> {
    const investor = await investorService.getInvestor(id);
    if (!investor) return null;
    
    return {
      id: investor.id,
      name: investor.name,
      type: 'investor',
      email: investor.email,
      investorType: investor.type,
      kycStatus: investor.kycStatus
    };
  }
}

// Register with global reference service
referenceService.register('investor', new InvestorReferenceService());
```

#### Phase 3.1.3: Query Interface Implementation (Day 3)
```typescript
// Domain query handlers
// src/features/projects/services/projectQueryHandler.ts
export class ProjectQueryHandler implements DomainQueryHandler {
  domain = 'project';
  
  async handle(request: QueryRequest): Promise<QueryResponse> {
    switch (request.operation) {
      case 'get_project_investors':
        return this.getProjectInvestors(request.parameters);
      case 'get_project_tokens':
        return this.getProjectTokens(request.parameters);
      default:
        return {
          requestId: request.requestId,
          success: false,
          error: `Unknown operation: ${request.operation}`
        };
    }
  }
  
  private async getProjectInvestors(params: any): Promise<QueryResponse> {
    const { projectId } = params;
    const investors = await projectService.getProjectInvestors(projectId);
    
    return {
      requestId: params.requestId,
      success: true,
      data: investors.map(investor => ({
        id: investor.id,
        name: investor.name,
        email: investor.email,
        allocation: investor.allocation
      }))
    };
  }
}

// Usage from other domains:
// src/features/captable/hooks/useCapTable.ts
export const useCapTable = (projectId: string) => {
  const [investors, setInvestors] = useState([]);
  
  useEffect(() => {
    const loadInvestors = async () => {
      const response = await crossDomainQuery.query({
        domain: 'project',
        operation: 'get_project_investors',
        parameters: { projectId },
        requestedBy: 'captable'
      });
      
      if (response.success) {
        setInvestors(response.data);
      }
    };
    
    loadInvestors();
  }, [projectId]);
};
```

#### Phase 3.1.4: Event Subscriptions in Domains (Day 4)
```typescript
// Example: Compliance domain reacting to investor events
// src/features/compliance/hooks/useComplianceMonitoring.ts
export const useComplianceMonitoring = () => {
  useEffect(() => {
    // Subscribe to investor KYC changes
    const subscriptionId = eventBus.subscribe(
      InvestorEvents.KYC_STATUS_CHANGED,
      async (event) => {
        const { investorId, newStatus } = event.payload;
        
        if (newStatus === 'failed') {
          // Trigger compliance review
          await complianceService.triggerReview(investorId, 'kyc_failed');
        }
      }
    );
    
    return () => {
      eventBus.unsubscribe(subscriptionId);
    };
  }, []);
};

// Example: Reporting domain aggregating events
// src/features/reporting/hooks/useActivityTracking.ts
export const useActivityTracking = () => {
  useEffect(() => {
    // Subscribe to all domain events for analytics
    const subscriptions = [
      eventBus.subscribe('auth.*', trackAuthActivity),
      eventBus.subscribe('investor.*', trackInvestorActivity),
      eventBus.subscribe('project.*', trackProjectActivity),
      eventBus.subscribe('token.*', trackTokenActivity)
    ];
    
    return () => {
      subscriptions.forEach(id => eventBus.unsubscribe(id));
    };
  }, []);
};
```

### Testing Cross-Domain Communication

#### 1. Event Bus Testing
```typescript
// tests/shared/events/eventBus.test.ts
describe('DomainEventBus', () => {
  let eventBus: DomainEventBus;
  
  beforeEach(() => {
    eventBus = new DomainEventBus();
  });
  
  it('should publish and receive events', async () => {
    const handler = jest.fn();
    
    eventBus.subscribe('test.event', handler);
    
    await eventBus.publish({
      type: 'test.event',
      source: 'test',
      payload: { data: 'test' }
    });
    
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'test.event',
        payload: { data: 'test' }
      })
    );
  });
  
  it('should handle subscription priorities', async () => {
    const calls: number[] = [];
    
    eventBus.subscribe('test.priority', () => calls.push(1), { priority: 1 });
    eventBus.subscribe('test.priority', () => calls.push(3), { priority: 3 });
    eventBus.subscribe('test.priority', () => calls.push(2), { priority: 2 });
    
    await eventBus.publish({
      type: 'test.priority',
      source: 'test',
      payload: {}
    });
    
    expect(calls).toEqual([3, 2, 1]); // Highest priority first
  });
});
```

#### 2. Integration Testing
```typescript
// tests/integration/crossDomainCommunication.test.ts
describe('Cross-Domain Communication', () => {
  it('should handle investor creation workflow', async () => {
    const complianceHandler = jest.fn();
    const reportingHandler = jest.fn();
    
    // Set up event subscriptions
    eventBus.subscribe(InvestorEvents.INVESTOR_CREATED, complianceHandler);
    eventBus.subscribe(InvestorEvents.INVESTOR_CREATED, reportingHandler);
    
    // Create investor (should trigger events)
    const investor = await investorService.createInvestor({
      name: 'Test Investor',
      email: 'test@example.com',
      type: 'individual'
    });
    
    // Verify events were published and handled
    expect(complianceHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        type: InvestorEvents.INVESTOR_CREATED,
        payload: expect.objectContaining({
          investorId: investor.id
        })
      })
    );
    
    expect(reportingHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        type: InvestorEvents.INVESTOR_CREATED
      })
    );
  });
});
```

### Acceptance Criteria
- [ ] Event bus system implemented and tested
- [ ] Standard event types defined for all domains
- [ ] Reference service system created
- [ ] Cross-domain query interface implemented
- [ ] All domains can communicate without direct imports
- [ ] Event publishing and subscription working correctly
- [ ] Integration tests validate cross-domain workflows
- [ ] Documentation provides usage examples
- [ ] Performance benchmarks show acceptable overhead

### Deliverables
1. Complete event bus system with typed events
2. Reference service implementations for all domains
3. Cross-domain query interface and handlers
4. Integration test suite for domain communication
5. Documentation with usage patterns and examples

### Time Estimate: 4 days (32 hours)

---

## Task 3.2: Resolve Circular Dependencies

### Overview
Identify and systematically resolve circular dependencies between domains using dependency inversion, interface segregation, and shared abstractions.

### Current State Analysis
**Circular Dependency Issues:**
- Token domain needs Project types, Project domain needs Token types
- Captable domain depends on Investor, Project, and Token domains
- Compliance domain needs Investor data, Investor domain needs compliance status
- Document domain serves multiple domains that also need document references

**Dependency Analysis Results:**
```
Current Dependency Chains:
Token → Project → Token (circular)
Investor → Compliance → Investor (circular)
Captable → Investor → Project → Token → Captable (complex circular)
Document → Project → Document (circular)
Document → Investor → Document (circular)
```

### Resolution Strategy

#### 1. Dependency Inversion Pattern

**Problem:** Direct type dependencies create cycles
```typescript
// BAD: Circular dependency
// Token domain
import { Project } from '@/features/projects/types';
export interface Token {
  projectId: string;
  project: Project; // Direct dependency on Project domain
}

// Project domain  
import { Token } from '@/features/tokens/types';
export interface Project {
  tokens: Token[]; // Direct dependency on Token domain
}
```

**Solution:** Use abstractions and references
```typescript
// GOOD: Use shared interfaces
// src/shared/interfaces/domainReferences.ts
export interface ProjectTokenRelationship {
  projectId: string;
  tokenId: string;
  relationship: 'primary' | 'utility' | 'governance';
  isActive: boolean;
}

// Token domain - no direct Project import
export interface Token {
  id: string;
  projectId: string; // Reference only
  // No direct project object
}

// Project domain - no direct Token import  
export interface Project {
  id: string;
  // No direct tokens array
}

// Relationship service handles connections
export interface TokenProjectService {
  getProjectTokens(projectId: string): Promise<TokenReference[]>;
  getTokenProject(tokenId: string): Promise<ProjectReference | null>;
  linkTokenToProject(tokenId: string, projectId: string): Promise<void>;
}
```

#### 2. Interface Segregation

**Extract minimal interfaces for cross-domain usage:**
```typescript
// src/shared/interfaces/segregatedInterfaces.ts

// Minimal interface for domains that need basic investor info
export interface InvestorBasicInfo {
  id: string;
  name: string;
  email: string;
  type: 'individual' | 'institutional';
  status: 'active' | 'pending' | 'suspended';
}

// Extended interface for compliance-specific needs
export interface InvestorComplianceInfo extends InvestorBasicInfo {
  kycStatus: string;
  kycExpiryDate?: string;
  accreditationStatus: string;
  riskScore: number;
  lastComplianceCheck?: string;
}

// Project info for external domains
export interface ProjectBasicInfo {
  id: string;
  name: string;
  status: string;
  type: string;
  ownerId: string;
}

// Token info for external domains
export interface TokenBasicInfo {
  id: string;
  name: string;
  symbol: string;
  standard: string;
  projectId: string;
  contractAddress?: string;
}
```

#### 3. Shared State Management

**Create shared stores for cross-domain data:**
```typescript
// src/shared/stores/entityCache.ts
export interface EntityCache {
  users: Map<string, UserReference>;
  investors: Map<string, InvestorBasicInfo>;
  projects: Map<string, ProjectBasicInfo>;
  tokens: Map<string, TokenBasicInfo>;
}

export class EntityCacheService {
  private cache: EntityCache = {
    users: new Map(),
    investors: new Map(),
    projects: new Map(),
    tokens: new Map()
  };
  
  // Update cache when entities change
  updateInvestor(investor: InvestorBasicInfo): void {
    this.cache.investors.set(investor.id, investor);
    
    // Notify subscribers of change
    eventBus.publish({
      type: 'cache.investor.updated',
      source: 'entity-cache',
      payload: { investorId: investor.id }
    });
  }
  
  getInvestor(id: string): InvestorBasicInfo | null {
    return this.cache.investors.get(id) || null;
  }
  
  // Similar methods for other entities...
}

export const entityCache = new EntityCacheService();
```

#### 4. Specific Circular Dependency Resolutions

**Resolution 1: Token ↔ Project Circular Dependency**
```typescript
// BEFORE: Circular dependency
// Token domain imports Project, Project domain imports Token

// AFTER: Resolved through relationship service
// src/shared/services/tokenProjectRelationshipService.ts
export class TokenProjectRelationshipService {
  async getProjectTokens(projectId: string): Promise<TokenReference[]> {
    // Query through cross-domain service
    const response = await crossDomainQuery.query({
      domain: 'token',
      operation: 'get_tokens_by_project',
      parameters: { projectId },
      requestedBy: 'project'
    });
    
    return response.success ? response.data : [];
  }
  
  async getTokenProject(tokenId: string): Promise<ProjectReference | null> {
    const response = await crossDomainQuery.query({
      domain: 'project', 
      operation: 'get_project_by_token',
      parameters: { tokenId },
      requestedBy: 'token'
    });
    
    return response.success ? response.data : null;
  }
}

// Usage in Project domain:
export const useProjectTokens = (projectId: string) => {
  const [tokens, setTokens] = useState<TokenReference[]>([]);
  
  useEffect(() => {
    tokenProjectService.getProjectTokens(projectId).then(setTokens);
  }, [projectId]);
  
  return tokens;
};

// Usage in Token domain:
export const useTokenProject = (tokenId: string) => {
  const [project, setProject] = useState<ProjectReference | null>(null);
  
  useEffect(() => {
    tokenProjectService.getTokenProject(tokenId).then(setProject);
  }, [tokenId]);
  
  return project;
};
```

**Resolution 2: Investor ↔ Compliance Circular Dependency**
```typescript
// BEFORE: Investor imports compliance types, Compliance imports investor types

// AFTER: Resolved through events and references
// Investor domain publishes compliance-relevant events
export const useInvestorCompliance = (investorId: string) => {
  const updateKYCStatus = async (status: string) => {
    await investorService.updateKYCStatus(investorId, status);
    
    // Publish event for compliance domain
    await eventBus.publish({
      type: InvestorEvents.KYC_STATUS_CHANGED,
      source: 'investor',
      payload: {
        investorId,
        newStatus: status,
        timestamp: new Date().toISOString()
      }
    });
  };
};

// Compliance domain reacts to events
export const useComplianceMonitoring = () => {
  useEffect(() => {
    const subscription = eventBus.subscribe(
      InvestorEvents.KYC_STATUS_CHANGED,
      async (event) => {
        const { investorId, newStatus } = event.payload;
        
        // Update compliance records without importing investor types
        await complianceService.updateInvestorComplianceStatus(investorId, {
          kycStatus: newStatus,
          lastChecked: new Date().toISOString()
        });
      }
    );
    
    return () => eventBus.unsubscribe(subscription);
  }, []);
};
```

**Resolution 3: Captable Complex Dependencies**
```typescript
// BEFORE: Captable imports Investor, Project, Token types directly

// AFTER: Captable uses references and aggregation service
// src/shared/services/captableAggregationService.ts
export interface CapTableData {
  projectInfo: ProjectBasicInfo;
  allocations: AllocationSummary[];
  totalAllocated: number;
  totalInvestors: number;
}

export interface AllocationSummary {
  investorId: string;
  investorName: string;
  investorEmail: string;
  tokenId: string;
  tokenSymbol: string;
  allocatedAmount: number;
  allocatedPercentage: number;
}

export class CapTableAggregationService {
  async getCapTableData(projectId: string): Promise<CapTableData> {
    // Get project info
    const projectResponse = await crossDomainQuery.query({
      domain: 'project',
      operation: 'get_project_basic_info',
      parameters: { projectId },
      requestedBy: 'captable'
    });
    
    // Get allocations
    const allocationsResponse = await crossDomainQuery.query({
      domain: 'captable',
      operation: 'get_project_allocations',
      parameters: { projectId },
      requestedBy: 'captable'
    });
    
    // Aggregate data without direct domain imports
    return {
      projectInfo: projectResponse.data,
      allocations: allocationsResponse.data,
      totalAllocated: allocationsResponse.data.reduce((sum, alloc) => sum + alloc.allocatedAmount, 0),
      totalInvestors: new Set(allocationsResponse.data.map(alloc => alloc.investorId)).size
    };
  }
}
```

#### 5. Dependency Analysis Tools

**Create scripts to detect and prevent circular dependencies:**
```typescript
// scripts/analyzeDependencies.ts
import * as fs from 'fs';
import * as path from 'path';

interface DependencyNode {
  domain: string;
  dependencies: string[];
  file: string;
}

export class DependencyAnalyzer {
  private nodes: Map<string, DependencyNode> = new Map();
  
  analyzeDomain(domainPath: string): void {
    const files = this.getTypeScriptFiles(domainPath);
    
    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      const dependencies = this.extractDependencies(content);
      const domain = this.extractDomainFromPath(file);
      
      this.nodes.set(domain, {
        domain,
        dependencies,
        file
      });
    });
  }
  
  detectCircularDependencies(): string[][] {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[][] = [];
    
    for (const domain of this.nodes.keys()) {
      if (!visited.has(domain)) {
        this.detectCyclesDFS(domain, visited, recursionStack, [], cycles);
      }
    }
    
    return cycles;
  }
  
  private detectCyclesDFS(
    domain: string,
    visited: Set<string>,
    recursionStack: Set<string>,
    path: string[],
    cycles: string[][]
  ): void {
    visited.add(domain);
    recursionStack.add(domain);
    path.push(domain);
    
    const node = this.nodes.get(domain);
    if (!node) return;
    
    for (const dependency of node.dependencies) {
      if (!visited.has(dependency)) {
        this.detectCyclesDFS(dependency, visited, recursionStack, path, cycles);
      } else if (recursionStack.has(dependency)) {
        // Found cycle
        const cycleStart = path.indexOf(dependency);
        cycles.push([...path.slice(cycleStart), dependency]);
      }
    }
    
    recursionStack.delete(domain);
    path.pop();
  }
  
  generateDependencyReport(): string {
    const cycles = this.detectCircularDependencies();
    
    let report = '# Dependency Analysis Report\n\n';
    
    if (cycles.length === 0) {
      report += '✅ No circular dependencies detected!\n\n';
    } else {
      report += `❌ Found ${cycles.length} circular dependencies:\n\n`;
      cycles.forEach((cycle, index) => {
        report += `${index + 1}. ${cycle.join(' → ')}\n`;
      });
      report += '\n';
    }
    
    // Add dependency graph
    report += '## Dependency Graph\n\n';
    for (const [domain, node] of this.nodes.entries()) {
      report += `**${domain}**: ${node.dependencies.join(', ') || 'No dependencies'}\n`;
    }
    
    return report;
  }
}

// Usage
const analyzer = new DependencyAnalyzer();
analyzer.analyzeDomain('src/features');
const report = analyzer.generateDependencyReport();
fs.writeFileSync('docs/dependency-analysis.md', report);
```

### Implementation Timeline

#### Day 1: Dependency Analysis and Planning
- Run dependency analysis on current codebase
- Identify all circular dependencies
- Create resolution plan for each cycle
- Set up dependency tracking tools

#### Day 2: Shared Interface Creation
- Create segregated interfaces for cross-domain usage
- Implement entity reference system
- Set up shared state management
- Create relationship services

#### Day 3: Circular Dependency Resolution
- Resolve Token ↔ Project dependencies
- Resolve Investor ↔ Compliance dependencies
- Resolve Captable complex dependencies
- Resolve Document domain dependencies

#### Day 4: Testing and Validation
- Test all resolved dependencies
- Validate no new cycles introduced
- Performance testing of new patterns
- Update documentation

### Acceptance Criteria
- [ ] All circular dependencies identified and resolved
- [ ] Shared interfaces created for cross-domain communication
- [ ] Dependency analysis tools implemented
- [ ] No new circular dependencies introduced
- [ ] All domain functionality preserved
- [ ] Performance impact minimal (<5% overhead)
- [ ] Documentation updated with resolution patterns

### Deliverables
1. Dependency analysis report
2. Resolved circular dependency implementations
3. Shared interface definitions
4. Relationship service implementations
5. Dependency tracking tools

### Time Estimate: 3 days (24 hours)

---

## Task 3.3: Create Shared Infrastructure

### Overview
Identify and properly organize truly shared infrastructure components that should remain centralized while ensuring they don't create coupling between domains.

### Current State Analysis
**Shared Infrastructure Scattered:**
- Supabase client configuration in multiple locations
- Web3 providers and adapters mixed with domain code
- Common utilities duplicated across domains
- No clear shared vs domain-specific boundaries

### Target Shared Infrastructure

#### 1. Database Infrastructure (`src/shared/infrastructure/database/`)

**Supabase Client and Configuration:**
```typescript
// src/shared/infrastructure/database/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-application-name': 'chain-capital'
    }
  }
});

// Database connection health check
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('health_check').select('*').limit(1);
    return !error;
  } catch {
    return false;
  }
};
```

**Database Query Utilities:**
```typescript
// src/shared/infrastructure/database/queryUtils.ts
export interface QueryOptions {
  select?: string;
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
  filters?: Record<string, any>;
}

export class DatabaseQueryBuilder {
  static buildQuery(table: string, options: QueryOptions = {}) {
    let query = supabase.from(table);
    
    if (options.select) {
      query = query.select(options.select);
    } else {
      query = query.select('*');
    }
    
    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });
    }
    
    if (options.orderBy) {
      query = query.order(options.orderBy, { 
        ascending: options.ascending ?? true 
      });
    }
    
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }
    
    return query;
  }
}

// Pagination utilities
export interface PaginationOptions {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const paginateQuery = async <T>(
  baseQuery: any,
  options: PaginationOptions
): Promise<PaginatedResult<T>> => {
  const { page, pageSize } = options;
  const offset = (page - 1) * pageSize;
  
  const [dataResult, countResult] = await Promise.all([
    baseQuery.range(offset, offset + pageSize - 1),
    baseQuery.select('*', { count: 'exact', head: true })
  ]);
  
  if (dataResult.error) throw dataResult.error;
  if (countResult.error) throw countResult.error;
  
  return {
    data: dataResult.data,
    total: countResult.count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((countResult.count || 0) / pageSize)
  };
};
```

#### 2. Web3 Infrastructure (`src/shared/infrastructure/web3/`)

**Provider Management:**
```typescript
// src/shared/infrastructure/web3/providers.ts
export interface Web3Provider {
  name: string;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export const WEB3_PROVIDERS: Record<string, Web3Provider> = {
  ethereum: {
    name: 'Ethereum Mainnet',
    chainId: 1,
    rpcUrl: 'https://eth-mainnet.alchemyapi.io/v2/your-api-key',
    explorerUrl: 'https://etherscan.io',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    }
  },
  polygon: {
    name: 'Polygon Mainnet', 
    chainId: 137,
    rpcUrl: 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    nativeCurrency: {
      name: 'Polygon',
      symbol: 'MATIC',
      decimals: 18
    }
  },
  polygonAmoy: {
    name: 'Polygon Amoy Testnet',
    chainId: 80002,
    rpcUrl: 'https://rpc-amoy.polygon.technology',
    explorerUrl: 'https://amoy.polygonscan.com',
    nativeCurrency: {
      name: 'Polygon',
      symbol: 'MATIC',
      decimals: 18
    }
  }
};

export const getProvider = (network: string): Web3Provider => {
  const provider = WEB3_PROVIDERS[network];
  if (!provider) {
    throw new Error(`Unknown network: ${network}`);
  }
  return provider;
};
```

**Blockchain Adapters:**
```typescript
// src/shared/infrastructure/web3/adapters.ts
export interface BlockchainAdapter {
  network: string;
  getBalance(address: string): Promise<string>;
  sendTransaction(tx: TransactionRequest): Promise<string>;
  getTransactionStatus(hash: string): Promise<TransactionStatus>;
  estimateGas(tx: TransactionRequest): Promise<string>;
}

export interface TransactionRequest {
  to: string;
  value?: string;
  data?: string;
  gasLimit?: string;
  gasPrice?: string;
}

export interface TransactionStatus {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  confirmations?: number;
}

export class EthereumAdapter implements BlockchainAdapter {
  constructor(public network: string, private provider: any) {}
  
  async getBalance(address: string): Promise<string> {
    return await this.provider.getBalance(address);
  }
  
  async sendTransaction(tx: TransactionRequest): Promise<string> {
    const result = await this.provider.sendTransaction(tx);
    return result.hash;
  }
  
  // ... other methods
}
```

#### 3. API Infrastructure (`src/shared/infrastructure/api/`)

**HTTP Client:**
```typescript
// src/shared/infrastructure/api/httpClient.ts
export interface HttpClientConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
  retries: number;
}

export interface HttpResponse<T = any> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

export class HttpClient {
  private config: HttpClientConfig;
  
  constructor(config: Partial<HttpClientConfig> = {}) {
    this.config = {
      baseURL: '',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      },
      retries: 3,
      ...config
    };
  }
  
  async get<T>(url: string, options?: RequestInit): Promise<HttpResponse<T>> {
    return this.request<T>('GET', url, options);
  }
  
  async post<T>(url: string, data?: any, options?: RequestInit): Promise<HttpResponse<T>> {
    return this.request<T>('POST', url, {
      ...options,
      body: JSON.stringify(data)
    });
  }
  
  private async request<T>(
    method: string,
    url: string,
    options: RequestInit = {}
  ): Promise<HttpResponse<T>> {
    const fullUrl = this.config.baseURL + url;
    let attempts = 0;
    
    while (attempts < this.config.retries) {
      try {
        const response = await fetch(fullUrl, {
          method,
          headers: {
            ...this.config.headers,
            ...options.headers
          },
          signal: AbortSignal.timeout(this.config.timeout),
          ...options
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        return {
          data,
          status: response.status,
          headers: Object.fromEntries(response.headers.entries())
        };
      } catch (error) {
        attempts++;
        if (attempts >= this.config.retries) {
          throw error;
        }
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
      }
    }
    
    throw new Error('Request failed after retries');
  }
}

// Pre-configured clients
export const apiClient = new HttpClient({
  baseURL: import.meta.env.VITE_API_BASE_URL
});

export const blockchainApiClient = new HttpClient({
  baseURL: import.meta.env.VITE_BLOCKCHAIN_API_URL,
  headers: {
    'Authorization': `Bearer ${import.meta.env.VITE_BLOCKCHAIN_API_KEY}`
  }
});
```

#### 4. Caching Infrastructure (`src/shared/infrastructure/cache/`)

**Cache Interface:**
```typescript
// src/shared/infrastructure/cache/cacheInterface.ts
export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  key: string;
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number;
  onEviction?: (key: string, value: any) => void;
}

export interface CacheProvider {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
  size(): Promise<number>;
}

// In-memory cache implementation
export class MemoryCache implements CacheProvider {
  private cache = new Map<string, CacheEntry<any>>();
  private options: Required<CacheOptions>;
  
  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: 5 * 60 * 1000, // 5 minutes default
      maxSize: 1000,
      onEviction: () => {},
      ...options
    };
    
    // Cleanup expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }
  
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value;
  }
  
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    // Evict if at max size
    if (this.cache.size >= this.options.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        const evicted = this.cache.get(firstKey);
        this.cache.delete(firstKey);
        if (evicted) {
          this.options.onEviction(firstKey, evicted.value);
        }
      }
    }
    
    const expiresAt = Date.now() + (ttl || this.options.ttl);
    this.cache.set(key, { value, expiresAt, key });
  }
  
  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }
  
  async clear(): Promise<void> {
    this.cache.clear();
  }
  
  async keys(): Promise<string[]> {
    return Array.from(this.cache.keys());
  }
  
  async size(): Promise<number> {
    return this.cache.size;
  }
  
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instances
export const domainCache = new MemoryCache({ ttl: 10 * 60 * 1000 }); // 10 minutes
export const queryCache = new MemoryCache({ ttl: 5 * 60 * 1000 });   // 5 minutes
```

#### 5. Security Infrastructure (`src/shared/infrastructure/security/`)

**Encryption and Security Utilities:**
```typescript
// src/shared/infrastructure/security/encryption.ts
export class EncryptionService {
  async generateKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'RSA-PSS',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256'
      },
      true,
      ['sign', 'verify']
    );
    
    const publicKey = await crypto.subtle.exportKey('spki', keyPair.publicKey);
    const privateKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
    
    return {
      publicKey: this.arrayBufferToBase64(publicKey),
      privateKey: this.arrayBufferToBase64(privateKey)
    };
  }
  
  async hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
    const actualSalt = salt || crypto.getRandomValues(new Uint8Array(16));
    const encoder = new TextEncoder();
    const data = encoder.encode(password + actualSalt);
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hash = this.arrayBufferToBase64(hashBuffer);
    
    return {
      hash,
      salt: typeof actualSalt === 'string' ? actualSalt : this.arrayBufferToBase64(actualSalt)
    };
  }
  
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}

export const encryptionService = new EncryptionService();
```

### Shared Infrastructure Usage Guidelines

#### 1. Access Patterns
```typescript
// GOOD: Domains import shared infrastructure
import { supabase } from '@/shared/infrastructure/database';
import { domainCache } from '@/shared/infrastructure/cache';
import { eventBus } from '@/shared/events';

// BAD: Domains don't import other domain infrastructure
import { investorService } from '@/features/investors/services'; // ❌
```

#### 2. Configuration Management
```typescript
// src/shared/infrastructure/config/index.ts
export interface ApplicationConfig {
  database: {
    url: string;
    key: string;
  };
  web3: {
    defaultNetwork: string;
    providers: Record<string, string>;
  };
  api: {
    baseUrl: string;
    timeout: number;
  };
  cache: {
    defaultTtl: number;
    maxSize: number;
  };
}

export const config: ApplicationConfig = {
  database: {
    url: import.meta.env.VITE_SUPABASE_URL!,
    key: import.meta.env.VITE_SUPABASE_ANON_KEY!
  },
  web3: {
    defaultNetwork: 'polygonAmoy',
    providers: {
      ethereum: import.meta.env.VITE_ETHEREUM_RPC_URL!,
      polygon: import.meta.env.VITE_POLYGON_RPC_URL!,
      polygonAmoy: import.meta.env.VITE_POLYGON_AMOY_RPC_URL!
    }
  },
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL!,
    timeout: 30000
  },
  cache: {
    defaultTtl: 5 * 60 * 1000,
    maxSize: 1000
  }
};
```

#### 3. Testing Infrastructure
```typescript
// src/shared/infrastructure/testing/testUtils.ts
export const createTestDatabase = () => {
  // Return test database instance
};

export const createMockEventBus = () => {
  // Return mock event bus for testing
};

export const createTestCache = () => {
  return new MemoryCache({ ttl: 1000 }); // Short TTL for tests
};
```

### Acceptance Criteria
- [ ] All truly shared infrastructure identified and organized
- [ ] Database, Web3, API, Cache, and Security infrastructure created
- [ ] Clear usage guidelines documented
- [ ] No domain-specific logic in shared infrastructure
- [ ] All domains can access shared infrastructure without coupling
- [ ] Infrastructure is testable and mockable
- [ ] Configuration management centralized
- [ ] Performance monitoring in place

### Deliverables
1. Organized shared infrastructure components
2. Infrastructure usage guidelines
3. Configuration management system
4. Testing utilities for infrastructure
5. Performance monitoring setup

### Time Estimate: 3 days (24 hours)
