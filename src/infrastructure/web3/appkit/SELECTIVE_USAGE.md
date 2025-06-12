# Selective AppKit Usage Guide

## Overview

AppKit has been removed as a global wrapper to prevent unnecessary initialization errors and improve performance. Use AppKit selectively in components that specifically need wallet functionality.

## How to Use AppKit Selectively

### 1. Import the Hook

```typescript
import { useAppKit } from '@/infrastructure/web3/appkit'
```

### 2. Use in Component

```typescript
import React from 'react'
import { useAppKit } from '@/infrastructure/web3/appkit'

export function WalletConnectionComponent() {
  const { isInitialized, error, projectId } = useAppKit({
    suppressErrors: true,  // Suppress console errors (default: true)
    autoConnect: false     // Auto-connect to last wallet (default: false)
  })

  if (error) {
    return <div>Wallet functionality unavailable</div>
  }

  if (!isInitialized) {
    return <div>Initializing wallet...</div>
  }

  return (
    <div>
      <w3m-button />
      {/* Other wallet UI components */}
    </div>
  )
}
```

### 3. Example Usage in Wallet Pages

Use the hook only in pages/components that need wallet functionality:

- Wallet Dashboard pages
- Token deployment pages  
- Transfer/swap pages
- Any component with wallet connection buttons

### 4. Environment Setup

Ensure your `.env` files have the correct project ID:

```
VITE_PUBLIC_PROJECT_ID=your_reown_project_id_here
```

## Benefits of Selective Usage

✅ **No Global Initialization Errors**: AppKit only loads when needed
✅ **Better Performance**: Reduces bundle size and initialization time on non-wallet pages  
✅ **Reduced API Calls**: Prevents unnecessary calls to Reown services
✅ **Cleaner Console**: No more console errors on pages that don't use wallets
✅ **Selective Control**: Choose exactly where and how AppKit initializes

## Migration from Global Wrapper

**Before (Global Wrapper)**:
```typescript
// App.tsx - affects entire app
<ConditionalAppKitProvider>
  <Routes>...</Routes>
</ConditionalAppKitProvider>
```

**After (Selective Usage)**:
```typescript
// WalletPage.tsx - only where needed
function WalletPage() {
  const { isInitialized } = useAppKit()
  // ...
}
```

## Troubleshooting

- **Project ID Missing**: Set `VITE_PUBLIC_PROJECT_ID` in environment variables
- **API Errors**: Set `suppressErrors: true` in useAppKit options
- **Initialization Issues**: Check browser console for specific AppKit errors (when suppressErrors is false)
