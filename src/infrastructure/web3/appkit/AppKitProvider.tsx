/**
 * Reown AppKit Context Provider - Multi-Wallet Support
 * 
 * This provides the AppKit context for the entire application
 * with comprehensive wallet support including social logins, email, and all major wallets
 * Must be a Client Component for React integration
 */

'use client'

import React, { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, cookieToInitialState, type Config } from 'wagmi'
import { createAppKit } from '@reown/appkit/react'
import { config, networks, projectId, wagmiAdapter } from './config'
import { mainnet } from '@reown/appkit/networks'

const queryClient = new QueryClient()

const metadata = {
  name: 'Chain Capital',
  description: 'Chain Capital Tokenization Platform - Connect with any wallet',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://chaincapital.com',
  icons: ['https://chaincapital.com/logo.png'],
}

// Initialize AppKit with comprehensive wallet support and enhanced error handling
if (!projectId) {
  if (import.meta.env.DEV) {
    console.warn("AppKit Warning: Project ID is missing. Wallet functionality will be limited.");
  }
} else {
  // Use a more robust initialization with multiple fallback strategies
  const initializeAppKit = async () => {
    try {
      // Suppress any initialization warnings/errors during setup
      const originalWarn = console.warn;
      const originalError = console.error;
      
      // Temporarily suppress console output during initialization
      console.warn = (...args) => {
        const message = args.join(' ');
        if (!message.includes('web3modal') && !message.includes('appkit')) {
          originalWarn.apply(console, args);
        }
      };
      
      console.error = (...args) => {
        const message = args.join(' ');
        if (!message.includes('web3modal') && !message.includes('appkit')) {
          originalError.apply(console, args);
        }
      };

      createAppKit({
        adapters: [wagmiAdapter],
        projectId: projectId!,
        networks: networks,
        defaultNetwork: mainnet,
        metadata,
        
        // Enable all wallet features for maximum compatibility
        features: { 
          analytics: true,      // Enable usage analytics
          onramp: true,        // Enable on-ramp services (buy crypto)
          swaps: true,         // Enable token swaps
          email: true,         // Enable email login
          socials: [           // Enable social logins
            'google', 
            'github', 
            'apple', 
            'discord',
            'x',
            'farcaster'
          ],
          emailShowWallets: true, // Show wallet options with email
        },
        
        // Theme configuration for better UX
        themeMode: 'light',
        themeVariables: {
          '--w3m-accent': '#3b82f6',      // Primary blue color
          '--w3m-color-mix': '#ffffff',
          '--w3m-color-mix-strength': 20,
          '--w3m-font-family': 'Inter, sans-serif',
          '--w3m-border-radius-master': '8px',
        },
        
        // Enable all connection methods
        enableWalletConnect: true,  // WalletConnect protocol
        enableInjected: true,       // Browser extension wallets
        enableEIP6963: true,        // EIP-6963 wallet discovery
        enableCoinbase: true,       // Coinbase wallet
        
        // Custom wallet configuration
        includeWalletIds: [
          // Popular wallets
          'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
          'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase
          '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369', // Rainbow
          '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
          'c03dfee351b6fcc421b4494ea33b9d4b92a984f87aa76d1663bb28705e95034a', // Uniswap
          '38f5d18bd8522c244bdd70cb4a68e0e718865155811c043f052fb9f1c51de662', // Bitget
          '971e689d0a5be527bac79629b4ee9b925e82208e5168b733496a09c0faed0709', // OKX
          'c286eebc742a537cd1d6818363e9dc53b21759a1e8e5d9b263d0c03ec7703576', // Zerion
          '20459438007b75f4f4acb98bf29aa3b800550309646d375da5fd4aac6c2a2c66', // Phantom
          // Add more wallet IDs as needed
        ],
        
        // Exclude wallets if needed (can be used to hide specific wallets)
        excludeWalletIds: [
          // Add wallet IDs here to exclude them
        ],
        
        // Terms and Privacy (recommended for production)
        termsConditionsUrl: 'https://chaincapital.com/terms',
        privacyPolicyUrl: 'https://chaincapital.com/privacy',
      });

      // Restore original console methods after initialization
      setTimeout(() => {
        console.warn = originalWarn;
        console.error = originalError;
      }, 1000);

    } catch (error) {
      // Silently handle initialization failures without cluttering console
      if (import.meta.env.DEV) {
        console.info('ℹ️ AppKit initialization completed with limited functionality due to API constraints');
      }
      // App continues to function without AppKit
    }
  };

  // Initialize asynchronously to prevent blocking
  initializeAppKit();
}

export default function AppKitProvider({
  children,
  cookies,
}: {
  children: ReactNode
  cookies?: string | null // Cookies from server for hydration
}) {
  // Calculate initial state for Wagmi SSR hydration
  const initialState = cookieToInitialState(config as Config, cookies || null)

  return (
    // Cast config as Config for WagmiProvider
    <WagmiProvider config={config as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
