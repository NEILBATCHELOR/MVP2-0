# `/src/routes` — READMEnew.md

This folder contains the application's route-level logic and API entrypoints. It defines how HTTP and WebSocket requests are routed, versioned, and handled, serving as the bridge between incoming requests and backend services.

---

## Files & Subfolders

- **api.ts**
  - Main Express router for the API layer.
  - Applies API versioning (e.g., `/v1`).
  - Integrates subrouters such as `api/` for policy and other endpoints.
  - Health check endpoint (`/health`) for service monitoring.
  - WebSocket status and broadcast endpoints for real-time communication.
  - Handles unknown API endpoints with a 404 response.

- **api/**
  - Contains subrouters and endpoint definitions for domain-specific APIs (see `routes/api/READMEnew.md`).

---

## Usage
- Import and mount this router in the server entrypoint to expose all API and WebSocket endpoints.
- Extend with new subrouters for additional API versions or domains.
- Use health and status endpoints for monitoring and orchestration.

## Developer Notes
- All routing is handled via Express.js for flexibility and composability.
- Prefer modular subrouters for scalability and maintainability.
- Keep documentation (`READMEnew.md`) up to date as new endpoints or subfolders are added.

---

### Download Link
- [Download /src/routes/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/src/routes/READMEnew.md)
