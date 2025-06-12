import { supabase } from '@/infrastructure/database/client';
import { MoonpayService, MoonpayPass, MoonpayAssetInfo, MoonpayProject } from '@/services/wallet/MoonpayService';
import { v4 as uuidv4 } from 'uuid';

export interface NFTCollectionStats {
  totalPasses: number;
  mintedPasses: number;
  transferredPasses: number;
  burnedPasses: number;
  uniqueOwners: number;
  floorPrice?: number;
  totalVolume?: number;
}

export interface NFTPassFilter {
  projectId?: string;
  contractAddress?: string;
  ownerAddress?: string;
  status?: 'pending' | 'minted' | 'transferred' | 'burned';
  attributes?: Record<string, string | number>;
}

export interface NFTBatchOperation {
  operationType: 'mint' | 'transfer' | 'burn';
  passes: Array<{
    passId: string;
    toAddress?: string;
  }>;
}

export interface NFTMarketplaceListingFilter {
  projectId?: string;
  priceRange?: { min: number; max: number };
  attributes?: Record<string, string | number>;
  sortBy?: 'price' | 'recent' | 'rarity';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Enhanced NFT Service for Moonpay Pass Management
 * Handles NFT minting, transfers, marketplace operations, and analytics
 */
export class NFTService {
  private moonpayService: MoonpayService;

  constructor(moonpayService: MoonpayService) {
    this.moonpayService = moonpayService;
  }

  // ===== PASS MANAGEMENT =====

  /**
   * Get all passes with advanced filtering
   */
  async getPasses(filter: NFTPassFilter = {}, limit: number = 50, offset: number = 0): Promise<{
    passes: MoonpayPass[];
    total: number;
  }> {
    try {
      // Build Supabase query
      let query = (supabase as any)
        .from('moonpay_passes')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filter.projectId) query = query.eq('project_id', filter.projectId);
      if (filter.contractAddress) query = query.eq('contract_address', filter.contractAddress);
      if (filter.ownerAddress) query = query.eq('owner_address', filter.ownerAddress);
      if (filter.status) query = query.eq('status', filter.status);
      
      // Apply pagination
      query = query.range(offset, offset + limit - 1);
      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      const passes = data?.map(this.mapDatabaseToPass) || [];
      
      return {
        passes,
        total: count || 0
      };
    } catch (error) {
      console.error('Error getting passes:', error);
      throw new Error(`Failed to get passes: ${error.message}`);
    }
  }

  /**
   * Get pass by ID with cached asset info
   */
  async getPassById(passId: string): Promise<MoonpayPass & { assetInfo?: MoonpayAssetInfo }> {
    try {
      // Get pass from database
      const { data, error } = await (supabase as any)
        .from('moonpay_passes')
        .select('*')
        .eq('id', passId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Pass not found');

      const pass = this.mapDatabaseToPass(data);

      // Try to get cached asset info
      let assetInfo: MoonpayAssetInfo | undefined;
      try {
        assetInfo = await this.getCachedAssetInfo(pass.contractAddress, pass.tokenId);
      } catch (err) {
        console.warn('Failed to get asset info:', err);
      }

      return { ...pass, assetInfo };
    } catch (error) {
      console.error('Error getting pass:', error);
      throw new Error(`Failed to get pass: ${error.message}`);
    }
  }

  /**
   * Create new pass with metadata
   */
  async createPass(
    passData: Omit<MoonpayPass, 'id' | 'createdAt' | 'updatedAt' | 'status'> & {
      autoMint?: boolean;
    }
  ): Promise<MoonpayPass> {
    try {
      // Create pass in Moonpay
      const moonpayPass = await this.moonpayService.createPass({
        ...passData,
        status: passData.autoMint ? 'pending' : 'pending'
      });

      // Store in local database
      const { data, error } = await (supabase as any)
        .from('moonpay_passes')
        .insert({
          id: uuidv4(),
          external_pass_id: moonpayPass.id,
          project_id: passData.projectId,
          contract_address: passData.contractAddress,
          token_id: passData.tokenId,
          metadata_url: passData.metadataUrl,
          name: passData.name,
          description: passData.description,
          image: passData.image,
          attributes: passData.attributes || [],
          owner_address: passData.owner,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      return this.mapDatabaseToPass(data);
    } catch (error) {
      console.error('Error creating pass:', error);
      throw new Error(`Failed to create pass: ${error.message}`);
    }
  }

  /**
   * Batch mint passes
   */
  async batchMintPasses(passIds: string[], toAddress: string): Promise<{
    success: string[];
    failed: Array<{ passId: string; error: string }>;
  }> {
    const results = {
      success: [] as string[],
      failed: [] as Array<{ passId: string; error: string }>
    };

    for (const passId of passIds) {
      try {
        await this.mintPass(passId, toAddress);
        results.success.push(passId);
      } catch (error) {
        results.failed.push({
          passId,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Mint individual pass
   */
  async mintPass(passId: string, toAddress: string): Promise<MoonpayPass> {
    try {
      // Get pass details
      const pass = await this.getPassById(passId);
      
      // Deliver NFT via Moonpay
      const deliveryResult = await this.moonpayService.deliverNFT(
        pass.contractAddress,
        pass.tokenId,
        toAddress
      );

      // Update pass status
      const { data, error } = await (supabase as any)
        .from('moonpay_passes')
        .update({
          status: 'minted',
          owner_address: toAddress,
          metadata: {
            txHash: deliveryResult.txHash,
            mintedAt: new Date().toISOString()
          }
        })
        .eq('id', passId)
        .select()
        .single();

      if (error) throw error;

      return this.mapDatabaseToPass(data);
    } catch (error) {
      console.error('Error minting pass:', error);
      throw new Error(`Failed to mint pass: ${error.message}`);
    }
  }

  /**
   * Transfer pass to new owner
   */
  async transferPass(passId: string, fromAddress: string, toAddress: string): Promise<MoonpayPass> {
    try {
      // Update pass ownership
      const { data, error } = await (supabase as any)
        .from('moonpay_passes')
        .update({
          status: 'transferred',
          owner_address: toAddress,
          metadata: {
            previousOwner: fromAddress,
            transferredAt: new Date().toISOString()
          }
        })
        .eq('id', passId)
        .eq('owner_address', fromAddress) // Ensure current owner
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Pass not found or unauthorized transfer');

      return this.mapDatabaseToPass(data);
    } catch (error) {
      console.error('Error transferring pass:', error);
      throw new Error(`Failed to transfer pass: ${error.message}`);
    }
  }

  // ===== PROJECT MANAGEMENT =====

  /**
   * Get project statistics
   */
  async getProjectStats(projectId: string): Promise<NFTCollectionStats> {
    try {
      const { data, error } = await (supabase as any)
        .from('moonpay_passes')
        .select('status, owner_address')
        .eq('project_id', projectId);

      if (error) throw error;

      const stats: NFTCollectionStats = {
        totalPasses: data?.length || 0,
        mintedPasses: 0,
        transferredPasses: 0,
        burnedPasses: 0,
        uniqueOwners: 0
      };

      const owners = new Set<string>();

      (data || []).forEach((pass: any) => {
        switch (pass.status) {
          case 'minted':
            stats.mintedPasses++;
            break;
          case 'transferred':
            stats.transferredPasses++;
            break;
          case 'burned':
            stats.burnedPasses++;
            break;
        }

        if (pass.owner_address) {
          owners.add(pass.owner_address);
        }
      });

      stats.uniqueOwners = owners.size;

      return stats;
    } catch (error) {
      console.error('Error getting project stats:', error);
      throw new Error(`Failed to get project stats: ${error.message}`);
    }
  }

  /**
   * Get projects with pagination
   */
  async getProjects(limit: number = 20, offset: number = 0): Promise<{
    projects: MoonpayProject[];
    total: number;
  }> {
    try {
      const { data, error, count } = await (supabase as any)
        .from('moonpay_projects')
        .select('*', { count: 'exact' })
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const projects = data?.map(this.mapDatabaseToProject) || [];

      return {
        projects,
        total: count || 0
      };
    } catch (error) {
      console.error('Error getting projects:', error);
      throw new Error(`Failed to get projects: ${error.message}`);
    }
  }

  // ===== ASSET CACHING =====

  /**
   * Get cached asset info or fetch from Moonpay
   */
  async getCachedAssetInfo(contractAddress: string, tokenId: string): Promise<MoonpayAssetInfo> {
    try {
      // Check cache first
      const { data: cached } = await (supabase as any)
        .from('moonpay_asset_cache')
        .select('asset_data, expires_at')
        .eq('contract_address', contractAddress)
        .eq('token_id', tokenId)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (cached && cached.asset_data) {
        return cached.asset_data as MoonpayAssetInfo;
      }

      // Fetch from Moonpay API
      const assetInfo = await this.moonpayService.getAssetInfo(contractAddress, tokenId);

      // Cache the result
      await (supabase as any)
        .from('moonpay_asset_cache')
        .upsert({
          contract_address: contractAddress,
          token_id: tokenId,
          asset_data: assetInfo,
          cached_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        });

      return assetInfo;
    } catch (error) {
      console.error('Error getting cached asset info:', error);
      throw new Error(`Failed to get asset info: ${error.message}`);
    }
  }

  // ===== HELPER METHODS =====

  private mapDatabaseToPass(data: any): MoonpayPass {
    return {
      id: data.external_pass_id || data.id,
      projectId: data.project_id,
      contractAddress: data.contract_address,
      tokenId: data.token_id,
      metadataUrl: data.metadata_url,
      name: data.name,
      description: data.description,
      image: data.image,
      attributes: data.attributes || [],
      owner: data.owner_address,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  private mapDatabaseToProject(data: any): MoonpayProject {
    return {
      id: data.external_project_id || data.id,
      name: data.name,
      description: data.description,
      contractAddress: data.contract_address,
      network: data.network,
      totalSupply: data.total_supply,
      maxSupply: data.max_supply,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }
}

export const nftService = new NFTService(new MoonpayService());
