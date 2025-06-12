#!/usr/bin/env ts-node

/**
 * Create Missing Max Token Versions
 * Creates the missing max versions for ERC-1155, ERC-1400, ERC-3525, and ERC-4626
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const TEST_CONFIG = {
  supabaseUrl: process.env.VITE_SUPABASE_URL || '',
  supabaseKey: process.env.VITE_SUPABASE_ANON_KEY || '',
  testProjectId: '0350bd24-1f6d-4cc7-840a-da8916610063'
};

interface TestTokenData {
  standard: string;
  mode: 'max';
  name: string;
  symbol: string;
  description: string;
  blocks: Record<string, any>;
  properties?: Record<string, any>;
  arrayData?: Record<string, any[]>;
}

const MISSING_MAX_TOKENS: TestTokenData[] = [
  // ERC-1155 Advanced
  {
    standard: 'ERC-1155',
    mode: 'max',
    name: 'Test Advanced Multi-Token',
    symbol: 'TAMT',
    description: 'An advanced ERC-1155 multi-token with all features for UI testing',
    blocks: {
      baseUri: 'https://advanced.example.com/1155/metadata/',
      isBurnable: true,
      isPausable: true,
      hasRoyalty: true,
      royaltyPercentage: '5.0',
      royaltyReceiver: '0x742d35Cc6634C0532925a3b8D4E32E42f4B9eE48',
      batchMinting: true,
      containerEnabled: true,
      dynamicUris: true,
      accessControl: 'roles',
      updatableUris: true,
      transferLimits: {
        enabled: true,
        maxPerTransaction: 100,
        maxPerWallet: 1000
      }
    },
    properties: {
      base_uri: 'https://advanced.example.com/1155/metadata/',
      is_burnable: true,
      is_pausable: true,
      has_royalty: true,
      royalty_percentage: '5.0',
      royalty_receiver: '0x742d35Cc6634C0532925a3b8D4E32E42f4B9eE48',
      metadata_storage: 'ipfs',
      access_control: 'roles',
      updatable_uris: true,
      supply_tracking: true,
      enable_approval_for_all: true,
      batch_minting_enabled: true,
      container_enabled: true,
      dynamic_uris: true,
      transfer_limits: {
        enabled: true,
        maxPerTransaction: 100,
        maxPerWallet: 1000
      },
      whitelist_enabled: true,
      auto_id_assignment: false,
      uri_freezing: true,
      batch_transfer_enabled: true,
      cross_chain_enabled: false,
      fractionalization_enabled: false,
      governance_enabled: false,
      staking_enabled: false,
      marketplace_integration: true
    },
    arrayData: {
      tokenTypes: [
        {
          token_type_id: '1',
          name: 'Premium Gold Coin',
          description: 'Premium in-game currency with bonuses',
          max_supply: '500000',
          fungibility_type: 'fungible'
        },
        {
          token_type_id: '2',
          name: 'Legendary Weapon',
          description: 'Ultra-rare legendary weapon',
          max_supply: '10',
          fungibility_type: 'non-fungible'
        },
        {
          token_type_id: '3',
          name: 'Energy Crystal',
          description: 'Renewable energy token',
          max_supply: '1000000',
          fungibility_type: 'semi-fungible'
        }
      ]
    }
  },

  // ERC-1400 Advanced
  {
    standard: 'ERC-1400',
    mode: 'max',
    name: 'Test Advanced Security Token',
    symbol: 'TAST',
    description: 'An advanced ERC-1400 security token with all compliance features for UI testing',
    blocks: {
      initialSupply: '5000000',
      cap: '50000000',
      isMintable: true,
      isBurnable: true,
      isPausable: true,
      enforceKYC: true,
      securityType: 'bond',
      issuingJurisdiction: 'US',
      regulationType: 'reg-s',
      forcedTransfers: true,
      forcedRedemption: true,
      dividendDistribution: true,
      corporateActions: true,
      multiClass: true,
      trancheTransferability: true
    },
    properties: {
      initial_supply: '5000000',
      cap: '50000000',
      is_mintable: true,
      is_burnable: true,
      is_pausable: true,
      enforce_kyc: true,
      security_type: 'bond',
      issuing_jurisdiction: 'US',
      regulation_type: 'reg-s',
      controller_address: '0x742d35Cc6634C0532925a3b8D4E32E42f4B9eE48',
      forced_transfers: true,
      forced_redemption_enabled: true,
      whitelist_enabled: true,
      investor_accreditation: true,
      holding_period: 365,
      max_investor_count: 500,
      auto_compliance: true,
      manual_approvals: false,
      compliance_module: 'advanced',
      is_issuable: true,
      granular_control: true,
      dividend_distribution: true,
      corporate_actions: true,
      is_multi_class: true,
      tranche_transferability: true,
      kyc_provider: 'chainanalysis',
      aml_compliance: true,
      ofac_screening: true,
      document_management: true,
      regulatory_reporting: true,
      voting_rights: true,
      tag_along_rights: true,
      drag_along_rights: true,
      anti_dilution_rights: true,
      liquidation_preference: 'participating',
      conversion_rights: true
    },
    arrayData: {
      partitions: [
        {
          name: 'Series A Preferred',
          partition_id: 'SERIES_A',
          amount: '2000000',
          transferable: true,
          partition_type: 'preferred'
        },
        {
          name: 'Series B Preferred',
          partition_id: 'SERIES_B',
          amount: '2000000',
          transferable: true,
          partition_type: 'preferred'
        },
        {
          name: 'Common Shares',
          partition_id: 'COMMON',
          amount: '1000000',
          transferable: true,
          partition_type: 'common'
        }
      ],
      controllers: [
        '0x742d35Cc6634C0532925a3b8D4E32E42f4B9eE48',
        '0x8ba1f109551bD432803012645Hac136c',
        '0x1234567890123456789012345678901234567890'
      ]
    }
  },

  // ERC-3525 Advanced
  {
    standard: 'ERC-3525',
    mode: 'max',
    name: 'Test Advanced Semi-Fungible',
    symbol: 'TASF',
    description: 'An advanced ERC-3525 semi-fungible token with all features for UI testing',
    blocks: {
      valueDecimals: 8,
      baseUri: 'https://advanced.example.com/3525/metadata/',
      slotType: 'structured_product',
      isBurnable: true,
      isPausable: true,
      hasRoyalty: true,
      royaltyPercentage: '3.0',
      royaltyReceiver: '0x742d35Cc6634C0532925a3b8D4E32E42f4B9eE48',
      slotApprovals: true,
      valueApprovals: true,
      valueTransfersEnabled: true,
      fractionalOwnership: true,
      mergable: true,
      splittable: true,
      dynamicMetadata: true
    },
    properties: {
      value_decimals: 8,
      base_uri: 'https://advanced.example.com/3525/metadata/',
      slot_type: 'structured_product',
      is_burnable: true,
      is_pausable: true,
      has_royalty: true,
      royalty_percentage: '3.0',
      royalty_receiver: '0x742d35Cc6634C0532925a3b8D4E32E42f4B9eE48',
      slot_approvals: true,
      value_approvals: true,
      access_control: 'roles',
      updatable_uris: true,
      updatable_slots: true,
      value_transfers_enabled: true,
      fractional_ownership_enabled: true,
      mergable: true,
      splittable: true,
      dynamic_metadata: true,
      allows_slot_enumeration: true,
      value_aggregation: true,
      permissioning_enabled: true,
      supply_tracking: true,
      updatable_values: true,
      fractionalizable: true,
      metadata_storage: 'ipfs',
      cross_slot_transfers: true,
      slot_inheritance: true,
      value_appreciation: true,
      automated_distributions: true,
      compliance_integration: true,
      oracle_integration: true,
      staking_rewards: true,
      governance_participation: true
    },
    arrayData: {
      slots: [
        {
          slot_id: '1',
          name: 'Fixed Income Bond 2025',
          description: 'High-grade corporate bond with 5% yield',
          value_units: 'USD',
          slot_transferable: true
        },
        {
          slot_id: '2',
          name: 'Equity Derivative 2026',
          description: 'Structured equity product with S&P 500 exposure',
          value_units: 'USD',
          slot_transferable: true
        },
        {
          slot_id: '3',
          name: 'Real Estate REIT Token',
          description: 'Fractional ownership in commercial real estate',
          value_units: 'USD',
          slot_transferable: false
        }
      ]
    }
  },

  // ERC-4626 Advanced
  {
    standard: 'ERC-4626',
    mode: 'max',
    name: 'Test Advanced Yield Vault',
    symbol: 'TAYV',
    description: 'An advanced ERC-4626 yield vault with all features for UI testing',
    blocks: {
      assetAddress: '0xA0b86a33E6441E7df6Bb8c6E12eE4a2B8A8A8A8A',
      assetName: 'USDC',
      assetSymbol: 'USDC',
      assetDecimals: 6,
      vaultType: 'multi_strategy',
      vaultStrategy: 'custom',
      customStrategy: true,
      isMintable: true,
      isBurnable: true,
      isPausable: true,
      permit: true,
      flashLoans: true,
      emergencyShutdown: true,
      performanceTracking: true,
      yieldOptimization: true,
      automatedRebalancing: true
    },
    properties: {
      asset_address: '0xA0b86a33E6441E7df6Bb8c6E12eE4a2B8A8A8A8A',
      asset_name: 'USDC',
      asset_symbol: 'USDC',
      asset_decimals: 6,
      vault_type: 'multi_strategy',
      vault_strategy: 'custom',
      custom_strategy: true,
      is_mintable: true,
      is_burnable: true,
      is_pausable: true,
      permit: true,
      flash_loans: true,
      emergency_shutdown: true,
      performance_metrics: true,
      performance_tracking: true,
      yield_optimization_enabled: true,
      automated_rebalancing: true,
      yield_source: 'multiple',
      access_control: 'roles',
      deposit_limit: '10000000',
      withdrawal_limit: '1000000',
      min_deposit: '100',
      max_deposit: '1000000',
      min_withdrawal: '10',
      max_withdrawal: '500000',
      deposit_fee: '0.1',
      withdrawal_fee: '0.2',
      management_fee: '2.0',
      performance_fee: '20.0',
      fee_recipient: '0x742d35Cc6634C0532925a3b8D4E32E42f4B9eE48',
      strategy_controller: '0x8ba1f109551bD432803012645Hac136c',
      strategy_documentation: 'https://docs.example.com/strategy',
      rebalance_threshold: '5.0',
      liquidity_reserve: '20',
      max_slippage: '1.0',
      risk_level: 'medium',
      target_apy: '8.5',
      lock_period: 0,
      whitelisted_assets: ['USDC', 'DAI', 'USDT'],
      supported_protocols: ['aave', 'compound', 'yearn'],
      insurance_coverage: true,
      audit_status: 'audited'
    },
    arrayData: {
      strategyParams: [
        {
          name: 'primary_protocol',
          value: 'aave',
          description: 'Primary lending protocol'
        },
        {
          name: 'secondary_protocol',
          value: 'compound',
          description: 'Secondary lending protocol'
        },
        {
          name: 'yield_farming_protocol',
          value: 'yearn',
          description: 'Yield farming strategy'
        },
        {
          name: 'rebalance_frequency',
          value: 'daily',
          description: 'Automatic rebalancing frequency'
        }
      ],
      assetAllocations: [
        {
          asset: 'USDC',
          percentage: '60'
        },
        {
          asset: 'DAI',
          percentage: '30'
        },
        {
          asset: 'USDT',
          percentage: '10'
        }
      ]
    }
  }
];

class MissingMaxTokenCreator {
  private supabase: any;
  private results: Array<{
    standard: string;
    mode: string;
    success: boolean;
    tokenId?: string;
    error?: string;
  }> = [];

  constructor() {
    if (!TEST_CONFIG.supabaseUrl || !TEST_CONFIG.supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }
    
    this.supabase = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseKey);
  }

  async createMissingTokens(): Promise<void> {
    console.log('🚀 Creating Missing Max Token Versions...\n');
    console.log(`Creating ${MISSING_MAX_TOKENS.length} missing max tokens\n`);
    
    try {
      // Verify project exists
      await this.verifyProject();
      
      // Create all missing max tokens
      for (const tokenData of MISSING_MAX_TOKENS) {
        await this.createTestToken(tokenData);
      }
      
      // Print results
      this.printResults();
      
    } catch (error) {
      console.error('❌ Creation failed:', error);
      throw error;
    }
  }

  private async verifyProject(): Promise<void> {
    const { data: project, error } = await this.supabase
      .from('projects')
      .select('id, name')
      .eq('id', TEST_CONFIG.testProjectId)
      .single();
    
    if (error) {
      throw new Error(`Project verification failed: ${error.message}`);
    }
    
    console.log(`✅ Using project: "${project.name}" (${project.id})\n`);
  }

  private async createTestToken(tokenData: TestTokenData): Promise<void> {
    const testName = `${tokenData.standard} ${tokenData.mode}`;
    console.log(`🔧 Creating ${testName} token...`);
    
    try {
      // Create unique symbol with timestamp to avoid conflicts
      const timestamp = Date.now().toString().slice(-6);
      const uniqueSymbol = `${tokenData.symbol}_${timestamp}`;
      
      // 1. Create main token record
      const mainTokenData = {
        project_id: TEST_CONFIG.testProjectId,
        name: tokenData.name,
        symbol: uniqueSymbol,
        standard: tokenData.standard as "ERC-1155" | "ERC-1400" | "ERC-3525" | "ERC-4626",
        decimals: tokenData.blocks.decimals || (tokenData.standard === 'ERC-1155' ? 0 : 18),
        status: 'DRAFT' as const,
        config_mode: tokenData.mode,
        blocks: {
          name: tokenData.name,
          symbol: uniqueSymbol,
          ...tokenData.blocks
        },
        total_supply: tokenData.blocks.initialSupply || tokenData.blocks.cap || '0',
        metadata: {
          description: tokenData.description,
          testToken: true,
          createdBy: 'missing-max-token-creator'
        }
      };

      const { data: token, error: tokenError } = await this.supabase
        .from('tokens')
        .insert(mainTokenData)
        .select()
        .single();

      if (tokenError) {
        throw new Error(`Main token creation failed: ${tokenError.message}`);
      }

      console.log(`  ✅ Main token created: ${token.id}`);

      // 2. Create standard-specific properties
      if (tokenData.properties) {
        await this.createStandardProperties(token.id, tokenData.standard, tokenData.properties);
        console.log(`  ✅ Standard properties created`);
      }

      // 3. Create array data
      if (tokenData.arrayData) {
        await this.createArrayData(token.id, tokenData.standard, tokenData.arrayData);
        console.log(`  ✅ Array data created`);
      }

      this.results.push({
        standard: tokenData.standard,
        mode: tokenData.mode,
        success: true,
        tokenId: token.id
      });

      console.log(`  🎉 ${testName} token complete: ${token.id}\n`);

    } catch (error: any) {
      console.error(`  ❌ ${testName} token failed: ${error.message}\n`);
      
      this.results.push({
        standard: tokenData.standard,
        mode: tokenData.mode,
        success: false,
        error: error.message
      });
    }
  }

  private async createStandardProperties(tokenId: string, standard: string, properties: Record<string, any>): Promise<void> {
    const tableMap: Record<string, string> = {
      'ERC-1155': 'token_erc1155_properties',
      'ERC-1400': 'token_erc1400_properties',
      'ERC-3525': 'token_erc3525_properties',
      'ERC-4626': 'token_erc4626_properties'
    };

    const tableName = tableMap[standard];
    if (!tableName) {
      throw new Error(`Unknown standard: ${standard}`);
    }

    const propertiesData = {
      token_id: tokenId,
      ...properties
    };

    const { error } = await this.supabase
      .from(tableName)
      .insert(propertiesData);

    if (error) {
      throw new Error(`Properties creation failed: ${error.message}`);
    }
  }

  private async createArrayData(tokenId: string, standard: string, arrayData: Record<string, any[]>): Promise<void> {
    const tableMap: Record<string, Record<string, string>> = {
      'ERC-1155': {
        tokenTypes: 'token_erc1155_types'
      },
      'ERC-1400': {
        partitions: 'token_erc1400_partitions',
        controllers: 'token_erc1400_controllers'
      },
      'ERC-3525': {
        slots: 'token_erc3525_slots'
      },
      'ERC-4626': {
        strategyParams: 'token_erc4626_strategy_params',
        assetAllocations: 'token_erc4626_asset_allocations'
      }
    };

    const tables = tableMap[standard] || {};

    for (const [dataType, items] of Object.entries(arrayData)) {
      const tableName = tables[dataType];
      if (!tableName) {
        console.warn(`  ⚠️ Unknown array data type: ${dataType} for ${standard}`);
        continue;
      }

      let records;
      if (dataType === 'controllers') {
        records = items.map(address => ({
          token_id: tokenId,
          address: address,
          permissions: ['ADMIN']
        }));
      } else {
        records = items.map(item => ({
          token_id: tokenId,
          ...item
        }));
      }

      const { error } = await this.supabase
        .from(tableName)
        .insert(records);

      if (error) {
        throw new Error(`Array data creation failed for ${dataType}: ${error.message}`);
      }
    }
  }

  private printResults(): void {
    const successful = this.results.filter(r => r.success);
    const failed = this.results.filter(r => !r.success);

    console.log('\n📊 Creation Results Summary');
    console.log('===========================');
    console.log(`Total Tokens: ${this.results.length}`);
    console.log(`Successful: ${successful.length} ✅`);
    console.log(`Failed: ${failed.length} ❌`);
    console.log(`Success Rate: ${((successful.length / this.results.length) * 100).toFixed(1)}%`);

    if (successful.length > 0) {
      console.log('\n✅ Successfully Created Max Tokens:');
      successful.forEach(result => {
        console.log(`  • ${result.standard} (${result.mode}): ${result.tokenId}`);
      });
    }

    if (failed.length > 0) {
      console.log('\n❌ Failed Tokens:');
      failed.forEach(result => {
        console.log(`  • ${result.standard} (${result.mode}): ${result.error}`);
      });
    }

    console.log('\n🎯 Next Steps:');
    console.log('1. Test all max version tokens in the UI');
    console.log('2. Verify trait types, token IDs, partition IDs, and slot IDs are displayed correctly');
    console.log('3. Check form validation and editing functionality');
    console.log('4. Test mode switching between basic and advanced configurations');
  }
}

// Main execution
async function main() {
  try {
    const creator = new MissingMaxTokenCreator();
    await creator.createMissingTokens();
    process.exit(0);
  } catch (error) {
    console.error('💥 Creation failed:', error);
    process.exit(1);
  }
}

main();