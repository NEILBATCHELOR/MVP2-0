/**
 * Main exports for Ripple Payments integration
 * Comprehensive access to all Ripple services and types
 */

// Configuration and utilities
export * from './config';
export * from './utils';
export * from './types';

// Authentication services
export * from './auth';

// Payment services
export * from './payments';

// Stablecoin services
export { 
  StablecoinService,
  createStablecoinService 
} from './stablecoin';

// Main factory function for creating complete Ripple integration
export interface RippleIntegrationConfig {
  environment?: 'test' | 'production';
  clientId?: string;
  clientSecret?: string;
  tenantId?: string;
  enableODL?: boolean;
  enableStablecoin?: boolean;
  enableCustody?: boolean;
  enableIdentity?: boolean;
  enableReporting?: boolean;
  enableWebhooks?: boolean;
}

export class RippleIntegration {
  // TODO: This will be implemented as we add more services
  // Will provide a unified interface to all Ripple services
  constructor(config: RippleIntegrationConfig) {
    // Implementation pending
  }
}

export const createRippleIntegration = (config: RippleIntegrationConfig) => {
  return new RippleIntegration(config);
};
