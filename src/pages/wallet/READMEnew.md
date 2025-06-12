# `/src/pages/wallet` — READMEnew.md

This folder contains all route pages related to wallet management, creation, transfer, swapping, and dashboard workflows. Each page orchestrates wallet UI components and navigation, providing a seamless experience for wallet users and administrators.

---

## Files

- **NewWalletPage.tsx**
  - UI for creating a new wallet (single or multisig), including key generation, risk checks, and backup reminders.
  - Integrates wallet generator factories and risk check components.

- **SwapPage.tsx**
  - UI for swapping tokens/assets between wallets.
  - Integrates swap logic, token selectors, and confirmation flows.

- **TransferPage.tsx**
  - UI for transferring assets between wallets or to external addresses.
  - Includes QR code scanning, recent addresses, and gas/fee settings.

- **WalletDashboardPage.tsx**
  - Main dashboard for wallet overview, balances, health checks, and security recommendations.
  - Displays wallet health, multisig status, and backup reminders.

---

## Usage
- Use these pages for all wallet-related user flows: creation, management, transfer, swap, and dashboard.
- Compose pages with atomic and domain-specific components for maintainability.
- Extend as new wallet features are added.

## Developer Notes
- All pages use shared wallet components for consistency and modularity.
- Business logic is handled in components/services; pages focus on orchestration.
- Follow design system conventions (Radix UI/shadcn/ui).
- Keep documentation (`READMEnew.md`) up to date as new pages are added or updated.

---

### Download Link
- [Download /src/pages/wallet/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/src/pages/wallet/READMEnew.md)
