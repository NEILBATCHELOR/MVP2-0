# `/src/components/verification` — READMEnew.md

This folder contains components for advanced identity verification, specifically integrating with the Onfido SDK for KYC (Know Your Customer) and AML (Anti-Money Laundering) compliance.

---

## Files

### EnhancedOnfidoVerification.tsx
- **Purpose:**  
  Provides a full identity verification flow using the Onfido SDK, including applicant onboarding, document and face capture, and result handling.
- **Features:**  
  - Collects user details and initializes Onfido verification via the SDK.
  - Handles all Onfido steps: welcome, document upload, face verification, and completion.
  - Implements custom error handling and completion logic.
  - Uses advanced TypeScript types for Onfido SDK integration.
  - Integrates with `@/services/integrations/onfidoService` and central types.
  - UI built with accessible, modern design and robust form validation (react-hook-form, zod).
  - Displays progress, loading, and success states.
- **Dependencies:**  
  - Onfido SDK (via global window object)
  - `@/services/integrations/onfidoService`
  - `@/types/onfido`
  - `react-hook-form`, `zod`, `@hookform/resolvers/zod`
- **Usage:**  
  Used in onboarding, compliance, and KYC/AML flows for secure, compliant identity verification.

---

## Developer Notes

- This component disables TypeScript type checking due to Onfido SDK type conflicts—review before production upgrades.
- Extend or customize Onfido steps as business/regulatory requirements evolve.
- Ensure Onfido API keys and callbacks are managed securely.
- All UI/UX follows platform accessibility and branding standards.

---

### Download Link

- [Download /src/components/verification/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/src/components/verification/READMEnew.md)
- [Download /memory-bank/components/verification/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/memory-bank/components/verification/READMEnew.md)

