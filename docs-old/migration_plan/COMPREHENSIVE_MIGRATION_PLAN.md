# 🚀 Comprehensive Migration Plan - Chain Capital Platform
## From `/Users/neilbatchelor/Cursor/1` to `/Users/neilbatchelor/chain-capital-production`

---

## 📋 Current Project Analysis

### **Existing Structure Assessment**
- **Total Dependencies**: 120+ packages including extensive Web3 libraries
- **Current Size**: Large monolithic React app with backend infrastructure
- **Architecture**: Frontend + infrastructure mixed in single `src/` directory
- **Database**: Supabase with 100+ migrations
- **Smart Contracts**: Foundry setup with 6 ERC standards
- **Type System**: Comprehensive TypeScript with shared types

### **Key Challenges Identified**
1. **Archive Directory**: 500+ duplicate/old files that need cleanup
2. **Mixed Concerns**: Frontend and backend logic intermingled
3. **Type System**: Fragmented across multiple files
4. **Dependencies**: Heavy Web3 polyfills affecting build performance
5. **No API Documentation**: Missing Swagger/OpenAPI

---

## 🗺️ File Migration Mapping

### **Phase 1: Frontend Migration (`/src` → `/apps/frontend/src`)**

#### **Core React App**
```bash
# Root App Files
/src/App.tsx                           → /apps/frontend/src/App.tsx
/src/main.tsx                          → /apps/frontend/src/main.tsx
/src/index.css                         → /apps/frontend/src/index.css
/src/react-shim.js                     → /apps/frontend/src/react-shim.js

# Configuration
/tailwind.config.js                    → /apps/frontend/tailwind.config.js
/postcss.config.js                     → /apps/frontend/postcss.config.js
/components.json                       → /apps/frontend/components.json
/vite.config.ts                        → /apps/frontend/vite.config.ts
/vitest.config.ts                      → /apps/frontend/vitest.config.ts
/tsconfig.json                         → /apps/frontend/tsconfig.json
```

#### **Components Migration**
```bash
# Main Components (Clean Version)
/src/components/                       → /apps/frontend/src/features/
├── compliance/                        → /features/compliance/components/
├── tokens/                           → /features/tokens/components/
├── wallet/                           → /features/wallet/components/
├── investors/                        → /features/investors/components/
└── ui/                               → /components/ui/

# Skip Archive - Will be cleaned up
/src/archive/                          → DELETE (after review)
```

#### **Pages Migration**
```bash
/src/pages/                           → /apps/frontend/src/pages/
├── token/                            → /pages/tokens/
├── wallet/                           → /pages/wallet/
├── onboarding/                       → /pages/onboarding/
├── dashboard/                        → /pages/dashboard/
└── investors/                        → /pages/investors/
```

#### **Hooks & Context**
```bash
/src/hooks/                           → /apps/frontend/src/hooks/
/src/contexts/                        → /apps/frontend/src/contexts/
/src/context/                         → /apps/frontend/src/contexts/ (merge)
```

#### **Routes**
```bash
/src/routes/                          → /apps/frontend/src/routes/
/tempo-routes.ts                      → /apps/frontend/src/routes/tempo-routes.ts
```

#### **Theme & Styling**
```bash
/src/theme/                           → /apps/frontend/src/theme/
```

---

### **Phase 2: Backend Migration (Infrastructure → Backend App)**

#### **API & Infrastructure**
```bash
# Backend Server
/server.ts                            → /apps/backend/src/server.ts

# Infrastructure becomes Backend API
/src/infrastructure/                  → /apps/backend/src/
├── api/                              → /api/v1/
├── web3/                            → /services/blockchain/
├── services/                         → /services/
└── auth/                            → /middleware/auth/

# Scripts
/src/scripts/                         → /apps/backend/src/scripts/
/scripts/                            → /tools/scripts/
```

#### **Services Migration**
```bash
/src/services/                        → /apps/backend/src/services/
├── wallet/                           → /services/wallet/
├── tokens/                           → /services/tokens/
├── compliance/                       → /services/compliance/
└── auth/                            → /services/auth/
```

---

### **Phase 3: Shared Packages Migration**

#### **Types Package (`packages/types/`)**
```bash
# Core Types (Merge and organize)
/src/types/supabase.ts                → /packages/types/src/supabase.ts
/src/types/database.ts                → /packages/types/src/database.ts
/src/types/centralModels.ts           → /packages/types/src/models.ts
/src/types/blockchain.ts              → /packages/types/src/blockchain.ts
/src/types/wallet.ts                  → /packages/types/src/wallet.ts
/src/types/compliance.ts              → /packages/types/src/compliance.ts
/src/types/deployment.ts              → /packages/types/src/deployment.ts
/src/types/tokens/                    → /packages/types/src/tokens/
/src/types/web3/                      → /packages/types/src/web3/
```

#### **Utils Package (`packages/utils/`)**
```bash
/src/utils/                           → /packages/utils/src/
├── typeGuards.ts                     → /validation/typeGuards.ts
├── formatters.ts                     → /formatters/
├── mappers.ts                        → /mappers/
└── validation/                       → /validation/
```

#### **UI Components Package (`packages/ui-components/`)**
```bash
# Extract reusable components
/src/components/ui/                   → /packages/ui-components/src/
├── Button/                           → /src/button/
├── Dialog/                           → /src/dialog/
├── Form/                            → /src/form/
└── Table/                           → /src/table/
```

#### **Blockchain Adapters Package (`packages/blockchain-adapters/`)**
```bash
/src/lib/web3/                        → /packages/blockchain-adapters/src/
├── adapters/                         → /adapters/
├── transactions/                     → /transactions/
├── fees/                            → /fees/
├── identity/                         → /identity/
└── notifications/                    → /notifications/
```

---

### **Phase 4: Infrastructure & Contracts**

#### **Smart Contracts**
```bash
/foundry-contracts/                   → /contracts/
├── src/                              → /src/
├── script/                           → /script/
├── test/                            → /test/
└── foundry.toml                     → /foundry.toml
```

#### **Database**
```bash
/supabase/                            → /supabase/
├── migrations/                       → /migrations/
└── functions/                        → /functions/
```

#### **Infrastructure Files**
```bash
# Docker & K8s (New)
CREATE: /infra/docker/
├── Dockerfile.frontend
├── Dockerfile.backend
├── docker-compose.yml
└── nginx.conf

CREATE: /infra/k8s/
└── helm/chain-capital/

# CI/CD
/.github/workflows/                   → /.github/workflows/ (enhance)
```

---

### **Phase 5: Documentation & Configuration**

#### **Documentation Migration**
```bash
/docs/                                → /docs/
/src/docs/                           → /docs/development/
/README.md                           → /README.md (update)
/READMEnew.md                        → DELETE (consolidate)
```

#### **Configuration Files**
```bash
# Root Config
/package.json                         → Analyze for monorepo split
/.env                                → /.env (root)
/.env.local                          → /apps/frontend/.env.local
/tsconfig.json                       → /tsconfig.json (root)
/eslint.config.js                    → /eslint.config.js (root)
```

---

## 📦 Dependency Distribution Strategy

### **Root Package.json (Monorepo)**
```json
{
  "name": "chain-capital-monorepo",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "devDependencies": {
    "typescript": "^5.2.2",
    "turbo": "^2.1.0",
    "@types/node": "^20.14.2",
    "eslint": "^9.23.0"
  }
}
```

### **Frontend App Dependencies**
```json
{
  "name": "@chain-capital/frontend",
  "dependencies": {
    // Core React
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.23.1",
    
    // UI & Styling
    "@radix-ui/react-*": "All Radix packages",
    "tailwindcss": "^3.4.1",
    "tailwind-merge": "^2.3.0",
    "tailwindcss-animate": "^1.0.7",
    "lucide-react": "^0.484.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    
    // Data Fetching & State
    "@tanstack/react-query": "^5.75.2",
    "zustand": "^4.x.x",
    
    // Forms & Validation
    "react-hook-form": "^7.55.0",
    "@hookform/resolvers": "^3.10.0",
    "zod": "^3.24.2",
    
    // Web3 Frontend
    "@reown/appkit": "^1.7.3",
    "@reown/appkit-adapter-wagmi": "^1.7.3",
    "wagmi": "^2.15.2",
    "viem": "2.28.3",
    
    // Supabase Client
    "@supabase/supabase-js": "^2.45.6",
    
    // Utilities
    "date-fns": "^3.6.0",
    "papaparse": "^5.5.2",
    "react-hot-toast": "^2.4.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react-swc": "^3.9.0",
    "vite": "^5.2.0",
    "vite-plugin-node-polyfills": "^0.23.0",
    "@types/react": "^18.3.20",
    "@types/react-dom": "^18.3.5"
  }
}
```

### **Backend App Dependencies**
```json
{
  "name": "@chain-capital/backend",
  "dependencies": {
    // Core Node.js
    "express": "^5.1.0",
    "cors": "^2.x.x",
    "helmet": "^7.x.x",
    "compression": "^1.x.x",
    
    // Database & Auth
    "@supabase/supabase-js": "^2.45.6",
    
    // Validation & Types
    "zod": "^3.24.2",
    
    // Web3 Backend
    "ethers": "6.13.7",
    "viem": "2.28.3",
    
    // Multi-chain Support
    "@solana/web3.js": "^1.98.2",
    "@solana/spl-token": "^0.4.13",
    "bitcoinjs-lib": "^6.1.7",
    "stellar-sdk": "^13.3.0",
    "xrpl": "^4.2.5",
    "near-api-js": "^5.1.1",
    "@aptos-labs/ts-sdk": "^2.0.1",
    
    // Security & Rate Limiting
    "express-rate-limit": "^7.x.x",
    "express-slow-down": "^2.x.x",
    "jsonwebtoken": "^9.x.x",
    
    // Logging & Monitoring
    "winston": "^3.x.x",
    "morgan": "^1.x.x",
    
    // API Documentation
    "swagger-jsdoc": "^6.x.x",
    "swagger-ui-express": "^5.x.x",
    
    // Utilities
    "dotenv": "^16.3.1",
    "node-fetch": "^3.3.2"
  },
  "devDependencies": {
    "@types/express": "^4.x.x",
    "@types/cors": "^2.x.x",
    "@types/swagger-jsdoc": "^6.x.x",
    "@types/swagger-ui-express": "^5.x.x",
    "tsx": "^4.19.4",
    "nodemon": "^3.x.x"
  }
}
```

### **Types Package Dependencies**
```json
{
  "name": "@chain-capital/types",
  "dependencies": {
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "typescript": "^5.2.2"
  }
}
```

### **Utils Package Dependencies**
```json
{
  "name": "@chain-capital/utils",
  "dependencies": {
    "zod": "^3.24.2",
    "date-fns": "^3.6.0"
  },
  "devDependencies": {
    "typescript": "^5.2.2"
  }
}
```

### **Blockchain Adapters Package Dependencies**
```json
{
  "name": "@chain-capital/blockchain-adapters",
  "dependencies": {
    "ethers": "6.13.7",
    "viem": "2.28.3",
    "@solana/web3.js": "^1.98.2",
    "@solana/spl-token": "^0.4.13",
    "bitcoinjs-lib": "^6.1.7",
    "stellar-sdk": "^13.3.0",
    "xrpl": "^4.2.5",
    "near-api-js": "^5.1.1",
    "@aptos-labs/ts-sdk": "^2.0.1",
    "buffer": "^6.0.3",
    "events": "^3.3.0"
  },
  "devDependencies": {
    "typescript": "^5.2.2"
  }
}
```

### **UI Components Package Dependencies**
```json
{
  "name": "@chain-capital/ui-components",
  "dependencies": {
    "react": "^18.2.0",
    "@radix-ui/react-*": "All shared Radix packages",
    "tailwindcss": "^3.4.1",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1"
  },
  "devDependencies": {
    "typescript": "^5.2.2",
    "@types/react": "^18.3.20"
  }
}
```

---

## 🚀 Migration Execution Plan

### **Pre-Migration Checklist**
- [ ] Create backup: `cp -r /Users/neilbatchelor/Cursor/1 /Users/neilbatchelor/Cursor/1-backup`
- [ ] Document current working features
- [ ] Export Supabase schema
- [ ] Note current environment variables

### **Step 1: Create New Monorepo Structure (30 minutes)**
```bash
# Create new directory
mkdir -p /Users/neilbatchelor/chain-capital-production
cd /Users/neilbatchelor/chain-capital-production

# Initialize monorepo structure
mkdir -p {apps/{frontend,backend},packages/{types,utils,ui-components,blockchain-adapters},infra/{docker,k8s,helm},tools/scripts,docs,contracts,supabase}

# Initialize package.json files
pnpm init
```

### **Step 2: Frontend Migration (45 minutes)**
```bash
# Setup frontend workspace
cd apps/frontend
pnpm init
# Configure as React app with Vite

# Copy and organize frontend files
cp -r /Users/neilbatchelor/Cursor/1/src/components ./src/features/
cp -r /Users/neilbatchelor/Cursor/1/src/pages ./src/
# Continue with file mapping above...
```

### **Step 3: Backend Migration (30 minutes)**
```bash
# Setup backend workspace
cd apps/backend
pnpm init
# Configure as Node.js Express app

# Migrate infrastructure to backend
cp -r /Users/neilbatchelor/Cursor/1/src/infrastructure ./src/
# Restructure as backend API...
```

### **Step 4: Shared Packages Migration (40 minutes)**
```bash
# Types package
cd packages/types
pnpm init
# Consolidate all type files

# Utils package
cd packages/utils
pnpm init
# Move utility functions

# UI Components package
cd packages/ui-components
pnpm init
# Extract reusable components

# Blockchain Adapters package
cd packages/blockchain-adapters
pnpm init
# Move Web3 infrastructure
```

### **Step 5: Infrastructure Setup (25 minutes)**
```bash
# Copy contracts
cp -r /Users/neilbatchelor/Cursor/1/foundry-contracts/* ./contracts/

# Copy database
cp -r /Users/neilbatchelor/Cursor/1/supabase/* ./supabase/

# Create Docker configurations
# Create Kubernetes manifests
# Setup CI/CD pipeline
```

### **Step 6: Configuration & Dependencies (20 minutes)**
```bash
# Install root dependencies
pnpm install

# Install workspace dependencies
pnpm install --recursive

# Build all packages
pnpm run build

# Test the migration
pnpm run dev
```

---

## ✅ Post-Migration Validation

### **Functionality Checklist**
- [ ] Frontend loads without errors
- [ ] Backend API responds correctly
- [ ] Database connection works
- [ ] Web3 functionality intact
- [ ] All routes accessible
- [ ] Type checking passes
- [ ] Build process succeeds
- [ ] Tests pass

### **Performance Validation**
- [ ] Bundle size reduced by >30%
- [ ] Build time improved
- [ ] Hot reload works in dev
- [ ] Docker builds successfully

### **Developer Experience**
- [ ] Monorepo commands work (`pnpm run dev`)
- [ ] Type sharing between packages
- [ ] Import paths resolve correctly
- [ ] Linting and formatting work

---

## 🔧 Troubleshooting Common Issues

### **Import Path Fixes**
```typescript
// Old
import { User } from '../../../types/centralModels';

// New
import { User } from '@chain-capital/types';
```

### **Web3 Polyfill Issues**
```typescript
// Move polyfills to backend only
// Use dynamic imports in frontend
```

### **Type Resolution**
```bash
# If types don't resolve
pnpm run build --filter=@chain-capital/types
```

### **Dependency Conflicts**
```bash
# Clear all node_modules
pnpm clean
rm -rf node_modules
pnpm install
```

---

## 📈 Expected Outcomes

### **Before Migration**
- Monolithic 120+ dependency React app
- 500MB+ node_modules
- Mixed frontend/backend concerns
- Complex build configuration
- No API documentation

### **After Migration**
- Clean monorepo with separated concerns
- Optimized dependency distribution
- Production-ready architecture
- Docker & Kubernetes ready
- Complete API documentation
- Improved developer experience

---

## 🎯 Next Steps After Migration

1. **API Enhancement**: Add Swagger documentation
2. **Testing**: Implement comprehensive test suite
3. **CI/CD**: Complete automated deployment
4. **Monitoring**: Add observability stack
5. **Security**: Implement production security measures

This migration plan transforms your comprehensive tokenization platform into a production-ready, scalable architecture while preserving all existing functionality and improving developer experience.