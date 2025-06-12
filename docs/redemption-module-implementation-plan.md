# Redemption Module Implementation Plan

## Overview

This document outlines the implementation plan for the new redemptions module in Chain Capital Production. The module will enable investors to redeem their distributed tokens back to the issuer, with support for both standard (immediate) redemptions and interval fund repurchases (periodic redemptions).

## Current State Analysis

### Database Schema
- **distributions**: Tracks distributed tokens with `remaining_amount` and `fully_redeemed` fields
- **distribution_redemptions**: Junction table linking distributions to redemption requests
- **redemption_requests**: Main table for redemption request data
- **redemption_approvers**: Tracks multi-signature approval workflow

### Integration Points
1. **Distributions**: Source of redeemable tokens
2. **Cap Table**: Updates ownership records post-redemption
3. **Rules/Policies**: Enforces redemption rules (lock-ups, intervals, limits)
4. **User Management**: Role-based access and approvals
5. **Guardian/Wallet Services**: Token burning and settlement

## Module Architecture

### Core Components Structure
```
/src/components/redemption/
├── index.ts                    # Main exports
├── types/                      # Domain-specific types
│   ├── redemption.ts
│   ├── approvals.ts
│   └── settlement.ts
├── hooks/                      # React hooks
│   ├── useRedemptions.ts
│   ├── useRedemptionApprovals.ts
│   └── useRedemptionStatus.ts
├── services/                   # Business logic
│   ├── redemptionService.ts
│   ├── eligibilityService.ts
│   ├── settlementService.ts
│   └── approvalService.ts
├── dashboard/                  # Dashboard components
│   ├── RedemptionDashboard.tsx
│   ├── RedemptionMetrics.tsx
│   └── RedemptionFilters.tsx
├── requests/                   # Request management
│   ├── RedemptionRequestForm.tsx
│   ├── RedemptionRequestList.tsx
│   ├── RedemptionRequestDetails.tsx
│   └── BulkRedemptionForm.tsx
├── approvals/                  # Approval workflow
│   ├── ApprovalQueue.tsx
│   ├── ApproverDashboard.tsx
│   ├── MultiSignatureFlow.tsx
│   └── ApprovalHistory.tsx
├── settlement/                 # Settlement process
│   ├── SettlementQueue.tsx
│   ├── SettlementStatus.tsx
│   ├── TokenBurning.tsx
│   └── FundTransfer.tsx
├── calendar/                   # Interval fund features
│   ├── RedemptionCalendar.tsx
│   ├── RedemptionWindows.tsx
│   └── WindowManager.tsx
├── notifications/              # Real-time updates
│   ├── RedemptionNotifications.tsx
│   └── StatusSubscriber.tsx
└── utils/                      # Utility functions
    ├── eligibilityChecks.ts
    ├── navCalculations.ts
    └── validations.ts
```

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1)

#### 1.1 Type Definitions
```typescript
// types/redemption.ts
export interface RedemptionRequest {
  id: string;
  distributionId: string;
  investorId: string;
  tokenAmount: number;
  tokenType: 'ERC-20' | 'ERC-721' | 'ERC-1155' | 'ERC-1400' | 'ERC-3525' | 'ERC-4626';
  redemptionType: 'standard' | 'interval';
  status: 'draft' | 'pending' | 'approved' | 'processing' | 'settled' | 'rejected' | 'cancelled';
  sourceWallet: string;
  destinationWallet: string;
  conversionRate: number;
  usdcAmount: number;
  submittedAt: Date;
  approvedAt?: Date;
  settledAt?: Date;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface Distribution {
  id: string;
  tokenAllocationId: string;
  investorId: string;
  tokenAmount: number;
  remainingAmount: number;
  fullyRedeemed: boolean;
  standard: string;
  distributionDate: Date;
  blockchain: string;
  tokenAddress?: string;
  tokenSymbol?: string;
}
```

#### 1.2 Database Migrations
- Add missing columns to existing tables
- Create indexes for performance
- Add triggers for audit logging

#### 1.3 Base Services
- Implement core CRUD operations
- Set up Supabase real-time subscriptions
- Create error handling patterns

### Phase 2: Eligibility & Validation (Week 1-2)

#### 2.1 Eligibility Service
```typescript
// services/eligibilityService.ts
export class EligibilityService {
  async checkRedemptionEligibility(
    distributionId: string,
    requestedAmount: number
  ): Promise<EligibilityResult> {
    // Check distribution exists and has remaining balance
    // Verify no active lock-up periods
    // Check interval fund windows if applicable
    // Validate against policy rules
    // Return detailed eligibility result
  }
}
```

#### 2.2 Policy Integration
- Connect with existing rules engine
- Implement lock-up period checks
- Handle interval fund windows
- Geographic restrictions validation

### Phase 3: Request Management (Week 2)

#### 3.1 Request Form Component
- Single investor redemption form
- Bulk redemption interface
- Real-time eligibility feedback
- Dynamic NAV calculations

#### 3.2 Request List & Details
- Sortable/filterable request list
- Detailed request view with timeline
- Status tracking visualization
- Export functionality

### Phase 4: Approval Workflow (Week 2-3)

#### 4.1 Multi-Signature Implementation
```typescript
// services/approvalService.ts
export class ApprovalService {
  async createApprovalRequest(
    redemptionId: string,
    requiredApprovers: string[]
  ): Promise<void> {
    // Create approval records
    // Notify approvers
    // Set up approval thresholds
  }

  async processApproval(
    redemptionId: string,
    approverId: string,
    decision: 'approve' | 'reject',
    comments?: string
  ): Promise<void> {
    // Record approval decision
    // Check if threshold met
    // Update redemption status
    // Trigger next workflow step
  }
}
```

#### 4.2 Approver Dashboard
- Pending approvals queue
- Approval history
- Bulk approval actions
- Comments and audit trail

### Phase 5: Settlement Process (Week 3)

#### 5.1 Token Burning Integration
- Guardian wallet integration
- Multi-chain support
- Transaction monitoring
- Gas optimization

#### 5.2 Settlement Service
```typescript
// services/settlementService.ts
export class SettlementService {
  async executeSettlement(
    redemptionId: string
  ): Promise<SettlementResult> {
    // Burn tokens via Guardian
    // Update distributions table
    // Process USDC conversion
    // Execute fund transfer
    // Update cap table
    // Record transaction details
  }
}
```

### Phase 6: Interval Fund Features (Week 3-4)

#### 6.1 Window Management
- Redemption calendar component
- Window configuration interface
- Pro-rata distribution logic
- Queue management for oversubscription

#### 6.2 NAV Integration
- Oracle price feed integration
- Historical NAV tracking
- Automated NAV calculations
- Manual override capability

### Phase 7: Enhanced Features (Week 4)

#### 7.1 Real-time Updates
- WebSocket integration
- Push notifications
- Email notifications
- In-app status updates

#### 7.2 Analytics & Reporting
- Redemption metrics dashboard
- Trend analysis
- Liquidity forecasting
- Compliance reporting

## Key Improvements Over Archive

1. **Real-time Eligibility Checking**
   - Live balance verification
   - Dynamic rule evaluation
   - Instant feedback

2. **Enhanced Approval Workflow**
   - Configurable approval chains
   - Parallel approval support
   - Delegation capabilities

3. **Automated Settlement**
   - Direct Guardian integration
   - Multi-chain execution
   - Automatic retry logic

4. **Better User Experience**
   - Progressive form validation
   - Contextual help
   - Mobile-responsive design
   - Accessibility compliance

5. **Comprehensive Audit Trail**
   - All actions logged
   - Blockchain transaction links
   - Compliance-ready exports

## Integration Requirements

### 1. Distribution System
- Query available distributions
- Update remaining amounts
- Mark as fully redeemed
- Handle partial redemptions

### 2. Cap Table
- Update token holdings
- Record redemption events
- Maintain ownership history
- Generate reports

### 3. Policy Rules
- Evaluate redemption rules
- Enforce restrictions
- Handle exceptions
- Audit rule applications

### 4. Guardian/Wallet Services
- Execute token burns
- Monitor transactions
- Handle failures
- Optimize gas usage

## Security Considerations

1. **Access Control**
   - Role-based permissions
   - Multi-signature requirements
   - IP whitelisting for approvers

2. **Data Validation**
   - Input sanitization
   - Amount validations
   - Address verification

3. **Audit Logging**
   - All state changes logged
   - User actions tracked
   - System events recorded

4. **Error Handling**
   - Graceful failure recovery
   - Transaction rollback
   - User-friendly error messages

## Testing Strategy

1. **Unit Tests**
   - Service layer logic
   - Eligibility calculations
   - Validation functions

2. **Integration Tests**
   - Database operations
   - External service calls
   - Workflow scenarios

3. **E2E Tests**
   - Complete redemption flow
   - Multi-user scenarios
   - Edge cases

## Performance Considerations

1. **Database Optimization**
   - Proper indexing
   - Query optimization
   - Connection pooling

2. **Caching Strategy**
   - Distribution data
   - Policy rules
   - NAV values

3. **Scalability**
   - Pagination for large datasets
   - Async processing for settlements
   - Queue management

## Deployment Plan

1. **Development Environment**
   - Set up test data
   - Configure services
   - Run initial tests

2. **Staging Deployment**
   - Full integration testing
   - Performance testing
   - Security audit

3. **Production Rollout**
   - Phased deployment
   - Feature flags
   - Monitoring setup

## Success Metrics

1. **Operational Metrics**
   - Average processing time
   - Settlement success rate
   - System uptime

2. **User Metrics**
   - Request completion rate
   - User satisfaction scores
   - Support ticket volume

3. **Business Metrics**
   - Redemption volume
   - Liquidity utilization
   - Compliance adherence

## Next Steps

1. Review and approve implementation plan
2. Set up development environment
3. Begin Phase 1 implementation
4. Schedule weekly progress reviews
5. Prepare testing environments

---

*Document Version: 1.0*  
*Last Updated: [Current Date]*  
*Status: Ready for Review*
