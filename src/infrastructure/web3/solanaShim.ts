/**
 * Solana Web3.js Shim
 * 
 * This file provides a compatibility layer for Solana Web3.js imports
 * to ensure consistent imports across the application.
 */

// Re-export everything from @solana/web3.js
export * from '@solana/web3.js';

// Specific value re-exports (classes, objects, constants)
export {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Message,
  TransactionInstruction,
  VersionedTransaction
} from '@solana/web3.js';

// Type-only re-exports
export type {
  Commitment,
  Finality,
  TransactionResponse,
  TransactionSignature,
  ConfirmedSignatureInfo,
  ParsedTransactionWithMeta,
  SendOptions,
  SimulatedTransactionResponse,
  RpcResponseAndContext,
  SignatureStatus,
  BlockhashWithExpiryBlockHeight,
  GetVersionedTransactionConfig,
  RecentPrioritizationFees
} from '@solana/web3.js';
