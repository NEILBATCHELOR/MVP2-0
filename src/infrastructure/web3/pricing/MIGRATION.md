# Cryptocurrency Price Feed Module Migration Guide

## Overview

This document describes the migration from the old pricing module structure to the new consolidated implementation. The new structure offers improved error handling, better type safety, and more consistent API design while maintaining backward compatibility.

## Structure Changes

### Old Structure
```
src/lib/web3/pricing/
├── adapters/
│   ├── CoinGeckoAdapter.ts
│   └── CryptoCompareAdapter.ts
├── types.ts
└── PriceManager.ts
```

### New Structure
```
src/lib/web3/pricing/
├── BasePriceFeedAdapter.ts
├── CoinGeckoPriceFeedAdapter.ts
├── CryptoComparePriceFeedAdapter.ts
├── PriceFeedManager.ts
├── PriceManager.ts (backward compatibility)
├── cache/
│   └── MemoryPriceCache.ts
├── types.ts
└── index.ts
```

## Key Improvements

1. **Standardized Interface**: Consistent `PriceFeedAdapter` interface for all adapters
2. **Base Adapter Class**: Common functionality shared via `BasePriceFeedAdapter`
3. **Error Handling**: Structured error handling with `PriceFeedError` class
4. **Rate Limiting**: Built-in rate limiting for API calls
5. **Caching**: Improved caching mechanism via `MemoryPriceCache`
6. **Type Safety**: Better TypeScript type definitions
7. **Backward Compatibility**: Legacy methods maintained for existing code

## Migration for Consumers

The migration is designed to be transparent for existing consumers:

1. The `index.ts` file exports aliases that maintain the original naming:
   ```typescript
   // Old imports still work
   import { CoinGeckoAdapter } from '@/lib/web3/pricing';
   ```

2. The `PriceManager` class has been preserved with its original API, but internally uses the new adapter implementations.

3. Legacy methods like `getPrice()`, `getPrices()`, and `getHistoricalData()` are still supported but are now marked as deprecated.

## Using the New API

New code should use the improved API:

```typescript
import { 
  PriceFeedManager, 
  CoinGeckoPriceFeedAdapter,
  PriceInterval 
} from '@/lib/web3/pricing';

// Create a manager with an adapter
const manager = new PriceFeedManager({
  defaultAdapter: new CoinGeckoPriceFeedAdapter(),
  defaultCurrency: 'USD',
  cacheTtlMs: 60000
});

// Get current price
const btcPrice = await manager.getCurrentPrice('BTC');

// Get historical prices
const ethHistory = await manager.getHistoricalPrices(
  'ETH', 
  'USD', 
  7, 
  PriceInterval.DAY
);

// Get token metadata
const solMetadata = await manager.getTokenMetadata('SOL');
```

## Migration Steps

1. Replace imports from `./adapters/CoinGeckoAdapter` with imports from the root pricing module:
   ```typescript
   // Before
   import { CoinGeckoAdapter } from './adapters/CoinGeckoAdapter';
   
   // After
   import { CoinGeckoAdapter } from './';
   ```

2. New code should use the newer class names and methods:
   ```typescript
   // Before
   import { CoinGeckoAdapter } from './adapters/CoinGeckoAdapter';
   
   // After
   import { CoinGeckoPriceFeedAdapter } from './';
   ```

3. Eventually, migrate to the new method names:
   ```typescript
   // Before
   const price = await adapter.getPrice('BTC', PriceConversion.USD);
   
   // After
   const price = await adapter.getCurrentPrice('BTC', 'USD');
   ```

## Deprecation Timeline

The old adapter implementation in the `adapters/` directory has been removed, but backward compatibility is maintained through the new implementation. The deprecated methods will be supported for at least 6 months before they are removed.