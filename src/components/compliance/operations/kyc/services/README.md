# KYC Operations Services

This directory contains services related to KYC (Know Your Customer) operations.

## Services

- `idenfyService.ts` - Handles identity verification operations including:
  - Verification queue management
  - Operator assignment
  - Workload tracking
  - Verification reporting
  - Integration with Idenfy API

## Usage

Import services using:
```typescript
import { idenfyService } from '@/operations/kyc/services';
```