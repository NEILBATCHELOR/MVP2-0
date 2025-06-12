# `/src/infrastructure/api` — READMEnew.md

This folder contains API integration modules and logic for handling approval workflows, policy management, and transaction history within the application. Each file provides a set of functions to interact with Supabase tables and encapsulate business logic for their domain.

---

## Files

- **approvalApi.ts**
  - Handles redemption request workflows, including fetching, creating, updating, and approving redemption requests and approvers.
  - Integrates with Supabase for persistent storage and retrieval.
  - Provides utilities for avatar generation and status management.

- **policyApi.ts**
  - Manages policy-related data and logic (e.g., compliance or eligibility policies).
  - Interfaces with Supabase for CRUD operations on policy tables.

- **transactionHistoryApi.ts**
  - Handles transaction event history, including creation, retrieval, and filtering of transaction events.
  - Supports event types such as status changes, approvals, blockchain confirmations, rejections, and creations.
  - Integrates with Supabase for event storage and retrieval.

- **index.ts**
  - Barrel file for exporting API modules and utilities.

---

## Usage
- Import API modules to interact with backend data for approvals, policies, and transaction history.
- Extend modules for new approval flows, event types, or policy logic as needed.
- All API logic is designed for integration with Supabase and typed for safety.

## Developer Notes
- All modules follow TypeScript best practices and leverage centralized types from `@/types`.
- Extend each module with new endpoints or business logic as requirements grow.
- Keep documentation (`READMEnew.md`) up to date as new APIs are added or updated.

---

### Download Link
- [Download /src/infrastructure/api/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/src/infrastructure/api/READMEnew.md)
