# 🛡️ Guardian Medex API Integration - Test Page

## Overview

This integration provides comprehensive testing for the Guardian Medex API, enabling institutional-grade wallet management operations. The test page allows you to verify both working and problematic endpoints while debugging authentication and signature issues.

## 🎯 What's Working vs. What Needs Debugging

### ✅ **Currently Working**
- **POST /api/v1/wallets/create**: 200 OK responses confirmed
- **Ed25519 Authentication**: BASE64 signatures working perfectly
- **JSON Key Sorting**: Alphabetical sorting implemented correctly
- **Request Format**: Simple `{"id": "uuid"}` body format confirmed
- **Infrastructure**: All Guardian components updated and functional

### ❌ **Needs Investigation**
- **GET /api/v1/wallets**: Returns 403 Invalid Signature
- **GET /api/v1/wallets/{id}**: Returns 403 Invalid Signature  
- **GET /api/v1/operations/{id}**: Returns 403 Invalid Signature

The issue appears to be that GET requests require different signature generation than POST requests.

## 🚀 Accessing the Test Page

Navigate to: **`/wallet/guardian/test`**

Or directly visit: `http://localhost:3000/wallet/guardian/test`

## 📋 Test Page Features

### 1. **Create Wallet Tab** (✅ Working)
- Test POST /api/v1/wallets/create endpoint
- Configure wallet parameters (name, type, blockchain)
- Real-time response monitoring
- Operation ID tracking for async operations

### 2. **List Wallets Tab** (❌ Debugging)
- Test GET /api/v1/wallets endpoint
- Test GET /api/v1/operations endpoint
- Monitor signature generation for GET requests
- Compare with working POST signatures

### 3. **API Debug Tab** (🔧 Advanced)
- Manual API call configuration
- Preset test configurations
- Detailed signature payload inspection
- Request/response debugging tools
- Multiple signature format testing

### 4. **Status Tab** (📊 Overview)
- Integration status summary
- Working vs. problematic features
- Next steps and recommendations
- Troubleshooting guidance

## 🔧 Configuration Required

Before using the test page, ensure these environment variables are set:

```bash
# .env or .env.guardian
GUARDIAN_API_BASE_URL=https://api.medex.guardian-dev.com
GUARDIAN_PRIVATE_KEY=your_ed25519_private_key_hex
GUARDIAN_API_KEY=your_api_key_from_guardian_labs
GUARDIAN_DEFAULT_WEBHOOK_URL=https://your-domain.com/api/guardian/webhooks
GUARDIAN_WEBHOOK_AUTH_KEY=your_webhook_auth_secret
```

### Generate Keys
Use the key generation script:
```bash
pnpm tsx scripts/guardian/generate-ed25519-keys.ts
```

### Get API Key
Share your public key with Guardian Labs to receive your API key.

## 📁 File Structure

```
src/
├── components/guardian/
│   ├── GuardianTestPage.tsx          # Main test interface
│   ├── GuardianWalletCreation.tsx    # Wallet creation testing
│   ├── GuardianWalletList.tsx        # GET endpoints testing
│   ├── GuardianApiTester.tsx         # Advanced debugging tools
│   └── index.ts                      # Component exports
├── pages/wallet/
│   └── GuardianTestPage.tsx          # Page wrapper
├── infrastructure/guardian/
│   ├── GuardianAuth.ts               # Ed25519 authentication (✅ Working)
│   ├── GuardianApiClient.ts          # API client (✅ POST working, ❌ GET issues)
│   ├── GuardianWalletService.ts      # Wallet operations (✅ Working)
│   └── GuardianConfig.ts             # Configuration management
└── types/guardian/
    └── guardian.ts                   # TypeScript types
```

## 🧪 Testing Workflow

### 1. **Test Working Features**
1. Navigate to **Create Wallet** tab
2. Configure wallet parameters
3. Click "Create Guardian Wallet"
4. Verify 200 OK response and operation ID

### 2. **Debug GET Issues**
1. Navigate to **List Wallets** tab  
2. Click "Run GET Tests"
3. Observe 403 Invalid Signature errors
4. Compare signature generation with working POST

### 3. **Advanced Debugging**
1. Navigate to **API Debug** tab
2. Try preset test configurations
3. Enable "Show Signature Details"
4. Test different signature approaches:
   - Include/exclude body in signature
   - Include/exclude Content-Type header
   - Different timestamp/nonce formats

### 4. **Monitor Results**
1. Check **Status** tab for overall integration health
2. Review console logs for detailed request/response data
3. Copy signature payloads for external analysis

## 🔍 Known Signature Generation Differences

### **POST Requests (Working)**
```typescript
// Signature payload format:
const payload = `${method}${url}${sortedJsonBody}${timestamp}${nonce}`;

// Example:
"POSThttps://api.medex.guardian-dev.com/api/v1/wallets/create{\"id\":\"uuid\"}1748960772167abc-123-def"

// Result: 200 OK
```

### **GET Requests (Failing)**
```typescript
// Current approach (failing):
const payload = `${method}${url}${emptyBody}${timestamp}${nonce}`;

// Example:
"GEThttps://api.medex.guardian-dev.com/api/v1/wallets1748960772167abc-123-def"

// Result: 403 Invalid Signature
```

## 💡 Debugging Strategies

The test page provides several approaches to try:

1. **Remove body entirely from GET signature**
2. **Exclude Content-Type header for GET requests**
3. **Try different timestamp/nonce formats**
4. **Test with URL query parameters**
5. **Try HEX signature format instead of BASE64**

## 📧 Contact Guardian Labs

If debugging doesn't resolve the GET request issues, contact Guardian Labs with:

- **Working POST example**: Include successful wallet creation details
- **Failing GET example**: Include signature payload and error response
- **Request for GET signature documentation**: Specific format requirements

## 🎉 Success Criteria

The integration is considered complete when:
- ✅ POST /api/v1/wallets/create returns 200 OK (DONE)
- ⏳ GET /api/v1/wallets returns 200 OK (IN PROGRESS)
- ⏳ GET /api/v1/operations/{id} returns 200 OK (IN PROGRESS)
- ⏳ Operation status polling works correctly (PENDING GET FIXES)
- ⏳ Webhook integration functional (FUTURE)

## 🔗 Resources

- **Guardian API Documentation**: https://api.medex.guardian-dev.com/openapi
- **Guardian Policy Engine**: https://guardian-labs.gitbook.io/guardian-docs/guardian-universal-policy-engine
- **Ed25519 Standard**: RFC 8032
- **Test Page**: `/wallet/guardian/test`

---

**Status**: ✅ POST working perfectly, ❌ GET signatures need debugging
**Last Updated**: June 3, 2025
**Ready for**: Guardian Labs consultation on GET request signatures
