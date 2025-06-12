// Main export file for the Redemption Module
// Provides centralized access to all redemption-related functionality

// Re-export all types
// Use explicit imports to avoid duplicate exports
import * as RedemptionTypes from './types';
export * from './types';

// Override the RedemptionApprover export to avoid ambiguity
export type { RedemptionApprover } from './components/RedemptionApproverSelection';

// Re-export all services
export * from './services';

// Re-export hooks
export * from './hooks';

// Component exports
export * from './requests';
export * from './approvals';
export * from './notifications';
