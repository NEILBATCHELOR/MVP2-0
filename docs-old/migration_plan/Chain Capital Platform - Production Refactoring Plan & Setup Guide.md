# Chain Capital Platform - Production Refactoring Plan & Setup Guide

## 📊 Current Architecture Analysis

### What We Have (Strengths)
Your platform is remarkably comprehensive with institutional-grade features:

**Frontend (React/Vite/TypeScript)**
- ✅ Modern tech stack with Vite + React 18 + TypeScript
- ✅ Comprehensive UI library (shadcn/ui + Radix)
- ✅ Multi-blockchain wallet integration (Reown AppKit)
- ✅ Feature-based architecture (`/tokens`, `/compliance`, `/investors`)
- ✅ Extensive routing with protected routes
- ✅ Real-time subscriptions and WebSocket integration

**Backend (Node.js/Express)**
- ✅ Express.js API with WebSocket support
- ✅ Comprehensive Supabase integration
- ✅ Multi-chain blockchain adapters (8+ blockchains)
- ✅ Token deployment services for 6 ERC standards
- ✅ Compliance infrastructure (KYC/AML, audit trails)

**Database (Supabase)**
- ✅ 100+ migration files showing mature schema evolution
- ✅ Row-level security (RLS) policies
- ✅ Comprehensive compliance tables
- ✅ Audit logging and activity tracking
- ✅ Multi-tenant architecture support

**Smart Contracts**
- ✅ Multiple token standards (ERC-20, ERC-721, ERC-1155, ERC-1400, ERC-3525, ERC-4626)
- ✅ Foundry contracts integration
- ✅ TypeChain type generation
- ✅ Multi-sig wallet support

**Infrastructure**
- ✅ Docker configuration
- ✅ GitHub Actions workflows
- ✅ Comprehensive testing setup
- ✅ Environment-based configuration

### Critical Issues to Address

**Architecture Complexity**
- 🔴 Monolithic structure needs modularization
- 🔴 Mixed concerns (archive folder with duplicated components)
- 🔴 Inconsistent file organization
- 🔴 No clear separation between frontend/backend in src

**Performance & Scalability**
- 🔴 Large bundle sizes (multiple Web3 libraries)
- 🔴 Complex Vite polyfill configuration
- 🔴 No CDN or edge deployment strategy
- 🔴 Missing load balancing for API

**Security & Compliance**
- 🔴 Environment variables not properly managed
- 🔴 No secrets management system
- 🔴 Missing rate limiting configuration
- 🔴 No API versioning strategy

**Development Experience**
- 🔴 Complex build configuration
- 🔴 Missing API documentation (Swagger)
- 🔴 No automated dependency updates
- 🔴 Testing coverage gaps

## 🏗️ Production-Ready Refactoring Plan

### Phase 1: Foundation Restructure (Week 1-2)

#### 1.1 Move to Monorepo Structure

```bash
# Current structure restructuring
mkdir -p apps/{frontend,backend}
mkdir -p packages/{types,ui-components,utils,blockchain-adapters}
mkdir -p infra/{docker,k8s,terraform}
mkdir -p tools/{scripts,ci-cd}
```

**New Directory Structure:**
```
chain-capital/
├── apps/
│   ├── frontend/              # React app (clean)
│   │   ├── src/
│   │   │   ├── features/     # Feature-based modules
│   │   │   │   ├── tokens/
│   │   │   │   ├── compliance/
│   │   │   │   ├── investors/
│   │   │   │   └── wallet/
│   │   │   ├── shared/       # Shared components
│   │   │   └── app/          # App shell
│   │   └── public/
│   └── backend/               # Node.js API
│       ├── src/
│       │   ├── api/          # REST endpoints
│       │   ├── services/     # Business logic
│       │   ├── middleware/   # Auth, validation, etc.
│       │   └── config/       # Environment config
│       └── docs/             # API documentation
├── packages/
│   ├── types/                # Shared TypeScript types
│   ├── ui-components/        # Shared React components
│   ├── utils/                # Common utilities
│   └── blockchain-adapters/  # Web3 integrations
├── infra/
│   ├── docker/               # Dockerfiles
│   ├── k8s/                  # Kubernetes manifests
│   └── terraform/            # Infrastructure as Code
├── tools/
│   ├── scripts/              # Development scripts
│   └── ci-cd/                # CI/CD configurations
└── docs/                     # Documentation
```

#### 1.2 Package Manager Migration

**Switch to pnpm with workspaces:**

```bash
# Install pnpm
npm install -g pnpm

# Create workspace configuration
cat > pnpm-workspace.yaml << EOF
packages:
  - 'apps/*'
  - 'packages/*'
  - 'tools/*'
EOF

# Create root package.json
cat > package.json << EOF
{
  "name": "chain-capital-monorepo",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*",
    "tools/*"
  ],
  "scripts": {
    "dev": "pnpm --parallel run dev",
    "build": "pnpm --recursive run build",
    "test": "pnpm --recursive run test",
    "lint": "pnpm --recursive run lint",
    "clean": "pnpm --recursive run clean"
  },
  "devDependencies": {
    "@types/node": "^20.14.2",
    "typescript": "^5.2.2",
    "turbo": "^2.1.0"
  },
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=8.0.0"
  }
}
EOF
```

#### 1.3 Cleanup Archive and Duplicated Files

**macOS Setup Steps:**
```bash
# Navigate to project
cd /Users/neilbatchelor/Cursor/1

# Create backup
cp -r . ../chain-capital-backup-$(date +%Y%m%d)

# Remove archive directory (after reviewing for any needed components)
mv src/archive src/archive-backup-$(date +%Y%m%d)

# Clean up duplicate files
find . -name "*.DS_Store" -delete
find . -name "READMEnew.md" -delete  # Replace with single README files
find . -name "README copy.md" -delete
```

### Phase 2: Frontend Modernization (Week 2-3)

#### 2.1 Vite Configuration Simplification

**Create optimized vite.config.ts:**
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "esnext",
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'web3-vendor': ['ethers', 'viem', 'wagmi'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        }
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'ethers']
  }
});
```

#### 2.2 Feature-Based Architecture Implementation

**Move components to feature modules:**
```bash
# Create feature directories
mkdir -p apps/frontend/src/features/{tokens,compliance,investors,wallet,captable}

# Move token-related components
mv src/components/tokens apps/frontend/src/features/tokens/components
mv src/pages/token apps/frontend/src/features/tokens/pages
mv src/tokens apps/frontend/src/features/tokens/core

# Move compliance components
mv src/components/compliance apps/frontend/src/features/compliance/components
mv src/components/onboarding apps/frontend/src/features/compliance/onboarding

# Move investor components
mv src/components/investors apps/frontend/src/features/investors/components

# Move wallet components
mv src/components/wallet apps/frontend/src/features/wallet/components
mv src/pages/wallet apps/frontend/src/features/wallet/pages
```

#### 2.3 Shared Package Creation

**Create shared types package:**
```bash
mkdir -p packages/types/src
cat > packages/types/package.json << EOF
{
  "name": "@chain-capital/types",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "devDependencies": {
    "typescript": "^5.2.2"
  }
}
EOF

# Move shared types
mv src/types/* packages/types/src/
```

### Phase 3: Backend API Enhancement (Week 3-4)

#### 3.1 API Structure Reorganization

**Create proper API structure:**
```bash
mkdir -p apps/backend/src/{api,services,middleware,config,docs}

# Move API routes
mv src/routes apps/backend/src/api
mv src/infrastructure/api apps/backend/src/api/v1

# Move services
mv src/services apps/backend/src/services
```

#### 3.2 Swagger/OpenAPI Integration

**Install Swagger dependencies:**
```bash
cd apps/backend
pnpm add swagger-jsdoc swagger-ui-express @types/swagger-jsdoc @types/swagger-ui-express
```

**Create Swagger configuration:**
```typescript
// apps/backend/src/config/swagger.ts
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Chain Capital API',
      version: '1.0.0',
      description: 'Institutional tokenization platform API',
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3001',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/api/**/*.ts'], // Path to the API files
};

const specs = swaggerJSDoc(options);

export function setupSwagger(app: Express): void {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
  }));
}
```

#### 3.3 API Versioning and Rate Limiting

**Install rate limiting:**
```bash
pnpm add express-rate-limit express-slow-down helmet compression
```

**Create middleware:**
```typescript
// apps/backend/src/middleware/security.ts
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import helmet from 'helmet';
import compression from 'compression';

export const rateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

export const speedLimitMiddleware = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests per 15 minutes at full speed
  delayMs: () => 500, // Add 500ms delay per request after delayAfter
});

export const securityMiddleware = [
  helmet(),
  compression(),
  rateLimitMiddleware,
  speedLimitMiddleware,
];
```

### Phase 4: Infrastructure & Deployment (Week 4-5)

#### 4.1 Docker Optimization

**Create multi-stage Dockerfiles:**

**Frontend Dockerfile:**
```dockerfile
# apps/frontend/Dockerfile
FROM node:20-alpine AS base
RUN corepack enable pnpm

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY packages packages
RUN pnpm install --frozen-lockfile --prod

FROM base AS build
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm run build

FROM nginx:alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY apps/frontend/nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Backend Dockerfile:**
```dockerfile
# apps/backend/Dockerfile
FROM node:20-alpine AS base
RUN corepack enable pnpm

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY packages packages
RUN pnpm install --frozen-lockfile --prod

FROM base AS build
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm run build

FROM base AS runtime
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./

EXPOSE 3001
CMD ["node", "dist/server.js"]
```

#### 4.2 Kubernetes Deployment

**Create Helm chart structure:**
```bash
mkdir -p infra/helm/chain-capital/{templates,values}

# Create base Helm chart
cat > infra/helm/chain-capital/Chart.yaml << EOF
apiVersion: v2
name: chain-capital
description: Institutional tokenization platform
type: application
version: 1.0.0
appVersion: "1.0.0"
EOF
```

**Frontend deployment template:**
```yaml
# infra/helm/chain-capital/templates/frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "chain-capital.fullname" . }}-frontend
spec:
  replicas: {{ .Values.frontend.replicaCount }}
  selector:
    matchLabels:
      app: {{ include "chain-capital.name" . }}-frontend
  template:
    metadata:
      labels:
        app: {{ include "chain-capital.name" . }}-frontend
    spec:
      containers:
      - name: frontend
        image: "{{ .Values.frontend.image.repository }}:{{ .Values.frontend.image.tag }}"
        ports:
        - containerPort: 80
        env:
        - name: VITE_SUPABASE_URL
          valueFrom:
            secretKeyRef:
              name: chain-capital-secrets
              key: supabase-url
        resources:
          limits:
            memory: "512Mi"
            cpu: "500m"
          requests:
            memory: "256Mi"
            cpu: "250m"
        livenessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
```

#### 4.3 CI/CD Pipeline Enhancement

**Create GitHub Actions workflow:**
```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Run type check
        run: pnpm run type-check
        
      - name: Run linting
        run: pnpm run lint
        
      - name: Run tests
        run: pnpm run test
        
      - name: Build packages
        run: pnpm run build

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    strategy:
      matrix:
        app: [frontend, backend]
    steps:
      - uses: actions/checkout@v4
      
      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
          
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/${{ matrix.app }}
          
      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: apps/${{ matrix.app }}/Dockerfile
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Kubernetes
        run: |
          echo "Deploying to production cluster..."
          # Add kubectl deployment commands here
```

### Phase 5: Security & Compliance Enhancement (Week 5-6)

#### 5.1 Secrets Management

**Install HashiCorp Vault integration:**
```bash
pnpm add node-vault @types/node-vault
```

**Create secrets manager:**
```typescript
// packages/utils/src/secrets/VaultManager.ts
import vault from 'node-vault';

export class VaultManager {
  private vault: any;
  
  constructor() {
    this.vault = vault({
      apiVersion: 'v1',
      endpoint: process.env.VAULT_ENDPOINT,
      token: process.env.VAULT_TOKEN,
    });
  }
  
  async getSecret(path: string): Promise<any> {
    try {
      const response = await this.vault.read(path);
      return response.data;
    } catch (error) {
      console.error('Failed to retrieve secret:', error);
      throw new Error('Secret retrieval failed');
    }
  }
  
  async setSecret(path: string, data: Record<string, any>): Promise<void> {
    try {
      await this.vault.write(path, data);
    } catch (error) {
      console.error('Failed to store secret:', error);
      throw new Error('Secret storage failed');
    }
  }
}
```

#### 5.2 Environment Configuration

**Create environment validation:**
```typescript
// packages/utils/src/config/envValidator.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  DATABASE_URL: z.string().url(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  JWT_SECRET: z.string().min(32),
  REDIS_URL: z.string().url().optional(),
  VAULT_ENDPOINT: z.string().url().optional(),
  VAULT_TOKEN: z.string().optional(),
});

export function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('Environment validation failed:', error);
    process.exit(1);
  }
}
```

### Phase 6: Monitoring & Observability (Week 6)

#### 6.1 Logging Infrastructure

**Install structured logging:**
```bash
pnpm add winston pino @types/winston
```

**Create logger:**
```typescript
// packages/utils/src/logging/Logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'chain-capital' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

#### 6.2 Health Checks

**Create health check endpoints:**
```typescript
// apps/backend/src/api/health/index.ts
import { Router } from 'express';
import { supabase } from '../../config/supabase';

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 */
router.get('/health', async (req, res) => {
  try {
    // Check database connection
    const { error } = await supabase.from('users').select('count').limit(1);
    
    if (error) throw error;
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        api: 'running'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

export default router;
```

## 🚀 Implementation Timeline & Setup Instructions

### Week 1: Foundation Setup

**Day 1-2: Environment Setup**
```bash
# 1. Install required tools
brew install node pnpm docker kubectl helm

# 2. Clone and backup current code
cd /Users/neilbatchelor
cp -r Cursor/1 chain-capital-backup-$(date +%Y%m%d)
cd Cursor/1

# 3. Initialize new monorepo structure
mkdir -p {apps/{frontend,backend},packages/{types,ui-components,utils},infra/{docker,k8s},tools}

# 4. Setup pnpm workspace
echo 'packages:
  - "apps/*"
  - "packages/*"
  - "tools/*"' > pnpm-workspace.yaml
```

**Day 3-5: File Migration**
```bash
# 1. Move frontend code
mkdir -p apps/frontend/src
cp -r src/* apps/frontend/src/
# Clean up archive and duplicates as outlined above

# 2. Move backend code
mkdir -p apps/backend/src
mv server.ts apps/backend/src/
mv src/routes apps/backend/src/api
mv src/infrastructure apps/backend/src/
mv src/services apps/backend/src/

# 3. Create shared packages
mkdir -p packages/types/src
mv apps/frontend/src/types/* packages/types/src/
```

### Week 2-3: Frontend Modernization

**Follow the Vite configuration and feature-based architecture steps above**

### Week 4-5: Backend & Infrastructure

**Follow the API enhancement and Docker/K8s setup steps above**

### Week 6: Security & Monitoring

**Implement secrets management and observability as outlined above**

## 🎯 Success Metrics

After implementation, you should achieve:

- **Performance**: 50% reduction in bundle size, <2s initial load time
- **Reliability**: 99.9% uptime with health checks and monitoring
- **Security**: All secrets encrypted, rate limiting, audit trails
- **Developer Experience**: <30s build times, comprehensive API docs
- **Scalability**: Horizontal pod autoscaling, load balancing
- **Compliance**: Full audit trail, GDPR compliance, KYC automation

## 📋 Post-Refactoring Checklist

- [ ] All environment variables moved to secure vault
- [ ] API documentation accessible at `/api/docs`
- [ ] CI/CD pipeline successfully deploys to staging
- [ ] All tests passing with >80% coverage
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Documentation updated
- [ ] Team training completed

This refactoring will transform your platform into a truly production-ready, institutional-grade tokenization infrastructure that can scale to handle high-value transactions and regulatory requirements.