# `/src/pages` — READMEnew.md

This folder contains all top-level route pages for the application. Each file or subfolder represents a distinct route or a set of related routes, often corresponding to a major feature or workflow. Pages are typically composed of atomic and domain-specific components, and are responsible for orchestrating UI, data fetching, and navigation logic.

---

## Top-Level Files
- **ActivityMetricsPage.tsx**: Visual analytics and metrics for project or system-wide activities. Fetches project data and displays metrics using charts and cards.
- **ActivityMonitorPage.tsx**: Real-time monitoring and feed of user/system activity events.
- **ApproverPortalPage.tsx**: Portal for approvers to review, approve, or reject requests (e.g., redemptions, compliance).
- **MFASettingsPage.tsx**: User interface for managing multi-factor authentication (MFA) settings.
- **NotificationSettingsPage.tsx**: User interface for managing notification preferences and channels.
- **OfferingsPage.tsx**: Displays available offerings (e.g., tokens, projects) for investment or participation.
- **ResetPasswordPage.tsx**: Password reset workflow for users.
- **UserMFAPage.tsx**: Account security page for enabling and managing two-factor authentication and password settings.

## Key Subfolders
- **auth/**: Authentication-related pages (login, register, forgot password, etc.).
- **dashboard/**: Main dashboard and overview pages for users and admins.
- **investors/**: Investor onboarding, management, and portfolio pages.
- **onboarding/**: User onboarding flows and checklists.
- **projects/**: Project creation, listing, and management pages.
- **token/**: Token-related pages (see token/READMEnew.md for details).
- **wallet/**: Wallet management and transaction pages (see wallet/READMEnew.md for details).

---

## Usage
- Pages are registered as routes in the app's routing configuration.
- Compose pages from atomic and domain-specific components for maintainability.
- Extend subfolders as new features and flows are added.

## Developer Notes
- Keep business logic in services/hooks; keep pages focused on orchestration and UI.
- Follow accessibility and design system (Radix UI/shadcn/ui) conventions.
- Keep documentation (`READMEnew.md`) up to date as new pages are added or updated.

---

### Download Link
- [Download /src/pages/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/src/pages/READMEnew.md)
