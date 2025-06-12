import { NetworkEnvironment } from '@/infrastructure/web3/ProviderManager';
import { isAddress as isEthereumAddress } from 'ethers';

/**
 * Deployment request interface
 */
export interface DeploymentRequest {
  projectId: string;
  tokenId: string;
  blockchain: string;
  environment: NetworkEnvironment;
  keyId: string;
  contractAddress?: string;
}

/**
 * Validates a deployment request
 * @param request The deployment request to validate
 * @returns Error message if validation fails, null if valid
 */
export const validateDeploymentRequest = (request: Partial<DeploymentRequest>): string | null => {
  const { projectId, tokenId, blockchain, environment, keyId } = request;

  // Check for required fields
  if (!projectId) {
    return 'Project ID is required';
  }
  
  if (!tokenId) {
    return 'Token ID is required';
  }
  
  if (!blockchain) {
    return 'Blockchain is required';
  }
  
  if (!environment) {
    return 'Network environment is required';
  }
  
  if (!keyId) {
    return 'Key ID is required';
  }

  // Validate blockchain - simplified validation for now, could be expanded
  const supportedBlockchains = ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base', 'binance'];
  if (!supportedBlockchains.includes(blockchain.toLowerCase())) {
    return `Unsupported blockchain: ${blockchain}. Supported blockchains: ${supportedBlockchains.join(', ')}`;
  }
  
  // Validate environment
  if (environment !== 'mainnet' && environment !== 'testnet') {
    return `Invalid environment: ${environment}. Supported environments: mainnet, testnet`;
  }
  
  // Validate contract address if provided
  if (request.contractAddress) {
    // For Ethereum-compatible chains, validate with ethers
    if (['ethereum', 'polygon', 'arbitrum', 'optimism', 'base'].includes(blockchain.toLowerCase())) {
      if (!isEthereumAddress(request.contractAddress)) {
        return `Invalid contract address for ${blockchain}: ${request.contractAddress}`;
      }
    }
  }
  
  return null;
};

/**
 * Validates a token verification request
 * @param tokenId Token ID
 * @param blockchain Blockchain
 * @param contractAddress Contract address
 * @returns Error message if validation fails, null if valid
 */
export const validateVerificationRequest = (
  tokenId: string,
  blockchain: string,
  contractAddress: string
): string | null => {
  if (!tokenId) {
    return 'Token ID is required';
  }
  
  if (!blockchain) {
    return 'Blockchain is required';
  }
  
  if (!contractAddress) {
    return 'Contract address is required';
  }
  
  // Validate blockchain
  const supportedBlockchains = ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base', 'binance'];
  if (!supportedBlockchains.includes(blockchain.toLowerCase())) {
    return `Unsupported blockchain: ${blockchain}. Supported blockchains: ${supportedBlockchains.join(', ')}`;
  }
  
  // Validate contract address
  if (['ethereum', 'polygon', 'arbitrum', 'optimism', 'base'].includes(blockchain.toLowerCase())) {
    if (!isEthereumAddress(contractAddress)) {
      return `Invalid contract address for ${blockchain}: ${contractAddress}`;
    }
  }
  
  return null;
};