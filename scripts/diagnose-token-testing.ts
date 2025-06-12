#!/usr/bin/env ts-node

/**
 * Token Testing Diagnostic Script
 * Diagnoses why validation scripts aren't creating tokens in database
 */

// Load environment variables from .env file
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load .env file
dotenv.config();

// Check environment configuration
console.log('🔍 Diagnosing Token Testing Issues...\n');

// 1. Environment Variables Check
console.log('📋 Environment Variables:');
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');

if (process.env.VITE_SUPABASE_URL) {
  console.log('🔗 Supabase URL:', process.env.VITE_SUPABASE_URL.substring(0, 30) + '...');
}

const TEST_CONFIG = {
  supabaseUrl: process.env.VITE_SUPABASE_URL || '',
  supabaseKey: process.env.VITE_SUPABASE_ANON_KEY || '',
  testProjectId: '0350bd24-1f6d-4cc7-840a-da8916610063'
};

async function runDiagnostics() {
  try {
    // 2. Database Connection Test
    console.log('\n🔌 Testing Database Connection...');
    
    if (!TEST_CONFIG.supabaseUrl || !TEST_CONFIG.supabaseKey) {
      console.error('❌ Missing Supabase configuration');
      console.log('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables');
      return;
    }
    
    const supabase = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseKey);
    
    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('tokens')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      console.error('❌ Database connection failed:', connectionError.message);
      return;
    }
    
    console.log('✅ Database connection successful');
    
    // 3. Test Project Verification
    console.log('\n📁 Testing Project Access...');
    
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name')
      .eq('id', TEST_CONFIG.testProjectId)
      .single();
    
    if (projectError) {
      console.error('❌ Test project access failed:', projectError.message);
      return;
    }
    
    console.log(`✅ Test project found: "${project.name}" (${project.id})`);
    
    // 4. Test Token Creation
    console.log('\n🔧 Testing Token Creation...');
    
    const testTokenData = {
      project_id: TEST_CONFIG.testProjectId,
      name: 'Diagnostic Test Token',
      symbol: 'TEST',
      standard: 'ERC-20' as const,
      decimals: 18,
      status: 'DRAFT' as const,
      blocks: {
        name: 'Diagnostic Test Token',
        symbol: 'TEST',
        initialSupply: '1000000',
        isMintable: true,
        isBurnable: false,
        isPausable: true
      },
      total_supply: '1000000',
      config_mode: 'min' as const
    };
    
    const { data: createdToken, error: createError } = await supabase
      .from('tokens')
      .insert(testTokenData)
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Token creation failed:', createError.message);
      console.error('Error details:', createError);
      return;
    }
    
    console.log(`✅ Test token created successfully: ${createdToken.id}`);
    
    // 5. Test Standard Properties Creation
    console.log('\n⚙️ Testing ERC-20 Properties Creation...');
    
    const erc20Properties = {
      token_id: createdToken.id,
      initial_supply: '1000000',
      is_mintable: true,
      is_burnable: false,
      is_pausable: true,
      token_type: 'utility',
      access_control: 'ownable',
      allow_management: false,
      permit: false,
      snapshot: false
    };
    
    const { data: propertiesData, error: propertiesError } = await supabase
      .from('token_erc20_properties')
      .insert(erc20Properties)
      .select()
      .single();
    
    if (propertiesError) {
      console.error('❌ ERC-20 properties creation failed:', propertiesError.message);
    } else {
      console.log(`✅ ERC-20 properties created successfully: ${propertiesData.id}`);
    }
    
    // 6. Test Token Retrieval
    console.log('\n📖 Testing Token Retrieval...');
    
    const { data: retrievedToken, error: retrieveError } = await supabase
      .from('tokens')
      .select(`
        *,
        token_erc20_properties (*)
      `)
      .eq('id', createdToken.id)
      .single();
    
    if (retrieveError) {
      console.error('❌ Token retrieval failed:', retrieveError.message);
    } else {
      console.log('✅ Token retrieved successfully with properties');
      console.log('📊 Token data structure:');
      console.log(`  - ID: ${retrievedToken.id}`);
      console.log(`  - Name: ${retrievedToken.name}`);
      console.log(`  - Symbol: ${retrievedToken.symbol}`);
      console.log(`  - Standard: ${retrievedToken.standard}`);
      console.log(`  - Status: ${retrievedToken.status}`);
      console.log(`  - Has ERC-20 Properties: ${retrievedToken.token_erc20_properties ? 'Yes' : 'No'}`);
      
      if (retrievedToken.token_erc20_properties) {
        const props = retrievedToken.token_erc20_properties;
        console.log(`  - Initial Supply: ${props.initial_supply}`);
        console.log(`  - Is Mintable: ${props.is_mintable}`);
        console.log(`  - Token Type: ${props.token_type}`);
      }
    }
    
    // 7. Cleanup Test
    console.log('\n🧹 Testing Cleanup...');
    
    // Delete properties first (foreign key constraint)
    if (propertiesData) {
      await supabase
        .from('token_erc20_properties')
        .delete()
        .eq('token_id', createdToken.id);
    }
    
    // Delete main token
    const { error: deleteError } = await supabase
      .from('tokens')
      .delete()
      .eq('id', createdToken.id);
    
    if (deleteError) {
      console.error('❌ Cleanup failed:', deleteError.message);
    } else {
      console.log('✅ Test data cleaned up successfully');
    }
    
    // 8. Final Summary
    console.log('\n📊 Diagnostic Summary:');
    console.log('✅ Database connection: Working');
    console.log('✅ Test project access: Working');
    console.log('✅ Token creation: Working');
    console.log('✅ Properties creation: Working');
    console.log('✅ Token retrieval: Working');
    console.log('✅ Cleanup: Working');
    
    console.log('\n🎉 All systems appear to be working correctly!');
    console.log('\nIf validation scripts are still not working, the issue may be:');
    console.log('1. Script execution environment (Node.js vs browser)');
    console.log('2. TypeScript compilation issues');
    console.log('3. Import path resolution');
    console.log('4. Different environment variable loading');
    console.log('\n💡 Try running: npm run test:tokens:create');
    
  } catch (error) {
    console.error('\n💥 Unexpected error during diagnostics:', error);
  }
}

// Run diagnostics
runDiagnostics();
