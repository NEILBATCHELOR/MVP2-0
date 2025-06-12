import { randomUUID } from 'crypto';
import { GuardianApiClient } from '@/infrastructure/guardian/GuardianApiClient';
import { supabase } from '@/infrastructure/database/client';

/**
 * Guardian Wallet Database Service
 * 
 * Handles the complete Guardian wallet workflow:
 * 1. Create Guardian wallet via API
 * 2. Store initial record in database
 * 3. Fetch wallet details from Guardian API
 * 4. Update database with complete wallet information
 */

export interface GuardianWalletCreationParams {
  name: string;
  type: 'EOA' | 'MULTISIG' | 'SMART';
  userId: string;
  blockchain?: 'polygon' | 'ethereum';
}

export interface GuardianWalletDetails {
  id: string;
  externalId: string;
  accounts: Array<{
    id: string;
    address: string;
    type: string;
    network: string;
  }>;
  status: string;
}

export interface WalletDetailsRecord {
  id: string;
  wallet_id: string | null;
  blockchain_specific_data: {
    guardian_wallet_id: string;
    guardian_external_id: string;
    accounts: Array<{
      id: string;
      address: string;
      type: string;
      network: string;
    }>;
    status: string;
    operation_id: string;
    name: string;
    user_id: string;
    blockchain: string;
  };
  created_at: string;
  updated_at: string;
}

export class GuardianWalletDatabaseService {
  private apiClient: GuardianApiClient;

  constructor() {
    this.apiClient = new GuardianApiClient();
  }

  /**
   * Complete Guardian wallet creation workflow
   */
  async createGuardianWallet(params: GuardianWalletCreationParams): Promise<WalletDetailsRecord> {
    // Step 1: Create Guardian wallet via API
    const guardianWalletId = randomUUID();
    console.log(`🔄 Creating Guardian wallet with ID: ${guardianWalletId}`);
    
    const createResult = await this.apiClient.createWallet({ id: guardianWalletId });
    console.log(`✅ Guardian wallet creation initiated. Operation ID: ${createResult.operationId}`);

    // Step 2: Store initial record in database
    const initialData = {
      guardian_wallet_id: guardianWalletId,
      guardian_external_id: guardianWalletId, // Initially same as ID
      accounts: [], // Will be populated after fetching details
      status: 'pending',
      operation_id: createResult.operationId,
      name: params.name,
      user_id: params.userId,
      blockchain: params.blockchain || 'polygon'
    };

    const { data: walletDetailsRecord, error: insertError } = await supabase
      .from('wallet_details')
      .insert({
        id: guardianWalletId,
        wallet_id: null, // Will be set later if linking to multi_sig_wallets
        blockchain_specific_data: initialData
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to store initial wallet record: ${insertError.message}`);
    }

    console.log(`✅ Initial wallet record stored in database`);

    // Step 3: Attempt to fetch wallet details (this will fail until GET requests are fixed)
    try {
      console.log(`🔄 Attempting to fetch wallet details...`);
      const walletDetails = await this.fetchWalletDetails(guardianWalletId);
      
      if (walletDetails) {
        console.log(`✅ Wallet details fetched successfully`);
        return await this.updateWalletWithDetails(guardianWalletId, walletDetails);
      }
    } catch (error) {
      console.log(`⚠️ Could not fetch wallet details (GET request issue): ${error.message}`);
      console.log(`📝 Wallet created but details will need to be fetched later`);
    }

    return walletDetailsRecord as WalletDetailsRecord;
  }

  /**
   * Fetch wallet details from Guardian API (currently fails due to GET signature issue)
   */
  async fetchWalletDetails(walletId: string): Promise<GuardianWalletDetails | null> {
    try {
      // This will fail until we fix GET request signatures
      const walletDetails = await this.apiClient.getWallet(walletId);
      return walletDetails as any; // Type cast to avoid conversion error
    } catch (error) {
      console.log(`❌ Failed to fetch wallet details: ${error.message}`);
      return null;
    }
  }

  /**
   * Update database record with complete wallet details
   */
  async updateWalletWithDetails(
    walletId: string, 
    walletDetails: GuardianWalletDetails
  ): Promise<WalletDetailsRecord> {
    const { data: currentRecord, error: fetchError } = await supabase
      .from('wallet_details')
      .select('*')
      .eq('id', walletId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch current wallet record: ${fetchError.message}`);
    }

    // Merge new details with existing data
    const existingData = currentRecord.blockchain_specific_data as any || {};
    const updatedData = {
      ...existingData,
      guardian_external_id: walletDetails.externalId,
      accounts: walletDetails.accounts,
      status: walletDetails.status
    };

    const { data: updatedRecord, error: updateError } = await supabase
      .from('wallet_details')
      .update({
        blockchain_specific_data: updatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', walletId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update wallet record: ${updateError.message}`);
    }

    console.log(`✅ Wallet record updated with complete details`);
    return updatedRecord as WalletDetailsRecord;
  }

  /**
   * List all Guardian wallets from database
   */
  async listGuardianWallets(userId?: string): Promise<WalletDetailsRecord[]> {
    let query = supabase
      .from('wallet_details')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.filter('blockchain_specific_data->>user_id', 'eq', userId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to list Guardian wallets: ${error.message}`);
    }

    return data as WalletDetailsRecord[];
  }

  /**
   * Get Guardian wallet by ID from database
   */
  async getGuardianWalletFromDatabase(walletId: string): Promise<WalletDetailsRecord | null> {
    const { data, error } = await supabase
      .from('wallet_details')
      .select('*')
      .eq('id', walletId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to get Guardian wallet: ${error.message}`);
    }

    return data as WalletDetailsRecord;
  }

  /**
   * Sync wallet details from Guardian API (once GET requests are fixed)
   */
  async syncWalletDetails(walletId: string): Promise<WalletDetailsRecord> {
    const walletDetails = await this.fetchWalletDetails(walletId);
    
    if (!walletDetails) {
      throw new Error(`Could not fetch wallet details from Guardian API`);
    }

    return await this.updateWalletWithDetails(walletId, walletDetails);
  }

  /**
   * List Guardian wallets from API with pagination (when GET requests work)
   */
  async listGuardianWalletsFromAPI(page: number = 1, limit: number = 100): Promise<GuardianWalletDetails[]> {
    try {
      // This will fail until we fix GET request signatures
      const wallets = await this.apiClient.getWallets(limit, page);
      return wallets as GuardianWalletDetails[];
    } catch (error) {
      console.log(`❌ Failed to list wallets from Guardian API: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get wallet address from database (primary address from accounts)
   */
  getWalletAddress(walletRecord: WalletDetailsRecord): string | null {
    const accounts = walletRecord.blockchain_specific_data.accounts;
    if (accounts && accounts.length > 0) {
      return accounts[0].address; // Return first account address
    }
    return null;
  }

  /**
   * Check if wallet has complete details
   */
  hasCompleteDetails(walletRecord: WalletDetailsRecord): boolean {
    const data = walletRecord.blockchain_specific_data;
    return (
      data.accounts && 
      data.accounts.length > 0 && 
      data.status === 'active'
    );
  }
}
