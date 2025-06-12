/**
 * Token services re-exports
 * Re-exports token services from components/tokens/services for global access
 */

// Re-export all token services from components directory
export * from '@/components/tokens/services';

// Re-export specific commonly used functions from tokenService (excluding getTokens which we'll wrap)
export {
  createToken,
  updateToken,
  getToken,
  getTokensByProject,
  getCompleteToken,
  updateTokenDeployment,
  deployToken,
  executeTokenOperation,
  createTokenTemplate,
  getTokenTemplatesByProject,
  deleteToken,
  updateTokenStatus
} from '@/components/tokens/services/tokenService';

// Create wrapper function for getTemplates
export async function getTemplates(options: { projectId: string }) {
  const { getTokenTemplatesByProject } = await import('@/components/tokens/services/tokenService');
  return {
    success: true,
    data: await getTokenTemplatesByProject(options.projectId)
  };
}

// Create wrapper function for getTokens to match expected interface
export async function getTokens(options: { projectId: string }) {
  const { getTokensByProject } = await import('@/components/tokens/services/tokenService');
  return {
    success: true,
    data: await getTokensByProject(options.projectId)
  };
}

// Specific commonly used service instances for convenience
export {
  erc20Service,
  erc721Service,
  erc1155Service,
  erc1400Service,
  erc3525Service,
  erc4626Service
} from '@/components/tokens/services';

// Service classes for advanced usage
export {
  EnhancedERC20Service,
  EnhancedERC721Service,
  EnhancedERC1155Service,
  EnhancedERC1400Service,
  EnhancedERC3525Service,
  EnhancedERC4626Service
} from '@/components/tokens/services';
