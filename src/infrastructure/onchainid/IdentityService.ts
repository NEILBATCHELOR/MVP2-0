/**
 * Identity Service
 * 
 * Provides on-chain identity management using the OnChainID standard.
 * Handles identity creation, claims management, and verification.
 */

import type { Provider, Signer } from 'ethers';
import type { 
  ClaimData, 
  IdentityVerificationResult, 
  DeployedIdentity, 
  IdentityDeployOptions,
  ClaimTopic 
} from '@/types/domain/blockchain/onchainid';
import { ethers } from 'ethers';

/**
 * Identity configuration interface
 */
interface IdentityConfig {
  factoryAddress?: string;
  implementationAddress?: string;
  claimIssuerAddress?: string;
  trustedIssuers: string[];
}

/**
 * Extended verification result interface for internal use
 */
interface ExtendedVerificationResult {
  address: string;
  isValid: boolean;
  verifiedTopics: string[];
  missingTopics: ClaimTopic[];
  reason: string;
  verificationDate: string;
  trustedIssuers: string[];
  timestamp: Date;
}

export class IdentityService {
  private static instance: IdentityService | null = null;
  private provider: Provider | null = null;
  private signer: Signer | null = null;
  private config: IdentityConfig;

  private constructor() {
    this.config = {
      factoryAddress: process.env.ONCHAINID_FACTORY_ADDRESS,
      implementationAddress: process.env.ONCHAINID_IMPLEMENTATION_ADDRESS,
      claimIssuerAddress: process.env.ONCHAINID_CLAIM_ISSUER_ADDRESS,
      trustedIssuers: process.env.ONCHAINID_TRUSTED_ISSUERS?.split(',') || []
    };
  }

  /**
   * Get singleton instance
   */
  static getInstance(): IdentityService {
    if (!IdentityService.instance) {
      IdentityService.instance = new IdentityService();
    }
    return IdentityService.instance;
  }

  /**
   * Set provider
   */
  setProvider(provider: Provider): void {
    this.provider = provider;
  }

  /**
   * Set signer
   */
  setSigner(signer: Signer): void {
    this.signer = signer;
  }

  /**
   * Create a new on-chain identity
   */
  async createIdentity(
    userId: string,
    ownerAddress: string,
    options?: IdentityDeployOptions
  ): Promise<DeployedIdentity> {
    if (!this.provider || !this.signer) {
      throw new Error('Provider and signer must be set before creating identity');
    }

    try {
      // In a real implementation, this would deploy an OnChainID contract
      // For now, we'll simulate the deployment
      
      const identityAddress = this.generateMockIdentityAddress(ownerAddress);
      
      // Store identity information in database
      await this.storeIdentityInDatabase(userId, identityAddress, ownerAddress, options);

      return {
        address: identityAddress,
        owner: ownerAddress,
        deployTx: {
          hash: this.generateMockTxHash(),
          blockNumber: await this.provider.getBlockNumber(),
          gasUsed: BigInt('150000')
        } as any // Mock transaction object
      };
    } catch (error) {
      throw new Error(`Failed to create identity: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get claims for an identity
   */
  async getClaims(identityAddress: string, topic?: ClaimTopic): Promise<ClaimData[]> {
    try {
      // In a real implementation, this would query the blockchain and database
      // For now, return mock claims
      
      const mockClaims: ClaimData[] = [
        {
          id: 'claim_kyc_001',
          topic: 'KYC_VERIFIED',
          scheme: 1,
          issuer: this.config.claimIssuerAddress || '0x1234...5678',
          signature: '0xabcd...ef01',
          data: JSON.stringify({
            firstName: 'John',
            lastName: 'Doe',
            dateOfBirth: '1990-01-01',
            nationality: 'US'
          }),
          uri: 'https://issuer.com/claims/kyc_001',
          validFrom: Math.floor(Date.now() / 1000), // Current timestamp
          validTo: Math.floor((Date.now() + 365 * 24 * 60 * 60 * 1000) / 1000) // 1 year from now
        }
      ];

      if (topic) {
        return mockClaims.filter(claim => claim.topic === topic);
      }

      return mockClaims;
    } catch (error) {
      console.error('Failed to get claims:', error);
      return [];
    }
  }

  /**
   * Store a claim in the database
   */
  async storeClaimInDatabase(identityAddress: string, claim: ClaimData): Promise<boolean> {
    try {
      // In a real implementation, this would store the claim in Supabase
      console.log('Storing claim for identity:', identityAddress, claim);
      return true;
    } catch (error) {
      console.error('Failed to store claim in database:', error);
      return false;
    }
  }

  /**
   * Verify an identity has required claims from trusted issuers
   */
  async verifyIdentity(
    identityAddress: string,
    requiredTopics: ClaimTopic[],
    trustedIssuers: string[]
  ): Promise<IdentityVerificationResult> {
    try {
      const claims = await this.getClaims(identityAddress);
      
      const verificationResults = requiredTopics.map(topic => {
        const relevantClaims = claims.filter(claim => 
          claim.topic === topic && 
          trustedIssuers.includes(claim.issuer)
        );
        
        return {
          topic,
          hasValidClaim: relevantClaims.length > 0,
          claims: relevantClaims
        };
      });

      const allTopicsVerified = verificationResults.every(result => result.hasValidClaim);

      return {
        address: identityAddress,
        isValid: allTopicsVerified,
        reason: allTopicsVerified ? 'All required claims verified' : 'Missing required claims',
        timestamp: new Date()
        // verifiedTopics, missingTopics, verificationDate, trustedIssuers removed - not in IdentityVerificationResult interface
      };
    } catch (error) {
      return {
        address: identityAddress,
        isValid: false,
        reason: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
        // verifiedTopics, missingTopics, verificationDate, trustedIssuers removed - not in IdentityVerificationResult interface
      };
    }
  }

  /**
   * Add a claim to an identity (on-chain)
   */
  async addClaim(
    identityAddress: string,
    claim: ClaimData
  ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    try {
      if (!this.signer) {
        throw new Error('Signer required to add claims');
      }

      // In a real implementation, this would call the OnChainID contract
      // For now, simulate the transaction
      
      const txHash = this.generateMockTxHash();
      
      // Store claim in database
      await this.storeClaimInDatabase(identityAddress, claim);

      return {
        success: true,
        transactionHash: txHash
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add claim'
      };
    }
  }

  /**
   * Remove a claim from an identity
   */
  async removeClaim(
    identityAddress: string,
    claimId: string
  ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    try {
      if (!this.signer) {
        throw new Error('Signer required to remove claims');
      }

      // In a real implementation, this would call the OnChainID contract
      const txHash = this.generateMockTxHash();

      return {
        success: true,
        transactionHash: txHash
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to remove claim'
      };
    }
  }

  /**
   * Get identity keys
   */
  async getIdentityKeys(identityAddress: string): Promise<Array<{
    keyType: number;
    keyData: string;
    purposes: number[];
  }>> {
    try {
      // In a real implementation, this would query the identity contract
      return [
        {
          keyType: 1, // ECDSA
          keyData: '0x' + '1'.repeat(64), // Mock key data
          purposes: [1, 2] // Management and Action
        }
      ];
    } catch (error) {
      console.error('Failed to get identity keys:', error);
      return [];
    }
  }

  /**
   * Check if identity has a specific key purpose
   */
  async hasKeyPurpose(
    identityAddress: string,
    key: string,
    purpose: number
  ): Promise<boolean> {
    try {
      const keys = await this.getIdentityKeys(identityAddress);
      return keys.some(k => k.keyData === key && k.purposes.includes(purpose));
    } catch (error) {
      console.error('Failed to check key purpose:', error);
      return false;
    }
  }

  /**
   * Store identity in database
   */
  private async storeIdentityInDatabase(
    userId: string,
    identityAddress: string,
    ownerAddress: string,
    options?: IdentityDeployOptions
  ): Promise<void> {
    try {
      // In a real implementation, this would store in Supabase
      console.log('Storing identity in database:', {
        userId,
        identityAddress,
        ownerAddress,
        options
      });
    } catch (error) {
      console.error('Failed to store identity in database:', error);
    }
  }

  /**
   * Generate mock identity address
   */
  private generateMockIdentityAddress(ownerAddress: string): string {
    // Generate a deterministic but unique address based on owner
    const hash = ethers.keccak256(ethers.toUtf8Bytes(ownerAddress + Date.now()));
    return ethers.getAddress('0x' + hash.slice(2, 42));
  }

  /**
   * Generate mock transaction hash
   */
  private generateMockTxHash(): string {
    return '0x' + Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  /**
   * Get identity information
   */
  async getIdentityInfo(identityAddress: string): Promise<{
    address: string;
    owner: string;
    claimCount: number;
    keyCount: number;
    isVerified: boolean;
  } | null> {
    try {
      const claims = await this.getClaims(identityAddress);
      const keys = await this.getIdentityKeys(identityAddress);
      
      return {
        address: identityAddress,
        owner: '0x' + '1'.repeat(40), // Mock owner address
        claimCount: claims.length,
        keyCount: keys.length,
        isVerified: claims.some(claim => claim.topic === 'KYC_VERIFIED')
      };
    } catch (error) {
      console.error('Failed to get identity info:', error);
      return null;
    }
  }

  /**
   * Batch verify multiple identities
   */
  async batchVerifyIdentities(
    identityAddresses: string[],
    requiredTopics: ClaimTopic[],
    trustedIssuers: string[]
  ): Promise<Array<{
    address: string;
    result: IdentityVerificationResult;
  }>> {
    const results = await Promise.allSettled(
      identityAddresses.map(address => 
        this.verifyIdentity(address, requiredTopics, trustedIssuers)
      )
    );

    return identityAddresses.map((address, index) => ({
      address,
      result: results[index].status === 'fulfilled' 
        ? results[index].value
        : {
            address,
            isValid: false,
            reason: 'Verification failed',
            timestamp: new Date()
            // verifiedTopics, missingTopics, verificationDate, trustedIssuers removed - not in IdentityVerificationResult interface
          }
    }));
  }

  /**
   * Get trusted issuers
   */
  getTrustedIssuers(): string[] {
    return this.config.trustedIssuers || [];
  }

  /**
   * Add trusted issuer
   */
  addTrustedIssuer(issuerAddress: string): void {
    if (!this.config.trustedIssuers) {
      this.config.trustedIssuers = [];
    }
    if (!this.config.trustedIssuers.includes(issuerAddress)) {
      this.config.trustedIssuers.push(issuerAddress);
    }
  }

  /**
   * Remove trusted issuer
   */
  removeTrustedIssuer(issuerAddress: string): void {
    if (this.config.trustedIssuers) {
      this.config.trustedIssuers = this.config.trustedIssuers.filter(
        addr => addr !== issuerAddress
      );
    }
  }
}
