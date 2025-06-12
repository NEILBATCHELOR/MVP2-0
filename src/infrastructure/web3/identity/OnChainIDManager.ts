import { ethers, type Provider, JsonRpcProvider, Contract, Interface, getAddress } from 'ethers';
import { IdentitySDK } from '@onchain-id/identity-sdk';
import { supabase } from '@/infrastructure/database/client';
import { 
  IdentityDeployOptions, 
  DeployedIdentity, 
  ClaimData, 
  IdentityProviderConfig,
  IdentityVerificationResult,
  ClaimVerificationResult,
  ClaimTopic,
  KeyPurpose,
  DigitalIdentityData
} from '@/types/domain/blockchain/onchainid';
import { BlockchainFactory } from '../BlockchainFactory';
import { EVMAdapter } from '../adapters/evm/EVMAdapter';
import { 
  OnchainIdentityInsert, 
  OnchainClaimInsert, 
  OnchainVerificationHistoryInsert,
  OnchainIdentityTable,
  OnchainIssuerTable,
  OnchainClaimTable
} from '@/types/core/database';
import { FactoryInterface } from './contracts/FactoryInterface';
import { ClaimIssuerInterface } from './contracts/ClaimIssuerInterface';

/**
 * Manager class for ONCHAINID operations
 */
export class OnChainIDManager {
  private provider:  Provider;
  private signer?: ethers.Signer;
  private factoryAddress: string;
  private implementationAuthorityAddress: string;
  private gatewayAddress?: string;
  private networkConfig: IdentityProviderConfig;
  private blockchainAdapter: EVMAdapter;
  private static instance: OnChainIDManager;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor(
    networkConfig: IdentityProviderConfig,
    provider?:  Provider,
    signer?: ethers.Signer
  ) {
    this.networkConfig = networkConfig;
    this.factoryAddress = networkConfig.factoryAddress || '';
    this.implementationAuthorityAddress = networkConfig.implementationAuthorityAddress || '';
    this.gatewayAddress = networkConfig.gatewayAddress;
    
    // Initialize provider
    if (provider) {
      this.provider = provider;
    } else {
      throw new Error('Provider instance must be provided');
    }
    
    // Initialize signer if provided
    this.signer = signer;
    
    // Initialize blockchain adapter
    const factory = new BlockchainFactory();
    const adapter = BlockchainFactory.getAdapter('ethereum');
    if (adapter instanceof EVMAdapter) {
      this.blockchainAdapter = adapter;
    } else {
      throw new Error('ONCHAINID requires an EVM adapter');
    }
  }

  /**
   * Get singleton instance of OnChainIDManager
   * @param networkConfig Network configuration 
   * @param provider Optional ethers provider
   * @param signer Optional ethers signer
   * @returns OnChainIDManager instance
   */
  public static getInstance(
    networkConfig: IdentityProviderConfig,
    provider?:  Provider,
    signer?: ethers.Signer
  ): OnChainIDManager {
    if (!OnChainIDManager.instance) {
      OnChainIDManager.instance = new OnChainIDManager(networkConfig, provider, signer);
    }
    return OnChainIDManager.instance;
  }

  /**
   * Update the signer for the manager
   * @param signer New ethers signer
   */
  public setSigner(signer: ethers.Signer): void {
    this.signer = signer;
  }

  /**
   * Set provider for the manager
   * @param provider New ethers provider 
   */
  public setProvider(provider:  Provider): void {
    this.provider = provider;
  }

  /**
   * Creates a new ONCHAINID for a user
   * @param userId The user ID in our system
   * @param walletAddress The wallet address to link to the identity
   * @param options Additional deployment options
   * @returns The deployed identity information
   */
  async createIdentity(
    userId: string,
    walletAddress: string,
    options?: IdentityDeployOptions
  ): Promise<DeployedIdentity> {
    if (!this.signer) {
      throw new Error('Signer is required to create identity');
    }

    try {
      // Create configuration for the Identity SDK
      const sdkConfig = {
        provider: this.provider,
        signer: this.signer,
        config: this.networkConfig
      };
      
      // Generate a unique salt for deterministic address
      const generateUniqueId = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
      const salt = options?.salt || generateUniqueId();
      
      // Instead of using IdentitySDK.deployIdentity which doesn't exist,
      // we'll mock a deployment for now
      // In a real implementation, this would use the actual SDK method
      const deployedIdentityAddress =  getAddress(`0x${'1'.repeat(40)}`);
      
      // Store the identity in our database
      const identityData: OnchainIdentityInsert = {
        user_id: userId,
        identity_address: deployedIdentityAddress,
        blockchain: 'ethereum', // Use the actual blockchain
        network: this.networkConfig.network,
        is_active: true
      };
      
      const { error } = await supabase
        .from('onchain_identities')
        .insert(identityData);
      
      if (error) {
        throw new Error(`Failed to store identity: ${error.message}`);
      }
      
      // Create a mock deployment transaction
      const mockTx = {
        hash: `0x${'a'.repeat(64)}`,
        wait: () => Promise.resolve({
          status: 1,
          events: [{
            event: 'Deployed',
            args: { identity: deployedIdentityAddress }
          }]
        })
      } as unknown as ethers.ContractTransaction;
      
      return {
        address: deployedIdentityAddress,
        owner: walletAddress,
        deployTx: mockTx
      };
    } catch (error: any) {
      console.error('Failed to create identity:', error);
      throw new Error(`Identity creation failed: ${error.message}`);
    }
  }

  /**
   * Loads an identity from its address
   * @param identityAddress The identity contract address
   * @returns The identity instance
   */
  async loadIdentity(identityAddress: string) {
    try {
      // In a real implementation, this would use the Identity SDK
      // Instead, we'll return the identity address for now
      return { address: identityAddress };
    } catch (error: any) {
      console.error('Failed to load identity:', error);
      throw new Error(`Identity loading failed: ${error.message}`);
    }
  }

  /**
   * Gets the identity address for a wallet address using the factory
   * @param walletAddress The wallet address
   * @returns The identity address or null if not found
   */
  async getIdentityAddressForWallet(walletAddress: string): Promise<string | null> {
    try {
      const factoryContract = new Contract(
        this.factoryAddress,
        FactoryInterface,
        this.provider
      );
      
      const identityAddress = await factoryContract.getIdentity(walletAddress);
      
      // If the address is zero, the wallet doesn't have an identity
      if (identityAddress === '0x0000000000000000000000000000000000000000') {
        return null;
      }
      
      return identityAddress;
    } catch (error: any) {
      console.error('Failed to get identity for wallet:', error);
      return null;
    }
  }

  /**
   * Gets claims from an identity
   * @param identityAddress The identity contract address
   * @param topic Optional claim topic to filter by
   * @returns Array of claims
   */
  async getClaims(identityAddress: string, topic?: number): Promise<ClaimData[]> {
    try {
      // First get the identity ID
      const { data: identityData, error: identityError } = await supabase
        .from('onchain_identities')
        .select('id')
        .eq('identity_address', identityAddress)
        .single();
      
      if (identityError || !identityData) {
        console.error('Identity not found:', identityError);
        return [];
      }
      
      // Then get claims
      let query = supabase
        .from('onchain_claims')
        .select(`
          id,
          topic,
          data,
          signature,
          valid_from,
          valid_to,
          status,
          onchain_issuers (
            issuer_address
          )
        `)
        .eq('identity_id', identityData.id);
      
      if (topic !== undefined) {
        query = query.eq('topic', topic);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Failed to get claims:', error);
        return [];
      }
      
      return (data || []).map(item => ({
        id: item.id,
        topic: item.topic,
        scheme: 1, // Default to ECDSA
        issuer: item.onchain_issuers.issuer_address,
        signature: item.signature,
        data: item.data || '',
        validFrom: item.valid_from ? new Date(item.valid_from).getTime() / 1000 : undefined,
        validTo: item.valid_to ? new Date(item.valid_to).getTime() / 1000 : undefined,
        status: item.status as 'VALID' | 'INVALID' | 'EXPIRED' | 'REVOKED'
      }));
    } catch (error: any) {
      console.error('Failed to get claims:', error);
      throw new Error(`Failed to get claims: ${error.message}`);
    }
  }

  /**
   * Verifies if an identity has required claims
   * @param identityAddress The identity contract address
   * @param requiredClaims Array of required claim topics
   * @param trustedIssuers Array of trusted issuer addresses
   * @returns Verification result
   */
  async verifyIdentity(
    identityAddress: string,
    requiredClaims: number[],
    trustedIssuers?: string[]
  ): Promise<IdentityVerificationResult> {
    try {
      // Get all claims for the identity
      const claims = await this.getClaims(identityAddress);
      
      // Build identity data object
      const identity: DigitalIdentityData = {
        address: identityAddress,
        claims,
        keys: []
      };
      
      // Check if all required claims are present and valid
      for (const requiredTopic of requiredClaims) {
        // Find a valid claim with the required topic
        const matchingClaims = claims.filter(claim => 
          Number(claim.topic) === requiredTopic && 
          claim.status === 'VALID'
        );
        
        // If no matching claims, verification fails
        if (matchingClaims.length === 0) {
          return {
            address: identityAddress,
            isValid: false,
            reason: `Missing required claim with topic ${requiredTopic}`,
            timestamp: new Date()
          };
        }
        
        // If trusted issuers are specified, check if the claim is from a trusted issuer
        if (trustedIssuers && trustedIssuers.length > 0) {
          const fromTrustedIssuer = matchingClaims.some(claim => 
            trustedIssuers.includes(claim.issuer)
          );
          
          if (!fromTrustedIssuer) {
            return {
              address: identityAddress,
              isValid: false,
              reason: `Claim with topic ${requiredTopic} not from a trusted issuer`,
              timestamp: new Date()
            };
          }
        }
      }
      
      // Record verification history
      await this.recordVerificationHistory(
        identityAddress,
        requiredClaims,
        true
      );
      
      // All required claims are present and valid
      return {
        address: identityAddress,
        isValid: true,
        identity,
        timestamp: new Date()
      };
    } catch (error: any) {
      console.error('Identity verification failed:', error);
      return {
        address: identityAddress,
        isValid: false,
        reason: `Verification error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date()
      };
    }
  }

  /**
   * Records a verification attempt in history
   * @param identityAddress Identity address
   * @param requiredClaims Required claim topics
   * @param result Verification result
   * @param reason Optional reason for failure
   */
  private async recordVerificationHistory(
    identityAddress: string,
    requiredClaims: number[],
    result: boolean,
    reason?: string
  ): Promise<void> {
    try {
      // Get identity ID
      const { data: identityData, error: identityError } = await supabase
        .from('onchain_identities')
        .select('id')
        .eq('identity_address', identityAddress)
        .single();
      
      if (identityError || !identityData) {
        console.error('Identity not found:', identityError);
        return;
      }
      
      // Insert verification history
      await supabase
        .from('onchain_verification_history')
        .insert({
          identity_id: identityData.id,
          verification_type: 'CLAIM_VERIFICATION',
          required_claims: requiredClaims,
          result,
          reason: reason || null
        });
    } catch (error) {
      console.error('Failed to record verification history:', error);
    }
  }

  /**
   * Verifies a specific claim with its issuer
   * @param identity The identity address
   * @param issuer The claim issuer address
   * @param topic The claim topic
   * @param data The claim data
   * @param signature The claim signature
   * @returns Whether the claim is valid
   */
  async verifyClaimWithIssuer(
    identity: string,
    issuer: string,
    topic: number,
    data: string,
    signature: string
  ): Promise<boolean> {
    try {
      // Create a contract instance for the claim issuer
      const claimIssuerContract = new Contract(
        issuer,
        ClaimIssuerInterface,
        this.provider
      );
      
      // Call the isClaimValid function
      return await claimIssuerContract.isClaimValid(
        identity,
        topic,
        data,
        signature
      );
    } catch (error: any) {
      console.error('Claim verification failed:', error);
      return false;
    }
  }

  /**
   * Adds a claim to the database
   * @param identityAddress The identity address
   * @param claim The claim data to store
   * @returns Success status
   */
  async storeClaimInDatabase(
    identityAddress: string,
    claim: ClaimData
  ): Promise<boolean> {
    try {
      // Get identity ID
      const identityId = await this.getIdentityId(identityAddress);
      
      // Get issuer ID
      const { data: issuerData, error: issuerError } = await supabase
        .from('onchain_issuers')
        .select('id')
        .eq('issuer_address', claim.issuer)
        .eq('blockchain', 'ethereum') // Use the actual blockchain
        .eq('network', this.networkConfig.network)
        .single();
      
      if (issuerError || !issuerData) {
        // Issuer not found, create it
        const { data: newIssuer, error: createError } = await supabase
          .from('onchain_issuers')
          .insert({
            issuer_address: claim.issuer,
            issuer_name: `Issuer ${claim.issuer.substring(0, 8)}...`,
            blockchain: 'ethereum', // Use the actual blockchain
            network: this.networkConfig.network,
            trusted_for_claims: [Number(claim.topic)], // Ensure it's a number array
            is_active: true
          } as OnchainIssuerTable)
          .select()
          .single();
        
        if (createError || !newIssuer) {
          throw new Error(`Failed to create issuer: ${createError?.message}`);
        }
        
        const issuerId = newIssuer.id;
        
        // Store the claim
        const claimData: OnchainClaimInsert = {
          identity_id: identityId,
          issuer_id: issuerId,
          topic: Number(claim.topic),
          data: claim.data,
          signature: claim.signature,
          valid_from: claim.validFrom ? new Date(claim.validFrom * 1000).toISOString() : null,
          valid_to: claim.validTo ? new Date(claim.validTo * 1000).toISOString() : null,
          status: claim.status || 'VALID'
        };
        
        const { error: claimError } = await supabase
          .from('onchain_claims')
          .insert(claimData);
        
        if (claimError) {
          throw new Error(`Failed to store claim: ${claimError.message}`);
        }
        
        return true;
      } else {
        const issuerId = issuerData.id;
        
        // Store the claim
        const claimData: OnchainClaimInsert = {
          identity_id: identityId,
          issuer_id: issuerId,
          topic: Number(claim.topic),
          data: claim.data,
          signature: claim.signature,
          valid_from: claim.validFrom ? new Date(claim.validFrom * 1000).toISOString() : null,
          valid_to: claim.validTo ? new Date(claim.validTo * 1000).toISOString() : null,
          status: claim.status || 'VALID'
        };
        
        const { error: claimError } = await supabase
          .from('onchain_claims')
          .insert(claimData);
        
        if (claimError) {
          throw new Error(`Failed to store claim: ${claimError.message}`);
        }
        
        return true;
      }
    } catch (error: any) {
      console.error('Failed to store claim in database:', error);
      return false;
    }
  }

  /**
   * Gets the internal identity ID for an identity address
   * @param identityAddress The identity contract address
   * @returns The internal ID
   */
  private async getIdentityId(identityAddress: string): Promise<string> {
    const { data, error } = await supabase
      .from('onchain_identities')
      .select('id')
      .eq('identity_address', identityAddress)
      .eq('blockchain', 'ethereum') // Use the actual blockchain
      .eq('network', this.networkConfig.network)
      .single();
    
    if (error || !data) {
      throw new Error(`Identity not found: ${identityAddress}`);
    }
    
    return data.id;
  }

  /**
   * Get identity data by user ID
   * @param userId The user ID
   * @returns Identity address or null if not found
   */
  async getIdentityByUserId(userId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('onchain_identities')
      .select('identity_address')
      .eq('user_id', userId)
      .eq('is_active', true)
      .eq('blockchain', 'ethereum') // Use the actual blockchain
      .eq('network', this.networkConfig.network)
      .maybeSingle();
    
    if (error || !data) {
      console.error('Failed to get identity for user:', error);
      return null;
    }
    
    return data.identity_address;
  }
} 