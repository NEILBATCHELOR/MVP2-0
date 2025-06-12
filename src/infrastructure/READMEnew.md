# `/src/infrastructure` — READMEnew.md

This folder contains all infrastructure-level modules, services, and adapters required for backend integration, blockchain operations, authentication, logging, real-time features, and external API connectivity. Each subfolder and file provides foundational logic for the application, supporting both frontend and backend workflows.

---

## Top-Level Files
- **activityLogger.ts**: Centralized activity logging utility for user/system actions.
- **api.ts**: Root API integration module; sets up API endpoints and request handlers.
- **audit.ts**: Audit trail utilities for compliance and traceability.
- **auditLogger.ts**: Specialized logger for audit events.
- **cube3Init.ts**: Initialization logic for Cube3 integration (external service or analytics).
- **inertPolyfill.ts**: Polyfill for browser inert attribute (accessibility and focus management).
- **realtime.ts**: Real-time event manager (websockets, subscriptions, push notifications).
- **sessionManager.ts**: Session management utilities for user authentication and state.
- **subscriptions.ts**: Subscription logic for billing, access control, or SaaS features.
- **supabase.ts**: Supabase client and integration logic for database and auth.

## Key Subfolders
- **api/**: API route handlers, middleware, and endpoint logic.
- **auth/**: Authentication/authorization adapters and utilities.
- **blockchain/**: Blockchain-specific infrastructure (legacy or non-web3 logic).
- **onchainid/**: ONCHAINID identity and claim management infrastructure.
- **web3/**: Core blockchain/web3 integration (see web3/READMEnew.md for details).

---

## Usage
- Import infrastructure utilities and adapters for backend, blockchain, and API operations.
- Extend subfolders with new integrations as the app grows.
- Use centralized logging, session, and real-time utilities for cross-cutting concerns.

## Developer Notes
- All modules are TypeScript-typed and designed for modular import.
- Subfolders are organized by domain for clarity and maintainability.
- Add new infrastructure integrations by following existing folder/file patterns.
- Keep documentation (`READMEnew.md`) up to date as new integrations are added.

---

### Download Link
- [Download /src/infrastructure/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/src/infrastructure/READMEnew.md)
