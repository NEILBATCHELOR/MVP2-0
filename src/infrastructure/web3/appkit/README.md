# Multi-Wallet Integration with Reown AppKit for Chain Capital

This document describes the comprehensive multi-wallet integration using Reown AppKit that has been implemented in the Chain Capital project. The integration supports **300+ wallets** including browser extensions, mobile apps, hardware wallets, and social logins, providing a seamless connection experience that works instantly on any page.

## 🎯 Overview

The integration includes:
- **300+ Supported Wallets**: Browser extensions, mobile apps, hardware wallets
- **Social & Email Login**: Google, GitHub, Discord, Apple, and email authentication
- **WalletConnect Protocol**: Connects to hundreds of mobile wallets via QR code
- **Hardware Wallet Support**: Ledger, Trezor, and other hardware devices
- **Centralized Configuration**: One place to manage all wallet settings
- **React Context Provider**: Wraps the entire application
- **Reusable Components**: Drop-in wallet connection buttons
- **TypeScript Support**: Full type safety for AppKit components
- **shadcn UI Integration**: Consistent design with existing UI components

## 📁 Files Created

### Core Configuration
- `src/lib/web3/appkit/config.ts` - Wagmi adapter and network configuration
- `src/lib/web3/appkit/AppKitProvider.tsx` - React context provider
- `src/lib/web3/appkit/index.ts` - Export barrel file

### UI Components
- `src/components/wallet/ConnectWalletButton.tsx` - Reusable wallet button components
- `src/components/wallet/ComprehensiveWalletSelector.tsx` - Complete wallet selection interface
- `src/types/appkit.d.ts` - TypeScript declarations for AppKit web components

### Demo & Testing
- `src/pages/WalletDemoPage.tsx` - Comprehensive demo page showing all features

### Updated Files
- `src/App.tsx` - Added AppKitProvider wrapper and demo route

## 🚀 Quick Start

### 1. Environment Setup
Your project ID is already configured in `.env`:
```bash
VITE_PUBLIC_PROJECT_ID=e19ed9752e18e9d65fb885a9cd419aad
```

### 2. Basic Usage

**Simple Connect Button:**
```tsx
import { ConnectWalletButton } from '@/components/wallet/ConnectWalletButton'

export function MyPage() {
  return (
    <div>
      <h1>My DApp</h1>
      <ConnectWalletButton />
    </div>
  )
}
```

**Native AppKit Component:**
```tsx
export function SimplePage() {
  return (
    <div>
      <h1>My DApp</h1>
      <appkit-button />
    </div>
  )
}
```

### 3. Advanced Usage with Wagmi Hooks

```tsx
import { useAccount, useBalance } from 'wagmi'
import { ConnectWalletButton } from '@/components/wallet/ConnectWalletButton'

export function WalletInfo() {
  const { address, isConnected, chain } = useAccount()
  const { data: balance } = useBalance({ address })
  
  if (!isConnected) {
    return <ConnectWalletButton />
  }
  
  return (
    <div>
      <p>Connected to {chain?.name}</p>
      <p>Address: {address}</p>
      <p>Balance: {balance?.formatted} {balance?.symbol}</p>
      <ConnectWalletButton /> {/* Shows disconnect when connected */}
    </div>
  )
}
```

## 📱 Supported Wallets

The integration supports **300+ wallets** across multiple categories:

### 🌐 Browser Extension Wallets
- **MetaMask** - Most popular Ethereum wallet
- **Coinbase Wallet** - Easy onboarding with CEX integration
- **Rabby Wallet** - Multi-chain DeFi focused
- **Brave Wallet** - Built into Brave browser
- **Opera Wallet** - Built into Opera browser

### 📱 Mobile & WalletConnect Wallets
- **Trust Wallet** - Multi-cryptocurrency mobile wallet
- **Rainbow** - Ethereum wallet with NFT focus
- **Argent** - Smart contract wallet with social recovery
- **Zerion** - DeFi portfolio tracker and wallet
- **Uniswap Wallet** - Official Uniswap mobile wallet
- **imToken** - Popular in Asian markets
- **Ledger Live** - Mobile companion to hardware wallet
- And 200+ more through WalletConnect protocol

### 🔐 Hardware Wallets
- **Ledger** - Industry-leading hardware security
- **Trezor** - Open-source hardware wallet
- Direct integration with hardware devices

### 👥 Social & Email Logins
- **Google** - Sign in with Google account
- **GitHub** - Developer-focused authentication
- **Discord** - Gaming community integration
- **Apple** - Apple ID authentication
- **Email** - Universal email-based access
- **X (Twitter)** - Social media authentication
- **Farcaster** - Decentralized social protocol

### 🎯 Comprehensive Wallet Selector
Use the `ComprehensiveWalletSelector` component to show all supported wallets organized by category:

```tsx
import { ComprehensiveWalletSelector } from '@/components/wallet/ComprehensiveWalletSelector'

export function WalletSelectionPage() {
  return (
    <div>
      <h1>Choose Your Wallet</h1>
      <ComprehensiveWalletSelector />
    </div>
  )
}
```

## 🎨 Component Variants

The `ConnectWalletButton` component supports multiple variants:

### Button Variants
```tsx
<ConnectWalletButton variant="default" />
<ConnectWalletButton variant="outline" />
<ConnectWalletButton variant="secondary" />
<ConnectWalletButton variant="ghost" />
```

### Button Sizes
```tsx
<ConnectWalletButton size="sm" />
<ConnectWalletButton size="default" />
<ConnectWalletButton size="lg" />
```

### Custom Text and Icons
```tsx
<ConnectWalletButton 
  connectText="Connect to DeFi" 
  disconnectText="Sign Out"
  showIcon={false}
/>
```

## 🔧 Specialized Components

### WalletAccount Component
Shows detailed account information with click-to-manage functionality:
```tsx
import { WalletAccount } from '@/components/wallet/ConnectWalletButton'

<WalletAccount />
```

### NetworkSelector Component
Allows users to switch between supported networks:
```tsx
import { NetworkSelector } from '@/components/wallet/ConnectWalletButton'

<NetworkSelector />
```

## 🌐 Supported Networks

The integration currently supports:
- **Ethereum Mainnet**
- **Arbitrum**
- **Base**
- **Polygon**
- **Optimism**

To add more networks, update `src/lib/web3/appkit/config.ts`:
```tsx
import { mainnet, arbitrum, base, polygon, optimism, sepolia } from '@reown/appkit/networks'

export const networks: [Chain, ...Chain[]] = [
  mainnet, 
  arbitrum, 
  base, 
  polygon, 
  optimism,
  sepolia // Add new networks here
]
```

## 🧪 Testing the Integration

Visit the demo page to test all features:
```
http://localhost:3000/wallet/demo
```

The demo page shows:
- Connection status
- All button variants and sizes
- Account and network components
- Native AppKit components
- Code examples

## 🔒 Security Features

- **SSR Support**: Cookie-based state management for server-side rendering
- **Type Safety**: Full TypeScript support prevents runtime errors
- **Environment Variables**: Secure configuration management
- **Error Handling**: Graceful fallbacks and user feedback

## 📱 Mobile Support

The integration automatically works on mobile devices with:
- **WalletConnect**: QR code scanning for mobile wallets
- **In-app browsers**: Direct connection for mobile wallet apps
- **Responsive UI**: Optimized for all screen sizes

## 🛠 Advanced Configuration

### Custom Metadata
Update the metadata in `src/lib/web3/appkit/AppKitProvider.tsx`:
```tsx
const metadata = {
  name: 'Your App Name',
  description: 'Your App Description', 
  url: 'https://yourapp.com',
  icons: ['https://yourapp.com/icon.png'],
}
```

### Additional Features
Enable additional AppKit features:
```tsx
createAppKit({
  // ... other config
  features: { 
    analytics: true,
    onramp: true,        // Enable on-ramp services
    swaps: true,         // Enable token swaps
    email: true,         // Enable email login
    socials: ['google', 'github'] // Enable social logins
  },
})
```

## 🔄 Migration from Existing Wallet Integration

If you have existing wallet integration code:

1. **Replace old providers** with `AppKitProvider` in `App.tsx`
2. **Update wallet buttons** to use `ConnectWalletButton`
3. **Use standard wagmi hooks** for wallet state management
4. **Remove custom wallet connection logic**

## 📚 Useful Hooks

Common Wagmi hooks for wallet integration:

```tsx
import { 
  useAccount,          // Get connection status and address
  useBalance,          // Get token balances
  useNetwork,          // Get current network
  useConnect,          // Manual connection control
  useDisconnect,       // Manual disconnection
  useSwitchNetwork,    // Switch networks
  useSignMessage,      // Sign messages
  useContractRead,     // Read contract data
  useContractWrite,    // Write to contracts
} from 'wagmi'
```

## 🐛 Troubleshooting

### Common Issues

**"Project ID not found" error:**
- Ensure `VITE_PUBLIC_PROJECT_ID` is set in `.env` file
- Check that the project ID is valid on cloud.reown.com

**TypeScript errors with `<appkit-button>`:**
- Verify `src/types/appkit.d.ts` is included in your TypeScript config
- Restart your TypeScript server

**Wallet not connecting:**
- Check browser console for detailed error messages
- Ensure wallet extension is installed and unlocked
- Try different browsers or incognito mode

**SSR/Hydration issues:**
- The integration uses cookie storage to prevent hydration mismatches
- If issues persist, check that `AppKitProvider` is properly wrapping your app

### Getting Help

- Check the [Reown AppKit Documentation](https://docs.reown.com/appkit/react/core/installation)
- Review the demo page at `/wallet/demo` for working examples
- Look at the implementation in `src/components/wallet/ConnectWalletButton.tsx`

## 🎉 Success!

Your Chain Capital project now has a comprehensive, production-ready multi-wallet connection system powered by Reown AppKit. The system supports:

✅ **300+ Wallets** - Browser extensions, mobile apps, hardware wallets  
✅ **Social & Email Login** - Google, GitHub, Discord, Apple, email authentication  
✅ **WalletConnect Protocol** - QR code scanning for mobile wallets  
✅ **Hardware Wallet Support** - Ledger, Trezor integration  
✅ **Type-safe** - Full TypeScript support  
✅ **Responsive** - Works on all devices  
✅ **Extensible** - Easy to customize and extend  
✅ **Production-ready** - Built with best practices  

Start by visiting `/wallet/demo` to see all 300+ wallet options in action!
