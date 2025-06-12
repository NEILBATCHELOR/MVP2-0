/**
 * Token Hooks Types
 * 
 * TypeScript interfaces and types for token hooks functionality
 */

import { TokenStandard, TokenStatus } from '@/types/core/centralModels';
import { EnhancedTokenData, TokenFormData } from '../types';

// Base hook options
export interface BaseHookOptions {
  enabled?: boolean;
  refetchInterval?: number;
  onError?: (error: Error) => void;
  onSuccess?: (data: any) => void;
}

// Single token hook options
export interface UseTokenOptions extends BaseHookOptions {
  tokenId: string;
  includeProperties?: boolean;
  includeArrays?: boolean;
}

// Multiple tokens hook options  
export interface UseTokensOptions extends BaseHookOptions {
  projectId?: string;
  standard?: TokenStandard;
  status?: TokenStatus;
  search?: string;
  limit?: number;
  offset?: number;
}

// Token form hook options
export interface UseTokenFormOptions extends BaseHookOptions {
  initialData?: Partial<TokenFormData>;
  validationMode?: 'onChange' | 'onBlur' | 'onSubmit';
  standard?: TokenStandard;
  configMode?: 'min' | 'max';
}

// Token validation hook options
export interface UseTokenValidationOptions extends BaseHookOptions {
  standard: TokenStandard;
  configMode?: 'min' | 'max';
  validateOnChange?: boolean;
}

// Hook result types
export interface TokenHookResult {
  token: EnhancedTokenData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  update: (data: Partial<EnhancedTokenData>) => Promise<EnhancedTokenData>;
  delete: () => Promise<void>;
}

export interface TokensHookResult {
  tokens: EnhancedTokenData[];
  totalCount: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  create: (data: TokenFormData) => Promise<EnhancedTokenData>;
  hasNextPage: boolean;
  fetchNextPage: () => Promise<void>;
}

export interface TokenFormHookResult {
  formData: TokenFormData;
  setFormData: (data: TokenFormData | ((prev: TokenFormData) => TokenFormData)) => void;
  handleInputChange: (field: string, value: any) => void;
  handleNestedChange: (path: string, value: any) => void;
  reset: () => void;
  isDirty: boolean;
  isValid: boolean;
  errors: Record<string, string[]>;
  submit: () => Promise<EnhancedTokenData>;
}

export interface TokenValidationHookResult {
  validate: (data: TokenFormData) => ValidationResult;
  validateField: (field: string, value: any) => string[];
  isValid: (data: TokenFormData) => boolean;
  errors: Record<string, string[]>;
  clearErrors: () => void;
  clearFieldError: (field: string) => void;
}

// Validation result type
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
  warnings: Record<string, string[]>;
}

// Token operation types
export interface TokenOperationOptions {
  tokenId: string;
  operationType: string;
  params?: Record<string, any>;
  confirmRequired?: boolean;
}

export interface TokenOperationResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
  timestamp: string;
}

// Configuration types
export interface TokenConfigOptions {
  standard: TokenStandard;
  mode: 'min' | 'max';
  projectId?: string;
}

export interface TokenConfigResult {
  config: Record<string, any>;
  schema: any;
  defaultValues: Record<string, any>;
  updateConfig: (updates: Record<string, any>) => void;
  resetConfig: () => void;
  validateConfig: () => ValidationResult;
}

// Deployment types
export interface DeploymentOptions {
  tokenId: string;
  network: string;
  environment: 'testnet' | 'mainnet';
  gasPrice?: string;
  gasLimit?: string;
}

export interface DeploymentResult {
  status: 'pending' | 'deploying' | 'deployed' | 'failed';
  contractAddress?: string;
  transactionHash?: string;
  deploymentId?: string;
  error?: string;
  estimatedTime?: number;
}

// Metadata types
export interface MetadataOptions {
  tokenId: string;
  standard: TokenStandard;
  includeImages?: boolean;
}

export interface MetadataResult {
  metadata: Record<string, any>;
  isLoading: boolean;
  update: (updates: Record<string, any>) => Promise<void>;
  generateDefault: () => Record<string, any>;
}

// Template types
export interface TemplateOptions {
  projectId?: string;
  standard?: TokenStandard;
  category?: string;
}

export interface TemplateResult {
  templates: any[];
  create: (template: any) => Promise<any>;
  update: (id: string, updates: any) => Promise<any>;
  delete: (id: string) => Promise<void>;
  apply: (templateId: string, targetTokenId: string) => Promise<void>;
}

// Real-time types
export interface RealtimeOptions {
  tokenId?: string;
  projectId?: string;
  events?: string[];
}

export interface RealtimeResult {
  isConnected: boolean;
  lastEvent: any;
  events: any[];
  subscribe: (eventType: string) => void;
  unsubscribe: (eventType: string) => void;
}
