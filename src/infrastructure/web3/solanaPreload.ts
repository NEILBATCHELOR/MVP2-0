/**
 * Solana Environment Preloader
 * 
 * This file initializes the Solana environment and must be imported
 * before any other Solana modules to ensure proper initialization.
 * 
 * Key responsibilities:
 * - Set up Buffer polyfill for browser compatibility
 * - Initialize crypto utilities for Solana operations
 * - Configure environment variables for Solana endpoints
 */

// Ensure Buffer is available globally for Solana Web3.js
if (typeof window !== 'undefined' && !window.Buffer) {
  window.Buffer = Buffer;
}

// Ensure global is available for Solana compatibility
if (typeof window !== 'undefined' && !window.global) {
  window.global = window as any;
}

// Initialize crypto for Ed25519 operations (used by Solana)
if (typeof window !== 'undefined' && !window.crypto?.subtle) {
  console.warn('WebCrypto API not available - some Solana operations may not work');
}

// Set up process.env for Solana modules that expect Node.js environment
if (typeof window !== 'undefined' && !window.process) {
  window.process = {
    env: {
      NODE_ENV: import.meta.env.MODE,
      VITE_SOLANA_RPC_URL: import.meta.env.VITE_SOLANA_RPC_URL,
      VITE_SOLANA_DEVNET_URL: import.meta.env.VITE_SOLANA_DEVNET_URL,
      VITE_SOLANA_TESTNET_URL: import.meta.env.VITE_SOLANA_TESTNET_URL,
      ...import.meta.env
    }
  } as any;
}

// Solana environment configuration
export const SOLANA_CONFIG = {
  // Default to devnet for development
  defaultEndpoint: import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  commitment: 'confirmed' as const,
  preflightCommitment: 'confirmed' as const
};

// Export flag to indicate Solana environment is ready
export const SOLANA_PRELOAD_COMPLETE = true;

console.log('✓ Solana environment preloaded successfully');
