# Uniswap V4 Integration

This directory contains the implementation for Uniswap V4 integration using a parallel strategy. This approach maintains support for V2/V3 alongside V4, ensuring a smooth transition and optimal user experience.

## Key Files

- `uniswapV4Service.ts` - Core service for interacting with Uniswap V4 contracts
- `uniswapV4Contracts.ts` - Contract addresses, ABIs, and helper functions

## Implementation Strategy

The implementation follows a parallel approach that:

1. **Maintains backward compatibility** - V2/V3 operations continue to work smoothly
2. **Provides version selection** - Users can explicitly choose a version or use automatic selection
3. **Optimizes for gas savings** - Intelligently selects V4 for operations where it provides significant benefits
4. **Enables hook discovery** - Users can explore and utilize V4's custom hooks

## User Experience Enhancements

- **Version Selector** - Allows users to switch between versions or use automatic selection
- **Hook Selector** - For V4 swaps, displays available hooks with details on their functionality
- **Gas Comparison** - Shows gas cost differences between versions to help users make informed decisions
- **Progressive Disclosure** - Advanced V4 features are presented in a way that doesn't overwhelm users

## Technical Benefits

1. **Gas Efficiency**: Creating new pools with V4 is up to 99.99% cheaper than previous versions
2. **Native ETH Support**: Direct ETH trading without wrapping, adding significant savings for ETH pairs
3. **Custom Hooks**: Support for dynamic fees, limit orders, and other advanced features
4. **Multi-Chain Support**: Works across Ethereum, Polygon, Arbitrum, Optimism, Base, and more

## Progressive Adoption Plan

The integration follows a phased approach:

### Phase 1: Initial Integration (Current)
- Parallel implementation with opt-in V4 support
- Basic hook support for key functionality
- Version comparison and selection

### Phase 2: Feature Parity (Planned)
- Enhanced hook discovery and specialized UI
- Gas comparison metrics
- Promotion of V4 benefits in the UI

### Phase 3: Default Transition (Future)
- Make V4 the default for operations with clear benefits
- Data-driven recommendations in the UI
- Maintain V2/V3 options for continuity

## Usage Example

```typescript
// Get a quote with explicit version selection
const quote = await swapService.getQuoteWithVersion(
  fromToken,
  toToken,
  amount,
  slippage,
  "v4",                // Specify version or use "auto"
  hookAddress,         // Optional hook address
  "auto"               // Provider selection
);

// Execute a swap with explicit version selection
const txHash = await swapService.executeSwapWithVersion(
  fromToken,
  toToken,
  amount,
  slippage,
  walletAddress,
  "v4",                // Specify version or use "auto"
  hookAddress,         // Optional hook address
  "auto",              // Provider selection
  "medium"             // Gas option
);
```

## References

1. [Uniswap V4 Documentation](https://docs.uniswap.org/concepts/protocol/v4)
2. [How Uniswap V4 and UniswapX Work Together](https://blog.uniswap.org/how-uniswapv4-uniswapx-work-together)
3. [Uniswap V4 Technical Overview](https://blog.uniswap.org/uniswap-v4) 