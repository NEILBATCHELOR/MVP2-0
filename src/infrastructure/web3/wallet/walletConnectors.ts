/**
 * Wallet Connectors - Multi-Wallet Connection Support
 * 
 * This file provides wallet connector configurations for various wallet types
 * supporting MetaMask, Coinbase, WalletConnect, and hardware wallets
 */

import { createConfig, http } from 'wagmi'
import { mainnet, sepolia, polygon, arbitrum, base, optimism, polygonAmoy } from 'wagmi/chains'
import { metaMask, coinbaseWallet, walletConnect, injected } from 'wagmi/connectors'
import type { CreateConfigParameters, CreateConnectorFn } from 'wagmi'

// Re-export from appkit config for consistency
export { projectId } from '@/infrastructure/web3/appkit/config'

// Environment variable for WalletConnect project ID
const WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_PUBLIC_PROJECT_ID || 'your-project-id'

// Environment-aware URL for development vs production
const APP_URL = import.meta.env.DEV 
  ? (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173') 
  : 'https://chaincapital.com'

/**
 * MetaMask connector configuration
 */
export const metaMaskConnector = metaMask({
  dappMetadata: {
    name: 'Chain Capital',
    url: APP_URL,
  },
  // Add more MetaMask-specific options if needed
})

/**
 * Coinbase Wallet connector configuration
 */
export const coinbaseConnector = coinbaseWallet({
  appName: 'Chain Capital',
  appLogoUrl: 'https://chaincapital.com/favicon.ico',
  preference: 'smartWalletOnly', // Use Coinbase Smart Wallet by default
})

/**
 * WalletConnect connector configuration
 */
export const walletConnectConnector = walletConnect({
  projectId: WALLETCONNECT_PROJECT_ID,
  metadata: {
    name: 'Chain Capital',
    description: 'Institutional Digital Asset Platform',
    url: APP_URL,
    icons: ['https://chaincapital.com/favicon.ico'],
  },
  showQrModal: true,
})

/**
 * Injected connector for other browser wallets
 */
export const injectedConnector = injected({
  shimDisconnect: true,
})

/**
 * Safe connector configuration for multi-sig wallets
 */
export const safeWalletConnect = (): ReturnType<typeof walletConnect> => {
  return walletConnect({
    projectId: WALLETCONNECT_PROJECT_ID,
    metadata: {
      name: 'Chain Capital Safe',
      description: 'Chain Capital Multi-Signature Wallet',
      url: APP_URL,
      icons: ['https://chaincapital.com/favicon.ico'],
    },
    showQrModal: true,
  })
}

/**
 * All supported connectors
 */
export const connectors: CreateConnectorFn[] = [
  metaMaskConnector,
  coinbaseConnector,
  walletConnectConnector,
  injectedConnector,
]

/**
 * Supported chains configuration
 */
export const supportedChains = [
  mainnet,
  sepolia,
  polygon,
  polygonAmoy,
  arbitrum,
  base,
  optimism,
] as const

/**
 * RPC transports configuration
 */
export const transports = {
  [mainnet.id]: http(),
  [sepolia.id]: http(),
  [polygon.id]: http(),
  [polygonAmoy.id]: http(),
  [arbitrum.id]: http(),
  [base.id]: http(),
  [optimism.id]: http(),
}

/**
 * Create Wagmi configuration with all connectors
 */
export const createWalletConfig = (): ReturnType<typeof createConfig> => {
  return createConfig({
    chains: supportedChains,
    connectors,
    transports,
    ssr: false, // Set to true if using SSR
  })
}

/**
 * Default wallet configuration
 */
export const walletConfig = createWalletConfig()

/**
 * Wallet connector types for TypeScript
 */
export type WalletConnector = 
  | typeof metaMaskConnector
  | typeof coinbaseConnector
  | typeof walletConnectConnector
  | typeof injectedConnector
  | ReturnType<typeof safeWalletConnect>

export type SupportedChain = typeof supportedChains[number]

/**
 * Wallet connection utilities
 */
export const walletUtils = {
  /**
   * Check if MetaMask is installed
   */
  isMetaMaskInstalled: (): boolean => {
    return typeof window !== 'undefined' && Boolean(window.ethereum?.isMetaMask)
  },

  /**
   * Check if Coinbase Wallet is installed
   */
  isCoinbaseInstalled: (): boolean => {
    return typeof window !== 'undefined' && Boolean(window.ethereum?.isCoinbaseWallet)
  },

  /**
   * Get available wallet options
   */
  getAvailableWallets: () => {
    const wallets = []
    
    if (walletUtils.isMetaMaskInstalled()) {
      wallets.push('MetaMask')
    }
    
    if (walletUtils.isCoinbaseInstalled()) {
      wallets.push('Coinbase')
    }
    
    // WalletConnect is always available
    wallets.push('WalletConnect')
    
    return wallets
  },

  /**
   * Get connector by name
   */
  getConnectorByName: (name: string): WalletConnector | undefined => {
    switch (name.toLowerCase()) {
      case 'metamask':
        return metaMaskConnector
      case 'coinbase':
        return coinbaseConnector
      case 'walletconnect':
        return walletConnectConnector
      case 'injected':
        return injectedConnector
      case 'safe':
        return safeWalletConnect()
      default:
        return undefined
    }
  }
}

/**
 * Wallet metadata for UI display
 */
export const walletMetadata = {
  metamask: {
    name: 'MetaMask',
    icon: '/wallets/metamask.svg',
    description: 'Connect using MetaMask browser extension',
    installUrl: 'https://metamask.io/download/',
  },
  coinbase: {
    name: 'Coinbase Wallet',
    icon: '/wallets/coinbase.svg',
    description: 'Connect using Coinbase Wallet',
    installUrl: 'https://www.coinbase.com/wallet',
  },
  walletconnect: {
    name: 'WalletConnect',
    icon: '/wallets/walletconnect.svg',
    description: 'Scan with WalletConnect to connect',
    installUrl: 'https://walletconnect.com/',
  },
  safe: {
    name: 'Safe Wallet',
    icon: '/wallets/safe.svg',
    description: 'Connect using Safe multi-signature wallet',
    installUrl: 'https://safe.global/',
  },
} as const

export default walletConfig
