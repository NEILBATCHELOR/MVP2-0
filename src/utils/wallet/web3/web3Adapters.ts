/**
 * Web3 Adapters
 * 
 * This file contains adapter functions that convert between our application models
 * and the models used by web3 libraries like ethers.js and our WalletManager.
 */

import { 
  Wallet as CentralWallet,
  Transaction as CentralTransaction,
  MultiSigTransaction,
  WalletType,
  TokenType
} from '@/types/core/centralModels';

// Import types from our WalletManager
import { 
  WalletEntity as WalletManagerWallet,
  Transaction as WalletManagerTransaction,
  WalletType as WalletManagerWalletType
} from '@/services/wallet/WalletManager';

/**
 * Converts a wallet from WalletManager format to our centralModels format
 */
export function walletManagerToCentralWallet(wallet: WalletManagerWallet): CentralWallet {
  // Map wallet type
  let walletType: WalletType;
  switch(wallet.type) {
    case WalletManagerWalletType.EOA:
      walletType = WalletType.EOA;
      break;
    case WalletManagerWalletType.MULTISIG:
      walletType = WalletType.MULTISIG;
      break;
    case WalletManagerWalletType.SMART:
      walletType = WalletType.SMART;
      break;
    default:
      walletType = WalletType.INDIVIDUAL;
  }

  return {
    id: wallet.id || "",
    name: wallet.name,
    type: walletType,
    address: wallet.address,
    contractAddress: wallet.contractAddress,
    userId: wallet.userId,
    signers: wallet.signers,
    requiredConfirmations: wallet.requiredConfirmations,
    blockchain: "ethereum", // Default value
    chainId: wallet.chainId,
    isDefault: wallet.isDefault,
    encryptedPrivateKey: wallet.encryptedPrivateKey,
    createdAt: wallet.createdAt || new Date().toISOString(),
    updatedAt: undefined
  };
}

/**
 * Converts a wallet from our centralModels format to WalletManager format
 */
export function centralToWalletManagerWallet(wallet: CentralWallet): WalletManagerWallet {
  // Map wallet type
  let walletType: WalletManagerWalletType;
  switch(wallet.type) {
    case WalletType.EOA:
      walletType = WalletManagerWalletType.EOA;
      break;
    case WalletType.MULTISIG:
      walletType = WalletManagerWalletType.MULTISIG;
      break;
    case WalletType.SMART:
      walletType = WalletManagerWalletType.SMART;
      break;
    default:
      walletType = WalletManagerWalletType.EOA;
  }

  return {
    id: wallet.id,
    address: wallet.address,
    type: walletType,
    name: wallet.name,
    chainId: wallet.chainId || 1, // Default to Ethereum mainnet
    isDefault: wallet.isDefault,
    createdAt: wallet.createdAt,
    userId: wallet.userId,
    encryptedPrivateKey: wallet.encryptedPrivateKey,
    contractAddress: wallet.contractAddress,
    signers: wallet.signers,
    requiredConfirmations: wallet.requiredConfirmations
  };
}

/**
 * Converts a transaction from WalletManager format to our centralModels format
 */
export function walletManagerToCentralTransaction(
  tx: WalletManagerTransaction, 
  isMultiSig = false
): CentralTransaction | MultiSigTransaction {
  const baseTx: CentralTransaction = {
    id: tx.id || "",
    walletId: "", // This field needs to be filled by the caller
    to: tx.to,
    value: tx.value,
    data: tx.data,
    nonce: tx.nonce,
    description: tx.description,
    status: tx.status || "pending",
    txHash: tx.hash,
    blockNumber: tx.blockNumber,
    gasLimit: tx.gasLimit,
    gasPrice: tx.gasPrice,
    chainId: tx.chainId,
    from: tx.from,
    hash: tx.hash,
    timestamp: tx.timestamp,
    createdAt: new Date().toISOString(),
  };

  if (isMultiSig) {
    // Add MultiSig specific fields with defaults
    return {
      ...baseTx,
      confirmations: 0,
      required: 0,
      executed: false,
      createdBy: undefined
    } as MultiSigTransaction;
  }

  return baseTx;
}

/**
 * Converts a transaction from our centralModels format to WalletManager format
 */
export function centralToWalletManagerTransaction(tx: CentralTransaction | MultiSigTransaction): WalletManagerTransaction {
  return {
    id: tx.id,
    from: tx.from || "",
    to: tx.to,
    value: tx.value,
    data: tx.data,
    gasLimit: tx.gasLimit,
    gasPrice: tx.gasPrice,
    nonce: tx.nonce,
    chainId: tx.chainId || 1,
    hash: tx.hash || tx.txHash,
    status: tx.status as "pending" | "confirmed" | "failed",
    timestamp: tx.timestamp,
    blockNumber: tx.blockNumber,
    description: tx.description
  };
}

/**
 * Maps TokenType enums between different sources
 */
export function mapTokenType(tokenType: string): TokenType {
  const normalizedType = tokenType.toLowerCase();
  
  if (normalizedType.includes('erc20')) return TokenType.ERC20;
  if (normalizedType.includes('erc721')) return TokenType.ERC721;
  if (normalizedType.includes('erc1155')) return TokenType.ERC1155;
  return TokenType.NATIVE;
} 