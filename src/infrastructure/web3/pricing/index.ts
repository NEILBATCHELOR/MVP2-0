// Export types and interfaces
export * from './types';

// Export base adapter
export * from './BasePriceFeedAdapter';

// Export concrete adapters
export * from './CoinGeckoPriceFeedAdapter';
export * from './CryptoComparePriceFeedAdapter';

// Export manager and factory
export * from './PriceFeedManager';
export * from './PriceManager';

// For backward compatibility, also export the classic (legacy) API
import { CoinGeckoPriceFeedAdapter } from './CoinGeckoPriceFeedAdapter';
import { CryptoComparePriceFeedAdapter } from './CryptoComparePriceFeedAdapter';

// Legacy named exports for backward compatibility
export { 
  CoinGeckoPriceFeedAdapter as CoinGeckoAdapter,
  CryptoComparePriceFeedAdapter as CryptoCompareAdapter
};

// This ensures consumers of the API don't need to change their imports
// when migrating from the old structure to the new one