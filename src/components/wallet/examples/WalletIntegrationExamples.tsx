/**
 * Example implementations showing how to integrate the multi-wallet system
 * into your existing pages and components
 */

import React from 'react'
import { ConnectWalletButton, WalletAccount } from '@/components/wallet/ConnectWalletButton'
import { ComprehensiveWalletSelector } from '@/components/wallet/ComprehensiveWalletSelector'
import { useAccount, useBalance } from 'wagmi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Wallet, ArrowRight } from 'lucide-react'

// Example 1: Simple integration in any component
export function SimpleWalletIntegration() {
  return (
    <div className="flex items-center gap-4">
      <h1>My DApp</h1>
      <ConnectWalletButton />
    </div>
  )
}

// Example 2: Navigation bar integration
export function NavigationWithWallet() {
  const { isConnected } = useAccount()
  
  return (
    <nav className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-6">
        <h1 className="text-xl font-bold">Chain Capital</h1>
        <div className="flex gap-4">
          <a href="/dashboard">Dashboard</a>
          <a href="/tokens">Tokens</a>
          <a href="/portfolio">Portfolio</a>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {isConnected ? (
          <WalletAccount />
        ) : (
          <ConnectWalletButton variant="outline" />
        )}
      </div>
    </nav>
  )
}

// Example 3: Onboarding page with wallet selection
export function OnboardingWalletPage() {
  const { isConnected } = useAccount()
  
  if (isConnected) {
    return (
      <div className="container mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Welcome to Chain Capital!</h1>
        <p className="text-muted-foreground mb-6">
          Your wallet is connected. You can now access all platform features.
        </p>
        <Button>
          Continue to Dashboard
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Connect Your Wallet</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Choose from 300+ supported wallets to get started with Chain Capital. 
          We support browser extensions, mobile apps, hardware wallets, and social logins.
        </p>
      </div>
      
      <ComprehensiveWalletSelector />
    </div>
  )
}

// Example 4: Portfolio page with wallet info
export function PortfolioPage() {
  const { address, isConnected, chain } = useAccount()
  const { data: balance } = useBalance({ address })
  
  if (!isConnected) {
    return (
      <div className="container mx-auto p-6 text-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Connect Wallet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Connect your wallet to view your portfolio and manage your tokens.
            </p>
            <ConnectWalletButton className="w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Portfolio</h1>
        <WalletAccount />
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Wallet Address</CardTitle>
          </CardHeader>
          <CardContent>
            <code className="text-sm bg-muted p-2 rounded block">
              {address}
            </code>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Network</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline">{chain?.name}</Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {balance?.formatted} {balance?.symbol}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Rest of portfolio content */}
    </div>
  )
}

// Example 5: Settings page with wallet management
export function WalletSettingsPage() {
  const { isConnected } = useAccount()
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Wallet Settings</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Wallet Connection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isConnected ? (
            <div className="space-y-4">
              <WalletAccount />
              <div className="space-y-2">
                <h3 className="font-medium">Connected Features</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Multi-chain Support</Badge>
                  <Badge variant="secondary">Hardware Wallet</Badge>
                  <Badge variant="secondary">Social Login</Badge>
                  <Badge variant="secondary">Mobile Compatible</Badge>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                No wallet connected. Connect a wallet to access platform features.
              </p>
              <ConnectWalletButton />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Example 6: Modal with wallet selection
export function WalletSelectionModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { isConnected } = useAccount()
  
  React.useEffect(() => {
    if (isConnected) {
      onClose()
    }
  }, [isConnected, onClose])
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-lg max-w-4xl w-full max-h-[80vh] overflow-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Connect Wallet</h2>
            <Button variant="ghost" onClick={onClose}>×</Button>
          </div>
          
          <ComprehensiveWalletSelector />
        </div>
      </div>
    </div>
  )
}

// Native AppKit components can be used anywhere without imports
export function NativeAppKitExample() {
  return (
    <div className="flex items-center gap-4">
      <h2>Quick Connect:</h2>
      <appkit-button />
      <appkit-network-button />
      <appkit-account-button />
    </div>
  )
}
