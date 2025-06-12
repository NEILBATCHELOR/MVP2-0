#!/usr/bin/env ts-node

/**
 * Migration script to backfill investor_name and investor_id for existing redemption requests
 * that have null or placeholder values
 */

import { supabase } from '../src/infrastructure/supabaseClient';

async function backfillInvestorData() {
  console.log('🔄 Starting backfill of investor data for redemption requests...\n');

  // 1. Find redemption requests with missing investor data
  console.log('1. Finding redemption requests with missing investor data...');
  
  const { data: redemptionRequests, error: fetchError } = await supabase
    .from('redemption_requests')
    .select('id, investor_name, investor_id, token_amount, created_at')
    .or('investor_name.is.null,investor_id.eq.current-user');

  if (fetchError) {
    console.error('❌ Failed to fetch redemption requests:', fetchError);
    return;
  }

  if (!redemptionRequests || redemptionRequests.length === 0) {
    console.log('✅ No redemption requests found with missing investor data');
    return;
  }

  console.log(`📊 Found ${redemptionRequests.length} redemption requests with missing investor data`);

  // 2. Process each redemption request
  let successCount = 0;
  let failureCount = 0;

  for (const request of redemptionRequests) {
    console.log(`\n🔍 Processing redemption request ${request.id}...`);

    try {
      // For requests with "current-user" as investor_id, we need to find the actual investor
      // This is more complex as we don't have a direct link to distributions
      // For now, let's see if we can find any distribution redemptions linked to this request
      
      const { data: distributionRedemptions, error: distRedError } = await supabase
        .from('distribution_redemptions')
        .select(`
          distribution_id,
          distributions!distribution_redemptions_distribution_id_fkey (
            investor_id,
            investors!distributions_investor_fkey (
              investor_id,
              name
            )
          )
        `)
        .eq('redemption_request_id', request.id)
        .limit(1)
        .single();

      if (distRedError || !distributionRedemptions) {
        console.log(`⚠️ No distribution redemption found for request ${request.id}`);
        failureCount++;
        continue;
      }

      const distribution = distributionRedemptions.distributions;
      const investor = distribution?.investors;

      if (!investor) {
        console.log(`⚠️ No investor found for request ${request.id}`);
        failureCount++;
        continue;
      }

      // Update the redemption request with the correct investor data
      const { error: updateError } = await supabase
        .from('redemption_requests')
        .update({
          investor_name: investor.name,
          investor_id: investor.investor_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', request.id);

      if (updateError) {
        console.error(`❌ Failed to update request ${request.id}:`, updateError);
        failureCount++;
        continue;
      }

      console.log(`✅ Updated request ${request.id} with investor: ${investor.name} (${investor.investor_id})`);
      successCount++;

    } catch (error) {
      console.error(`❌ Error processing request ${request.id}:`, error);
      failureCount++;
    }
  }

  // 3. Summary
  console.log('\n📈 Backfill Summary:');
  console.log(`✅ Successfully updated: ${successCount} redemption requests`);
  console.log(`❌ Failed to update: ${failureCount} redemption requests`);
  console.log(`📊 Total processed: ${redemptionRequests.length} redemption requests`);

  if (successCount > 0) {
    console.log('\n🎉 Backfill completed successfully!');
  } else {
    console.log('\n⚠️ No redemption requests were updated. This might be expected if there are no linked distribution redemptions yet.');
  }
}

// Run the migration
backfillInvestorData()
  .then(() => {
    console.log('\n✨ Migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration failed with error:', error);
    process.exit(1);
  });
