# Import Migration Guide: ProviderManager → RPCConnectionManager

## **Quick Reference**

| Old Import | New Import | Notes |
|------------|------------|-------|
| `providerManager` | `rpcManager` | Global instance with same functionality |
| `NetworkEnvironment` | `NetworkType` | Type renamed for consistency |
| `ProviderManager` | `RPCConnectionManager` | Class name (rarely needed) |

## **Correct Import Patterns**

### **1. Basic Usage (Most Common)**
```typescript
// ✅ For most use cases
import { rpcManager, type NetworkType } from '@/infrastructure/web3';

// Usage
const rpcUrl = rpcManager.getRPCUrl('ethereum', 'mainnet');
const health = rpcManager.getHealthMetrics();
```

### **2. Extended Usage**
```typescript
// ✅ For advanced RPC operations
import { 
  rpcManager, 
  type NetworkType, 
  type SupportedChain, 
  type RPCConfig, 
  type RPCProvider 
} from '@/infrastructure/web3';

// Usage
const provider = rpcManager.getOptimalProvider('ethereum', 'mainnet');
const config = rpcManager.getProviderConfig('ethereum', 'mainnet');
```

### **3. Configuration Utilities**
```typescript
// ✅ For debugging and configuration
import { 
  getConfiguredEndpoints, 
  isChainConfigured 
} from '@/infrastructure/web3';

// Usage
const isEthConfigured = isChainConfigured('ethereum', 'mainnet');
const allEndpoints = getConfiguredEndpoints();
```

### **4. Factory Integration**
```typescript
// ✅ For creating blockchain adapters
import { BlockchainFactory } from '@/infrastructure/web3';

// Usage - automatically uses optimal RPC provider
const adapter = await BlockchainFactory.createAdapter('ethereum', 'mainnet');
```

## **Method Mapping**

### **Old ProviderManager Methods → New RPCManager Methods**

```typescript
// ❌ Old (if it existed)
providerManager.getUrl('ethereum', 'mainnet');
providerManager.getConfig('ethereum', 'mainnet');
providerManager.isHealthy('ethereum');

// ✅ New
rpcManager.getRPCUrl('ethereum', 'mainnet');
rpcManager.getProviderConfig('ethereum', 'mainnet');
rpcManager.getHealthMetrics();
```

## **Type Mapping**

```typescript
// ❌ Old types
type NetworkEnvironment = 'mainnet' | 'testnet' | 'devnet';

// ✅ New types
type NetworkType = 'mainnet' | 'testnet' | 'devnet' | 'regtest';
type SupportedChain = 'ethereum' | 'polygon' | 'bitcoin' | 'solana' | /* ... */;
```

## **Complete Examples**

### **Example 1: Get RPC Configuration**
```typescript
import { rpcManager, type NetworkType, type SupportedChain } from '@/infrastructure/web3';

function getRPCConfiguration(chain: SupportedChain, network: NetworkType) {
  const rpcUrl = rpcManager.getRPCUrl(chain, network);
  const config = rpcManager.getProviderConfig(chain, network);
  
  return {
    url: rpcUrl,
    config: config
  };
}
```

### **Example 2: Health Monitoring**
```typescript
import { rpcManager } from '@/infrastructure/web3';

function checkRPCHealth() {
  const metrics = rpcManager.getHealthMetrics();
  
  console.log(`Healthy providers: ${metrics.healthyProviders}/${metrics.totalProviders}`);
  console.log(`Average latency: ${metrics.averageLatency}ms`);
  
  return metrics;
}
```

### **Example 3: Chain Configuration Check**
```typescript
import { isChainConfigured, getConfiguredEndpoints } from '@/infrastructure/web3';

function validateChainSetup() {
  const chains = ['ethereum', 'polygon', 'bitcoin', 'solana'] as const;
  const networks = ['mainnet', 'testnet'] as const;
  
  for (const chain of chains) {
    for (const network of networks) {
      const configured = isChainConfigured(chain, network);
      console.log(`${chain} ${network}: ${configured ? 'CONFIGURED' : 'MISSING'}`);
    }
  }
  
  // Show all configured endpoints
  const endpoints = getConfiguredEndpoints();
  console.log('All endpoints:', endpoints);
}
```

## **Best Practices**

### **1. Use Global Instance**
```typescript
// ✅ Preferred - use global instance
import { rpcManager } from '@/infrastructure/web3';

// ❌ Avoid - creating new instances
import { RPCConnectionManager } from '@/infrastructure/web3/rpc/RPCConnectionManager';
const myManager = new RPCConnectionManager(); // Not recommended
```

### **2. Import from Main Module**
```typescript
// ✅ Preferred - clean imports
import { rpcManager, type NetworkType } from '@/infrastructure/web3';

// ❌ Avoid - deep imports
import { rpcManager } from '@/infrastructure/web3/rpc/RPCConnectionManager';
import { NetworkType } from '@/infrastructure/web3/adapters/IBlockchainAdapter';
```

### **3. Use Type Imports**
```typescript
// ✅ Good - explicit type imports
import { rpcManager, type NetworkType, type SupportedChain } from '@/infrastructure/web3';

// ❌ Avoid - mixing value and type imports
import { rpcManager, NetworkType, SupportedChain } from '@/infrastructure/web3';
```

## **Integration with BlockchainFactory**

The `BlockchainFactory` automatically uses the `rpcManager`, so you don't need to manage RPC connections manually:

```typescript
import { BlockchainFactory } from '@/infrastructure/web3';

// This automatically:
// 1. Gets optimal RPC provider from rpcManager
// 2. Uses your environment-configured endpoints
// 3. Includes health monitoring and failover
const adapter = await BlockchainFactory.createAdapter('ethereum', 'mainnet');
```

---

**Summary**: Replace `providerManager` with `rpcManager` and `NetworkEnvironment` with `NetworkType`. Import from `@/infrastructure/web3` for clean, type-safe access to the RPC management system.
