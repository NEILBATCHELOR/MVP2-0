/**
 * Web3 configuration settings
 * 
 * This file contains environment-specific configuration for Web3 connections
 */

// WalletConnect project ID from environment
export const WALLET_CONNECT_PROJECT_ID = import.meta.env.VITE_PUBLIC_PROJECT_ID || 'e19ed9752e18e9d65fb885a9cd419aad';

// Optional Infura project ID (not used in current config, but maintained for compatibility)
export const INFURA_PROJECT_ID = import.meta.env.VITE_INFURA_PROJECT_ID || '';

// Alchemy API key from environment (used for most EVM chains)
export const ALCHEMY_API_KEY = import.meta.env.VITE_ALCHEMY_API_KEY || 'Z3UXs7SblJNf-xGhHBc63iDRi9xqWCYP';

// QuickNode API key from environment (used for some non-EVM chains)
export const QUICKNODE_API_KEY = import.meta.env.VITE_QUICKNODE_API_KEY || '5dc455368b6e13a2f7885bd651641ef622fe2151';

// Application metadata for wallet connections
export const APP_METADATA = {
  name: 'Chain Capital',
  description: 'Chain Capital Tokenization Platform',
  url: 'https://chaincapital.com',
  icons: ['https://chaincapital.com/logo.png']
};

// Import RPC_CONFIG, but do this at the end of the file to avoid circular dependencies
// RPC_CONFIG will be imported by other files that need it, directly from rpc-config.ts
import { RPC_CONFIG } from './rpc-config';
export const RPC_ENDPOINTS = RPC_CONFIG;