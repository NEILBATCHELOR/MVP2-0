#!/usr/bin/env ts-node

/**
 * Test script to verify that investor name and ID are properly populated
 * when creating redemption requests
 */

import { supabase } from '../src/infrastructure/supabaseClient';
import { redemptionService } from '../src/components/redemption/services/redemptionService';
import type { CreateRedemptionRequestInput } from '../src/components/redemption/types';

async function testInvestorPopulation() {
  console.log('🔍 Testing investor population in redemption requests...\n');

  // 1. First, get a sample distribution with known investor
  console.log('1. Fetching a sample distribution...');
  const { data: distributions, error: distError } = await supabase
    .from('distributions')
    .select(`
      id,
      investor_id,
      token_amount,
      remaining_amount,
      token_type,
      investors!distributions_investor_fkey (
        investor_id,
        name,
        email
      )
    `)
    .gt('remaining_amount', 0)
    .limit(1)
    .single();

  if (distError || !distributions) {
    console.error('❌ Could not fetch distributions:', distError);
    return;
  }

  console.log('✅ Found distribution:', {
    id: distributions.id,
    investor_id: distributions.investor_id,
    investor_name: distributions.investors?.name,
    remaining_amount: distributions.remaining_amount
  });

  // 2. Test creating a redemption request without providing investor details
  console.log('\n2. Testing redemption request creation with distributionId...');
  
  const testInput: CreateRedemptionRequestInput = {
    distributionId: distributions.id, // This should auto-populate investor details
    tokenAmount: Math.min(100, Number(distributions.remaining_amount)),
    tokenType: distributions.token_type || 'ERC-20',
    redemptionType: 'standard',
    sourceWallet: '0x1234567890123456789012345678901234567890',
    destinationWallet: '0x0987654321098765432109876543210987654321',
    sourceWalletAddress: '0x1234567890123456789012345678901234567890',
    destinationWalletAddress: '0x0987654321098765432109876543210987654321',
    conversionRate: 1.0,
    usdcAmount: Math.min(100, Number(distributions.remaining_amount)),
    notes: 'Test redemption for investor population validation'
  };

  const result = await redemptionService.createRedemptionRequest(testInput);

  if (!result.success) {
    console.error('❌ Failed to create redemption request:', result.error);
    return;
  }

  console.log('✅ Created redemption request successfully!');
  console.log('📊 Redemption request details:', {
    id: result.data?.id,
    investor_name: result.data?.investorName,
    investor_id: result.data?.investorId,
    token_amount: result.data?.tokenAmount
  });

  // 3. Verify the data was saved correctly in the database
  console.log('\n3. Verifying data in database...');
  
  const { data: dbRecord, error: dbError } = await supabase
    .from('redemption_requests')
    .select('id, investor_name, investor_id, token_amount, created_at')
    .eq('id', result.data?.id)
    .single();

  if (dbError || !dbRecord) {
    console.error('❌ Could not fetch redemption request from database:', dbError);
    return;
  }

  console.log('✅ Database record verification:', {
    id: dbRecord.id,
    investor_name: dbRecord.investor_name,
    investor_id: dbRecord.investor_id,
    token_amount: dbRecord.token_amount,
    created_at: dbRecord.created_at
  });

  // 4. Compare with expected values
  console.log('\n4. Validation results:');
  
  const expectedName = distributions.investors?.name;
  const expectedId = distributions.investor_id;
  
  const nameMatch = dbRecord.investor_name === expectedName;
  const idMatch = dbRecord.investor_id === expectedId;
  
  console.log(`Investor Name: ${nameMatch ? '✅' : '❌'} Expected: "${expectedName}", Got: "${dbRecord.investor_name}"`);
  console.log(`Investor ID: ${idMatch ? '✅' : '❌'} Expected: "${expectedId}", Got: "${dbRecord.investor_id}"`);
  
  if (nameMatch && idMatch) {
    console.log('\n🎉 SUCCESS: Investor data is properly populated!');
  } else {
    console.log('\n❌ FAILURE: Investor data population needs fixing');
  }

  // 5. Clean up test data
  console.log('\n5. Cleaning up test data...');
  const { error: deleteError } = await supabase
    .from('redemption_requests')
    .delete()
    .eq('id', result.data?.id);

  if (deleteError) {
    console.warn('⚠️ Warning: Could not delete test redemption request:', deleteError);
  } else {
    console.log('✅ Test data cleaned up successfully');
  }
}

// Run the test
testInvestorPopulation()
  .then(() => {
    console.log('\n✨ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed with error:', error);
    process.exit(1);
  });
