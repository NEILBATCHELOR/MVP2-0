/**
 * Reown AppKit Configuration - Multi-Wallet Support
 * 
 * This file sets up the Wagmi adapter and configuration for Reown AppKit
 * with comprehensive wallet support including MetaMask, Coinbase, WalletConnect, and more
 * Following the documentation at https://docs.reown.com/appkit/react/core/installation
 */

import { cookieStorage, createStorage } from 'wagmi'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { 
  mainnet, 
  arbitrum, 
  base, 
  polygon, 
  optimism,
  sepolia,
  arbitrumSepolia,
  baseSepolia,
  polygonAmoy
} from '@reown/appkit/networks'
import type { Chain } from 'viem'

// Read Project ID from environment variables
export const projectId = import.meta.env.VITE_PUBLIC_PROJECT_ID

// Ensure Project ID is defined at build time
if (!projectId) {
  throw new Error('VITE_PUBLIC_PROJECT_ID is not defined. Please set it in .env.local')
}

// Define supported networks with both mainnet and testnet options
export const networks: [Chain, ...Chain[]] = [
  // Mainnets
  mainnet, 
  arbitrum, 
  base, 
  polygon, 
  optimism,
  // Testnets (useful for development)
  sepolia,
  arbitrumSepolia,
  baseSepolia,
  polygonAmoy
]

// Enhanced Wagmi adapter configuration with multi-wallet support
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({ storage: cookieStorage }), // Use cookieStorage for SSR
  ssr: true, // Enable SSR support
  projectId,
  networks, // Pass the explicitly typed networks array
  // Note: metadata is configured in AppKitProvider, not here
})

// Export the Wagmi config generated by the adapter
export const config = wagmiAdapter.wagmiConfig

// Supported wallet types for reference
export const SUPPORTED_WALLETS = {
  // Browser extension wallets
  METAMASK: 'MetaMask',
  COINBASE: 'Coinbase Wallet',
  RABBY: 'Rabby Wallet',
  BRAVE: 'Brave Wallet',
  OPERA: 'Opera Wallet',
  
  // WalletConnect compatible wallets (mobile & desktop)
  TRUST_WALLET: 'Trust Wallet',
  RAINBOW: 'Rainbow',
  ARGENT: 'Argent',
  IMTOKEN: 'imToken',
  LEDGER_LIVE: 'Ledger Live',
  ZERION: 'Zerion',
  UNISWAP: 'Uniswap Wallet',
  SAFE: 'Safe Wallet',
  
  // Hardware wallets
  LEDGER: 'Ledger',
  TREZOR: 'Trezor',
  
  // Social & Email logins
  GOOGLE: 'Google',
  GITHUB: 'GitHub',
  DISCORD: 'Discord',
  EMAIL: 'Email',
} as const

// Wallet categories for UI organization
export const WALLET_CATEGORIES = {
  BROWSER: 'Browser Extensions',
  MOBILE: 'Mobile Wallets',
  HARDWARE: 'Hardware Wallets',
  SOCIAL: 'Social Logins',
  WALLETCONNECT: 'WalletConnect',
} as const

// Default export for compatibility
export default {
  projectId,
  networks,
  wagmiAdapter,
  config,
  SUPPORTED_WALLETS,
  WALLET_CATEGORIES
}
