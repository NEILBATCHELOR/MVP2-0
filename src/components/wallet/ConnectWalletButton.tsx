/**
 * Reusable Connect Wallet Button Component
 * 
 * This component can be used on any page and integrates with Reown AppKit
 * Uses shadcn UI components for consistent design
 */

'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { useAppKit } from '@reown/appkit/react'
import { useAccount, useDisconnect } from 'wagmi'
import { Wallet, LogOut } from 'lucide-react'

interface ConnectWalletButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  showIcon?: boolean
  connectText?: string
  disconnectText?: string
}

export function ConnectWalletButton({
  variant = 'default',
  size = 'default',
  className = '',
  showIcon = true,
  connectText = 'Connect Wallet',
  disconnectText = 'Disconnect',
}: ConnectWalletButtonProps) {
  const { open } = useAppKit()
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  if (isConnected && address) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => disconnect()}
      >
        {showIcon && <LogOut className="w-4 h-4 mr-2" />}
        {formatAddress(address)}
      </Button>
    )
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={() => open()}
    >
      {showIcon && <Wallet className="w-4 h-4 mr-2" />}
      {connectText}
    </Button>
  )
}

// Additional component for account management (shows more detailed info)
export function WalletAccount() {
  const { open } = useAppKit()
  const { address, isConnected } = useAccount()

  if (!isConnected || !address) {
    return (
      <ConnectWalletButton 
        variant="outline" 
        connectText="Connect to get started"
      />
    )
  }

  return (
    <Button
      variant="outline"
      onClick={() => open({ view: 'Account' })}
      className="flex items-center gap-2"
    >
      <div className="w-2 h-2 bg-green-500 rounded-full" />
      {address.slice(0, 6)}...{address.slice(-4)}
    </Button>
  )
}

// Network selector component
export function NetworkSelector() {
  const { open } = useAppKit()

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => open({ view: 'Networks' })}
    >
      Networks
    </Button>
  )
}
