# `/src/components/wallet` — READMEnew.md

This folder contains all wallet-related components, including atomic UI elements, transaction flows, error handling, risk checks, and multi-signature (MultiSig) workflows. The structure is modular, with atomic and page-level components collapsed into `components/` as per refactor guidelines. Intended for developers implementing or maintaining wallet, transaction, and risk management UIs.

---

## File-by-File Breakdown

### Core Atomic Components
- **ContractRiskCheck.tsx**
  - Runs risk checks on smart contracts before interaction.
  - Displays warnings, risk scores, and actionable recommendations.
  - Integrates with external risk APIs and internal heuristics.
- **ErrorDisplay.tsx**
  - Standardized error UI for all wallet and transaction flows.
  - Maps error codes to user-friendly messages and suggestions.
  - Supports compact/detailed modes, technical details, retry/back actions.
- **TokenSelector.tsx**
  - UI for selecting tokens for transfer, swap, or display.
  - Supports search, filtering, and custom token input.
- **TransactionConfirmation.tsx**
  - UI for confirming transactions (transfer, swap, MultiSig, etc).
  - Shows status, details, hash, explorer link, retry/back actions.
- **TransactionDetails.tsx**
  - Displays full transaction metadata: from/to, amount, asset, timestamp, status, etc.
- **TransactionHistory.tsx**
  - List/table of transactions with filtering, sorting, and status badges.
- **TransactionNotifications.tsx**
  - Displays real-time transaction notifications (pending, confirmed, failed).
- **WalletRiskCheck.tsx**
  - Runs risk checks on wallet addresses before sending assets.
  - Shows risk score, warnings, and recommendations.
- **WalletRiskIndicator.tsx**
  - Visual indicator of wallet risk level (low/medium/high/critical).
  - Shows icon, label, score, and tooltip.
  - Helper: `getRiskLevelFromScore(score)` to map score to risk level.

### Subfolders (Key Areas)
- **dashboard/**
  - Portfolio overview, network status, token balances, recent transactions, wallet list.
- **multisig/**
  - MultiSig transaction confirmation and signature collection flows.
- **new/**
  - New wallet creation and onboarding flows.
- **swap/**
  - Swap UI: route info, settings, token/version selector, confirmation.
- **transfer/**
  - Transfer UI: QR code scanner, recent addresses, gas settings, confirmation.

### Documentation
- **README.md**
  - Legacy documentation (superseded by this READMEnew.md).
- **READMEnew.md**
  - This file.

---

## Usage
- Use these components to build wallet management, transaction, risk, and MultiSig workflows.
- Integrate atomic components in pages or flows as needed.
- Extend risk checks, notifications, and transaction logic for new features.

## Developer Notes
- All UI follows Radix UI/shadcn/ui conventions for accessibility and consistency.
- Risk checks should use both external APIs and internal logic for defense-in-depth.
- MultiSig workflows are modular and integrate with transaction manager services.
- Remove/merge duplicate page-level components as per refactor guidelines.

---

### Download Link
- [Download /src/components/wallet/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/src/components/wallet/READMEnew.md)
