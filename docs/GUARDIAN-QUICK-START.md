# 🛡️ Guardian Integration - Idiots Guide

## 🚨 **You're Getting a 404 Because...**

Your frontend (localhost:5173) isn't talking to your backend (localhost:3001). Fixed this with proxy configuration.

## ⚡ **Quick Start (3 steps)**

### 1️⃣ **Start Backend Server**
```bash
# Terminal 1: Start backend API server
pnpm run dev:backend
# Should show: "API server running on port 3001"
```

### 2️⃣ **Start Frontend Server** 
```bash
# Terminal 2: Start frontend (with NEW proxy config)
pnpm run dev
# Should show: "Local: http://localhost:5173/"
```

### 3️⃣ **Test Guardian API**
```bash
# Terminal 3: Test everything works
pnpm tsx guardian-test.ts
```

## 🔍 **What Was Wrong?**

**Before**: 
- Frontend calls `/api/guardian/wallets` 
- Goes to Vite server (localhost:5173) → 404 error

**After**: 
- Frontend calls `/api/guardian/wallets` 
- Vite proxy forwards to backend (localhost:3001) → ✅ works

## 🧪 **Test Your Setup**

### Manual Test 1: Backend Health
```bash
curl http://localhost:3001/api/health
# Should return: {"status":"ok","version":"1.0.0"}
```

### Manual Test 2: Guardian Status  
```bash
curl http://localhost:3001/api/guardian/status
# Should return Guardian configuration status
```

### Manual Test 3: Create Wallet
```bash
curl -X POST http://localhost:3001/api/guardian/wallets \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Wallet",
    "type": "EOA", 
    "blockchain": "polygon",
    "userId": "test-123"
  }'
```

### Manual Test 4: Frontend Proxy
```bash
# With frontend running, test proxy:
curl http://localhost:5173/api/health
# Should proxy to backend and return same result as Test 1
```

## 🎯 **Guardian Demo Page**

Your Guardian demo page should now work! Visit:
```
http://localhost:5173/guardian
```

## 📁 **What's Already Implemented**

✅ **Backend API Routes**: `/src/routes/guardian/`
- `GET /api/guardian/wallets` - List wallets
- `POST /api/guardian/wallets` - Create wallet  
- `GET /api/guardian/wallets/:id` - Get wallet
- `PUT /api/guardian/wallets/:id` - Update wallet
- `DELETE /api/guardian/wallets/:id` - Delete wallet
- `POST /api/guardian/wallets/:id/transactions` - Send transaction
- `GET /api/guardian/status` - Check status

✅ **Guardian Infrastructure**: `/src/infrastructure/guardian/`
- `GuardianApiClient.ts` - API client with Ed25519 auth
- `GuardianAuth.ts` - Request signing
- `GuardianConfig.ts` - Environment configuration  
- `GuardianWalletService.ts` - Wallet operations

✅ **Guardian Types**: `/src/types/guardian/guardian.ts`
- All TypeScript interfaces
- Zod validation schemas

✅ **React Components**: `/src/components/guardian/`
- `GuardianWalletCreation.tsx` - Wallet creation form

✅ **Environment Variables**: `.env`
- Guardian API keys are configured
- Ed25519 keys are set up

## 🔐 **Guardian Configuration Status**

Your Guardian keys are already configured:
- ✅ `GUARDIAN_API_BASE_URL`: https://api.medex.guardian-dev.com
- ✅ `GUARDIAN_PRIVATE_KEY`: c369400e32...
- ✅ `GUARDIAN_PUBLIC_KEY`: 14a858445f...  
- ✅ `GUARDIAN_API_KEY`: 24a8533f-216d...

## 🚀 **You're Ready For Guardian Operations!**

1. **Wallet Creation**: Institutional-grade wallets via Guardian Medex
2. **Ed25519 Authentication**: Secure API request signing  
3. **Policy Engine**: Compliance and validation rules
4. **Polygon Amoy Testnet**: Live blockchain operations
5. **Real-time Events**: Webhook integration ready

## 🔧 **Troubleshooting**

### ❌ "Connection refused" 
- Backend not running → `pnpm run dev:backend`

### ❌ "404 Not Found"
- Proxy not working → restart frontend after vite.config.ts change

### ❌ "Guardian API Error"  
- Check environment variables in `.env`
- Verify API key with Guardian Labs

### ❌ TypeScript errors
- Run `pnpm run build:types` 
- Check import paths use `@/` prefix

## 📞 **Support**

If still having issues:
1. Check both servers are running (`localhost:3001` + `localhost:5173`)
2. Run the test script: `pnpm tsx guardian-test.ts`  
3. Check browser console for detailed error messages
4. Verify your Guardian API key is valid

**Your Guardian integration is 99% complete - just needed the proxy fix! 🎉**
