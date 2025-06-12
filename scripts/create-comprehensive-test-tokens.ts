#!/usr/bin/env ts-node

/**
 * Comprehensive Token Creation and Editing Test Suite
 * Creates test tokens for all standards to verify UI functionality
 */

// Load environment variables from .env file
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load .env file
dotenv.config();

const TEST_CONFIG = {
  supabaseUrl: process.env.VITE_SUPABASE_URL || '',
  supabaseKey: process.env.VITE_SUPABASE_ANON_KEY || '',
  testProjectId: '0350bd24-1f6d-4cc7-840a-da8916610063',
  cleanup: false, // Keep tokens for UI testing
  createPersistent: true
};

interface TestTokenData {
  standard: string;
  mode: 'min' | 'max';
  name: string;
  symbol: string;
  description: string;
  blocks: Record<string, any>;
  properties?: Record<string, any>;
  arrayData?: Record<string, any[]>;
}

// Test data definitions for all standards
const TEST_TOKENS: TestTokenData[] = [
  // ERC-20 Basic
  {
    standard: 'ERC-20',
    mode: 'min',
    name: 'Test Basic ERC20',
    symbol: 'TBE20',
    description: 'A basic ERC-20 token for UI testing',
    blocks: {
      initialSupply: '1000000',
      decimals: 18,
      isMintable: true,
      isBurnable: false,
      isPausable: true,
      cap: '5000000'
    },
    properties: {
      initial_supply: '1000000',
      cap: '5000000',
      is_mintable: true,
      is_burnable: false,
      is_pausable: true,
      token_type: 'utility',
      access_control: 'ownable',
      allow_management: false,
      permit: false,
      snapshot: false
    }
  },
  
  // ERC-20 Advanced
  {
    standard: 'ERC-20',
    mode: 'max',
    name: 'Test Advanced ERC20',
    symbol: 'TAE20',
    description: 'An advanced ERC-20 token with all features for UI testing',
    blocks: {
      initialSupply: '2000000',
      decimals: 18,
      isMintable: true,
      isBurnable: true,
      isPausable: true,
      cap: '10000000',
      tokenType: 'governance',
      accessControl: 'roles',
      allowanceManagement: true,
      permit: true,
      snapshot: true,
      feeOnTransfer: {
        enabled: true,
        fee: '2.5',
        feeType: 'percentage',
        recipient: '0x742d35Cc6634C0532925a3b8D4E32E42f4B9eE48'
      },
      rebasing: {
        enabled: true,
        mode: 'automatic',
        targetSupply: '3000000'
      },
      governanceFeatures: {
        enabled: true,
        votingPeriod: 7,
        votingThreshold: '51'
      }
    },
    properties: {
      initial_supply: '2000000',
      cap: '10000000',
      is_mintable: true,
      is_burnable: true,
      is_pausable: true,
      token_type: 'governance',
      access_control: 'roles',
      allow_management: true,
      permit: true,
      snapshot: true,
      fee_on_transfer: {
        enabled: true,
        fee: '2.5',
        feeType: 'percentage',
        recipient: '0x742d35Cc6634C0532925a3b8D4E32E42f4B9eE48'
      },
      rebasing: {
        enabled: true,
        mode: 'automatic',
        targetSupply: '3000000'
      },
      governance_features: {
        enabled: true,
        votingPeriod: 7,
        votingThreshold: '51'
      }
    }
  },
  
  // ERC-721 Basic
  {
    standard: 'ERC-721',
    mode: 'min',
    name: 'Test Basic NFT',
    symbol: 'TBNFT',
    description: 'A basic ERC-721 NFT collection for UI testing',
    blocks: {
      baseUri: 'https://example.com/metadata/',
      maxSupply: '10000',
      isMintable: true,
      isBurnable: false,
      isPausable: true,
      hasRoyalty: true,
      royaltyPercentage: '5.0',
      royaltyReceiver: '0x742d35Cc6634C0532925a3b8D4E32E42f4B9eE48'
    },
    properties: {
      base_uri: 'https://example.com/metadata/',
      max_supply: '10000',
      is_mintable: true,
      is_burnable: false,
      is_pausable: true,
      has_royalty: true,
      royalty_percentage: '5.0',
      royalty_receiver: '0x742d35Cc6634C0532925a3b8D4E32E42f4B9eE48',
      metadata_storage: 'ipfs',
      asset_type: 'unique_asset',
      minting_method: 'open',
      auto_increment_ids: true,
      enumerable: true,
      uri_storage: 'tokenId',
      access_control: 'ownable',
      updatable_uris: false
    },
    arrayData: {
      tokenAttributes: [
        {
          trait_type: 'Background',
          values: ['Blue', 'Red', 'Green', 'Purple']
        },
        {
          trait_type: 'Rarity',
          values: ['Common', 'Rare', 'Epic', 'Legendary']
        }
      ]
    }
  },
  
  // ERC-721 Advanced
  {
    standard: 'ERC-721',
    mode: 'max',
    name: 'Test Advanced NFT',
    symbol: 'TANFT',
    description: 'An advanced ERC-721 NFT with all features for UI testing',
    blocks: {
      baseUri: 'https://advanced.example.com/metadata/',
      maxSupply: '5000',
      isMintable: true,
      isBurnable: true,
      isPausable: true,
      hasRoyalty: true,
      royaltyPercentage: '7.5',
      royaltyReceiver: '0x742d35Cc6634C0532925a3b8D4E32E42f4B9eE48',
      assetType: 'gaming_asset',
      mintingMethod: 'whitelist',
      autoIncrementIds: false,
      enumerable: true,
      uriStorage: 'custom',
      accessControl: 'roles',
      updatableUris: true,
      salesConfig: {
        enabled: true,
        price: '0.1',
        maxPerTransaction: 5,
        publicSaleStart: '2024-01-01T00:00:00Z'
      }
    },
    properties: {
      base_uri: 'https://advanced.example.com/metadata/',
      max_supply: '5000',
      is_mintable: true,
      is_burnable: true,
      is_pausable: true,
      has_royalty: true,
      royalty_percentage: '7.5',
      royalty_receiver: '0x742d35Cc6634C0532925a3b8D4E32E42f4B9eE48',
      metadata_storage: 'ipfs',
      asset_type: 'gaming_asset',
      minting_method: 'whitelist',
      auto_increment_ids: false,
      enumerable: true,
      uri_storage: 'custom',
      access_control: 'roles',
      updatable_uris: true,
      sales_config: {
        enabled: true,
        price: '0.1',
        maxPerTransaction: 5,
        publicSaleStart: '2024-01-01T00:00:00Z'
      }
    },
    arrayData: {
      tokenAttributes: [
        {
          trait_type: 'Power Level',
          values: ['1', '10', '100', '1000']
        },
        {
          trait_type: 'Element',
          values: ['Fire', 'Water', 'Earth', 'Air']
        },
        {
          trait_type: 'Character Class',
          values: ['Warrior', 'Mage', 'Archer', 'Assassin']
        }
      ]
    }
  },
  
  // ERC-1155 Basic
  {
    standard: 'ERC-1155',
    mode: 'min',
    name: 'Test Multi-Token',
    symbol: 'TMT',
    description: 'A basic ERC-1155 multi-token for UI testing',
    blocks: {
      baseUri: 'https://example.com/1155/metadata/',
      isBurnable: false,
      isPausable: true,
      hasRoyalty: true,
      royaltyPercentage: '2.5',
      royaltyReceiver: '0x742d35Cc6634C0532925a3b8D4E32E42f4B9eE48',
      batchMinting: true
    },
    properties: {
      base_uri: 'https://example.com/1155/metadata/',
      is_burnable: false,
      is_pausable: true,
      has_royalty: true,
      royalty_percentage: '2.5',
      royalty_receiver: '0x742d35Cc6634C0532925a3b8D4E32E42f4B9eE48',
      metadata_storage: 'ipfs',
      access_control: 'ownable',
      updatable_uris: false,
      supply_tracking: true,
      enable_approval_for_all: true,
      batch_minting_enabled: true,
      container_enabled: false,
      dynamic_uris: false
    },
    arrayData: {
      tokenTypes: [
        {
          token_type_id: '1',
          name: 'Gold Coin',
          description: 'In-game currency',
          max_supply: '1000000',
          fungibility_type: 'fungible'
        },
        {
          token_type_id: '2',
          name: 'Magic Sword',
          description: 'Rare weapon',
          max_supply: '100',
          fungibility_type: 'non-fungible'
        }
      ]
    }
  },
  
  // ERC-1400 Basic
  {
    standard: 'ERC-1400',
    mode: 'min',
    name: 'Test Security Token',
    symbol: 'TST',
    description: 'A basic ERC-1400 security token for UI testing',
    blocks: {
      initialSupply: '1000000',
      cap: '5000000',
      isMintable: true,
      isBurnable: true,
      isPausable: true,
      enforceKYC: true,
      securityType: 'equity',
      issuingJurisdiction: 'US',
      regulationType: 'reg-d'
    },
    properties: {
      initial_supply: '1000000',
      cap: '5000000',
      is_mintable: true,
      is_burnable: true,
      is_pausable: true,
      enforce_kyc: true,
      security_type: 'equity',
      issuing_jurisdiction: 'US',
      regulation_type: 'reg-d',
      controller_address: '0x742d35Cc6634C0532925a3b8D4E32E42f4B9eE48',
      forced_transfers: false,
      forced_redemption_enabled: false,
      whitelist_enabled: true,
      investor_accreditation: true,
      holding_period: 365,
      max_investor_count: 100,
      auto_compliance: false,
      manual_approvals: true,
      compliance_module: 'basic',
      is_issuable: true,
      granular_control: false,
      dividend_distribution: false,
      corporate_actions: false,
      is_multi_class: false,
      tranche_transferability: false
    },
    arrayData: {
      partitions: [
        {
          name: 'Class A Shares',
          partition_id: 'CLASS_A',
          amount: '500000',
          transferable: true
        },
        {
          name: 'Class B Shares',
          partition_id: 'CLASS_B',
          amount: '500000',
          transferable: false
        }
      ],
      controllers: [
        '0x742d35Cc6634C0532925a3b8D4E32E42f4B9eE48',
        '0x8ba1f109551bD432803012645Hac136c'
      ]
    }
  },
  
  // ERC-3525 Basic
  {
    standard: 'ERC-3525',
    mode: 'min',
    name: 'Test Semi-Fungible',
    symbol: 'TSF',
    description: 'A basic ERC-3525 semi-fungible token for UI testing',
    blocks: {
      valueDecimals: 6,
      baseUri: 'https://example.com/3525/metadata/',
      slotType: 'bond',
      isBurnable: false,
      isPausable: true,
      hasRoyalty: false,
      slotApprovals: true,
      valueApprovals: true,
      valueTransfersEnabled: true
    },
    properties: {
      value_decimals: 6,
      base_uri: 'https://example.com/3525/metadata/',
      slot_type: 'bond',
      is_burnable: false,
      is_pausable: true,
      has_royalty: false,
      slot_approvals: true,
      value_approvals: true,
      access_control: 'ownable',
      updatable_uris: false,
      updatable_slots: false,
      value_transfers_enabled: true,
      fractional_ownership_enabled: false,
      mergable: false,
      splittable: false,
      dynamic_metadata: false,
      allows_slot_enumeration: true,
      value_aggregation: false,
      permissioning_enabled: false,
      supply_tracking: false,
      updatable_values: false,
      fractionalizable: false,
      metadata_storage: 'ipfs'
    },
    arrayData: {
      slots: [
        {
          slot_id: '1',
          name: 'Municipal Bond 2025',
          description: 'City infrastructure bond',
          value_units: 'USD',
          slot_transferable: true
        },
        {
          slot_id: '2',
          name: 'Corporate Bond 2026',
          description: 'Corporate debt instrument',
          value_units: 'USD',
          slot_transferable: true
        }
      ]
    }
  },
  
  // ERC-4626 Basic
  {
    standard: 'ERC-4626',
    mode: 'min',
    name: 'Test Yield Vault',
    symbol: 'TYV',
    description: 'A basic ERC-4626 yield vault for UI testing',
    blocks: {
      assetAddress: '0xA0b86a33E6441E7df6Bb8c6E12eE4a2B8A8A8A8A',
      assetName: 'USDC',
      assetSymbol: 'USDC',
      assetDecimals: 6,
      vaultType: 'yield',
      vaultStrategy: 'compound',
      customStrategy: false,
      isMintable: true,
      isBurnable: true,
      isPausable: true,
      permit: true,
      flashLoans: false,
      emergencyShutdown: true
    },
    properties: {
      asset_address: '0xA0b86a33E6441E7df6Bb8c6E12eE4a2B8A8A8A8A',
      asset_name: 'USDC',
      asset_symbol: 'USDC',
      asset_decimals: 6,
      vault_type: 'yield',
      vault_strategy: 'compound',
      custom_strategy: false,
      is_mintable: true,
      is_burnable: true,
      is_pausable: true,
      permit: true,
      flash_loans: false,
      emergency_shutdown: true,
      performance_metrics: false,
      performance_tracking: false,
      yield_optimization_enabled: false,
      automated_rebalancing: false,
      yield_source: 'external',
      access_control: 'ownable',
      deposit_limit: null,
      withdrawal_limit: null,
      min_deposit: null,
      max_deposit: null,
      min_withdrawal: null,
      max_withdrawal: null,
      deposit_fee: null,
      withdrawal_fee: null,
      management_fee: null,
      performance_fee: null,
      fee_recipient: null,
      strategy_controller: null,
      strategy_documentation: null,
      rebalance_threshold: null,
      liquidity_reserve: '10',
      max_slippage: null
    },
    arrayData: {
      strategyParams: [
        {
          name: 'protocol',
          value: 'compound',
          description: 'Primary yield protocol'
        }
      ],
      assetAllocations: [
        {
          asset: 'USDC',
          percentage: '100'
        }
      ]
    }
  }
];

class ComprehensiveTokenTester {
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
      throw new Error('Missing Supabase configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    }
    
    this.supabase = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseKey);
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Comprehensive Token Creation Tests...\n');
    console.log(`Creating ${TEST_TOKENS.length} test tokens for UI testing\n`);
    
    try {
      // Verify project exists
      await this.verifyProject();
      
      // Create all test tokens
      for (const tokenData of TEST_TOKENS) {
        await this.createTestToken(tokenData);
      }
      
      // Print results
      this.printResults();
      
      // Print UI testing instructions
      this.printUITestingInstructions();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
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
        standard: tokenData.standard as "ERC-20" | "ERC-721" | "ERC-1155" | "ERC-1400" | "ERC-3525" | "ERC-4626",
        decimals: tokenData.blocks.decimals || (tokenData.standard === 'ERC-721' || tokenData.standard === 'ERC-1155' ? 0 : 18),
        status: 'DRAFT' as const,
        config_mode: tokenData.mode,
        blocks: {
          // Include name and symbol in blocks for validation
          name: tokenData.name,
          symbol: uniqueSymbol,
          ...tokenData.blocks
        },
        total_supply: tokenData.blocks.initialSupply || tokenData.blocks.cap || '0',
        metadata: {
          description: tokenData.description,
          testToken: true,
          createdBy: 'comprehensive-test-suite'
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
      'ERC-20': 'token_erc20_properties',
      'ERC-721': 'token_erc721_properties',
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

    // Check if properties already exist
    const { data: existing } = await this.supabase
      .from(tableName)
      .select('id')
      .eq('token_id', tokenId)
      .maybeSingle();

    if (existing) {
      // Update existing properties
      const { error } = await this.supabase
        .from(tableName)
        .update(propertiesData)
        .eq('token_id', tokenId);

      if (error) {
        throw new Error(`Properties update failed: ${error.message}`);
      }
    } else {
      // Insert new properties
      const { error } = await this.supabase
        .from(tableName)
        .insert(propertiesData);

      if (error) {
        throw new Error(`Properties creation failed: ${error.message}`);
      }
    }
  }

  private async createArrayData(tokenId: string, standard: string, arrayData: Record<string, any[]>): Promise<void> {
    const tableMap: Record<string, Record<string, string>> = {
      'ERC-721': {
        tokenAttributes: 'token_erc721_attributes'
      },
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

      // Delete existing array data first
      await this.supabase
        .from(tableName)
        .delete()
        .eq('token_id', tokenId);

      // Create new records
      let records;
      if (dataType === 'controllers') {
        // Handle controllers as simple address array
        records = items.map(address => ({
          token_id: tokenId,
          address: address,
          permissions: ['ADMIN']
        }));
      } else {
        // Handle other array types
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

    console.log('\n📊 Test Results Summary');
    console.log('========================');
    console.log(`Total Tests: ${this.results.length}`);
    console.log(`Successful: ${successful.length} ✅`);
    console.log(`Failed: ${failed.length} ❌`);
    console.log(`Success Rate: ${((successful.length / this.results.length) * 100).toFixed(1)}%`);

    if (successful.length > 0) {
      console.log('\n✅ Successful Tokens:');
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
  }

  private printUITestingInstructions(): void {
    console.log('\n🎯 UI Testing Instructions');
    console.log('===========================');
    console.log('\n1. **Token Creation Testing:**');
    console.log('   - Navigate to: /tokens/create');
    console.log('   - Test each standard in both basic and advanced modes');
    console.log('   - Verify all form fields work correctly');
    console.log('   - Test template loading functionality');
    console.log('   - Verify validation messages');
    
    console.log('\n2. **Token Editing Testing:**');
    console.log('   - Navigate to token list in your project');
    console.log('   - Click edit on each test token created above');
    console.log('   - Test editing all fields for each standard');
    console.log('   - Verify array data editing (attributes, slots, etc.)');
    console.log('   - Test save functionality');
    
    console.log('\n3. **Test Tokens Available:**');
    const successful = this.results.filter(r => r.success);
    successful.forEach(result => {
      console.log(`   • ${result.standard} (${result.mode}): ${result.tokenId}`);
    });
    
    console.log('\n4. **Specific Areas to Test:**');
    console.log('   - Form validation and error handling');
    console.log('   - Complex nested configurations (fees, rebasing, etc.)');
    console.log('   - Array data management (add/edit/remove)');
    console.log('   - Mode switching (basic ↔ advanced)');
    console.log('   - Template loading and customization');
    console.log('   - Save/update functionality');
    
    console.log('\n5. **Database Verification:**');
    console.log('   - Check that all tokens appear in the UI');
    console.log('   - Verify all properties are editable');
    console.log('   - Confirm changes persist after save');
    console.log('   - Test complex field types (JSON, arrays, etc.)');
    
    console.log('\n🎉 Test tokens are ready for comprehensive UI testing!');
    console.log('\nTo clean up test tokens later, run the cleanup script or delete manually from the UI.');
  }
}

// Main execution
async function main() {
  try {
    const tester = new ComprehensiveTokenTester();
    await tester.runAllTests();
    process.exit(0);
  } catch (error) {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  }
}

// Run main function
main();

export { ComprehensiveTokenTester, TEST_TOKENS };
