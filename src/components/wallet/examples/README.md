# Wallet Integration Examples

This directory contains real-world examples of how to integrate the multi-wallet system into various parts of your application.

## 📁 Files

- `WalletIntegrationExamples.tsx` - Complete examples showing different integration patterns

## 🎯 Examples Included

### 1. Simple Integration
Basic wallet button integration for any component:
```tsx
import { ConnectWalletButton } from '@/components/wallet/ConnectWalletButton'

<ConnectWalletButton />
```

### 2. Navigation Bar Integration
Shows how to add wallet functionality to your navigation:
```tsx
const { isConnected } = useAccount()
{isConnected ? <WalletAccount /> : <ConnectWalletButton />}
```

### 3. Onboarding Page
Complete onboarding experience with comprehensive wallet selection:
```tsx
<ComprehensiveWalletSelector />
```

### 4. Portfolio Page
Wallet-gated content with balance and network display:
```tsx
const { address, isConnected, chain } = useAccount()
const { data: balance } = useBalance({ address })
```

### 5. Settings Page
Wallet management and configuration interface:
```tsx
<WalletAccount />
// Shows connected wallet details and management options
```

### 6. Modal Integration
Popup wallet selection modal:
```tsx
<WalletSelectionModal isOpen={isOpen} onClose={onClose} />
```

### 7. Native AppKit Components
Direct usage of AppKit web components:
```tsx
<appkit-button />
<appkit-network-button />
<appkit-account-button />
```

## 🚀 Usage

Copy any of these examples into your components and customize as needed. All examples are production-ready and follow best practices for:

- ✅ Error handling
- ✅ Loading states
- ✅ Responsive design
- ✅ TypeScript safety
- ✅ User experience

## 🔗 Related

- [Main README](../lib/web3/appkit/README.md) - Complete documentation
- [Demo Page](../pages/WalletDemoPage.tsx) - Interactive examples
- [Components](../components/wallet/) - Reusable components
