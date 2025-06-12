/**
 * Wallet Detector - Detect Available Browser Wallets
 * 
 * This utility detects which wallet extensions are installed in the user's browser
 * and provides information about available wallet options
 */

import { getEthereumProvider, type EthereumProvider } from '@/types/domain/blockchain/ethereum';

export interface WalletInfo {
  name: string
  id: string
  icon?: string
  installed: boolean
  download?: string
  description: string
  connector?: string
}

export interface DetectedWallet extends WalletInfo {
  provider?: any
  version?: string
  isConnected?: boolean
}

/**
 * Extended Ethereum provider interface for wallet detection
 */
interface ExtendedEthereumProvider extends EthereumProvider {
  isMetaMask?: boolean
  isCoinbaseWallet?: boolean
  isTrust?: boolean
  isBraveWallet?: boolean
  isRabby?: boolean
  isFrame?: boolean
  isExodus?: boolean
  providers?: ExtendedEthereumProvider[]
}

/**
 * Known wallet configurations
 */
export const WALLET_CONFIGS: Record<string, Omit<WalletInfo, 'installed'>> = {
  metamask: {
    name: 'MetaMask',
    id: 'metamask',
    icon: '/wallets/metamask.svg',
    download: 'https://metamask.io/download/',
    description: 'A crypto wallet & gateway to blockchain apps',
    connector: 'metaMask'
  },
  coinbase: {
    name: 'Coinbase Wallet',
    id: 'coinbase',
    icon: '/wallets/coinbase.svg',
    download: 'https://www.coinbase.com/wallet',
    description: 'Your key to the open internet',
    connector: 'coinbaseWallet'
  },
  trust: {
    name: 'Trust Wallet',
    id: 'trust',
    icon: '/wallets/trust.svg',
    download: 'https://trustwallet.com/',
    description: 'The most trusted & secure crypto wallet',
    connector: 'walletConnect'
  },
  brave: {
    name: 'Brave Wallet',
    id: 'brave',
    icon: '/wallets/brave.svg',
    download: 'https://brave.com/wallet/',
    description: 'Built into the Brave browser',
    connector: 'injected'
  },
  rabby: {
    name: 'Rabby Wallet',
    id: 'rabby',
    icon: '/wallets/rabby.svg',
    download: 'https://rabby.io/',
    description: 'The game-changing wallet for Ethereum and all EVM chains',
    connector: 'injected'
  },
  frame: {
    name: 'Frame',
    id: 'frame',
    icon: '/wallets/frame.svg',
    download: 'https://frame.sh/',
    description: 'A privacy focused Ethereum wallet',
    connector: 'injected'
  },
  exodus: {
    name: 'Exodus',
    id: 'exodus',
    icon: '/wallets/exodus.svg',
    download: 'https://www.exodus.com/',
    description: 'Secure, manage, and exchange blockchain assets',
    connector: 'injected'
  },
  walletconnect: {
    name: 'WalletConnect',
    id: 'walletconnect',
    icon: '/wallets/walletconnect.svg',
    download: 'https://walletconnect.com/',
    description: 'Connect to mobile wallets and hardware wallets',
    connector: 'walletConnect'
  }
}

/**
 * Detect if a specific wallet is installed
 */
export const detectWallet = {
  /**
   * Check if MetaMask is installed
   */
  isMetaMaskInstalled(): boolean {
    const ethereum = getEthereumProvider() as ExtendedEthereumProvider
    if (!ethereum) return false
    
    // Check if MetaMask is the only provider
    if (ethereum.isMetaMask && !ethereum.providers) return true
    
    // Check if MetaMask is among multiple providers
    if (ethereum.providers) {
      return ethereum.providers.some((provider: ExtendedEthereumProvider) => provider.isMetaMask)
    }
    
    return false
  },

  /**
   * Check if Coinbase Wallet is installed
   */
  isCoinbaseWalletInstalled(): boolean {
    const ethereum = getEthereumProvider() as ExtendedEthereumProvider
    if (!ethereum) return false
    
    // Check if Coinbase is the only provider
    if (ethereum.isCoinbaseWallet && !ethereum.providers) return true
    
    // Check if Coinbase is among multiple providers
    if (ethereum.providers) {
      return ethereum.providers.some((provider: ExtendedEthereumProvider) => provider.isCoinbaseWallet)
    }
    
    return false
  },

  /**
   * Check if Trust Wallet is installed
   */
  isTrustWalletInstalled(): boolean {
    const ethereum = getEthereumProvider() as ExtendedEthereumProvider
    if (!ethereum) return false
    
    // Check if Trust is the only provider
    if (ethereum.isTrust && !ethereum.providers) return true
    
    // Check if Trust is among multiple providers
    if (ethereum.providers) {
      return ethereum.providers.some((provider: ExtendedEthereumProvider) => provider.isTrust)
    }
    
    return false
  },

  /**
   * Check if Brave Wallet is installed
   */
  isBraveWalletInstalled(): boolean {
    const ethereum = getEthereumProvider() as ExtendedEthereumProvider
    if (!ethereum) return false
    
    // Check if Brave is the only provider
    if (ethereum.isBraveWallet && !ethereum.providers) return true
    
    // Check if Brave is among multiple providers
    if (ethereum.providers) {
      return ethereum.providers.some((provider: ExtendedEthereumProvider) => provider.isBraveWallet)
    }
    
    return false
  },

  /**
   * Check if Rabby Wallet is installed
   */
  isRabbyInstalled(): boolean {
    const ethereum = getEthereumProvider() as ExtendedEthereumProvider
    if (!ethereum) return false
    
    // Check if Rabby is the only provider
    if (ethereum.isRabby && !ethereum.providers) return true
    
    // Check if Rabby is among multiple providers
    if (ethereum.providers) {
      return ethereum.providers.some((provider: ExtendedEthereumProvider) => provider.isRabby)
    }
    
    return false
  },

  /**
   * Check if Frame is installed
   */
  isFrameInstalled(): boolean {
    const ethereum = getEthereumProvider() as ExtendedEthereumProvider
    if (!ethereum) return false
    
    // Check if Frame is the only provider
    if (ethereum.isFrame && !ethereum.providers) return true
    
    // Check if Frame is among multiple providers
    if (ethereum.providers) {
      return ethereum.providers.some((provider: ExtendedEthereumProvider) => provider.isFrame)
    }
    
    return false
  },

  /**
   * Check if Exodus is installed
   */
  isExodusInstalled(): boolean {
    const ethereum = getEthereumProvider() as ExtendedEthereumProvider
    if (!ethereum) return false
    
    // Check if Exodus is the only provider
    if (ethereum.isExodus && !ethereum.providers) return true
    
    // Check if Exodus is among multiple providers
    if (ethereum.providers) {
      return ethereum.providers.some((provider: ExtendedEthereumProvider) => provider.isExodus)
    }
    
    return false
  },

  /**
   * Check if any wallet is installed
   */
  hasEthereumProvider(): boolean {
    return getEthereumProvider() !== undefined
  }
}

/**
 * Get all detected wallets
 */
export function getDetectedWallets(): DetectedWallet[] {
  const detectedWallets: DetectedWallet[] = []

  // Always include WalletConnect as it doesn't require browser extension
  detectedWallets.push({
    ...WALLET_CONFIGS.walletconnect,
    installed: true // WalletConnect is always "available"
  })

  // Check browser extension wallets
  Object.entries(WALLET_CONFIGS).forEach(([id, config]) => {
    if (id === 'walletconnect') return // Already added above
    
    let installed = false
    
    switch (id) {
      case 'metamask':
        installed = detectWallet.isMetaMaskInstalled()
        break
      case 'coinbase':
        installed = detectWallet.isCoinbaseWalletInstalled()
        break
      case 'trust':
        installed = detectWallet.isTrustWalletInstalled()
        break
      case 'brave':
        installed = detectWallet.isBraveWalletInstalled()
        break
      case 'rabby':
        installed = detectWallet.isRabbyInstalled()
        break
      case 'frame':
        installed = detectWallet.isFrameInstalled()
        break
      case 'exodus':
        installed = detectWallet.isExodusInstalled()
        break
    }
    
    detectedWallets.push({
      ...config,
      installed
    })
  })

  return detectedWallets
}

/**
 * Get only installed wallets
 */
export function getInstalledWallets(): DetectedWallet[] {
  return getDetectedWallets().filter(wallet => wallet.installed)
}

/**
 * Get wallet installation recommendations
 */
export function getWalletRecommendations(): WalletInfo[] {
  const detected = getDetectedWallets()
  const notInstalled = detected.filter(wallet => !wallet.installed && wallet.id !== 'walletconnect')
  
  // Prioritize MetaMask and Coinbase for new users
  const priority = ['metamask', 'coinbase', 'trust', 'brave']
  
  return notInstalled.sort((a, b) => {
    const aIndex = priority.indexOf(a.id)
    const bIndex = priority.indexOf(b.id)
    
    if (aIndex === -1 && bIndex === -1) return 0
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    
    return aIndex - bIndex
  })
}

/**
 * Check if user has any wallet installed
 */
export function hasAnyWalletInstalled(): boolean {
  return getInstalledWallets().length > 0
}

/**
 * Get the primary wallet (first installed or MetaMask if available)
 */
export function getPrimaryWallet(): DetectedWallet | null {
  const installed = getInstalledWallets()
  
  if (installed.length === 0) return null
  
  // Prefer MetaMask if installed
  const metamask = installed.find(w => w.id === 'metamask')
  if (metamask) return metamask
  
  // Otherwise return first installed
  return installed[0]
}

/**
 * Wallet detection utilities for components
 */
export const walletDetector = {
  detectWallet,
  getDetectedWallets,
  getInstalledWallets,
  getWalletRecommendations,
  hasAnyWalletInstalled,
  getPrimaryWallet,
  WALLET_CONFIGS
}

// Compatibility exports for files expecting different naming
export const detectWallets = getDetectedWallets;
export type WalletDetectionResult = DetectedWallet;

export default walletDetector
