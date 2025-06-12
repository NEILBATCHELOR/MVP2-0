# infrastructure/web3/pricing — READMEnew.md

This folder provides an extensible price feed and asset pricing framework, enabling real-time and historical price retrieval for tokens and cryptocurrencies from multiple external sources. It supports caching, adapters for major APIs, and a unified interface for price queries and market analytics.

---

## Key Files

### BasePriceFeedAdapter.ts
- **BasePriceFeedAdapter** (abstract class): Common base for all price feed adapters.
  - Implements currency validation, error handling, and supported currency logic.
  - Subclasses must implement price fetching methods.

### CoinGeckoAdapter.ts, CoinGeckoPriceFeed.ts, CoinGeckoPriceFeedAdapter.ts
- **CoinGeckoAdapter / CoinGeckoPriceFeedAdapter**: Adapters for fetching token prices and historical data from the CoinGecko API.
- **CoinGeckoPriceFeed**: Concrete implementation for CoinGecko price feed logic (real-time and historical).

### CryptoComparePriceFeedAdapter.ts
- **CryptoComparePriceFeedAdapter**: Adapter for fetching prices from the CryptoCompare API.

### PriceFeedFactory.ts
- **PriceFeedFactory** (class): Factory for instantiating the correct price feed adapter for a given token or source.

### PriceFeedManager.ts
- **PriceFeedManager** (class): Manages multiple price feeds, caching, and fallback logic.
  - Handles price queries, error recovery, and adapter selection.

### PriceManager.ts
- **PriceManager** (class): High-level orchestration for all pricing operations.
  - Provides unified API for price, market data, and analytics.

### types.ts
- **Types and Interfaces**: Defines all types, interfaces, enums, and error classes for price feeds:
  - `PriceFeedAdapter`, `TokenPrice`, `PriceDataPoint`, `TokenMetadata`, `PriceInterval`, `PriceFeedError`, `PriceFeedErrorType`, `CacheOptions`, `MarketOverview`, and legacy compatibility types.

### demo.ts
- **Demo/utility script**: Example usage or test harness for the pricing system.

### index.ts
- **Barrel export** for all pricing modules and adapters.

### MIGRATION.md
- **Migration notes**: Documentation for migrating or updating the pricing framework.

### cache/
- **Subfolder for caching logic**: May contain in-memory or persistent cache implementations for price data.

---

## Usage

- Use `PriceManager` for high-level price queries and analytics.
- Use `PriceFeedManager` and `PriceFeedFactory` to manage and instantiate adapters for different sources.
- Adapters (CoinGecko, CryptoCompare, etc.) can be extended or replaced to support new APIs or data sources.
- All types and interfaces are defined in `types.ts` for strong typing and consistency.

---

## Developer Notes

- Adapters are designed for extension; implement new adapters by subclassing `BasePriceFeedAdapter`.
- All methods are async and return Promises.
- Caching and error handling are built-in for reliability and performance.
- Legacy types/interfaces are included for backward compatibility.
- Keep API keys and rate limits in mind when integrating new sources.

---

### Download Link
- [Download /memory-bank/infrastructure/web3/pricing/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/memory-bank/infrastructure/web3/pricing/READMEnew.md)
