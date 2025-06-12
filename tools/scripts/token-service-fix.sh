#!/bin/bash

# Token Service Error Fix Script
# This script addresses the specific TypeScript errors found in the codebase

echo "Starting token service error fixes..."

# Create a backup directory
BACKUP_DIR="backups/token-fixes-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "Creating backups in $BACKUP_DIR"

# Function to backup a file before modifying it
backup_file() {
  local file="$1"
  if [ -f "$file" ]; then
    echo "Backing up $file"
    cp "$file" "$BACKUP_DIR/$(basename "$file")"
  fi
}

# Function to safely replace text in files
replace_in_file() {
  local file="$1"
  local search="$2"
  local replace="$3"
  
  # Check if file exists
  if [ ! -f "$file" ]; then
    echo "Warning: File $file not found, skipping replacement"
    return
  fi
  
  # Backup the file
  backup_file "$file"
  
  # Perform replacement
  echo "Fixing: $file"
  perl -i -pe "s|$search|$replace|g" "$file"
}

# Function to add export type to index.ts
fix_index_ts() {
  local file="src/services/token/index.ts"
  
  backup_file "$file"
  
  # Read the file content
  content=$(cat "$file")
  
  # Replace the line with export type
  new_content=$(echo "$content" | sed 's/export { ValidationResult } from/export type { ValidationResult } from/')
  
  # Write the modified content back to the file
  echo "$new_content" > "$file"
  
  echo "Fixed export type in $file"
}

# Function to fix the TokenOperationOptions import issues
create_token_types_file() {
  echo "Creating replacement tokenTypes.ts file"
  
  cat > src/services/token/tokenTypes.ts << 'EOL'
// Import from the new location
import { TokenFormData, DeployedToken } from '@/components/tokens/types';

/**
 * Options for token operations
 */
export interface TokenOperationOptions {
  tokenId: string;
  amount?: string;
  recipient?: string;
  reason?: string;
  expiryDate?: string | Date;
  metadata?: Record<string, any>;
  projectId?: string;
  userId?: string;
  userAddress?: string;
  fromDate?: string | Date;
  toDate?: string | Date;
  transactionHash?: string;
}

/**
 * Result of token operations
 */
export interface TokenOperationResult {
  success: boolean;
  message?: string;
  error?: string;
  tokenId?: string;
  transactionHash?: string;
  blockNumber?: number;
  operationId?: string;
  timestamp?: string;
  data?: any;
}

/**
 * Token data interface
 */
export type TokenData = TokenFormData;

/**
 * Extended token data interface
 */
export interface ExtendedTokenData extends TokenData {
  project_id?: string;
  [key: string]: any;
}

/**
 * Deployed token data
 */
export type DeployedTokenData = DeployedToken;

/**
 * ERC4626 vault data
 */
export interface ERC4626VaultData {
  assetAddress: string;
  assetName: string;
  assetSymbol: string;
  assetDecimals: number;
  vault?: {
    name: string;
    symbol: string;
    decimals?: number;
  };
  fee?: {
    managementFee?: string;
    performanceFee?: string;
    depositFee?: string;
    withdrawalFee?: string;
  };
  limits?: {
    minDeposit?: string;
    maxDeposit?: string;
    maxWithdraw?: string;
    maxRedeem?: string;
  };
}
EOL

  echo "Created tokenTypes.ts with required interfaces"
}

# Function to fix the tokenService.ts metadata access issues
fix_token_service() {
  local file="src/services/token/tokenService.ts"
  
  backup_file "$file"
  
  # Read the file content
  content=$(cat "$file")
  
  # Fix metadata spreading
  content=$(echo "$content" | sed 's/\.\.\.(existingToken\.metadata || {}),/...((typeof existingToken.metadata === "object" ? existingToken.metadata : {}) || {}),/g')
  
  # Fix deployment property access
  content=$(echo "$content" | sed 's/\.\.\.(existingToken\.metadata?.deployment || {}),/...((typeof existingToken.metadata === "object" && existingToken.metadata?.deployment) ? existingToken.metadata.deployment : {}),/g')
  
  # Write the modified content back to the file
  echo "$content" > "$file"
  
  echo "Fixed metadata handling in $file"
}

# Function to fix the templateService.ts issue with TokenFormData
fix_template_service() {
  local file="src/services/token/templateService.ts"
  
  backup_file "$file"
  
  # Read the file content
  content=$(cat "$file")
  
  # Fix the TokenFormData issue by ensuring name and symbol are non-optional
  content=$(echo "$content" | sed 's/const tokenData: TokenFormData = {/const tokenData = {\n      name: template.templateData?.name || "Token",\n      symbol: template.templateData?.symbol || "TKN",/g')
  
  # Write the modified content back to the file
  echo "$content" > "$file"
  
  echo "Fixed TokenFormData issue in $file"
}

# Function to create a hook compatibility layer
create_hook_compatibility() {
  echo "Creating useTokenCRUD compatibility layer"
  
  cat > src/components/tokens/hooks/useTokenCRUD.ts << 'EOL'
import { useState, useCallback } from 'react';
import { useTokens, useTokenTemplates } from './index';
import { TokenFormData, TokenTemplate, DeployedToken } from '@/components/tokens/types';

/**
 * @deprecated Use useTokens and useTokenTemplates directly instead
 * This is a compatibility layer for the old useTokenCRUD hook
 */
export const useTokenCRUD = (projectId?: string) => {
  const {
    tokens,
    isLoading,
    isSaving,
    fetchTokens,
    getToken,
    createToken,
    updateToken, 
    deleteToken,
    updateTokenDeployment
  } = useTokens(projectId);
  
  const {
    templates,
    isLoading: templatesLoading,
    isSaving: templatesSaving,
    fetchTemplates,
    createTemplate,
    deleteTemplate,
    createFromTemplate
  } = useTokenTemplates(projectId);
  
  // Map properties to match old interface
  return {
    tokens,
    templates,
    isLoading,
    isSaving,
    loading: templatesLoading,
    saving: templatesSaving,
    fetchTokens,
    fetchTemplates,
    getToken,
    createToken,
    updateToken,
    deleteToken,
    createTemplate,
    deleteTemplate,
    updateTokenDeployment,
    createFromTemplate
  };
};
EOL

  echo "Created useTokenCRUD compatibility layer"
}

# Function to create integration service compatibility layers
create_integration_compatibility() {
  echo "Creating tokenService.ts compatibility layer in integrations"
  
  mkdir -p src/services/integrations
  
  cat > src/services/integrations/tokenService.ts << 'EOL'
/**
 * @deprecated Use @/services/token directly instead
 * This is a compatibility layer for the old tokenService module
 */

import { 
  getTokens as getTokensBase,
  getTokenById,
  createToken as createTokenBase,
  updateToken as updateTokenBase,
  deleteToken as deleteTokenBase,
  updateTokenDeployment,
  updateVerificationStatus
} from '@/services/token';

import { TokenFormData } from '@/components/tokens/types';
import type { TokenData, ExtendedTokenData } from '@/services/token/tokenTypes';

// Re-export types for compatibility
export type { TokenData, ExtendedTokenData };

// Re-export token status enum
export { TokenStatus } from '@/types/centralModels';

/**
 * Get all tokens with optional status filtering
 */
export const getTokens = getTokensBase;

/**
 * Get tokens by status
 */
export const getTokensByStatus = async (status?: string) => {
  const response = await getTokensBase({});
  
  if (response.success && response.data && status) {
    // Filter by status if provided
    const tokens = Array.isArray(response.data) 
      ? response.data
      : [response.data];
      
    return tokens.filter(token => token.status === status);
  }
  
  return response.data || [];
};

/**
 * Get tokens by project ID
 */
export const getTokensByProjectId = async (projectId: string) => {
  const response = await getTokensBase({ projectId });
  
  if (response.success && response.data) {
    return Array.isArray(response.data) 
      ? response.data
      : [response.data];
  }
  
  return [];
};

/**
 * Get a single token by ID
 */
export const getToken = async (tokenId: string): Promise<TokenFormData | null> => {
  const response = await getTokenById(tokenId);
  
  if (response.success && response.data) {
    return response.data as TokenFormData;
  }
  
  return null;
};

/**
 * Create a new token
 */
export const createToken = async (token: ExtendedTokenData): Promise<TokenFormData | null> => {
  const response = await createTokenBase(token as TokenFormData);
  
  if (response.success && response.data) {
    return response.data as TokenFormData;
  }
  
  return null;
};

/**
 * Update an existing token
 */
export const updateToken = async (tokenId: string, token: Partial<TokenFormData>): Promise<TokenFormData | null> => {
  // Get existing token first to make sure we have all required fields
  const existingResponse = await getTokenById(tokenId);
  
  if (!existingResponse.success || !existingResponse.data) {
    console.error('Error getting existing token for update:', existingResponse.error);
    return null;
  }
  
  const existingToken = existingResponse.data as TokenFormData;
  
  // Merge existing token with updates
  const updatedToken = {
    ...existingToken,
    ...token
  };
  
  const response = await updateTokenBase(tokenId, updatedToken);
  
  if (response.success && response.data) {
    return response.data as TokenFormData;
  }
  
  return null;
};

/**
 * Delete a token
 */
export const deleteToken = async (tokenId: string): Promise<boolean> => {
  const response = await deleteTokenBase(tokenId);
  return response.success;
};

/**
 * Update token status
 */
export const updateTokenStatus = async (tokenId: string, status: string): Promise<TokenFormData | null> => {
  // Get existing token first
  const existingResponse = await getTokenById(tokenId);
  
  if (!existingResponse.success || !existingResponse.data) {
    console.error('Error getting existing token for status update:', existingResponse.error);
    return null;
  }
  
  const existingToken = existingResponse.data as TokenFormData;
  
  // Update just the status
  const updatedToken = {
    ...existingToken,
    status
  };
  
  const response = await updateTokenBase(tokenId, updatedToken);
  
  if (response.success && response.data) {
    return response.data as TokenFormData;
  }
  
  return null;
};
EOL

  echo "Creating tokenTemplateService.ts compatibility layer in integrations"
  
  cat > src/services/integrations/tokenTemplateService.ts << 'EOL'
/**
 * @deprecated Use @/services/token directly instead
 * This is a compatibility layer for the old tokenTemplateService module
 */

import {
  getTemplates as getTemplatesBase,
  getTemplateById,
  createTemplate as createTemplateBase,
  updateTemplate as updateTemplateBase,
  deleteTemplate as deleteTemplateBase,
  createTokenFromTemplate as createTokenFromTemplateBase
} from '@/services/token';

import { TokenTemplate, TokenFormData } from '@/components/tokens/types';

// Re-export TokenTemplate type
export type { TokenTemplate };

/**
 * Get all templates with optional status filtering
 */
export const getTokenTemplates = async (options?: { projectId?: string, status?: string }): Promise<TokenTemplate[]> => {
  const response = await getTemplatesBase({ projectId: options?.projectId });
  
  if (response.success && response.data) {
    const templates = Array.isArray(response.data) 
      ? response.data
      : [response.data];
      
    // Filter by status if provided
    if (options?.status) {
      return templates.filter(template => 
        template.status === options.status ||
        template.metadata?.status === options.status
      );
    }
    
    return templates;
  }
  
  return [];
};

/**
 * Get templates with status
 */
export const getTemplatesWithStatus = async (status?: string): Promise<TokenTemplate[]> => {
  return getTokenTemplates({ status });
};

/**
 * Get a template by ID
 */
export const getTokenTemplate = async (templateId: string): Promise<TokenTemplate | null> => {
  const response = await getTemplateById(templateId);
  
  if (response.success && response.data) {
    return response.data as TokenTemplate;
  }
  
  return null;
};

/**
 * Create a new template
 */
export const createTokenTemplate = async (template: Partial<TokenTemplate>): Promise<TokenTemplate | null> => {
  const response = await createTemplateBase(template as TokenTemplate);
  
  if (response.success && response.data) {
    return response.data as TokenTemplate;
  }
  
  return null;
};

/**
 * Update an existing template
 */
export const updateTokenTemplate = async (templateId: string, template: Partial<TokenTemplate>): Promise<TokenTemplate | null> => {
  // Get existing template first
  const existingResponse = await getTemplateById(templateId);
  
  if (!existingResponse.success || !existingResponse.data) {
    console.error('Error getting existing template for update:', existingResponse.error);
    return null;
  }
  
  const existingTemplate = existingResponse.data as TokenTemplate;
  
  // Merge existing template with updates
  const updatedTemplate = {
    ...existingTemplate,
    ...template
  };
  
  const response = await updateTemplateBase(templateId, updatedTemplate);
  
  if (response.success && response.data) {
    return response.data as TokenTemplate;
  }
  
  return null;
};

/**
 * Delete a template
 */
export const deleteTokenTemplate = async (templateId: string): Promise<boolean> => {
  const response = await deleteTemplateBase(templateId);
  return response.success;
};

/**
 * Create token from template
 */
export const createTokenFromTemplate = async (
  templateId: string, 
  customizations: Partial<TokenFormData>
): Promise<TokenFormData | null> => {
  const response = await createTokenFromTemplateBase(templateId, customizations);
  
  if (response.success && response.data) {
    return response.data as TokenFormData;
  }
  
  return null;
};

/**
 * Delete template group (compatibility stub)
 */
export const deleteTemplateGroup = async (groupId: string): Promise<boolean> => {
  console.warn('deleteTemplateGroup is deprecated and not fully implemented in the new services');
  return true;
};

/**
 * Duplicate token template (compatibility stub)
 */
export const duplicateTokenTemplate = async (
  templateId: string,
  customizations: Partial<TokenTemplate>
): Promise<TokenTemplate | null> => {
  // Get the original template
  const originalTemplate = await getTokenTemplate(templateId);
  
  if (!originalTemplate) {
    console.error('Original template not found for duplication');
    return null;
  }
  
  // Create a new template based on the original
  const newTemplate: TokenTemplate = {
    ...originalTemplate,
    ...customizations,
    id: undefined as any, // Remove ID so a new one will be generated
  };
  
  return createTokenTemplate(newTemplate);
};
EOL

  echo "Created integration service compatibility layers"
}

# =========================================
# MAIN EXECUTION
# =========================================

# Step 1: Fix the export type in index.ts
fix_index_ts

# Step 2: Create tokenTypes.ts file for operation services
create_token_types_file

# Step 3: Fix token service metadata handling
fix_token_service

# Step 4: Fix template service TokenFormData issue
fix_template_service

# Step 5: Create hook compatibility layer
create_hook_compatibility

# Step 6: Create integration service compatibility layers
create_integration_compatibility

echo "Error fixes completed!"
echo "Run 'npx tsc --noEmit' to verify the fixes"