// Test XRPL seed generation to verify base58 compatibility

import * as xrpl from 'xrpl';

console.log('Testing XRPL wallet generation...');

try {
  // Test proper XRPL wallet generation
  const wallet1 = xrpl.Wallet.generate();
  console.log('✅ Generated wallet 1:', wallet1.address);
  console.log('✅ Seed 1:', wallet1.seed);

  // Test creating wallet from generated seed
  const wallet2 = xrpl.Wallet.fromSeed(wallet1.seed);
  console.log('✅ Created wallet 2 from seed:', wallet2.address);
  
  // Test that addresses match
  if (wallet1.address === wallet2.address) {
    console.log('✅ Address consistency verified');
  } else {
    console.log('❌ Address mismatch!');
  }

  // Test base58 character validation
  const validBase58Chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const seed = wallet1.seed;
  
  let hasInvalidChars = false;
  for (let i = 0; i < seed.length; i++) {
    const char = seed[i];
    if (!validBase58Chars.includes(char) && char !== 's') { // 's' prefix is allowed
      console.log(`❌ Invalid character found: '${char}' at position ${i}`);
      hasInvalidChars = true;
    }
  }
  
  if (!hasInvalidChars) {
    console.log('✅ All characters in seed are base58 compatible');
  }

} catch (error) {
  console.log('❌ Error testing XRPL:', error.message);
}
