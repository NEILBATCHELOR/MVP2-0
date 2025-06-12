/**
 * RAMP Network SDK Types
 * 
 * Type definitions for RAMP Network SDK integration and configuration
 */

import type { 
  RampVariant, 
  RampPaymentMethod, 
  RampNetworkFlow, 
  RampEnvironment 
} from './core';

// ===== SDK Configuration =====

export interface RampSDKConfig {
  hostAppName: string;
  hostLogoUrl: string;
  hostApiKey: string;
  userAddress?: string;
  swapAsset?: string;
  offrampAsset?: string;
  swapAmount?: string;
  fiatCurrency?: string;
  fiatValue?: string;
  userEmailAddress?: string;
  enabledFlows?: RampNetworkFlow[];
  variant?: RampVariant;
  paymentMethodType?: RampPaymentMethod;
  defaultFlow?: RampNetworkFlow;
  webhookStatusUrl?: string;
  offrampWebhookV3Url?: string;
  finalUrl?: string;
  userCountry?: string;
  useSendCryptoCallback?: boolean;
  selectedCountryCode?: string;
  defaultAsset?: string;
  containerNode?: HTMLElement;
}

export interface RampNetworkConfig {
  apiKey: string;
  hostAppName: string;
  hostLogoUrl: string;
  enabledFlows: RampNetworkFlow[];
  webhookSecret?: string;
  environment?: RampEnvironment;
}

export interface RampNetworkEnhancedConfig extends RampNetworkConfig {
  // SDK Configuration
  defaultVariant?: RampVariant;
  customCss?: string;
  containerElementId?: string;
  
  // Advanced Features
  enableNativeFlow?: boolean;
  enableQuotes?: boolean;
  enableWebhooks?: boolean;
  enableEventTracking?: boolean;
  
  // Payment Method Preferences
  preferredPaymentMethods?: RampPaymentMethod[];
  excludePaymentMethods?: RampPaymentMethod[];
  
  // Asset Configuration
  supportedAssets?: string[];
  excludeAssets?: string[];
  
  // Regional Settings
  supportedCountries?: string[];
  excludeCountries?: string[];
  
  // Custom Branding
  primaryColor?: string;
  borderRadius?: string;
  fontFamily?: string;
  
  // Rate Limiting
  rateLimits?: {
    quotesPerMinute?: number;
    transactionsPerHour?: number;
  };
  
  // Retry Configuration
  retryConfig?: {
    maxRetries?: number;
    retryDelay?: number;
    exponentialBackoff?: boolean;
  };
}

// ===== Environment Configuration =====

export interface RampEnvironmentConfig {
  production: RampNetworkEnhancedConfig;
  staging: RampNetworkEnhancedConfig;
}

export interface RampFeatureFlags {
  enableOnRamp: boolean;
  enableOffRamp: boolean;
  enableQuotes: boolean;
  enableWebhooks: boolean;
  enableEventTracking: boolean;
  enableAdvancedAnalytics: boolean;
  enableCustomBranding: boolean;
  enableNativeFlow: boolean;
  enableMultiplePaymentMethods: boolean;
  enableGeoRestrictions: boolean;
}

// ===== Widget Configuration =====

export interface RampWidgetProps {
  config: RampSDKConfig;
  onPurchaseCreated?: (purchase: any) => void;
  onSaleCreated?: (sale: any) => void;
  onWidgetClose?: () => void;
  onWidgetConfigDone?: () => void;
  onWidgetConfigFailed?: () => void;
  onSendCryptoRequest?: (request: any) => void;
  className?: string;
  style?: React.CSSProperties;
  loading?: boolean;
  error?: string | null;
}

export interface RampIntegrationSettings {
  mode: 'overlay' | 'hosted' | 'embedded';
  config: RampSDKConfig;
  featureFlags: Partial<RampFeatureFlags>;
  customization?: {
    theme?: 'light' | 'dark' | 'auto';
    primaryColor?: string;
    borderRadius?: string;
    fontFamily?: string;
    customCss?: string;
  };
  analytics?: {
    enabled: boolean;
    trackingId?: string;
    customEvents?: string[];
  };
}
