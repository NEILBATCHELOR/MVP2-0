import { sha512 } from '@noble/hashes/sha512';
import { ed25519 } from '@noble/curves/ed25519';

console.log('[🔍] Guardian Crypto Init: Patching ed25519.utils.sha512Sync…');
console.log('[🔎] Before:', typeof (ed25519.utils as any).sha512Sync);

try {
  // Set the SHA-512 implementation required by noble/ed25519
  // Some versions of the library have readonly properties, so we need to use Object.defineProperty
  if (ed25519.utils && typeof (ed25519.utils as any).sha512Sync === 'undefined') {
    Object.defineProperty(ed25519.utils, 'sha512Sync', {
      value: sha512,
      writable: true,
      configurable: true
    });
    console.log('[✅] Patched ed25519.utils.sha512Sync successfully using defineProperty.');
  } else if (ed25519.utils) {
    // Try direct assignment
    (ed25519.utils as any).sha512Sync = sha512;
    console.log('[✅] Patched ed25519.utils.sha512Sync successfully using direct assignment.');
  } else {
    console.warn('[⚠️] ed25519.utils not available for patching.');
  }
} catch (error) {
  console.error('[❌] Failed to patch sha512Sync:', error);
  // Continue execution even if patching fails
}

console.log('[🔎] After:', typeof (ed25519.utils as any).sha512Sync);

// Export to prevent tree-shaking
export const cryptoInitialized = true;