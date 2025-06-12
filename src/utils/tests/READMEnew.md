# /src/utils/tests — READMEnew.md

This folder contains utility modules for testing and mocking third-party integrations, specifically for risk/compliance (Cube3) and identity verification (Onfido). These utilities are used in both unit and integration tests to simulate real-world scenarios and validate service integration logic.

## Files

### cube3TestUtils.ts
- **Purpose:** Provides test data and helpers for Cube3 risk/compliance integration.
- **Key Exports:**
  - `testAddresses`: Sample wallet addresses with annotated risk profiles (low, medium, high, sanctioned) for wallet risk assessment tests.
  - `testContracts`: Sample smart contract addresses with annotated security profiles (verified, unverified, rug pull risk) for contract inspection tests.
  - `sampleTransactions`: Example transaction data for safe/risky scenarios.
- **Usage:** Use these constants in tests for wallet risk scoring, contract verification, and transaction validation logic.
- **Dependencies:** Imports types and service logic from `@/services/integrations/cube3Service`.

### onfidoTestUtils.ts
- **Purpose:** Provides test data and workflow helpers for Onfido identity verification integration.
- **Key Exports:**
  - `generateTestApplicant()`: Generates a mock applicant object for verification tests.
  - `generateMockVerificationReport()`: Returns a simulated Onfido verification report (clear, consider, rejected, etc).
  - `testOnfidoConnection()`: Async function to check Onfido API token/configuration.
  - `runOnfidoTestWorkflow()`: Simulates a multi-step Onfido verification workflow (create applicant, upload document, create check, get report).
- **Usage:** Use these helpers in tests for onboarding, KYC, and compliance flows involving Onfido.
- **Dependencies:** Relies on Onfido service integration and environment variable configuration.

## Developer Notes
- Update test data and helpers as integration APIs evolve.
- Use these utilities in both automated and manual tests to ensure robust integration coverage.
- Never use test/mock data in production logic.

---

### Download Link
- [Download /src/utils/tests/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/src/utils/tests/READMEnew.md)

---

### Memory-Bank Mirror
- [Download /memory-bank/utils/tests/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/memory-bank/utils/tests/READMEnew.md)
