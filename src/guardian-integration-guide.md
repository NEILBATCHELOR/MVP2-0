# 🛡️ Guardian Medex API Integration - Complete Setup Guide

## 📋 Overview

This guide provides step-by-step instructions for integrating Guardian Medex API with your Chain Capital platform for institutional-grade wallet management operations.

## 🎯 What This Integration Provides

- **Ed25519 Authenticated API Access** to Guardian Medex
- **Wallet as a Service (WaaS)** operations
- **Policy Engine Integration** for compliance
- **Polygon Amoy Testnet** support
- **Webhook Integration** for real-time events
- **Seamless Integration** with existing Chain Capital wallet system

## 📂 File Structure Created

```
/Users/neilbatchelor/Cursor/2/
├── packages/
│   ├── types/src/
│   │   └── guardian.ts                    # Guardian API types
│   └── infrastructure/src/guardian/
│       ├── GuardianAuth.ts                # Ed25519 authentication
│       ├── GuardianApiClient.ts           # API client
│       ├── GuardianConfig.ts              # Configuration service
│       ├── GuardianWalletService.ts       # Wallet operations
│       └── index.ts                       # Package exports
├── apps/backend/src/routes/api/guardian/
│   ├── webhooks.ts                        # Webhook handlers
│   ├── wallets.ts                         # Wallet API endpoints
│   └── index.ts                           # Route mounting
├── scripts/guardian/
│   └── generate-ed25519-keys.ts           # Key generation script
└── .env.guardian.example                  # Environment template
```

## 🔧 Step-by-Step Setup

### Step 1: Generate Ed25519 Key Pair

```bash
# Navigate to your project
cd /Users/neilbatchelor/Cursor/2

# Generate Ed25519 keys for Guardian API
pnpm tsx scripts/guardian/generate-ed25519-keys.ts
```

This script will output:
- **Private Key** (keep secret, add to .env)
- **Public Key** (share with Guardian Labs)
- **Email template** to send to Guardian Labs

### Step 2: Configure Environment Variables

```bash
# Copy environment template
cp .env.guardian.example .env.guardian

# Add the generated private key to your .env file
echo "GUARDIAN_PRIVATE_KEY=your_generated_private_key_here" >> .env
```

Required environment variables:
```bash
GUARDIAN_API_BASE_URL=https://api.medex.guardian-dev.com
GUARDIAN_PRIVATE_KEY=your_ed25519_private_key_hex
GUARDIAN_API_KEY=will_be_provided_by_guardian_labs
GUARDIAN_DEFAULT_WEBHOOK_URL=https://your-domain.com/api/guardian/webhooks
GUARDIAN_WEBHOOK_AUTH_KEY=your_webhook_auth_secret
GUARDIAN_EVENTS_HANDLER_URL=https://your-domain.com/api/guardian/events
```

### Step 3: Share Information with Guardian Labs

Send this information to Guardian Labs to receive your API key:

**Email Subject:** Guardian Medex API Integration - Public Key Submission

**Email Content:**
```
Hi Guardian Labs team,

Please find our Ed25519 public key for Guardian Medex API integration:

Public Key: [your_generated_public_key]

Additional Integration Details:
- Default Webhook URL: https://your-domain.com/api/guardian/webhooks
- Webhook Auth Key: [your_webhook_auth_key]
- Events Handler URL: https://your-domain.com/api/guardian/events

Please provide our API key once this public key is registered.

Best regards,
Chain Capital Development Team
```

### Step 4: Add API Key to Environment

Once Guardian Labs provides your API key:

```bash
# Add to your .env file
echo "GUARDIAN_API_KEY=your_provided_api_key" >> .env
```

### Step 5: Test Integration

```bash
# Build the packages
pnpm run build:packages

# Start your backend
pnpm run dev:backend

# Test Guardian API status
curl http://localhost:3001/api/guardian/status
```

## 🔌 API Endpoints Available

### Wallet Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/guardian/wallets` | List user's Guardian wallets |
| `POST` | `/api/guardian/wallets` | Create new Guardian wallet |
| `GET` | `/api/guardian/wallets/:id` | Get specific wallet |
| `PUT` | `/api/guardian/wallets/:id` | Update wallet |
| `DELETE` | `/api/guardian/wallets/:id` | Delete wallet |

### Transactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/guardian/wallets/:id/transactions` | Send transaction |
| `GET` | `/api/guardian/wallets/:id/transactions` | Get transaction history |

### Status & Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/guardian/status` | Check integration status |
| `POST` | `/api/guardian/webhooks` | Receive Guardian webhooks |
| `POST` | `/api/guardian/events` | Alternative events endpoint |

## 💻 Usage Examples

### Create Guardian Wallet

```typescript
import { GuardianWalletService } from '@chaincapital/infrastructure/guardian';

const walletService = new GuardianWalletService();

const wallet = await walletService.createGuardianWallet({
  name: "My Institutional Wallet",
  type: "EOA",
  userId: "user_123",
  blockchain: "polygon"
});

console.log('Created wallet:', wallet);
```

### Send Transaction

```typescript
const transaction = await walletService.sendTransaction({
  walletId: "guardian_wallet_id",
  to: "0x742d35Cc664C0532925a3b8D8A284ce8Ad7A3096",
  value: "1000000000000000000", // 1 ETH in wei
  gasLimit: "21000"
});

console.log('Transaction sent:', transaction);
```

### List User Wallets

```typescript
const wallets = await walletService.listUserGuardianWallets("user_123");
console.log('User Guardian wallets:', wallets);
```

## 🔒 Security Features

- **Ed25519 Request Signing** for all API calls
- **Webhook Signature Verification** for incoming events
- **Environment Variable Protection** for sensitive keys
- **Type-Safe API Client** with validation
- **Error Handling** with proper logging

## 🧪 Testing

### Test Guardian Integration

```bash
# Check if Guardian service is configured
pnpm tsx -e "
import { GuardianConfigService } from './packages/infrastructure/src/guardian/GuardianConfig';
const config = GuardianConfigService.getInstance();
console.log('Configured:', config.isConfigured());
console.log('Status:', config.getConfig());
"

# Test API connectivity (requires API key)
pnpm tsx -e "
import { GuardianWalletService } from './packages/infrastructure/src/guardian/GuardianWalletService';
const service = new GuardianWalletService();
service.healthCheck().then(healthy => console.log('API Health:', healthy));
"
```

### Manual API Testing

```bash
# Test status endpoint
curl -X GET http://localhost:3001/api/guardian/status

# Test wallet creation
curl -X POST http://localhost:3001/api/guardian/wallets \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Wallet",
    "type": "EOA",
    "blockchain": "polygon",
    "userId": "test_user_123"
  }'
```

## 🚨 Troubleshooting

### Common Issues

1. **"Guardian Auth requires both private key and API key"**
   - Check your .env file has both `GUARDIAN_PRIVATE_KEY` and `GUARDIAN_API_KEY`
   - Ensure the private key is in hex format (no spaces or special characters)

2. **"Guardian API Error: HTTP 401"**
   - Verify your API key is correct
   - Check that your public key was properly registered with Guardian Labs
   - Ensure Ed25519 signature is being generated correctly

3. **"Webhook signature verification failed"**
   - Verify the webhook URL is accessible from Guardian's servers
   - Check that the webhook auth key matches what you provided to Guardian Labs

4. **TypeScript import errors**
   - Run `pnpm run build:packages` to build the infrastructure package
   - Ensure all dependencies are installed: `pnpm install`

### Debug Mode

Enable debug logging for Guardian operations:

```bash
# Add to your .env
DEBUG=guardian:*

# Or set log level
LOG_LEVEL=debug
```

## 📊 Integration Status

✅ **Completed:**
- Ed25519 key generation script
- Guardian API types and interfaces
- Authentication service with request signing
- API client for all Guardian operations
- Wallet service integration
- Backend API endpoints
- Webhook handling infrastructure
- Environment configuration
- Documentation and setup guide

🔄 **Next Steps:**
1. Generate Ed25519 keys
2. Share public key with Guardian Labs
3. Receive and configure API key
4. Test wallet creation and operations
5. Set up webhook endpoints for production
6. Implement frontend components (optional)

## 🔗 Resources

- **Guardian API Documentation**: https://api.medex.guardian-dev.com/openapi
- **Guardian Policy Engine**: https://guardian-labs.gitbook.io/guardian-docs/guardian-universal-policy-engine
- **Chain Capital Platform**: Your existing tokenization infrastructure

## 🎉 Success Criteria

Your Guardian integration is working when:

1. ✅ Ed25519 keys generated successfully
2. ✅ Public key shared with Guardian Labs
3. ✅ API key received and configured
4. ✅ `/api/guardian/status` returns `configured: true, healthy: true`
5. ✅ Can create Guardian wallets via API
6. ✅ Can send transactions through Guardian wallets
7. ✅ Webhooks are received and processed correctly

**You're now ready for institutional-grade wallet management with Guardian Medex! 🚀**
