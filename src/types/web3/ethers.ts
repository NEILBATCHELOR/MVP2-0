/**
 * Type definitions for ethers.js v6 compatibility
 * These type definitions help bridge compatibility gaps between different ethers.js versions
 * and external libraries that depend on specific versions.
 */
import * as ethers from 'ethers';

// Type for combining JsonRpcSigner compatibility across versions
export type CompatibleJsonRpcSigner = ethers.JsonRpcSigner;

// Type for combining Wallet compatibility across versions
export type CompatibleWallet = ethers.Wallet | ethers.HDNodeWallet;

// Type for combining Provider compatibility across versions
export type CompatibleProvider = ethers.Provider | ethers.JsonRpcProvider | ethers.BrowserProvider;

// Type for combining Signer compatibility across versions
export type CompatibleSigner = ethers.Signer | ethers.Wallet | ethers.JsonRpcSigner;

// Helper function to check if wallet is HDNodeWallet
export function isHDNodeWallet(wallet: ethers.Wallet | ethers.HDNodeWallet): wallet is ethers.HDNodeWallet {
  return 'mnemonic' in wallet && wallet.mnemonic !== null;
}

// Helper function to get public key from wallet (works with ethers v6)
export function getPublicKey(wallet: ethers.Wallet | ethers.HDNodeWallet): string {
  // In ethers v6, publicKey is no longer directly accessible
  // Instead, we need to derive it from the private key
  return wallet.signingKey.publicKey;
}

// Helper function to ensure TransactionResponse compatibility
export function normalizeTransactionResponse(tx: ethers.TransactionResponse): ethers.TransactionResponse {
  return tx;
}

// Helper functions for BigNumber/bigint compatibility
export function divBigInt(value: bigint, divisor: bigint): bigint {
  return value / divisor;
}
