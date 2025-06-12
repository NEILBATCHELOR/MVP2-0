import { TokenStatus } from '@/types/core/centralModels';

// Common token interface that all display components will use
export interface UnifiedTokenData {
  id: string;
  name: string;
  symbol: string;
  standard: string;
  status: TokenStatus | string;
  address?: string;
  blockchain?: string;
  created_at: string;
  updated_at: string;
  approvals?: string[];
  blocks?: Record<string, any>;
  contract_preview?: string;
  decimals?: number;
  metadata?: any;
  project_id?: string;
  reviewers?: string[];
  total_supply?: string;
  tokenTier?: 'primary' | 'secondary' | 'tertiary';
  config_mode?: 'min' | 'max' | 'basic' | 'advanced';
  
  // Standard-specific properties (enhanced from token services)
  erc20Properties?: any;
  erc721Properties?: any;
  erc1155Properties?: any;
  erc1400Properties?: any;
  erc3525Properties?: any;
  erc4626Properties?: any;
  
  // Array properties for complex standards
  erc721Attributes?: any[];
  erc1155Types?: any[];
  erc1155Balances?: any[];
  erc1155UriMappings?: any[];
  erc1400Controllers?: any[];
  erc1400Partitions?: any[];
  erc1400Documents?: any[];
  erc3525Slots?: any[];
  erc3525Allocations?: any[];
  erc4626StrategyParams?: any[];
  erc4626AssetAllocations?: any[];
}

// Token display mode configuration
export interface TokenDisplayConfig {
  mode: 'card' | 'detail';
  layout: 'compact' | 'full' | 'horizontal';
  showActions: boolean;
  showMetadata: boolean;
  showFeatures: boolean;
  maxFeatures?: number;
  actionsLayout?: 'horizontal' | 'vertical' | 'grid';
}

// Standard configuration for consistent theming
export interface StandardConfig {
  icon: React.ComponentType<any>;
  bgGradient: string;
  borderColor: string;
  iconColor: string;
  hoverShadow: string;
  tooltip: string;
}

// Standard configurations mapping
export const standardConfigs: Record<string, StandardConfig> = {
  'ERC-20': {
    icon: () => null, // Will be imported from lucide-react
    bgGradient: 'bg-gradient-to-br from-blue-50 to-blue-100',
    borderColor: 'border-blue-200',
    iconColor: 'text-blue-500',
    hoverShadow: 'hover:shadow-blue-100',
    tooltip: 'ERC20 fungible token standard for currencies and utility tokens'
  },
  'ERC-721': {
    icon: () => null,
    bgGradient: 'bg-gradient-to-br from-purple-50 to-purple-100',
    borderColor: 'border-purple-200',
    iconColor: 'text-purple-500',
    hoverShadow: 'hover:shadow-purple-100',
    tooltip: 'ERC721 non-fungible token standard for unique digital assets'
  },
  'ERC-1155': {
    icon: () => null,
    bgGradient: 'bg-gradient-to-br from-amber-50 to-amber-100',
    borderColor: 'border-amber-200',
    iconColor: 'text-amber-500',
    hoverShadow: 'hover:shadow-amber-100',
    tooltip: 'ERC1155 multi-token standard supporting both fungible and non-fungible tokens'
  },
  'ERC-1400': {
    icon: () => null,
    bgGradient: 'bg-gradient-to-br from-green-50 to-green-100',
    borderColor: 'border-green-200',
    iconColor: 'text-green-500',
    hoverShadow: 'hover:shadow-green-100',
    tooltip: 'ERC1400 security token standard with compliance features'
  },
  'ERC-3525': {
    icon: () => null,
    bgGradient: 'bg-gradient-to-br from-pink-50 to-pink-100',
    borderColor: 'border-pink-200',
    iconColor: 'text-pink-500',
    hoverShadow: 'hover:shadow-pink-100',
    tooltip: 'ERC3525 semi-fungible token standard for tokenized assets with slots'
  },
  'ERC-4626': {
    icon: () => null,
    bgGradient: 'bg-gradient-to-br from-cyan-50 to-cyan-100',
    borderColor: 'border-cyan-200',
    iconColor: 'text-cyan-500',
    hoverShadow: 'hover:shadow-cyan-100',
    tooltip: 'ERC4626 tokenized vault standard for yield-bearing tokens'
  }
};

// Status border color mapping
export const statusBorderColors: Record<string, string> = {
  DRAFT: 'border-l-slate-400',
  REVIEW: 'border-l-yellow-400',
  APPROVED: 'border-l-blue-400',
  READY_TO_MINT: 'border-l-indigo-400',
  MINTED: 'border-l-blue-500',
  DEPLOYED: 'border-l-green-500',
  PAUSED: 'border-l-orange-400',
  DISTRIBUTED: 'border-l-teal-400',
  REJECTED: 'border-l-red-400'
};

// Utility functions

/**
 * Normalize token standard for consistent lookup
 */
export const normalizeStandard = (standard: string): string => {
  return standard
    .toUpperCase()
    .replace(/-/g, '')
    .replace(/\s+/g, '');
};

/**
 * Get standard configuration with fallback
 */
export const getStandardConfig = (standard: string): StandardConfig => {
  return standardConfigs[standard] || {
    icon: () => null,
    bgGradient: 'bg-gradient-to-br from-gray-50 to-gray-100',
    borderColor: 'border-gray-200',
    iconColor: 'text-gray-500',
    hoverShadow: 'hover:shadow-gray-100',
    tooltip: 'Token standard'
  };
};

/**
 * Get status border color with fallback
 */
export const getStatusBorderColor = (status: TokenStatus | string): string => {
  const statusStr = status?.toString().toUpperCase();
  return statusBorderColors[statusStr] || 'border-l-gray-300';
};

/**
 * Format security type for display
 */
export const formatSecurityType = (securityType: string | undefined): string => {
  if (!securityType) return 'Not Specified';
  
  return securityType
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Extract features from token data
 */
export const extractTokenFeatures = (token: UnifiedTokenData): Record<string, any> => {
  const features: Record<string, any> = {};
  
  // Standard-specific properties
  const properties = token.erc20Properties || 
                    token.erc721Properties || 
                    token.erc1155Properties || 
                    token.erc1400Properties || 
                    token.erc3525Properties || 
                    token.erc4626Properties || 
                    {};

  // Basic features from properties
  Object.keys(properties).forEach(key => {
    const value = properties[key];
    if (typeof value === 'boolean' && value) {
      features[key] = value;
    } else if (typeof value === 'object' && value !== null) {
      features[key] = value;
    }
  });

  // Features from blocks data
  if (token.blocks) {
    Object.keys(token.blocks).forEach(key => {
      const value = token.blocks![key];
      if (typeof value === 'boolean' && value) {
        features[key] = value;
      } else if (typeof value === 'object' && value !== null) {
        features[key] = value;
      }
    });
  }

  return features;
};

/**
 * Format number with commas
 */
export const formatNumber = (value: string | number): string => {
  if (!value) return '0';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return num.toLocaleString();
};

/**
 * Check if token is deployed
 */
export const isTokenDeployed = (status: TokenStatus | string): boolean => {
  return status?.toString().toUpperCase() === 'DEPLOYED';
};

/**
 * Check if token can be edited
 */
export const canEditToken = (status: TokenStatus | string): boolean => {
  const statusStr = status?.toString().toUpperCase();
  return statusStr !== 'DEPLOYED';
};

/**
 * Check if token can be deployed
 */
export const canDeployToken = (status: TokenStatus | string): boolean => {
  return status?.toString().toUpperCase() === 'APPROVED';
};

/**
 * Check if token can be deleted
 */
export const canDeleteToken = (status: TokenStatus | string): boolean => {
  return status?.toString().toUpperCase() !== 'DEPLOYED';
};

/**
 * Get appropriate data section component name for standard
 */
export const getDataSectionComponent = (standard: string): string => {
  const normalized = normalizeStandard(standard);
  switch (normalized) {
    case 'ERC20':
      return 'ERC20DataSection';
    case 'ERC721':
      return 'ERC721DataSection';
    case 'ERC1155':
      return 'ERC1155DataSection';
    case 'ERC1400':
      return 'ERC1400DataSection';
    case 'ERC3525':
      return 'ERC3525DataSection';
    case 'ERC4626':
      return 'ERC4626DataSection';
    default:
      return 'DefaultDataSection';
  }
};

// Default display configuration
export const defaultDisplayConfig: TokenDisplayConfig = {
  mode: 'card',
  layout: 'full',
  showActions: true,
  showMetadata: true,
  showFeatures: true,
  maxFeatures: 5,
  actionsLayout: 'horizontal'
};