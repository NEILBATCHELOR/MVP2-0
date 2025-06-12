import { PriceFeedManager } from './PriceFeedManager';
import { CoinGeckoPriceFeedAdapter } from './CoinGeckoPriceFeedAdapter';
import { PriceInterval } from './types';

/**
 * Demo function showing how to use the price feed adapters and manager
 */
export async function runPriceFeedDemo() {
  console.log('====== Crypto Price Feed Demo ======');
  
  // Create individual adapters
  const coinGeckoAdapter = new CoinGeckoPriceFeedAdapter();
  
  console.log(`Created ${coinGeckoAdapter.getName()} adapter`);
  console.log(`Supported currencies: ${coinGeckoAdapter.getSupportedCurrencies().join(', ')}`);
  
  // Create price feed manager with the CoinGecko adapter
  const priceFeedManager = new PriceFeedManager({
    defaultAdapter: coinGeckoAdapter,
    defaultCurrency: 'USD',
    cacheTtlMs: 60000, // 1 minute
    logLevel: 'info'
  });
  
  console.log('\n---- Current Price Demo ----');
  
  try {
    // Get current BTC price
    const btcPrice = await priceFeedManager.getCurrentPrice('BTC');
    console.log(`BTC price: $${btcPrice.price.toLocaleString()} USD`);
    console.log(`24h change: ${btcPrice.priceChange24h?.toFixed(2)}%`);
    console.log(`Market cap: $${btcPrice.marketCap?.toLocaleString()} USD`);
    console.log(`Last updated: ${new Date(btcPrice.lastUpdated).toLocaleString()}`);
  } catch (error) {
    console.error('Failed to get BTC price:', error);
  }
  
  console.log('\n---- Multiple Prices Demo ----');
  
  try {
    // Get multiple token prices
    const tokens = ['BTC', 'ETH', 'SOL', 'NEAR', 'AVAX'];
    const prices = await priceFeedManager.getMultiplePrices(tokens);
    
    console.log('Current prices:');
    for (const symbol of tokens) {
      if (prices[symbol]) {
        console.log(`${symbol}: $${prices[symbol].price.toLocaleString()} USD`);
      } else {
        console.log(`${symbol}: N/A`);
      }
    }
  } catch (error) {
    console.error('Failed to get multiple prices:', error);
  }
  
  console.log('\n---- Historical Price Demo ----');
  
  try {
    // Get historical ETH price data (7 days, daily interval)
    const ethHistory = await priceFeedManager.getHistoricalPrices('ETH', 'USD', 7, PriceInterval.DAY);
    
    console.log(`ETH price history (${ethHistory.length} data points):`);
    for (const dataPoint of ethHistory) {
      console.log(`${new Date(dataPoint.timestamp).toLocaleDateString()}: $${dataPoint.price.toLocaleString()} USD`);
    }
  } catch (error) {
    console.error('Failed to get historical prices:', error);
  }
  
  console.log('\n---- Token Metadata Demo ----');
  
  try {
    // Get token metadata
    const solMetadata = await priceFeedManager.getTokenMetadata('SOL');
    
    console.log(`Token information for ${solMetadata.symbol}:`);
    console.log(`Name: ${solMetadata.name}`);
    console.log(`Description: ${solMetadata.description?.substring(0, 100)}...`);
    console.log(`Website: ${solMetadata.website || 'N/A'}`);
    console.log(`Twitter: ${solMetadata.socialLinks?.twitter || 'N/A'}`);
  } catch (error) {
    console.error('Failed to get token metadata:', error);
  }
  
  console.log('\n====== Demo Complete ======');
}

// Run the demo if this file is executed directly
if (require.main === module) {
  runPriceFeedDemo().catch(error => {
    console.error('Demo failed:', error);
  });
}