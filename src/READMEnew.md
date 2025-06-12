# **READMEnew.md**

## **Overview**

The `/src` directory contains the main source code for the application. It is structured to separate concerns cleanly across types, contexts, components, services, infrastructure, pages, hooks, and utilities. This structure promotes maintainability, scalability, and ease of onboarding for new developers.

This document describes the purpose and dependencies of each major file and folder in `/src`.

---

## **Top-Level Files**

| File | Purpose |
| ----- | ----- |
| `App.tsx` | Main application wrapper. Defines application-wide routing and context providers. |
| `main.tsx` | Entry point for React. Renders `<App />` into the DOM. |
| `index.css` | Global CSS styles imported into the React app. |
| `setupTests.ts` | Configuration for test environment setup using Vitest or similar testing frameworks. |
| `test-inject.js` | Development utility for injecting test behavior or data. |
| `tsconfig.json` | TypeScript configuration scoped specifically for `/src`. |
| `README.md` | (Outdated) — This document (`READMEnew.md`) replaces it with updated details. |

---

## **Top-Level Folders**

### **`/types/`**

* Central repository for TypeScript type definitions.

* Contains models for database types, user types, blockchain entities, permission structures, rule engines, and wallet transaction types.

* Also includes custom extensions to external libraries (e.g., `bitcoin-modules.d.ts`).

### **`/contexts/`**

* Provides global context providers for Auth and general app state.

* Components like `AuthProvider.tsx` simplify authentication state management across the app.

### **`/context/`**

* Contains domain-specific contexts such as WalletContext, Web3Context, and NotificationContext.

* Helps manage state and side effects for blockchain wallet connections and user notifications.

### **`/archive/`**

* Legacy or deprecated files kept for reference.

* Includes older versions of services, components, and tests.

* **Not actively maintained**.

### **`/utils/`**

* General utility functions shared across the codebase.

* Includes helpers for wallet operations, API response standardization, etc.

### **`/components/`**

* The largest folder.

* Contains reusable UI components organized into feature folders (e.g., auth, activity, tokens, rules, wallet, dashboard, onboarding).

* Each feature folder may contain domain-specific components and UI elements.

* Some folders (e.g., `wallet/components/`) manage subdomain-specific functionality like multi-signature wallets, asset displays, etc.

### **`/hooks/`**

* Custom React hooks for fetching, managing, and syncing app state.

* Supports modular and DRY (Don't Repeat Yourself) code structure.

### **`/pages/`**

* Route-specific React components for different pages in the application.

* Follows a Next.js-style convention (even though the project uses Vite).

### **`/infrastructure/`**

* Infrastructure services such as API clients, third-party service wrappers, and blockchain communication layers.

### **`/services/`**

* Application service layer.

* Business logic for handling tokens, wallets, policies, onboarding flows, compliance operations, etc.

---

## **Development Tools & Dependencies**

* **React** for front-end rendering.

* **TypeScript** for type safety.

* **Tailwind CSS** (inferred from global styles and `tailwind.config.js`).

* **Supabase** for backend services (authentication, database).

* **Vitest** for testing (inferred from `setupTests.ts`).

* **Vite** as the build tool and development server.

* **Radix UI** and **shadcn/ui** for component primitives and design.

---

## **Notes for Developers**

* **Routing** is controlled manually inside `App.tsx`.

* **Context providers** are critical for app-wide state (especially `AuthProvider`, `WalletContext`, `NotificationContext`).

* **Type system** is carefully structured: centralized in `/types/`, not scattered.

* **Legacy code** exists under `/archive/` — check carefully before reusing.

* **All new components** should follow the modular structure under `/components/`.

---

## **Next Steps**

This document (`READMEnew.md`) serves as the **updated high-level guide** for `/src/`. Each subfolder (`/types/`, `/components/`, `/hooks/`, etc.) will have **its own READMEnew.md** created next with detailed analysis.

---

✅ **This READMEnew.md committed to memory** for /memory-bank/src/.

  /**
   * A comprehensive overview of the source code directory structure, files,
   * functionality, and dependencies.
   *
   * The source code is organized into directories, each containing related
   * functionality. The main application component is in `App.tsx`. The
   * application entry point is in `main.tsx`. Type definitions for environment
   * variables are in `env.d.ts`.
   *
   * Core dependencies are React, React Router, TypeScript, Supabase, ethers.js,
   * and Vite. UI dependencies are shadcn/ui, Radix UI, Tailwind CSS, clsx,
   * Framer Motion, and Recharts. Form handling dependencies are React Hook Form,
   * Zod, and @hookform/resolvers. Developer tools are ESLint, SWC, TypeScript,
   * and Tempo DevTools.
   *
   * The application implements a robust type system following these principles:
   *
   * 1. Database types are imported from `types/database.ts`.
   * 2. Supabase types are imported from `types/supabase.ts`.
   * 3. Status enums are imported from `types/status.ts`.
   * 4. Business models are imported from `types/centralModels.ts`.
   * 5. Type mappers are functions in `utils/typeMappers.ts` that convert between
   *    database and application models.
   * 6. Type guards are functions in `utils/typeGuards.ts` that provide runtime
   *    type validation.
   * 7. Error handling is consistent with proper typing.
   *
   * The database access pattern is to use the `executeWithRetry` function from
   * `lib/supabaseClient` to query the database. The component pattern is to use
   * explicit interfaces for component props and to validate data at application
   * boundaries (API, forms, etc.).
   *
   * To get started with development, first set up the environment with `npm
   * install`. Then, start the development server with `npm run dev`. To check
   * types, run `npm run type-check` or `node scripts/type-check.js`. To build
   * for production, run `npm run build`.
   *
   * Best practices include:
   *
   * 1. Always import types from the appropriate files.
   * 2. Use type mapping functions to convert between database and application
   *    models.
   * 3. Implement proper error handling with try/catch blocks and meaningful
   *    error messages.
   * 4. Define explicit interfaces for component props.
   * 5. Use status enums instead of string literals for status values.
   * 6. Validate data at application boundaries (API, forms, etc.).
   */

/**
 * This function fetches active users from the database and maps the result to the central user model.
 * @returns {Promise<User[]>} A promise that resolves to an array of active users.
 */