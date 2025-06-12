import { ethers, type Provider } from 'ethers';
import { 
  ClaimData, 
  IdentityVerificationResult, 
  IdentityProviderConfig,
  ClaimVerificationResult,
  DeployedIdentity,
  IdentityDeployOptions
} from '@/types/domain/blockchain/onchainid';
import { OnChainIDManager } from './OnChainIDManager';

/**
 * Adapter for ONCHAINID identity operations
 * Integrates with the web3 adapter pattern
 */
export class OnChainIDAdapter {
  private manager: OnChainIDManager;
  private networkConfig: IdentityProviderConfig;
  
  /**
   * Create a new ONCHAINID adapter
   * @param networkConfig Configuration for the ONCHAINID network
   * @param provider Optional ethers provider
   * @param signer Optional ethers signer
   */
  constructor(
    networkConfig: IdentityProviderConfig,
    provider?: Provider,
    signer?: ethers.Signer
  ) {
    this.networkConfig = networkConfig;
    this.manager = OnChainIDManager.getInstance(networkConfig, provider, signer);
  }
  
  /**
   * Update the adapter's signer
   * @param signer New ethers signer
   */
  setSigner(signer: ethers.Signer): void {
    this.manager.setSigner(signer);
  }
  
  /**
   * Update the adapter's provider
   * @param provider New ethers provider
   */
  setProvider(provider: Provider): void {
    this.manager.setProvider(provider);
  }
  
  /**
   * Create a new identity for a user
   * @param userId User ID in the system
   * @param walletAddress User's wallet address
   * @param options Additional deployment options
   * @returns The deployed identity
   */
  async createIdentity(
    userId: string,
    walletAddress: string,
    options?: IdentityDeployOptions
  ): Promise<DeployedIdentity> {
    return this.manager.createIdentity(userId, walletAddress, options);
  }
  
  /**
   * Get the identity address for a wallet
   * @param walletAddress The wallet address
   * @returns The identity address or null if not found
   */
  async getIdentityAddress(walletAddress: string): Promise<string | null> {
    return this.manager.getIdentityAddressForWallet(walletAddress);
  }
  
  /**
   * Get claims for an identity
   * @param identityAddress The identity address
   * @param topic Optional topic to filter claims
   * @returns Array of claim data
   */
  async getClaims(identityAddress: string, topic?: number): Promise<ClaimData[]> {
    return this.manager.getClaims(identityAddress, topic);
  }
  
  /**
   * Verify if an identity has the required claims
   * @param identityAddress The identity address
   * @param requiredClaims Array of required claim topics
   * @param trustedIssuers Optional array of trusted issuer addresses
   * @returns Verification result
   */
  async verifyIdentity(
    identityAddress: string,
    requiredClaims: number[],
    trustedIssuers?: string[]
  ): Promise<IdentityVerificationResult> {
    return this.manager.verifyIdentity(identityAddress, requiredClaims, trustedIssuers);
  }
  
  /**
   * Verify a specific claim with its issuer
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
    return this.manager.verifyClaimWithIssuer(identity, issuer, topic, data, signature);
  }
  
  /**
   * Store a claim in the database
   * @param identityAddress The identity address
   * @param claim The claim data
   * @returns Success status
   */
  async storeClaimInDatabase(
    identityAddress: string,
    claim: ClaimData
  ): Promise<boolean> {
    return this.manager.storeClaimInDatabase(identityAddress, claim);
  }
  
  /**
   * Get the identity address for a user by their ID
   * @param userId The user ID
   * @returns The identity address or null if not found
   */
  async getIdentityByUserId(userId: string): Promise<string | null> {
    return this.manager.getIdentityByUserId(userId);
  }
} 