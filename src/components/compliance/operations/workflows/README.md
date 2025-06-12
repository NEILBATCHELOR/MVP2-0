# Workflow Operations

This directory contains services and components related to workflow operations.

## Services

- `approvalWorkflowService.ts` - Handles approval workflow operations including:
  - Workflow creation and management
  - Approval/rejection handling
  - Step management
  - Workflow status tracking
  - Expiration handling
  - Batch operations

## Usage

Import services using:
```typescript
import { ApprovalWorkflowService } from '@/operations/workflows/services';
```