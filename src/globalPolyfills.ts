/**
 * Global Polyfills Setup
 * Must be imported first, before any other modules that depend on Node.js globals
 */
import { sha512 } from '@noble/hashes/sha512';
import { ed25519 } from '@noble/curves/ed25519';

if (!(ed25519.utils as any).sha512Sync) {
  (ed25519.utils as any).sha512Sync = sha512;
  console.log('[✅] ed25519.utils.sha512Sync has been set in globalPolyfills');
} else {
  console.log('[🟡] ed25519.utils.sha512Sync was already set');
}

import { Buffer } from 'buffer';

// Ensure process is available early
if (typeof globalThis.process === 'undefined') {
  globalThis.process = {
    env: typeof process !== 'undefined' ? process.env : {},
    nextTick: (fn: Function, ...args: any[]) => setTimeout(() => fn(...args), 0),
    version: '16.0.0',
    platform: 'browser',
    browser: true,
    argv: [],
    cwd: () => '/',
    versions: {
      node: '16.0.0'
    }
  } as any;
}

// Ensure global is available early
if (typeof globalThis.global === 'undefined') {
  globalThis.global = globalThis;
}

// Set Buffer with additional safety checks
if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer;
}

// Ensure window globals for browser
if (typeof window !== 'undefined') {
  // Set Buffer on window immediately
  (window as any).Buffer = Buffer;
  (window as any).global = globalThis;
  
  // Set up process on window
  if (!(window as any).process) {
    (window as any).process = globalThis.process;
  }
}

// Additional crypto-browserify compatibility
if (typeof globalThis !== 'undefined') {
  // Ensure Buffer is always the imported one
  (globalThis as any).Buffer = Buffer;
  (globalThis as any).global = globalThis;
}

// Ensure setImmediate is available
if (typeof globalThis.setImmediate === 'undefined') {
  (globalThis as any).setImmediate = (fn: Function, ...args: any[]) => {
    return setTimeout(() => fn(...args), 0);
  };
  (globalThis as any).clearImmediate = (id: any) => clearTimeout(id);
}

// Ensure crypto compatibility
if (typeof globalThis.crypto === 'undefined' && typeof window !== 'undefined' && window.crypto) {
  globalThis.crypto = window.crypto;
}

// Log successful initialization in development
if (typeof window !== 'undefined' && typeof console !== 'undefined') {
  console.debug('Global polyfills initialized');
  console.debug('Buffer available:', typeof globalThis.Buffer !== 'undefined');
  console.debug('Buffer.slice available:', typeof globalThis.Buffer?.prototype?.slice === 'function');
}

export {};
