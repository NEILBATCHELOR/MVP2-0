# Utility Functions

This directory contains utility functions used throughout the application.

## ethersCompat.ts

The `ethersCompat.ts` file provides compatibility between different versions of ethers.js. This utility is particularly useful because our codebase uses ethers v5.7 but some of our code was written using v6 API patterns.

### Features

- Re-exports ethers v5 functions with v6-compatible names
- Provides constants like `ZeroAddress` that exist in v6 but not in v5
- Includes utility functions for creating providers and signers
- Handles type compatibility between versions

### Usage

```typescript
// Import from ethersCompat instead of directly from ethers
import { 
  parseUnits, 
  formatUnits, 
  ZeroAddress, 
  JsonRpcProvider, 
  BrowserProvider,
  isAddress,
  keccak256,
  toUtf8Bytes
} from '@/utils/ethersCompat';

// Use types
import type { Signer, Contract } from '@/utils/ethersCompat';

// Create a provider
const provider = new JsonRpcProvider('https://mainnet.infura.io/v3/your-key');

// Create a signer
const signer = createSigner(provider, privateKey);

// Use utility functions
const formattedAmount = parseUnits('1.0', 18);
const isValid = isAddress('0x123...');
```

### Benefits

- Allows the codebase to be consistent despite mixing v5 and v6 patterns
- Simplifies future migration to v6 when ready
- Centralizes ethers.js functionality for easier maintenance
- Reduces build errors from mismatched API usage

## Other Utilities

### typeUtils.ts

Type utilities and helper functions for handling type conversions and safety.

### dateUtils.ts

Utilities for formatting, parsing, and manipulating dates.

### stringUtils.ts

String manipulation utilities, including formatting and validation functions.

### validationUtils.ts

Functions for validating user input and data.

### formatUtils.ts

Utilities for formatting display values (numbers, addresses, etc.).
