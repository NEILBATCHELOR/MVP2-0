/**
 * Selective AppKit Hook
 * Use this hook in components that specifically need wallet functionality
 * This replaces the global AppKit wrapper approach
 */

import { useEffect, useState } from 'react'
import { createAppKit } from '@reown/appkit/react'
import { config, networks, projectId, wagmiAdapter } from './config'
import { mainnet } from '@reown/appkit/networks'

const metadata = {
  name: 'Chain Capital',
  description: 'Chain Capital Tokenization Platform - Connect with any wallet',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://chaincapital.com',
  icons: ['https://chaincapital.com/logo.png'],
}

interface UseAppKitOptions {
  autoConnect?: boolean
  suppressErrors?: boolean
}

export function useAppKit(options: UseAppKitOptions = {}) {
  const { autoConnect = false, suppressErrors = true } = options
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!projectId) {
      const errorMsg = 'AppKit Project ID is missing. Set VITE_PUBLIC_PROJECT_ID in environment variables.'
      if (!suppressErrors) {
        console.error(errorMsg)
        setError(new Error(errorMsg))
      }
      return
    }

    let mounted = true

    const initializeAppKit = async () => {
      try {
        // Suppress console output during initialization if requested
        const originalWarn = console.warn
        const originalError = console.error        
        if (suppressErrors) {
          console.warn = (...args) => {
            const message = args.join(' ')
            if (!message.includes('web3modal') && !message.includes('appkit')) {
              originalWarn.apply(console, args)
            }
          }
          
          console.error = (...args) => {
            const message = args.join(' ')
            if (!message.includes('web3modal') && !message.includes('appkit')) {
              originalError.apply(console, args)
            }
          }
        }

        createAppKit({
          adapters: [wagmiAdapter],
          projectId: projectId!,
          networks: networks,
          defaultNetwork: mainnet,
          metadata,
          
          features: { 
            analytics: false,    // Disable analytics to reduce API calls
            onramp: true,
            swaps: true,
            email: true,
            socials: ['google', 'github', 'apple', 'discord', 'x', 'farcaster'],
            emailShowWallets: true,
          },
          
          themeMode: 'light',
          themeVariables: {
            '--w3m-accent': '#3b82f6',
            '--w3m-color-mix': '#ffffff',
            '--w3m-color-mix-strength': 20,
            '--w3m-font-family': 'Inter, sans-serif',
            '--w3m-border-radius-master': '8px',
          },
          
          enableWalletConnect: true,
          enableInjected: true,
          enableEIP6963: true,
          enableCoinbase: true,          
          includeWalletIds: [
            'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
            'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase
            '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369', // Rainbow
            '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
          ],
          
          termsConditionsUrl: 'https://chaincapital.com/terms',
          privacyPolicyUrl: 'https://chaincapital.com/privacy',
        })

        if (suppressErrors) {
          setTimeout(() => {
            console.warn = originalWarn
            console.error = originalError
          }, 2000)
        }

        if (mounted) {
          setIsInitialized(true)
          setError(null)
        }

      } catch (err) {
        if (mounted) {
          const error = err instanceof Error ? err : new Error('AppKit initialization failed')
          setError(error)
          if (!suppressErrors) {
            console.error('AppKit initialization error:', error)
          }
        }
      }
    }

    initializeAppKit()

    return () => {
      mounted = false
    }
  }, [autoConnect, suppressErrors])

  return {
    isInitialized,
    error,
    projectId: projectId || null,
  }
}

export default useAppKit