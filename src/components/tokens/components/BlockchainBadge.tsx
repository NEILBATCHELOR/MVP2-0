import React from 'react';
import { cn } from '@/utils/utils';

interface BlockchainBadgeProps {
  blockchain: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const BlockchainBadge: React.FC<BlockchainBadgeProps> = ({
  blockchain,
  size = 'md',
  className,
}) => {
  // Helper to get blockchain color
  const getBlockchainColor = (blockchain: string): string => {
    const colors: Record<string, string> = {
      ethereum: 'bg-blue-500',
      'ethereum-goerli': 'bg-blue-400',
      polygon: 'bg-purple-600',
      'polygon-mumbai': 'bg-purple-400',
      avalanche: 'bg-red-500',
      'avalanche-fuji': 'bg-red-400',
      bsc: 'bg-yellow-500',
      'bsc-testnet': 'bg-yellow-400',
      solana: 'bg-gradient-to-r from-purple-400 to-fuchsia-500',
      'solana-devnet': 'bg-gradient-to-r from-purple-300 to-fuchsia-400',
      bitcoin: 'bg-orange-500',
      'bitcoin-testnet': 'bg-orange-400',
      aptos: 'bg-blue-500',
      'aptos-devnet': 'bg-blue-400',
      sui: 'bg-teal-500',
      'sui-devnet': 'bg-teal-400',
      near: 'bg-black',
      'near-testnet': 'bg-gray-700',
      ripple: 'bg-blue-600',
      'ripple-testnet': 'bg-blue-500',
      stellar: 'bg-blue-500',
      'stellar-testnet': 'bg-blue-400',
    };
    
    return colors[blockchain] || 'bg-gray-500';
  };

  // Helper to get blockchain icon
  const getBlockchainIcon = (blockchain: string): string => {
    const baseChain = blockchain.split('-')[0]; // Handle testnet variations
    
    switch (baseChain) {
      case 'ethereum':
        return '♦';
      case 'polygon':
        return '⬡';
      case 'avalanche':
        return 'A';
      case 'bsc':
        return 'B';
      case 'solana':
        return 'S';
      case 'bitcoin':
        return '₿';
      case 'aptos':
        return 'A';
      case 'sui':
        return 'S';
      case 'near':
        return 'N';
      case 'ripple':
        return 'R';
      case 'stellar':
        return '✦';
      default:
        return '#';
    }
  };

  // Size classes
  const sizeClasses = {
    sm: 'h-5 w-5 text-xs',
    md: 'h-6 w-6 text-sm',
    lg: 'h-8 w-8 text-base',
  };

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full text-white font-medium',
        getBlockchainColor(blockchain),
        sizeClasses[size],
        className
      )}
    >
      {getBlockchainIcon(blockchain)}
    </div>
  );
};