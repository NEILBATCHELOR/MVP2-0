/**
 * Crypto Polyfills for Web3 compatibility
 * Specifically addresses crypto-browserify and readable-stream Buffer issues
 */

import { Buffer } from 'buffer';

// Ensure Buffer is available before any crypto modules load
if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer;
}

// Ensure Buffer methods are properly available
if (typeof globalThis.Buffer.prototype.slice !== 'function') {
  console.warn('Buffer.slice not available, patching...');
  globalThis.Buffer.prototype.slice = function(start?: number, end?: number) {
    return Buffer.from(Array.prototype.slice.call(this, start, end));
  };
}

// Patch for browserify modules that might not recognize Buffer correctly
if (typeof window !== 'undefined') {
  (window as any).Buffer = globalThis.Buffer;
  
  // Ensure crypto-browserify can find Buffer
  if (!(window as any).global) {
    (window as any).global = globalThis;
  }
}

// Ensure process is available for crypto modules
if (typeof globalThis.process === 'undefined') {
  globalThis.process = {
    env: {},
    nextTick: (fn: Function, ...args: any[]) => setTimeout(() => fn(...args), 0),
    browser: true,
    version: '16.0.0',
    platform: 'browser',
    argv: [],
    cwd: () => '/',
    versions: { node: '16.0.0' }
  } as any;
}

// Crypto module compatibility
if (typeof globalThis.crypto === 'undefined' && typeof window !== 'undefined' && window.crypto) {
  globalThis.crypto = window.crypto;
}

// Console debugging for crypto initialization
console.debug('Crypto polyfills initialized');
console.debug('Buffer available:', typeof globalThis.Buffer !== 'undefined');
console.debug('Buffer.isBuffer available:', typeof globalThis.Buffer?.isBuffer === 'function');
console.debug('Buffer.prototype.slice available:', typeof globalThis.Buffer?.prototype?.slice === 'function');

export {};
