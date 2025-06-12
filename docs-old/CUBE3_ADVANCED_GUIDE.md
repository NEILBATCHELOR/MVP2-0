# CUBE3 Advanced Implementation Guide

This guide covers advanced features of the CUBE3 integration for blockchain security and risk assessment.

## Table of Contents

- [Control Lists Management](#control-lists-management)
- [Transaction Verification](#transaction-verification)
- [Contract Risk Analysis](#contract-risk-analysis)
- [Continuous Monitoring](#continuous-monitoring)
- [Advanced Risk Scoring](#advanced-risk-scoring)
- [Batch Processing](#batch-processing)
- [SDK Initialization Options](#sdk-initialization-options)

## Control Lists Management

Control lists allow you to maintain your own allowlists and blocklists of addresses.

### Creating and Managing Lists

```typescript
import { 
  createControlList, 
  addAddressToControlList, 
  removeAddressFromControlList,
  getControlLists 
} from '@/lib/services/cube3Service';

// Create a new allowlist
const createAllowlist = async () => {
  const result = await createControlList(
    "Trusted Partners", 
    "allowlist", 
    "Verified partners we trust for transactions"
  );
  
  if (result.success) {
    console.log("Created list with ID:", result.data.id);
  }
};

// Add address to a list
const addTrustedAddress = async (listId, address) => {
  const result = await addAddressToControlList(
    listId,
    address,
    1, // Ethereum mainnet
    "Verified institutional partner",
    // Optional expiration date (ISO string)
    new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
  );
  
  if (result.success) {
    console.log("Added address to list:", result.data);
  }
};

// Remove address from a list
const removeAddress = async (listId, entryId) => {
  const result = await removeAddressFromControlList(listId, entryId);
  
  if (result.success) {
    console.log("Address removed from list");
  }
};

// Get all control lists
const fetchLists = async () => {
  const result = await getControlLists();
  
  if (result.success) {
    console.log("Control lists:", result.data);
  }
};
```

### Using Control Lists in Your Application

Control lists can be used to:

1. **Pre-approve transactions**: Only allow transactions with addresses on your allowlist
2. **Block risky interactions**: Prevent interactions with addresses on your blocklist
3. **Implement compliance controls**: Maintain lists of sanctions or other regulatory requirements

```tsx
import { useEffect, useState } from 'react';
import { getControlLists } from '@/lib/services/cube3Service';

function ControlListsExample() {
  const [lists, setLists] = useState([]);
  
  useEffect(() => {
    const fetchLists = async () => {
      const result = await getControlLists();
      if (result.success) {
        setLists(result.data);
      }
    };
    
    fetchLists();
  }, []);
  
  return (
    <div>
      <h2>Your Control Lists</h2>
      <div>
        {lists.map(list => (
          <div key={list.id}>
            <h3>{list.name} ({list.type})</h3>
            <p>{list.description}</p>
            <p>Entries: {list.entries.length}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Transaction Verification

The CUBE3 integration provides advanced transaction verification capabilities.

### Basic Transaction Verification

```typescript
import { verifyTransaction } from '@/lib/services/cube3Service';

// Verify a transaction before sending
const checkTransaction = async (rawTxData) => {
  const result = await verifyTransaction(rawTxData, 1); // Chain ID 1 = Ethereum
  
  if (result.success) {
    if (result.data.safe) {
      console.log("Transaction appears safe");
      return true;
    } else {
      console.warn(
        `Transaction may be risky: ${result.data.riskLevel} risk level`
      );
      return false;
    }
  } else {
    console.error("Failed to verify transaction:", result.error);
    return false;
  }
};
```

### Enhanced Transaction Simulation

For more detailed transaction analysis, use the simulation API:

```typescript
import { simulateTransaction } from '@/lib/services/cube3Service';

// Simulate transaction execution
const simulateTx = async (rawTxData) => {
  const result = await simulateTransaction(rawTxData, 1);
  
  if (result.success) {
    console.log("Simulation successful:", result.data);
    console.log("Gas estimate:", result.data.gasEstimate);
    
    if (result.data.warnings && result.data.warnings.length > 0) {
      console.warn("Simulation warnings:", result.data.warnings);
    }
    
    return result.data.successful;
  } else {
    console.error("Simulation failed:", result.error);
    return false;
  }
};
```

### User-Friendly Transaction Validation

For a complete user experience, use the helper function that includes UI feedback:

```typescript
import { validateTransactionForUser } from '@/lib/services/cube3Service';

// In a web3 application
async function sendTransaction() {
  // Get transaction data from your web3 library
  const txData = await prepareTransaction();
  
  // Validate transaction with user feedback
  const isValid = await validateTransactionForUser(txData);
  
  if (isValid) {
    // Proceed with transaction
    await web3.eth.sendTransaction(txData);
  } else {
    // User has been warned, they may still choose to proceed
    if (confirmRiskyTransaction()) {
      await web3.eth.sendTransaction(txData);
    }
  }
}
```

## Contract Risk Analysis

Inspect smart contracts for security risks using the CUBE3 Inspector API.

### Using the Contract Analysis API

```typescript
import { inspectContract } from '@/lib/services/cube3Service';

// Analyze a smart contract
const analyzeContract = async (contractAddress) => {
  const result = await inspectContract(contractAddress, 1);
  
  if (result.success) {
    console.log("Contract analysis:", result.data);
    console.log("Risk score:", result.data.riskScore);
    console.log("Verified:", result.data.verified);
    console.log("Audited:", result.data.audited);
    
    if (result.data.riskFactors && result.data.riskFactors.length > 0) {
      console.warn("Risk factors:", result.data.riskFactors);
    }
  } else {
    console.error("Contract analysis failed:", result.error);
  }
};
```

### Using the Contract Risk Check Component

```tsx
import { ContractRiskCheck } from '@/components/wallet/ContractRiskCheck';

function ContractAnalysisExample() {
  return (
    <div>
      <h2>Contract Security Analysis</h2>
      
      {/* With input field for user to enter address */}
      <ContractRiskCheck showInput={true} />
      
      {/* For a specific contract */}
      <ContractRiskCheck 
        address="0x1234567890abcdef1234567890abcdef12345678" 
        chainId={1}
        showInput={false}
        title="USDC Contract Security" 
      />
    </div>
  );
}
```

## Continuous Monitoring

Set up monitoring for addresses of interest to receive alerts on suspicious activity.

### Creating a Monitor

```typescript
import { createMonitor, getMonitors, addAddressesToMonitor } from '@/lib/services/cube3Service';

// Create a new monitor
const setupMonitor = async () => {
  const result = await createMonitor(
    "Customer Wallets", 
    [
      { address: "0x1234...", chainId: 1, label: "Customer A" },
      { address: "0xabcd...", chainId: 1, label: "Customer B" }
    ],
    ["webhook:https://your-api.com/cube3-alerts"], // Alert endpoints
    "Monitoring high-value customer wallets"
  );
  
  if (result.success) {
    console.log("Monitor created with ID:", result.data.monitorId);
  }
};

// List all monitors
const listMonitors = async () => {
  const result = await getMonitors();
  
  if (result.success) {
    console.log("Active monitors:", result.data);
  }
};

// Add addresses to existing monitor
const addAddresses = async (monitorId) => {
  const result = await addAddressesToMonitor(
    monitorId,
    [
      { address: "0x5678...", chainId: 1, label: "Customer C" },
      { address: "0xdef0...", chainId: 1, label: "Customer D" }
    ]
  );
  
  if (result.success) {
    console.log("Addresses added to monitor");
  }
};
```

### Client-Side Monitoring

For client-side monitoring without server alerts, use the following:

```typescript
import { monitorAddress } from '@/lib/services/cube3Service';

// Start monitoring an address with callbacks
const startMonitoring = () => {
  const monitor = monitorAddress(
    "0x1234...", 
    1, 
    (assessment) => {
      console.log("Updated risk assessment:", assessment);
      if (assessment.riskLevel === 'high') {
        console.warn("High risk detected!");
        notifyUser("Security risk detected for your wallet");
      }
    },
    3600000 // Check every hour (in milliseconds)
  );
  
  // Later, stop monitoring if needed
  // monitor.stop();
  
  return monitor;
};
```

## Advanced Risk Scoring

Get detailed risk analysis for wallet addresses.

### Detailed Wallet Analysis

```typescript
import { analyzeWalletRiskDetailed } from '@/lib/services/cube3Service';

// Get detailed risk analysis for a wallet
const getDetailedRisk = async (address) => {
  const result = await analyzeWalletRiskDetailed(
    address,
    1, // Chain ID
    {
      includeTransactionHistory: true,
      includeTokenBalances: true,
      lookbackDays: 30
    }
  );
  
  if (result.success) {
    console.log("Detailed risk analysis:", result.data);
    
    // Process transaction patterns
    if (result.data.transactionPatterns) {
      console.log("Unusual patterns:", result.data.transactionPatterns);
    }
    
    // Check connected entities
    if (result.data.connectedEntities) {
      console.log("Connected to:", result.data.connectedEntities);
    }
  }
};
```

## Batch Processing

Check multiple addresses efficiently.

```typescript
import { checkMultipleAddresses } from '@/lib/services/cube3Service';

// Check multiple addresses at once
const batchCheck = async () => {
  const addresses = [
    { address: "0x1111...", chainId: 1 },
    { address: "0x2222...", chainId: 1 },
    { address: "0x3333...", chainId: 1 },
    { address: "0x4444...", chainId: 1 }
  ];
  
  const results = await checkMultipleAddresses(addresses);
  
  // Process results
  results.forEach(result => {
    if (result.success) {
      console.log(`Address ${result.address}: ${result.riskLevel} risk`);
    } else {
      console.error(`Failed to check ${result.address}: ${result.error}`);
    }
  });
  
  // Get high risk addresses
  const highRiskAddresses = results
    .filter(r => r.success && r.riskLevel === 'high')
    .map(r => r.address);
    
  console.log("High risk addresses:", highRiskAddresses);
};
```

## SDK Initialization Options

The CUBE3 service can be initialized with various options:

```typescript
import { initializeCube3 } from '@/lib/cube3Init';

// Basic initialization from environment variables
initializeCube3();

// Custom initialization
initializeCube3({
  apiKey: "your_api_key_here", // Override env var
  apiUrl: "https://custom-api.cube3.ai/v2", // Custom API URL
  debug: true, // Enable debug logging
  defaultChainId: 137, // Polygon mainnet
  onInitSuccess: () => {
    console.log("CUBE3 initialized successfully");
    showStatusIndicator(true);
  },
  onInitError: (error) => {
    console.error("CUBE3 initialization failed:", error);
    showStatusIndicator(false);
  }
});
```

### Environment Variables

Configure the following environment variables for CUBE3:

```
# Required
NEXT_PUBLIC_CUBE3_API_KEY=your_cube3_api_key

# Optional
NEXT_PUBLIC_CUBE3_API_URL=https://api.cube3.ai/v2
NEXT_PUBLIC_CUBE3_DEBUG=false
NEXT_PUBLIC_CUBE3_DEFAULT_CHAIN_ID=1
```

## Supported Blockchain Networks

Get a list of all supported networks:

```typescript
import { getSupportedNetworks } from '@/lib/services/cube3Service';

// Get list of all supported blockchain networks
const fetchNetworks = async () => {
  const result = await getSupportedNetworks();
  
  if (result.success) {
    console.log("Supported networks:", result.data);
    
    // Create a chain ID to name mapping
    const chainIdToName = result.data.reduce((acc, network) => {
      acc[network.chainId] = network.name;
      return acc;
    }, {});
    
    console.log("Chain ID 1 =", chainIdToName[1]); // "Ethereum Mainnet"
  }
};
``` 