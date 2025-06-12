# Investor Wallet Operations

This directory contains components and utilities for managing investor wallet operations.

## Components

### BulkWalletGeneration

A component that handles the bulk generation of Ethereum wallets for investors who don't have one assigned yet.

#### Features
- Fetches and displays investors without wallet addresses
- Allows bulk selection of investors
- Generates Ethereum wallets with private keys
- Updates investor records in the database
- Downloads a secure backup of wallet information
- Shows progress during wallet generation
- Provides security warnings and best practices

#### Usage
```tsx
import { BulkWalletGeneration } from '@/components/compliance/operations/investor/wallets';

function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Wallets for Investors</CardTitle>
        <CardDescription>
          Create Ethereum wallets for investors who don't have one yet
        </CardDescription>
      </CardHeader>
      <CardContent>
        <BulkWalletGeneration />
      </CardContent>
    </Card>
  );
}
```

#### Dependencies
- Supabase for database operations
- ETHWalletGenerator for wallet creation
- UI components from shadcn/ui
- React hooks for state management

#### Security Considerations
1. Private keys are only temporarily stored during generation
2. Backup file is downloaded immediately and not stored
3. Secure distribution of wallet access is recommended
4. Database only stores public wallet addresses

#### Database Schema
The component expects the following fields in the investors table:
- investor_id: string (primary key)
- name: string
- email: string
- type: string
- kyc_status: string
- company: string (optional)
- wallet_address: string (nullable)
- updated_at: timestamp

#### Type Definitions
Types are defined in `@/types/database.ts`:
```typescript
export interface InvestorWithoutWallet {
  investor_id: string;
  name: string;
  email: string;
  type: string;
  kyc_status: string;
  company?: string;
}