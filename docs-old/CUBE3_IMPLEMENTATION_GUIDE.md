# CUBE3 Wallet Risk Assessment Implementation Guide

This guide walks you through setting up the CUBE3 wallet risk assessment service in your application.

## Prerequisites

1. A CUBE3 account with API access
2. API key from the CUBE3 dashboard
3. Environment variables properly configured

## Step 1: Set Up Environment Variables

Add the following to your `.env.local` file:

```
NEXT_PUBLIC_CUBE3_API_KEY=your_cube3_api_key
NEXT_PUBLIC_CUBE3_API_URL=https://api.cube3.ai/v2
```

## Step 2: Initialize the Service

Add the CUBE3 initialization to your application's entry point (`_app.tsx` or `layout.tsx`):

```typescript
import { initializeCube3 } from '@/lib/cube3Init';

// Add this to your app initialization function
useEffect(() => {
  const cube3Initialized = initializeCube3();
  if (!cube3Initialized) {
    console.warn('CUBE3 service not initialized - risk assessments will not be available');
  }
}, []);
```

## Step 3: Using the Risk Assessment Components

### Full Risk Check Component

The `WalletRiskCheck` component provides a comprehensive risk assessment display:

```tsx
import { WalletRiskCheck } from '@/components/wallet/WalletRiskCheck';

// For a connected wallet (using the app's wallet context)
<WalletRiskCheck />

// For a specific wallet address
<WalletRiskCheck 
  address="0x1234567890abcdef1234567890abcdef12345678" 
  chainId={1} // Ethereum mainnet
/>

// Compact mode
<WalletRiskCheck 
  address="0x1234567890abcdef1234567890abcdef12345678"
  compact={true}
/>
```

### Inline Risk Indicator

The `WalletRiskIndicator` component is perfect for showing risk next to wallet addresses:

```tsx
import { WalletRiskIndicator } from '@/components/wallet/WalletRiskIndicator';

// Basic usage
<div>
  <span>Wallet: {truncateAddress(walletAddress)}</span>
  <WalletRiskIndicator address={walletAddress} chainId={1} />
</div>

// With custom size
<WalletRiskIndicator 
  address={walletAddress} 
  chainId={1}
  size="sm" // or "md" or "lg"
/>

// Without tooltip
<WalletRiskIndicator 
  address={walletAddress} 
  chainId={1}
  showTooltip={false}
/>
```

## Step 4: Using the Direct API Functions

### Check a Single Wallet Address

```typescript
import { checkWalletAddress, assessWalletRisk } from '@/lib/services/cube3Service';

const checkWallet = async (address: string, chainId: number) => {
  try {
    // Get raw data from API
    const result = await checkWalletAddress(address, chainId);
    
    if (result.success) {
      // Process the data into a risk assessment
      const assessment = assessWalletRisk(result.data);
      
      console.log('Risk level:', assessment.riskLevel);
      console.log('Risk score:', assessment.riskScore);
      console.log('Risk details:', assessment.riskDetails);
    }
  } catch (error) {
    console.error('Error checking wallet risk:', error);
  }
};
```

### Check Multiple Addresses

```typescript
import { checkMultipleAddresses } from '@/lib/services/cube3Service';

const checkBatchWallets = async () => {
  const addresses = [
    { address: '0x1234567890abcdef1234567890abcdef12345678', chainId: 1 },
    { address: '0xabcdef1234567890abcdef1234567890abcdef12', chainId: 1 },
  ];
  
  try {
    const results = await checkMultipleAddresses(addresses);
    
    // Process the results
    results.forEach(result => {
      if (result.success) {
        console.log(`Address ${result.address} risk:`, result.riskLevel);
      } else {
        console.error(`Failed to check address ${result.address}:`, result.error);
      }
    });
  } catch (error) {
    console.error('Error checking wallet batch:', error);
  }
};
```

### Verify a Transaction

```typescript
import { verifyTransaction } from '@/lib/services/cube3Service';

const checkTransaction = async (txData: string, chainId: number) => {
  try {
    const result = await verifyTransaction(txData, chainId);
    
    if (result.success) {
      console.log('Transaction safe?', result.data.safe);
      console.log('Transaction details:', result.data.details);
    }
  } catch (error) {
    console.error('Error verifying transaction:', error);
  }
};
```

## Understanding Risk Levels

CUBE3 risk levels are interpreted as follows:

| Risk Level | Description | UI Indicator |
|------------|-------------|--------------|
| Low | Safe to interact with | Green shield check |
| Medium | Some caution advised | Yellow shield alert |
| High | High risk, avoid interaction | Red shield alert |
| Unknown | Unable to assess risk | Grey question mark |

## Troubleshooting

### Common Issues

1. **API Key Issues**: Ensure your API key is correctly set in the environment variables.
2. **Rate Limiting**: CUBE3 may impose rate limits on API calls. Implement caching where appropriate.
3. **Network Errors**: Handle network failures gracefully in production environments.

### Debugging

For debugging purposes, you can enable verbose logging in the CUBE3 service:

```typescript
// In your development environment
import { enableDebugLogging } from '@/lib/services/cube3Service';

// Enable debug mode
enableDebugLogging(true);
```

## Testing

- During development, use addresses with known risk profiles to test the UI components
- Monitor API usage in your CUBE3 dashboard
- Consider implementing a local cache to reduce API calls during testing

## Resources

- [CUBE3 API Documentation](https://docs.cube3.ai)
- [Blockchain Security Best Practices](https://cube3.ai/resources/blog)
- [Risk Assessment Standards](https://cube3.ai/standards) 