# `/src/components/subscriptions` — READMEnew.md

This folder contains all components related to subscription management, payment workflows, and plan selection. It is designed for developers implementing or maintaining recurring billing, payment method handling, and subscription UI flows.

---

## File-by-File Breakdown

- **PaymentMethodForm.tsx**
  - Form for adding or editing payment methods (credit/debit card, billing address).
  - Uses Zod schema validation and React Hook Form.
  - Integrates with UI dialogs for secure entry.
- **SubscriptionBadge.tsx**
  - Badge component to visually indicate subscription status or tier (e.g., active, expired, premium).
- **SubscriptionDetails.tsx**
  - Displays full details of a user's subscription: plan, billing cycle, renewal, payment method, and status.
- **SubscriptionInvoice.tsx**
  - Shows invoice details for a subscription payment (amount, date, status, downloadable receipt).
- **SubscriptionManager.tsx**
  - Main orchestration component for managing user subscriptions, plan changes, and cancellations.
- **SubscriptionPlans.tsx**
  - UI for displaying available plans, features, and pricing.
  - Handles plan selection, highlighting popular plans, and disables current plan selection.

### Documentation
- **README.md**: Legacy documentation (superseded by this READMEnew.md).

---

## Usage
- Use these components to build subscription onboarding, management, and billing flows.
- Integrate with payment processing APIs and user profile management.
- Extend forms, plans, and invoice logic as new billing models or features are added.

## Developer Notes
- All UI follows Radix UI/shadcn/ui conventions for accessibility and consistency.
- Payment forms use strong validation and secure UI dialogs.
- Document any new plans, badge logic, or invoice features added here.

---

### Download Link
- [Download /src/components/subscriptions/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/src/components/subscriptions/READMEnew.md)
