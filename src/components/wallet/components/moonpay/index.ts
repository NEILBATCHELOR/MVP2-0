/**
 * MoonPay Components and Services
 * Complete crypto onramp/offramp solution with advanced analytics and UI components
 */

// Main UI Components
export { default as MoonpayIntegration } from './MoonpayIntegration';
export { default as EnhancedMoonpayDashboard } from './EnhancedMoonpayDashboard';
export { default as AnalyticsDashboard } from './AnalyticsDashboard';
export { default as CustomerManagement } from './CustomerManagement';
export { default as NFTMarketplace } from './NFTMarketplace';
export { default as SwapInterface } from './SwapInterface';

// Service Layer - Use proper services location
export * from '@/services/wallet/moonpay';

// For backwards compatibility, provide legacy service access
export { 
  moonPayServices as moonpayServices,
  createMoonPayServices as createMoonpayServices,
  checkMoonPayServicesHealth as checkServicesHealth 
} from '@/services/wallet/moonpay';

// Re-export utility functions
export {
  MoonPayUtils,
  createEnhancedMoonpayConfig,
  type MoonPayConfig,
  type MoonPayServices
} from '@/services/wallet/moonpay';
