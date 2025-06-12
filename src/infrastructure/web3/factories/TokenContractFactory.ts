import { ethers } from 'ethers';
import { TokenType } from '@/types/core/centralModels';
import type { SupportedChain } from '../adapters/IBlockchainAdapter';
import { 
  ERC20_ABI, 
  ERC721_ABI, 
  ERC1155_ABI, 
  ERC1400_ABI, 
  ERC3525_ABI, 
  ERC4626_ABI 
} from '../TokenInterfaces';
import { providerManager, NetworkEnvironment } from '../ProviderManager';
import { logActivity } from '@/infrastructure/activityLogger';

// Deployment parameters interface for different token types
export interface TokenDeploymentParams {
  // Base parameters for all tokens
  name: string;
  symbol: string;
  description: string;
  configurationLevel: 'min' | 'max';
  
  // ERC20 specific parameters
  decimals?: number;
  initialSupply?: string;
  cap?: string;
  isMintable?: boolean;
  isBurnable?: boolean;
  isPausable?: boolean;
  
  // ERC20 detailed parameters
  accessControl?: string;
  allowanceManagement?: boolean;
  permit?: boolean;
  snapshot?: boolean;
  feeOnTransfer?: boolean;
  feePercentage?: number;
  feeRecipient?: string;
  rebasing?: boolean;
  rebasingMode?: string;
  targetSupply?: string;
  
  // ERC721 specific parameters
  baseURI?: string;
  royaltyRecipient?: string;
  royaltyPercentage?: number;
  
  // ERC1155 specific parameters
  uri?: string;
  dynamicUris?: boolean;
  batchMinting?: boolean;
  batchTransfers?: boolean;
  transferRestrictions?: boolean;
  
  // ERC3525 specific parameters
  feeStructure?: {
    transferFee?: number;
    mintFee?: number;
    slotCreationFee?: number;
  };
  slotConfiguration?: {
    initialSlots?: number[];
    slotURIs?: string[];
  };
  
  // ERC4626 specific parameters
  assetAddress?: string;
  assetName?: string;
  assetSymbol?: string;
  assetDecimals?: number;
  vaultType?: string;
  vaultStrategy?: string;
  strategyController?: string;
  depositLimit?: string;
  withdrawalLimit?: string;
  minDeposit?: string;
  maxDeposit?: string;
  minWithdrawal?: string;
  maxWithdrawal?: string;
  liquidityReserve?: string;
  maxSlippage?: number;
  
  // ERC1400 specific parameters
  controllers?: string[];
  partitions?: string[];
  isIssuable?: boolean;
  isControllable?: boolean;
  isDocumentable?: boolean;
}

/**
 * TokenContractFactory class for managing the deployment of different token standards
 */
export class TokenContractFactory {
  private provider: ethers.JsonRpcProvider;
  private blockchain: string;
  private environment: NetworkEnvironment;
  private networkConfig: any;
  
  /**
   * Constructor for TokenContractFactory
   * @param blockchain The blockchain to deploy to (e.g., "ethereum", "polygon")
   * @param environment The network environment (mainnet or testnet)
   */
  constructor(blockchain: string, environment: NetworkEnvironment) {
    this.blockchain = blockchain;
    this.environment = environment;
    
    // Get provider for the specified blockchain and environment
    this.provider = providerManager.getProviderForEnvironment(blockchain as SupportedChain, environment);
    
    // Get network configuration
    this.networkConfig = providerManager.getNetworkConfig(blockchain, environment);
    
    if (!this.provider) {
      throw new Error(`Provider not available for ${blockchain} in ${environment} environment`);
    }
  }
  
  /**
   * Deploy a token contract
   * @param tokenType The token standard type
   * @param params Deployment parameters
   * @param privateKey Private key for signing the transaction
   * @returns Promise resolving to deployment result with contract address and transaction hash
   */
  async deployToken(
    tokenType: TokenType,
    params: TokenDeploymentParams,
    privateKey: string
  ): Promise<{ address: string; transactionHash: string }> {
    try {
      // Create wallet with private key
      const wallet = new ethers.Wallet(privateKey, this.provider);
      
      // Determine if we're using the minimal or detailed implementation
      const useDetailed = params.configurationLevel === 'max';
      
      // Get contract bytecode and ABI based on token type and configuration level
      const { abi, bytecode } = await this.getContractArtifact(tokenType, useDetailed);
      
      // Prepare constructor parameters
      const constructorParams = this.prepareConstructorParams(tokenType, params, useDetailed);
      
      // Log deployment start
      await this.logDeployment('started', tokenType, {
        blockchain: this.blockchain,
        environment: this.environment,
        wallet: wallet.address,
        tokenType,
        params: { ...params, privateKey: '[REDACTED]' }
      });
      
      // Create contract factory
      const factory = new ethers.ContractFactory(abi, bytecode, wallet);
      
      // Deploy contract with gas estimation
      const deploymentTx = await factory.getDeployTransaction(...constructorParams);
      
      // Estimate gas
      const estimatedGas = await this.provider.estimateGas(deploymentTx);
      
      // Add 20% buffer to gas estimate
      const gasLimit = Math.floor(Number(estimatedGas) * 1.2);
      
      // Deploy with gas limit
      const contract = await factory.deploy(...constructorParams, { gasLimit });
      
      // Wait for deployment
      const receipt = await contract.deploymentTransaction()?.wait();
      
      if (!receipt) {
        throw new Error('Deployment failed: No transaction receipt received');
      }
      
      // Log successful deployment
      await this.logDeployment('success', tokenType, {
        blockchain: this.blockchain,
        environment: this.environment,
        contractAddress: contract.target,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        wallet: wallet.address
      });
      
      return {
        address: contract.target as string,
        transactionHash: receipt.hash
      };
    } catch (error: any) {
      // Log deployment failure
      await this.logDeployment('failed', tokenType, {
        blockchain: this.blockchain,
        environment: this.environment,
        error: error.message
      });
      
      throw new Error(`Token deployment failed: ${error.message}`);
    }
  }
  
  /**
   * Get contract artifact (ABI and bytecode) based on token type and configuration level
   */
  private async getContractArtifact(tokenType: TokenType, useDetailed: boolean): Promise<{ abi: any, bytecode: string }> {
    // Build the path to the contract artifact
    const contractType = useDetailed ? 'max' : 'min';
    let contractName: string;
    
    switch (tokenType) {
      case TokenType.ERC20:
        contractName = useDetailed ? 'ERC20Detailed' : 'ERC20Token';
        break;
      case TokenType.ERC721:
        contractName = useDetailed ? 'ERC721Detailed' : 'ERC721Token';
        break;
      case TokenType.ERC1155:
        contractName = useDetailed ? 'ERC1155Detailed' : 'ERC1155Token';
        break;
      case TokenType.ERC3525:
        contractName = useDetailed ? 'ERC3525Detailed' : 'ERC3525Token';
        break;
      case TokenType.ERC4626:
        contractName = useDetailed ? 'ERC4626Detailed' : 'ERC4626Token';
        break;
      case TokenType.ERC1400:
        contractName = useDetailed ? 'ERC1400Detailed' : 'ERC1400Token';
        break;
      default:
        throw new Error(`Unsupported token type: ${tokenType}`);
    }
    
    try {
      // Try multiple artifact paths to account for different build configurations
      let artifact;
      const artifactPaths = [
        `@/artifacts/contracts/${contractType}/${contractName}.sol/${contractName}.json`,
        `./artifacts/contracts/${contractType}/${contractName}.sol/${contractName}.json`,
        `../artifacts/contracts/${contractType}/${contractName}.sol/${contractName}.json`,
        `/artifacts/contracts/${contractType}/${contractName}.sol/${contractName}.json`
      ];
      
      // Try each path until we find one that works
      for (const path of artifactPaths) {
        try {
          artifact = await import(/* @vite-ignore */ path);
          console.log(`Found artifact at ${path}`);
          break;
        } catch (importError) {
          // Continue trying other paths
          console.debug(`Artifact not found at ${path}`);
        }
      }
      
      // If artifact was found, return it
      if (artifact) {
        return {
          abi: artifact.abi,
          bytecode: artifact.bytecode
        };
      }
      
      // If no artifact was found, fall back to hardcoded values
      throw new Error('No artifact found in any expected location');
    } catch (error) {
      // Fallback to hardcoded ABIs if artifacts can't be loaded
      console.warn(`Failed to load contract artifact for ${contractName}. Using fallback ABI and bytecode. Error: ${error.message}`);
      
      // Use the fallback ABI for the token type
      const abi = this.getAbiForTokenType(tokenType);
      
      // Use a minimal placeholder bytecode for demo/testing purposes
      // In a production environment, this should be replaced with actual compiled bytecode
      const bytecode = this.getPlaceholderBytecode();
      
      return {
        abi,
        bytecode
      };
    }
  }
  
  /**
   * Get placeholder bytecode for testing/demo purposes
   */
  private getPlaceholderBytecode(): string {
    // This is a minimal ERC20 token bytecode for demo/testing
    // In production, this should be replaced with actual compiled bytecode
    return "0x60806040523480156200001157600080fd5b506040518060400160405280600a81526020017f54657374546f6b656e00000000000000000000000000000000000000000000008152506040518060400160405280600481526020017f54455354000000000000000000000000000000000000000000000000000000008152506012600090805190602001906200009692919062000186565b5080600190805190602001906200008e92919062000186565b505080600260006101000a81548160ff021916908360ff160217905550505050348015620000ba57600080fd5b50336000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555062000235565b8280546200019490620001d0565b90600052602060002090601f016020900481019282620001b85760008555620001fe565b82601f10620001d357805160ff1916838001178555620001fe565b82800160010185558215620001fe579182015b82811115620001fd578251825591602001919060010190620001e6565b5b5090506200020d919062000211565b5090565b5b8082111562000230576000816000905550600101620002125600a165627a7a7230582002fafd0e018b4e53647b120eeebcb4c6536c0b565f63e2f808257b7e1088dd770029";
  }
  
  /**
   * Get ABI for a token type (fallback method)
   */
  private getAbiForTokenType(tokenType: TokenType): any[] {
    switch (tokenType) {
      case TokenType.ERC20:
        return ERC20_ABI;
      case TokenType.ERC721:
        return ERC721_ABI;
      case TokenType.ERC1155:
        return ERC1155_ABI;
      case TokenType.ERC1400:
        return ERC1400_ABI;
      case TokenType.ERC3525:
        return ERC3525_ABI;
      case TokenType.ERC4626:
        return ERC4626_ABI;
      default:
        throw new Error(`Unsupported token type: ${tokenType}`);
    }
  }
  
  /**
   * Prepare constructor parameters based on token type and configuration
   */
  private prepareConstructorParams(tokenType: TokenType, params: TokenDeploymentParams, useDetailed: boolean): any[] {
    // Validate parameters based on token type
    this.validateParams(tokenType, params);
    
    // Prepare parameters based on token type and complexity
    switch (tokenType) {
      case TokenType.ERC20:
        return this.prepareERC20Params(params, useDetailed);
      case TokenType.ERC721:
        return this.prepareERC721Params(params, useDetailed);
      case TokenType.ERC1155:
        return this.prepareERC1155Params(params, useDetailed);
      case TokenType.ERC3525:
        return this.prepareERC3525Params(params, useDetailed);
      case TokenType.ERC4626:
        return this.prepareERC4626Params(params, useDetailed);
      case TokenType.ERC1400:
        return this.prepareERC1400Params(params, useDetailed);
      default:
        throw new Error(`Unsupported token type: ${tokenType}`);
    }
  }
  
  /**
   * Validate deployment parameters for a specific token type
   */
  private validateParams(tokenType: TokenType, params: TokenDeploymentParams): void {
    // Basic validation for all token types
    if (!params.name) throw new Error('Token name is required');
    if (!params.symbol) throw new Error('Token symbol is required');
    
    // Token-specific validation
    switch (tokenType) {
      case TokenType.ERC20:
        this.validateERC20Params(params);
        break;
      case TokenType.ERC721:
        this.validateERC721Params(params);
        break;
      case TokenType.ERC1155:
        this.validateERC1155Params(params);
        break;
      case TokenType.ERC3525:
        this.validateERC3525Params(params);
        break;
      case TokenType.ERC4626:
        this.validateERC4626Params(params);
        break;
      case TokenType.ERC1400:
        this.validateERC1400Params(params);
        break;
    }
  }
  
  // Parameter preparation methods for each token type
  
  private prepareERC20Params(params: TokenDeploymentParams, useDetailed: boolean): any[] {
    if (useDetailed) {
      // For ERC20Detailed (max configuration)
      return [
        params.name,
        params.symbol,
        params.description || '',
        params.decimals || 18,
        params.initialSupply ? ethers.parseUnits(params.initialSupply, params.decimals || 18) : 0,
        params.isMintable ?? true,
        params.isBurnable ?? true,
        params.cap ? ethers.parseUnits(params.cap, params.decimals || 18) : 0,
        params.isPausable ?? false,
        params.accessControl || 'owner',
        params.allowanceManagement ?? false,
        params.permit ?? false,
        params.snapshot ?? false,
        params.feeOnTransfer ?? false,
        params.feePercentage || 0,
        params.feeRecipient || ethers.ZeroAddress,
        params.rebasing ?? false,
        params.rebasingMode || 'manual',
        params.targetSupply ? ethers.parseUnits(params.targetSupply, params.decimals || 18) : 0
      ];
    } else {
      // For ERC20Token (min configuration)
      return [
        params.name,
        params.symbol,
        params.description || '',
        params.decimals || 18,
        params.initialSupply ? ethers.parseUnits(params.initialSupply, params.decimals || 18) : 0,
        params.isMintable ?? true,
        params.isBurnable ?? true,
        params.isPausable ?? false,
        params.cap ? ethers.parseUnits(params.cap, params.decimals || 18) : 0
      ];
    }
  }
  
  private prepareERC721Params(params: TokenDeploymentParams, useDetailed: boolean): any[] {
    if (useDetailed) {
      // For ERC721Detailed (max configuration)
      return [
        params.name,
        params.symbol,
        params.description || '',
        params.baseURI || '',
        params.isMintable ?? true,
        params.isBurnable ?? true,
        params.isPausable ?? false,
        params.accessControl || 'owner',
        params.dynamicUris ?? false,
        params.batchMinting ?? false,
        params.batchTransfers ?? false,
        params.royaltyRecipient || ethers.ZeroAddress,
        params.royaltyPercentage || 0
      ];
    } else {
      // For ERC721Token (min configuration)
      return [
        params.name,
        params.symbol,
        params.description || '',
        params.baseURI || '',
        params.isMintable ?? true,
        params.isBurnable ?? true,
        params.isPausable ?? false,
        params.royaltyRecipient || ethers.ZeroAddress,
        params.royaltyPercentage || 0
      ];
    }
  }
  
  private prepareERC1155Params(params: TokenDeploymentParams, useDetailed: boolean): any[] {
    if (useDetailed) {
      // For ERC1155Detailed (max configuration)
      return [
        params.name,
        params.symbol,
        params.description || '',
        params.uri || '',
        params.isMintable ?? true,
        params.isBurnable ?? true,
        params.isPausable ?? false,
        params.accessControl || 'owner',
        params.dynamicUris ?? false,
        params.batchMinting ?? true,
        params.batchTransfers ?? true,
        params.transferRestrictions ?? false,
        params.royaltyRecipient || ethers.ZeroAddress,
        params.royaltyPercentage || 0
      ];
    } else {
      // For ERC1155Token (min configuration)
      return [
        params.name,
        params.symbol,
        params.description || '',
        params.uri || '',
        params.isMintable ?? true,
        params.isBurnable ?? true,
        params.isPausable ?? false,
        params.royaltyRecipient || ethers.ZeroAddress,
        params.royaltyPercentage || 0
      ];
    }
  }
  
  private prepareERC3525Params(params: TokenDeploymentParams, useDetailed: boolean): any[] {
    // Parse fee structure and slot configuration
    const feeStructure = JSON.stringify(params.feeStructure || {});
    const slotConfig = JSON.stringify(params.slotConfiguration || {});
    
    if (useDetailed) {
      // For ERC3525Detailed (max configuration)
      return [
        params.name,
        params.symbol,
        params.description || '',
        params.decimals || 0,
        params.baseURI || '',
        params.isMintable ?? true,
        params.isBurnable ?? true,
        params.isPausable ?? false,
        params.accessControl || 'owner',
        feeStructure,
        slotConfig,
        params.royaltyRecipient || ethers.ZeroAddress,
        params.royaltyPercentage || 0
      ];
    } else {
      // For ERC3525Token (min configuration)
      return [
        params.name,
        params.symbol,
        params.description || '',
        params.decimals || 0,
        params.baseURI || '',
        params.isMintable ?? true,
        params.isBurnable ?? true,
        params.isPausable ?? false,
        feeStructure,
        slotConfig,
        params.royaltyRecipient || ethers.ZeroAddress,
        params.royaltyPercentage || 0
      ];
    }
  }
  
  private prepareERC4626Params(params: TokenDeploymentParams, useDetailed: boolean): any[] {
    if (useDetailed) {
      // For ERC4626Detailed (max configuration)
      return [
        params.name,
        params.symbol,
        params.description || '',
        params.assetAddress || ethers.ZeroAddress,
        params.assetName || '',
        params.assetSymbol || '',
        params.assetDecimals || 18,
        params.isMintable ?? true,
        params.isBurnable ?? true,
        params.isPausable ?? false,
        params.accessControl || 'owner',
        params.vaultType || 'standard',
        params.vaultStrategy || 'conservative',
        params.strategyController || ethers.ZeroAddress,
        params.depositLimit ? ethers.parseUnits(params.depositLimit, params.assetDecimals || 18) : 0,
        params.withdrawalLimit ? ethers.parseUnits(params.withdrawalLimit, params.assetDecimals || 18) : 0,
        params.minDeposit ? ethers.parseUnits(params.minDeposit, params.assetDecimals || 18) : 0,
        params.maxDeposit ? ethers.parseUnits(params.maxDeposit, params.assetDecimals || 18) : 0,
        params.minWithdrawal ? ethers.parseUnits(params.minWithdrawal, params.assetDecimals || 18) : 0,
        params.maxWithdrawal ? ethers.parseUnits(params.maxWithdrawal, params.assetDecimals || 18) : 0,
        params.liquidityReserve ? ethers.parseUnits(params.liquidityReserve, params.assetDecimals || 18) : 0,
        params.maxSlippage || 100, // 1% by default (in basis points)
        params.feePercentage || 0
      ];
    } else {
      // For ERC4626Token (min configuration)
      return [
        params.name,
        params.symbol,
        params.description || '',
        params.assetAddress || ethers.ZeroAddress,
        params.isMintable ?? true,
        params.isBurnable ?? true,
        params.isPausable ?? false,
        params.depositLimit ? ethers.parseUnits(params.depositLimit, params.assetDecimals || 18) : 0
      ];
    }
  }
  
  private prepareERC1400Params(params: TokenDeploymentParams, useDetailed: boolean): any[] {
    if (useDetailed) {
      // For ERC1400Detailed (max configuration)
      return [
        params.name,
        params.symbol,
        params.description || '',
        params.decimals || 18,
        params.initialSupply ? ethers.parseUnits(params.initialSupply, params.decimals || 18) : 0,
        params.controllers || [],
        params.partitions || [],
        params.isMintable ?? true,
        params.isBurnable ?? true,
        params.isPausable ?? false,
        params.isIssuable ?? true,
        params.isControllable ?? true,
        params.isDocumentable ?? true,
        params.accessControl || 'owner'
      ];
    } else {
      // For ERC1400Token (min configuration)
      return [
        params.name,
        params.symbol,
        params.description || '',
        params.decimals || 18,
        params.initialSupply ? ethers.parseUnits(params.initialSupply, params.decimals || 18) : 0,
        params.controllers || [],
        params.partitions || [],
        params.isMintable ?? true,
        params.isBurnable ?? true,
        params.isPausable ?? false
      ];
    }
  }
  
  // Parameter validation methods for each token type
  
  private validateERC20Params(params: TokenDeploymentParams): void {
    if (params.decimals === undefined) {
      params.decimals = 18; // Set default
    } else if (params.decimals < 0 || params.decimals > 18) {
      throw new Error('ERC20 decimals must be between 0 and 18');
    }
    
    if (params.initialSupply && isNaN(Number(params.initialSupply))) {
      throw new Error('Invalid initial supply value');
    }
    
    if (params.cap && isNaN(Number(params.cap))) {
      throw new Error('Invalid cap value');
    }
    
    if (params.cap && params.initialSupply && Number(params.initialSupply) > Number(params.cap)) {
      throw new Error('Initial supply cannot exceed cap');
    }
    
    if (params.feeOnTransfer && !params.feeRecipient) {
      throw new Error('Fee recipient is required when fee on transfer is enabled');
    }
    
    if (params.feeOnTransfer && (params.feePercentage === undefined || params.feePercentage < 0 || params.feePercentage > 10000)) {
      throw new Error('Fee percentage must be between 0 and 10000 basis points (0-100%)');
    }
  }
  
  private validateERC721Params(params: TokenDeploymentParams): void {
    if (params.royaltyPercentage !== undefined && (params.royaltyPercentage < 0 || params.royaltyPercentage > 10000)) {
      throw new Error('Royalty percentage must be between 0 and 10000 basis points (0-100%)');
    }
    
    if (params.royaltyPercentage && params.royaltyPercentage > 0 && !params.royaltyRecipient) {
      throw new Error('Royalty recipient is required when royalty percentage is set');
    }
  }
  
  private validateERC1155Params(params: TokenDeploymentParams): void {
    if (!params.uri) {
      params.uri = 'https://token-cdn-domain/{id}.json'; // Default URI format
    }
    
    if (params.royaltyPercentage !== undefined && (params.royaltyPercentage < 0 || params.royaltyPercentage > 10000)) {
      throw new Error('Royalty percentage must be between 0 and 10000 basis points (0-100%)');
    }
    
    if (params.royaltyPercentage && params.royaltyPercentage > 0 && !params.royaltyRecipient) {
      throw new Error('Royalty recipient is required when royalty percentage is set');
    }
  }
  
  private validateERC3525Params(params: TokenDeploymentParams): void {
    if (params.decimals === undefined) {
      params.decimals = 0; // Default for ERC3525 is usually 0
    }
    
    // Validate fee structure if provided
    if (params.feeStructure) {
      const { transferFee, mintFee, slotCreationFee } = params.feeStructure;
      
      if (transferFee !== undefined && (transferFee < 0 || transferFee > 10000)) {
        throw new Error('Transfer fee must be between 0 and 10000 basis points (0-100%)');
      }
      
      if (mintFee !== undefined && (mintFee < 0 || mintFee > 10000)) {
        throw new Error('Mint fee must be between 0 and 10000 basis points (0-100%)');
      }
      
      if (slotCreationFee !== undefined && (slotCreationFee < 0 || slotCreationFee > 10000)) {
        throw new Error('Slot creation fee must be between 0 and 10000 basis points (0-100%)');
      }
    }
    
    // Validate slot configuration if provided
    if (params.slotConfiguration) {
      const { initialSlots, slotURIs } = params.slotConfiguration;
      
      if (initialSlots && !Array.isArray(initialSlots)) {
        throw new Error('Initial slots must be an array of slot IDs');
      }
      
      if (slotURIs && !Array.isArray(slotURIs)) {
        throw new Error('Slot URIs must be an array of URIs');
      }
      
      if (initialSlots && slotURIs && initialSlots.length !== slotURIs.length) {
        throw new Error('The number of initial slots must match the number of slot URIs');
      }
    }
  }
  
  private validateERC4626Params(params: TokenDeploymentParams): void {
    // Asset configuration validation
    if (!params.assetAddress && (!params.assetName || !params.assetSymbol)) {
      throw new Error('Either asset address or asset name and symbol must be provided');
    }
    
    if (params.assetDecimals === undefined) {
      params.assetDecimals = 18; // Default decimal places
    }
    
    // Limits validation
    if (params.depositLimit && isNaN(Number(params.depositLimit))) {
      throw new Error('Invalid deposit limit value');
    }
    
    if (params.withdrawalLimit && isNaN(Number(params.withdrawalLimit))) {
      throw new Error('Invalid withdrawal limit value');
    }
    
    if (params.minDeposit && isNaN(Number(params.minDeposit))) {
      throw new Error('Invalid minimum deposit value');
    }
    
    if (params.maxDeposit && isNaN(Number(params.maxDeposit))) {
      throw new Error('Invalid maximum deposit value');
    }
    
    if (params.minWithdrawal && isNaN(Number(params.minWithdrawal))) {
      throw new Error('Invalid minimum withdrawal value');
    }
    
    if (params.maxWithdrawal && isNaN(Number(params.maxWithdrawal))) {
      throw new Error('Invalid maximum withdrawal value');
    }
    
    if (params.liquidityReserve && isNaN(Number(params.liquidityReserve))) {
      throw new Error('Invalid liquidity reserve value');
    }
    
    if (params.maxSlippage !== undefined && (params.maxSlippage < 0 || params.maxSlippage > 10000)) {
      throw new Error('Maximum slippage must be between 0 and 10000 basis points (0-100%)');
    }
  }
  
  private validateERC1400Params(params: TokenDeploymentParams): void {
    if (params.decimals === undefined) {
      params.decimals = 18; // Set default
    }
    
    if (params.initialSupply && isNaN(Number(params.initialSupply))) {
      throw new Error('Invalid initial supply value');
    }
    
    // Validate controllers if provided
    if (params.controllers && !Array.isArray(params.controllers)) {
      throw new Error('Controllers must be an array of addresses');
    }
    
    // Validate partitions if provided
    if (params.partitions && !Array.isArray(params.partitions)) {
      throw new Error('Partitions must be an array of partition names');
    }
  }
  
  /**
   * Log token deployment events
   */
  private async logDeployment(
    status: 'started' | 'success' | 'failed',
    tokenType: TokenType,
    details: any
  ): Promise<void> {
    try {
      await logActivity({
        action: `token_deployment_${status}`,
        entity_type: 'token',
        entity_id: details.contractAddress || 'pending',
        details: {
          ...details,
          tokenType
        },
        status: status === 'failed' ? 'error' : 'success'
      });
    } catch (error) {
      console.error('Failed to log token deployment:', error);
    }
  }
}

// Export the TokenContractFactory
export default TokenContractFactory;