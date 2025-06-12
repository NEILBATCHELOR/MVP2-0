#!/usr/bin/env tsx

/**
 * 🎯 TEST: GET /api/v1/wallets/{walletId} endpoint
 * Test the new wallet details endpoint with correct signature
 */

import * as dotenv from 'dotenv';
import * as ed25519 from '@noble/ed25519';

dotenv.config({ path: '.env.guardian' });

const GUARDIAN_PRIVATE_KEY = process.env.GUARDIAN_PRIVATE_KEY!;
const GUARDIAN_API_KEY = process.env.GUARDIAN_API_KEY!;
const BASE_URL = 'https://api.medex.guardian-dev.com';

console.log('🎯 TEST: GET /api/v1/wallets/{walletId}');
console.log('='.repeat(40));

// Setup crypto
const crypto = await import('crypto');
ed25519.etc.sha512Sync = (...messages) => {
  const hash = crypto.createHash('sha512');
  for (const message of messages) {
    hash.update(message);
  }
  return new Uint8Array(hash.digest());
};

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function createAuthHeaders(method: string, url: string, bodyObj?: any) {
  const timestamp = Date.now();
  const nonce = generateUUID();
  
  let bodyString = '';
  
  if (method.toUpperCase() === 'GET') {
    bodyString = '{}'; // Empty object for GET requests
  } else if (bodyObj) {
    bodyString = JSON.stringify(bodyObj);
  }
  
  const payload = `${method.toUpperCase()}${url}${bodyString}${timestamp}${nonce}`;
  
  const privateKeyBytes = Buffer.from(GUARDIAN_PRIVATE_KEY, 'hex');
  const payloadBytes = Buffer.from(payload, 'utf8');
  const signature = ed25519.sign(payloadBytes, privateKeyBytes);
  const signatureBase64 = Buffer.from(signature).toString('base64');
  
  const headers = {
    'x-api-key': GUARDIAN_API_KEY,
    'x-api-signature': signatureBase64,
    'x-api-timestamp': timestamp.toString(),
    'x-api-nonce': nonce,
    'Accept': 'application/json'
  };
  
  if (method.toUpperCase() === 'POST') {
    headers['Content-Type'] = 'application/json';
  }
  
  return headers;
}

async function testWalletDetailsEndpoint() {
  console.log('\n📋 Step 1: Create wallet to get a valid wallet ID...');
  
  // First create a wallet
  const createUrl = `${BASE_URL}/api/v1/wallets/create`;
  const walletData = { id: generateUUID() };
  
  try {
    const createHeaders = createAuthHeaders('POST', createUrl, walletData);
    const bodyString = JSON.stringify(walletData);
    
    console.log(`   🆔 Creating wallet: ${walletData.id}`);
    
    const createResponse = await fetch(createUrl, {
      method: 'POST',
      headers: createHeaders,
      body: bodyString
    });
    
    console.log(`   📥 Create response: ${createResponse.status} ${createResponse.statusText}`);
    
    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.log(`   ❌ Create failed: ${errorText}`);
      return;
    }
    
    const createResult = await createResponse.json();
    console.log(`   ✅ Wallet creation initiated!`);
    console.log(`   🆔 Operation ID: ${createResult.operationId}`);
    
    // Wait for wallet creation to complete
    console.log('\n📋 Step 2: Wait for wallet creation to complete...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check operation status to get wallet ID
    const operationUrl = `${BASE_URL}/api/v1/operations/${createResult.operationId}`;
    const opHeaders = createAuthHeaders('GET', operationUrl);
    
    console.log('   🔍 Checking operation status...');
    const opResponse = await fetch(operationUrl, {
      method: 'GET',
      headers: opHeaders
    });
    
    console.log(`   📥 Operation response: ${opResponse.status} ${opResponse.statusText}`);
    
    if (opResponse.ok) {
      const opResult = await opResponse.json();
      console.log(`   📊 Operation status: ${opResult.status}`);
      
      if (opResult.status === 'processed' && opResult.result && opResult.result.id) {
        const guardianWalletId = opResult.result.id;
        console.log(`   ✅ Guardian wallet ID: ${guardianWalletId}`);
        
        // Step 3: Test GET /api/v1/wallets/{walletId}
        console.log('\n📋 Step 3: Test GET /api/v1/wallets/{walletId}...');
        
        const walletDetailsUrl = `${BASE_URL}/api/v1/wallets/${guardianWalletId}`;
        const walletHeaders = createAuthHeaders('GET', walletDetailsUrl);
        
        console.log(`   🔍 Getting wallet details for: ${guardianWalletId}`);
        
        const walletResponse = await fetch(walletDetailsUrl, {
          method: 'GET',
          headers: walletHeaders
        });
        
        console.log(`   📥 Wallet details response: ${walletResponse.status} ${walletResponse.statusText}`);
        
        if (walletResponse.ok) {
          const walletDetails = await walletResponse.json();
          console.log(`   🎉 SUCCESS! GET /api/v1/wallets/{walletId} working!`);
          console.log(`   📄 Wallet details: ${JSON.stringify(walletDetails, null, 2)}`);
          
          console.log('\n🎉 GET WALLET ENDPOINT WORKING PERFECTLY!');
          console.log('='.repeat(45));
          console.log('   ✅ POST /api/v1/wallets/create: Working');
          console.log('   ✅ GET /api/v1/operations/{id}: Working');
          console.log('   ✅ GET /api/v1/wallets/{id}: Working');
          console.log('   ✅ All Guardian endpoints functional!');
          
        } else {
          const walletError = await walletResponse.text();
          console.log(`   ❌ Wallet details failed: ${walletError}`);
        }
        
      } else {
        console.log(`   ⏳ Wallet still processing: ${opResult.status}`);
        console.log('   💡 Try running the test again in a few moments');
      }
    } else {
      const opError = await opResponse.text();
      console.log(`   ❌ Operation check failed: ${opError}`);
    }
    
  } catch (error) {
    console.error(`💥 Error: ${error.message}`);
  }
}

console.log('\n🚀 Testing GET /api/v1/wallets/{walletId} endpoint...\n');
testWalletDetailsEndpoint().catch(console.error);