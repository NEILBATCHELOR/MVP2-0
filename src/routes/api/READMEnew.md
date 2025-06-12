# `/src/routes/api` — READMEnew.md

This folder contains the main Express.js API router for domain-specific endpoints, primarily focused on policy and policy template management. It handles authentication, CRUD operations, and business logic for policy-related resources.

---

## Files

- **index.ts**
  - Main API router for policies and policy templates.
  - Middleware for authentication (`requireAuth`), adding `userId` to requests.
  - Endpoints:
    - `GET /policies`: List all policies (with optional inactive filter).
    - `GET /policies/:id`: Retrieve a specific policy by ID.
    - `POST /policies`: Create or update a policy.
    - `PUT /policies/:id`: Update a policy by ID (ensures ID consistency).
    - `GET /templates`: List all policy templates.
    - `GET /templates/:id`: Retrieve a specific policy template by ID.
    - `POST /templates`: Create a new policy template (requires name and policy data).
  - All endpoints require authentication and use business logic from `@/infrastructure/api/policyApi`.

---

## Usage
- Mount this router under a versioned API path (e.g., `/v1`) in the main API router.
- Extend with additional endpoints for new domain-specific API logic as needed.
- All endpoints require authentication and return JSON responses.

## Developer Notes
- Follows modular Express.js routing best practices.
- Use centralized business logic/services for maintainability.
- Keep documentation (`READMEnew.md`) up to date as new endpoints are added or updated.

---

### Download Link
- [Download /src/routes/api/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/src/routes/api/READMEnew.md)
