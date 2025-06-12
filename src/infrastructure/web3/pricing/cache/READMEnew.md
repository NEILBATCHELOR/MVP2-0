# infrastructure/web3/pricing/cache — READMEnew.md

This folder contains in-memory caching logic for price data within the pricing framework. The cache improves performance and reduces API calls by storing recent price queries and managing cache size and expiry.

## Files

### MemoryPriceCache.ts
- **MemoryPriceCache** (class):
  - Implements an in-memory cache for price data (`PriceData`).
  - Methods:
    - `set(symbol, data, currency)`: Stores price data with expiry and timestamp.
    - `get(symbol, currency)`: Retrieves cached price data if not expired.
    - `shouldRefresh(symbol, currency)`: Indicates if cached data should be refreshed based on age and expiry.
    - `clear()`: Clears the entire cache.
    - `clearSymbol(symbol)`: Removes all cached entries for a specific symbol.
    - `size`: Returns the number of cached entries.
  - Manages cache size by evicting oldest entries if the maximum size is exceeded.
  - Configurable TTL (time-to-live), refresh threshold, and max size via `CacheOptions`.

## Usage
- Used internally by `PriceFeedManager` and adapters to cache token price data.
- Reduces redundant external API calls and improves response times for frequent queries.

## Developer Notes
- Cache is in-memory only; not persistent across application restarts.
- Tune `CacheOptions` for optimal performance in production environments.
- Designed for extensibility if persistent or distributed caching is needed in future.

---

### Download Link
- [Download /src/infrastructure/web3/pricing/cache/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/src/infrastructure/web3/pricing/cache/READMEnew.md)
