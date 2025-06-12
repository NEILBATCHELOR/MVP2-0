/**
 * Demo page showing how to use the Reown AppKit integration
 */

import React from 'react'
import { ConnectWalletButton, WalletAccount, NetworkSelector } from '@/components/wallet/ConnectWalletButton'
import { ComprehensiveWalletSelector } from '@/components/wallet/ComprehensiveWalletSelector'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAccount } from 'wagmi'
import { SUPPORTED_WALLETS } from '@/infrastructure/web3/appkit/config'
import { WalletConnectProvider } from '@/components/wallet/WalletConnect'

function WalletDemoPageContent() {
  const { address, isConnected, chain } = useAccount()

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Multi-Wallet Integration Demo</h1>
        <p className="text-muted-foreground">
          Demonstrating Reown AppKit integration with 300+ supported wallets including browser extensions, mobile apps, hardware wallets, and social logins.
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge variant="secondary">300+ Wallets</Badge>
          <Badge variant="secondary">Social Login</Badge>
          <Badge variant="secondary">Hardware Wallets</Badge>
          <Badge variant="secondary">Mobile First</Badge>
          <Badge variant="secondary">WalletConnect</Badge>
        </div>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
          <CardDescription>Current wallet connection information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="font-medium">Status:</span>
            <Badge variant={isConnected ? "default" : "secondary"}>
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
          {isConnected && (
            <>
              <div className="flex items-center gap-2">
                <span className="font-medium">Address:</span>
                <code className="text-sm bg-muted px-2 py-1 rounded">
                  {address}
                </code>
              </div>
              {chain && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Network:</span>
                  <Badge variant="outline">{chain.name}</Badge>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Main Demo Tabs */}
      <Tabs defaultValue="comprehensive" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="comprehensive">All Wallets</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="native">Native AppKit</TabsTrigger>
          <TabsTrigger value="examples">Code Examples</TabsTrigger>
        </TabsList>

        {/* Comprehensive Wallet Selector */}
        <TabsContent value="comprehensive">
          <ComprehensiveWalletSelector />
        </TabsContent>

        {/* Component Examples */}
        <TabsContent value="components">
          <div className="space-y-6">
            {/* Connect Wallet Button Examples */}
            <Card>
        <CardHeader>
          <CardTitle>Connect Wallet Button Variants</CardTitle>
          <CardDescription>
            Different styles and sizes of the connect wallet button component.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Default Button */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Default Button</h3>
            <ConnectWalletButton />
          </div>

          {/* Button Variants */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Button Variants</h3>
            <div className="flex flex-wrap gap-2">
              <ConnectWalletButton variant="default" connectText="Connect" />
              <ConnectWalletButton variant="outline" connectText="Connect Outline" />
              <ConnectWalletButton variant="secondary" connectText="Connect Secondary" />
              <ConnectWalletButton variant="ghost" connectText="Connect Ghost" />
            </div>
          </div>

          {/* Button Sizes */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Button Sizes</h3>
            <div className="flex flex-wrap items-center gap-2">
              <ConnectWalletButton size="sm" connectText="Small" />
              <ConnectWalletButton size="default" connectText="Default" />
              <ConnectWalletButton size="lg" connectText="Large" />
            </div>
          </div>

          {/* Without Icon */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Without Icon</h3>
            <ConnectWalletButton showIcon={false} connectText="Connect Wallet" />
          </div>
        </CardContent>
      </Card>

            <Separator />

            {/* Account and Network Components */}
            <Card>
        <CardHeader>
          <CardTitle>Account and Network Components</CardTitle>
          <CardDescription>
            Specialized components for account management and network selection.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Wallet Account Component</h3>
            <WalletAccount />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Network Selector</h3>
            <NetworkSelector />
          </div>
        </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Native AppKit Components */}
        <TabsContent value="native">
          <Card>
        <CardHeader>
          <CardTitle>Native AppKit Components</CardTitle>
          <CardDescription>
            Direct usage of AppKit's native web components.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">AppKit Button</h3>
            <appkit-button />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">AppKit Network Button</h3>
            <appkit-network-button />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">AppKit Account Button</h3>
            <appkit-account-button />
          </div>
        </CardContent>
          </Card>
        </TabsContent>

        {/* Code Examples */}
        <TabsContent value="examples">
          <Card>
        <CardHeader>
          <CardTitle>Usage Examples</CardTitle>
          <CardDescription>
            Code examples for implementing wallet connectivity in your components.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Basic Implementation</h3>
            <pre className="text-sm bg-muted p-4 rounded overflow-x-auto">
{`import { ConnectWalletButton } from '@/components/wallet/ConnectWalletButton'

export function MyComponent() {
  return (
    <div>
      <h1>My DApp</h1>
      <ConnectWalletButton />
    </div>
  )
}`}
            </pre>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Using Wagmi Hooks</h3>
            <pre className="text-sm bg-muted p-4 rounded overflow-x-auto">
{`import { useAccount } from 'wagmi'
import { ConnectWalletButton } from '@/components/wallet/ConnectWalletButton'

export function WalletInfo() {
  const { address, isConnected } = useAccount()
  
  return (
    <div>
      {isConnected ? (
        <p>Connected: {address}</p>
      ) : (
        <ConnectWalletButton />
      )}
    </div>
  )
}`}
            </pre>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Native AppKit Component</h3>
            <pre className="text-sm bg-muted p-4 rounded overflow-x-auto">
{`export function SimpleConnect() {
  return (
    <div>
      <h1>Simple DApp</h1>
      <appkit-button />
    </div>
  )
}`}
            </pre>
          </div>
        </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function WalletDemoPage() {
  return (
    <WalletConnectProvider>
      <WalletDemoPageContent />
    </WalletConnectProvider>
  )
}
