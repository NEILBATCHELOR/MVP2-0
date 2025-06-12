/**
 * Test script to verify enhanced token data loading
 * This will help us debug why the standard-specific arrays are empty
 */
import { getEnhancedTokenData } from '../services/tokenDataService';
import { getTokensByProject } from '../services/tokenService';

/**
 * Test function to check token data loading
 * Call this from browser console: testEnhancedTokenLoading('your-project-id')
 */
export async function testEnhancedTokenLoading(projectId: string) {
  console.log('[Test] Starting enhanced token data test...');
  
  try {
    // 1. Get basic tokens first
    console.log('[Test] Fetching basic tokens...');
    const basicTokens = await getTokensByProject(projectId);
    console.log(`[Test] Found ${basicTokens.length} basic tokens:`, basicTokens);
    
    if (basicTokens.length === 0) {
      console.log('[Test] No tokens found for project');
      return;
    }
    
    // 2. Test enhanced data for each token
    for (const token of basicTokens) {
      console.log(`\n[Test] Testing enhanced data for token: ${token.name} (${token.id})`);
      console.log(`[Test] Token standard: ${token.standard}`);
      
      try {
        const enhancedData = await getEnhancedTokenData(token.id);
        console.log(`[Test] Enhanced data for ${token.name}:`, enhancedData);
        
        // Check specific arrays based on standard
        switch (token.standard) {
          case 'ERC-721':
            console.log(`[Test] ERC-721 Attributes:`, enhancedData.erc721Attributes);
            if (enhancedData.erc721Attributes && enhancedData.erc721Attributes.length > 0) {
              console.log(`[Test] ✅ Found ${enhancedData.erc721Attributes.length} ERC-721 attributes`);
            } else {
              console.log(`[Test] ❌ No ERC-721 attributes found`);
            }
            break;
            
          case 'ERC-1155':
            console.log(`[Test] ERC-1155 Types:`, enhancedData.erc1155Types);
            if (enhancedData.erc1155Types && enhancedData.erc1155Types.length > 0) {
              console.log(`[Test] ✅ Found ${enhancedData.erc1155Types.length} ERC-1155 types`);
            } else {
              console.log(`[Test] ❌ No ERC-1155 types found`);
            }
            break;
            
          case 'ERC-1400':
            console.log(`[Test] ERC-1400 Partitions:`, enhancedData.erc1400Partitions);
            if (enhancedData.erc1400Partitions && enhancedData.erc1400Partitions.length > 0) {
              console.log(`[Test] ✅ Found ${enhancedData.erc1400Partitions.length} ERC-1400 partitions`);
            } else {
              console.log(`[Test] ❌ No ERC-1400 partitions found`);
            }
            break;
            
          case 'ERC-3525':
            console.log(`[Test] ERC-3525 Slots:`, enhancedData.erc3525Slots);
            if (enhancedData.erc3525Slots && enhancedData.erc3525Slots.length > 0) {
              console.log(`[Test] ✅ Found ${enhancedData.erc3525Slots.length} ERC-3525 slots`);
            } else {
              console.log(`[Test] ❌ No ERC-3525 slots found`);
            }
            break;
            
          case 'ERC-4626':
            console.log(`[Test] ERC-4626 Strategy Params:`, enhancedData.erc4626StrategyParams);
            console.log(`[Test] ERC-4626 Asset Allocations:`, enhancedData.erc4626AssetAllocations);
            if (enhancedData.erc4626StrategyParams && enhancedData.erc4626StrategyParams.length > 0) {
              console.log(`[Test] ✅ Found ${enhancedData.erc4626StrategyParams.length} ERC-4626 strategy params`);
            } else {
              console.log(`[Test] ❌ No ERC-4626 strategy params found`);
            }
            break;
        }
        
      } catch (enhancedError) {
        console.error(`[Test] ❌ Error fetching enhanced data for ${token.name}:`, enhancedError);
      }
    }
    
    console.log('\n[Test] Enhanced token data test completed');
    
  } catch (error) {
    console.error('[Test] ❌ Test failed:', error);
  }
}

/**
 * Test function to directly check database tables
 */
export async function testDirectDatabaseQuery(tokenId: string) {
  console.log(`[Test] Testing direct database queries for token: ${tokenId}`);
  
  // We'll need to import supabase client for this
  const { supabase } = await import('@/infrastructure/database/client');
  
  // First get the token to know its standard
  const { data: token, error: tokenError } = await supabase
    .from('tokens')
    .select('*')
    .eq('id', tokenId)
    .single();
    
  if (tokenError) {
    console.error('[Test] Error fetching token:', tokenError);
    return;
  }
  
  console.log(`[Test] Token found: ${token.name} (${token.standard})`);
  
  // Test queries for different standards
  const tables = {
    'ERC-721': 'token_erc721_attributes',
    'ERC-1155': 'token_erc1155_types',
    'ERC-1400': 'token_erc1400_partitions',
    'ERC-3525': 'token_erc3525_slots',
    'ERC-4626': 'token_erc4626_strategy_params'
  };
  
  const tableName = tables[token.standard as keyof typeof tables];
  if (tableName) {
    console.log(`[Test] Querying ${tableName} table...`);
    
    const { data, error } = await supabase
      .from(tableName as any)
      .select('*')
      .eq('token_id', tokenId);
      
    if (error) {
      console.error(`[Test] Error querying ${tableName}:`, error);
    } else {
      console.log(`[Test] Found ${data?.length || 0} records in ${tableName}:`, data);
    }
  } else {
    console.log(`[Test] No standard-specific table for ${token.standard}`);
  }
}

// Make functions available globally for testing
(window as any).testEnhancedTokenLoading = testEnhancedTokenLoading;
(window as any).testDirectDatabaseQuery = testDirectDatabaseQuery;