# READMEnew.md

## Overview

The `/src/utils/` directory contains general-purpose helper functions, constants, type guards, and domain-specific utilities. These utilities are used throughout the application to simplify common operations such as formatting, logging, authentication workflows, blockchain integrations, and analytics.

Utilities are organized into thematic subfolders for easy discoverability and maintainability.

---

## Top-Level Files

| File | Purpose |
|:-----|:--------|
| `index.ts` | Entry point re-exporting major utilities for easy imports. |
| `logger.ts` | General-purpose logger for console output and error reporting. |
| `crypto.ts` | Utility functions for cryptographic operations (hashing, encoding). |
| `csv.ts` | CSV export and parsing helpers. |
| `countries.ts` | Country code utilities. Useful for KYC, onboarding, compliance workflows. |
| `roleUtils.ts`, `roleNormalizer.ts` | Utilities for handling user roles and permissions normalization. |
| `investorTypes.ts` | Helper types and mappings related to investor profiles. |
| `nodeStreamWebShim.ts`, `webStreamsShim.ts` | Shims to bridge Node.js streams with Web Streams API. |
| `utils.ts` | Miscellaneous utility functions (string manipulation, data conversion, etc.). |

---

## Subfolders

### `/types/`
| File | Purpose |
|:-----|:--------|
| `typeGuards.ts` | Runtime type guards to validate unknown data shapes and ensure type safety. |

### `/constants/`
| File | Purpose |
|:-----|:--------|
| `constants.ts` | Centralized app-wide constants (e.g., default settings, timeouts, regex patterns). |

### `/date/`
| File | Purpose |
|:-----|:--------|
| `dateHelpers.ts` | Date manipulation utilities (e.g., format date, difference calculation). |

### `/tests/`
| File | Purpose |
|:-----|:--------|
| `onfidoTestUtils.ts` | Test helpers for Onfido identity verification workflows. |
| `cube3TestUtils.ts` | Test helpers for Cube3 integration workflows. |

### `/web3/`
| File | Purpose |
|:-----|:--------|
| `web3Adapters.ts` | Web3 blockchain provider adapters and utility functions. |

### `/state/`
| File | Purpose |
|:-----|:--------|
| `focusManager.ts` | Helpers to manage input focus across complex forms. |
| `stateHelpers.ts` | State management utilities (e.g., reducers, optimizers). |

### `/compliance/`
| File | Purpose |
|:-----|:--------|
| `kyc.ts` | KYC compliance-related utility functions. |

### `/supabase/`
| File | Purpose |
|:-----|:--------|
| `supabaseHelpers.ts` | Helpers for interacting with Supabase (queries, auth flows, error handling). |

### `/formatting/`
| File | Purpose |
|:-----|:--------|
| `typeMappers.ts` | Mapping utilities between different model types (e.g., DB ➔ Business Model). |
| `workflowMappers.ts` | Mappers for compliance and onboarding workflow stages. |
| `table.ts` | Table data formatting utilities. |
| `exportUtils.ts` | Data exporting helpers (Excel, CSV formats). |
| `formatters.ts` | General data formatters (currency, percentages, addresses). |
| `uuidUtils.ts` | UUID parsing and generation utilities. |

### `/accessibility/`
| File | Purpose |
|:-----|:--------|
| `fixDialogAccessibility.ts` | Patches/fixes for improving modal and dialog accessibility compliance (WCAG standards). |

### `/logging/`
| File | Purpose |
|:-----|:--------|
| `activityLogger.ts` | Structured user activity logging for audit and analytics purposes. |
| `systemActivityLogger.ts` | System-level logging for background tasks and services. |

### `/analytics/`
| File | Purpose |
|:-----|:--------|
| `activityAnalytics.ts` | User activity tracking helpers for analytics tools. |
| `performanceUtils.ts` | Utilities to measure app performance (e.g., load time, TTFB). |
| `activityLogHelpers.ts` | Helpers for processing and analyzing activity logs. |

---

## Key Architectural Principles

- **Domain Organization**: Related utilities are grouped into folders for logical separation.
- **Reusability**: Utilities are generic and designed to be reused across services, components, and pages.
- **Type Safety**: Utilities prefer strict types and runtime validation where possible.
- **Performance**: Lightweight, fast, minimal external dependencies.

---

## Notes for Developers

- Use utilities from here instead of duplicating logic across the app.
- Always prefer using centralized constants from `/constants/constants.ts`.
- Blockchain-related operations (signing, transaction formatting) should leverage `/web3/web3Adapters.ts` first.
- When writing new utilities, follow the existing folder structure and create a README if a new subdomain is added.

---

✅ **This READMEnew.md committed to memory** for /memory-bank/src/utils/.

