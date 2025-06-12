/**
 * Comprehensive Wallet Selection Component
 * 
 * Shows all supported wallets organized by category
 * Demonstrates the full range of wallet options available through Reown AppKit
 */

'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAppKit } from '@reown/appkit/react'
import { useAccount } from 'wagmi'
import { 
  Smartphone, 
  Globe, 
  Shield, 
  Users, 
  Wallet, 
  ExternalLink,
  CheckCircle2,
  Circle
} from 'lucide-react'
import { SUPPORTED_WALLETS, WALLET_CATEGORIES } from '@/infrastructure/web3/appkit/config'

// Wallet data with categories, descriptions, and metadata
const WALLET_DATA = {
  // Browser Extension Wallets
  [SUPPORTED_WALLETS.METAMASK]: {
    category: WALLET_CATEGORIES.BROWSER,
    icon: '🦊',
    description: 'The most popular Ethereum wallet browser extension',
    website: 'https://metamask.io',
    features: ['Browser Extension', 'Mobile App', 'Hardware Support'],
    downloadUrl: 'https://metamask.io/download/',
  },
  [SUPPORTED_WALLETS.COINBASE]: {
    category: WALLET_CATEGORIES.BROWSER,
    icon: '🔵',
    description: 'Coinbase\'s self-custody wallet with easy onboarding',
    website: 'https://wallet.coinbase.com',
    features: ['Browser Extension', 'Mobile App', 'CEX Integration'],
    downloadUrl: 'https://wallet.coinbase.com/',
  },
  [SUPPORTED_WALLETS.RABBY]: {
    category: WALLET_CATEGORIES.BROWSER,
    icon: '🐰',
    description: 'Multi-chain wallet focused on DeFi and security',
    website: 'https://rabby.io',
    features: ['Multi-chain', 'DeFi Optimized', 'Security Focused'],
    downloadUrl: 'https://rabby.io/',
  },
  [SUPPORTED_WALLETS.BRAVE]: {
    category: WALLET_CATEGORIES.BROWSER,
    icon: '🦁',
    description: 'Built-in wallet in the Brave browser',
    website: 'https://brave.com/wallet',
    features: ['Built-in Browser', 'Privacy Focused', 'Multi-chain'],
    downloadUrl: 'https://brave.com/download/',
  },

  // Mobile & WalletConnect Wallets
  [SUPPORTED_WALLETS.TRUST_WALLET]: {
    category: WALLET_CATEGORIES.MOBILE,
    icon: '🛡️',
    description: 'Multi-cryptocurrency mobile wallet',
    website: 'https://trustwallet.com',
    features: ['Mobile First', 'Multi-chain', 'DApp Browser'],
    downloadUrl: 'https://trustwallet.com/download',
  },
  [SUPPORTED_WALLETS.RAINBOW]: {
    category: WALLET_CATEGORIES.MOBILE,
    icon: '🌈',
    description: 'Ethereum wallet with focus on NFTs and DeFi',
    website: 'https://rainbow.me',
    features: ['NFT Focused', 'Beautiful UI', 'DeFi Integration'],
    downloadUrl: 'https://rainbow.me/download',
  },
  [SUPPORTED_WALLETS.ARGENT]: {
    category: WALLET_CATEGORIES.MOBILE,
    icon: '🏛️',
    description: 'Smart contract wallet with enhanced security',
    website: 'https://argent.xyz',
    features: ['Smart Contract', 'Social Recovery', 'L2 Optimized'],
    downloadUrl: 'https://argent.xyz/download',
  },
  [SUPPORTED_WALLETS.ZERION]: {
    category: WALLET_CATEGORIES.MOBILE,
    icon: '⚡',
    description: 'DeFi portfolio tracker and wallet',
    website: 'https://zerion.io',
    features: ['Portfolio Tracking', 'DeFi Native', 'Multi-chain'],
    downloadUrl: 'https://zerion.io/wallet',
  },
  [SUPPORTED_WALLETS.UNISWAP]: {
    category: WALLET_CATEGORIES.MOBILE,
    icon: '🦄',
    description: 'Official Uniswap mobile wallet',
    website: 'https://wallet.uniswap.org',
    features: ['DEX Integration', 'Swapping', 'Mobile First'],
    downloadUrl: 'https://wallet.uniswap.org/',
  },

  // Hardware Wallets
  [SUPPORTED_WALLETS.LEDGER]: {
    category: WALLET_CATEGORIES.HARDWARE,
    icon: '🔐',
    description: 'Industry-leading hardware wallet for maximum security',
    website: 'https://ledger.com',
    features: ['Hardware Security', 'Multi-currency', 'Cold Storage'],
    downloadUrl: 'https://ledger.com/ledger-live',
  },
  [SUPPORTED_WALLETS.TREZOR]: {
    category: WALLET_CATEGORIES.HARDWARE,
    icon: '🛡️',
    description: 'Open-source hardware wallet',
    website: 'https://trezor.io',
    features: ['Open Source', 'Hardware Security', 'Privacy Focused'],
    downloadUrl: 'https://trezor.io/trezor-suite',
  },

  // Social Logins
  [SUPPORTED_WALLETS.GOOGLE]: {
    category: WALLET_CATEGORIES.SOCIAL,
    icon: '🔍',
    description: 'Sign in with your Google account',
    website: 'https://accounts.google.com',
    features: ['No Download', 'Familiar Login', 'Email Based'],
    downloadUrl: null,
  },
  [SUPPORTED_WALLETS.GITHUB]: {
    category: WALLET_CATEGORIES.SOCIAL,
    icon: '🐙',
    description: 'Sign in with your GitHub account',
    website: 'https://github.com',
    features: ['Developer Focused', 'No Download', 'Code Integration'],
    downloadUrl: null,
  },
  [SUPPORTED_WALLETS.EMAIL]: {
    category: WALLET_CATEGORIES.SOCIAL,
    icon: '📧',
    description: 'Sign in with any email address',
    website: null,
    features: ['Universal Access', 'No Download', 'Email Verification'],
    downloadUrl: null,
  },
}

const categoryIcons = {
  [WALLET_CATEGORIES.BROWSER]: Globe,
  [WALLET_CATEGORIES.MOBILE]: Smartphone,
  [WALLET_CATEGORIES.HARDWARE]: Shield,
  [WALLET_CATEGORIES.SOCIAL]: Users,
  [WALLET_CATEGORIES.WALLETCONNECT]: Wallet,
}

export function ComprehensiveWalletSelector() {
  const { open } = useAppKit()
  const { isConnected, connector } = useAccount()
  const [selectedCategory, setSelectedCategory] = useState<string>(WALLET_CATEGORIES.BROWSER)

  const walletsByCategory = Object.entries(WALLET_DATA).reduce((acc, [walletName, data]) => {
    if (!acc[data.category]) {
      acc[data.category] = []
    }
    acc[data.category].push({ name: walletName, ...data })
    return acc
  }, {} as Record<string, Array<{ name: string } & typeof WALLET_DATA[keyof typeof WALLET_DATA]>>)

  const handleConnectWallet = () => {
    open()
  }

  const handleOpenWalletSelection = () => {
    open({ view: 'Connect' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Connect Any Wallet</h2>
        <p className="text-muted-foreground">
          Choose from 300+ supported wallets including browser extensions, mobile apps, hardware wallets, and social logins
        </p>
      </div>

      {/* Quick Connect */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Quick Connect
          </CardTitle>
          <CardDescription>
            Connect instantly with any supported wallet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isConnected ? (
            <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="text-green-800">
                Connected with {connector?.name || 'Unknown Wallet'}
              </span>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleConnectWallet} className="flex-1">
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet
              </Button>
              <Button variant="outline" onClick={handleOpenWalletSelection}>
                Choose Wallet
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Wallet Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Supported Wallets by Category</CardTitle>
          <CardDescription>
            Explore all supported wallet types and find the one that's right for you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedCategory} onValueChange={(value: string) => setSelectedCategory(value)}>
            <TabsList className="grid w-full grid-cols-4">
              {Object.values(WALLET_CATEGORIES).map((category) => {
                const Icon = categoryIcons[category]
                const count = walletsByCategory[category]?.length || 0
                return (
                  <TabsTrigger key={category} value={category} className="flex items-center gap-1">
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{category}</span>
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {count}+
                    </Badge>
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {Object.entries(walletsByCategory).map(([category, wallets]) => (
              <TabsContent key={category} value={category} className="mt-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {wallets.map((wallet) => (
                    <Card key={wallet.name} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="text-2xl">{wallet.icon}</div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate">{wallet.name}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {wallet.description}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {wallet.features.slice(0, 2).map((feature) => (
                                <Badge key={feature} variant="outline" className="text-xs">
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                            {wallet.downloadUrl && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="mt-2 p-0 h-auto text-xs"
                                asChild
                              >
                                <a 
                                  href={wallet.downloadUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1"
                                >
                                  Download <ExternalLink className="w-3 h-3" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Category-specific information */}
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  {category === WALLET_CATEGORIES.BROWSER && (
                    <div>
                      <h4 className="font-medium mb-2">Browser Extension Wallets</h4>
                      <p className="text-sm text-muted-foreground">
                        Install these as browser extensions for desktop use. They integrate directly with websites and provide secure key management.
                      </p>
                    </div>
                  )}
                  {category === WALLET_CATEGORIES.MOBILE && (
                    <div>
                      <h4 className="font-medium mb-2">Mobile & WalletConnect Wallets</h4>
                      <p className="text-sm text-muted-foreground">
                        Mobile-first wallets that connect via WalletConnect. Scan QR codes to connect securely from your phone.
                      </p>
                    </div>
                  )}
                  {category === WALLET_CATEGORIES.HARDWARE && (
                    <div>
                      <h4 className="font-medium mb-2">Hardware Wallets</h4>
                      <p className="text-sm text-muted-foreground">
                        Maximum security with offline key storage. Connect your hardware device to sign transactions securely.
                      </p>
                    </div>
                  )}
                  {category === WALLET_CATEGORIES.SOCIAL && (
                    <div>
                      <h4 className="font-medium mb-2">Social & Email Logins</h4>
                      <p className="text-sm text-muted-foreground">
                        No wallet installation required. Use your existing social accounts or email to access Web3.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Native AppKit Components */}
      <Card>
        <CardHeader>
          <CardTitle>Native AppKit Components</CardTitle>
          <CardDescription>
            These components automatically show all supported wallets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Connect Button</label>
              <appkit-button />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Network Button</label>
              <appkit-network-button />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Account Button</label>
              <appkit-account-button />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Wallet,
                title: '300+ Wallets',
                description: 'Support for all major wallets and connection methods'
              },
              {
                icon: Shield,
                title: 'Secure Connections',
                description: 'Industry-standard security with WalletConnect protocol'
              },
              {
                icon: Users,
                title: 'Social Logins',
                description: 'Connect with Google, GitHub, Discord, and more'
              },
              {
                icon: Smartphone,
                title: 'Mobile Optimized',
                description: 'Seamless experience on mobile devices'
              },
              {
                icon: Globe,
                title: 'Multi-chain',
                description: 'Support for Ethereum, Polygon, Arbitrum, and more'
              },
              {
                icon: ExternalLink,
                title: 'DApp Ready',
                description: 'Full integration with decentralized applications'
              }
            ].map((feature) => (
              <div key={feature.title} className="flex items-start gap-3">
                <feature.icon className="w-5 h-5 text-primary mt-1" />
                <div>
                  <h4 className="font-medium">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
