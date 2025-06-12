READMEnew.md

Overview

The /src/hooks/ directory contains global and domain-specific custom React hooks.

Hooks are organized into functional domains, providing reusable logic for authentication, compliance workflows, document management, wallet connections, rule management, and real-time UI updates.

Major Functional Areas

Area

Purpose

Authentication Hooks

Manage user auth sessions, permissions, and Supabase tokens.

Compliance Hooks

Manage compliance policies, templates, rule sets, and enhanced compliance states.

Document Hooks

Manage document uploads, retrievals, and status updates.

Wallet Hooks

Handle wallet connections, balances, transaction signing, and risk checks.

Workflow Hooks

Manage approval workflows and status tracking.

UI Utility Hooks

Manage toast notifications, focus traps, real-time status polling, notification permissions.

Detailed Hook List

Authentication and Permissions

useAuth.tsx

Provides current user session.

Login/logout helpers.

Permissions and roles management.

usePermissions.tsx

Check permissions for actions based on user role and compliance status.

user/useUser.ts

Fetch and manage user profile details.

user/useSupabaseClient.ts

Access the initialized Supabase client for direct queries.

supabase/useSupabaseClient.ts

Duplicate — usually used for specific services (backward compatibility).

Compliance Management

useCompliance.ts

Fetch compliance status for a project, user, or issuer.

usePolicies.ts

Retrieve active policies for the current entity.

usePolicyTemplates.ts

Manage policy templates: create, fetch, update versions.

useRuleManagement.ts

Create, update, validate compliance rules.

useEnhancedRules.ts

Hooks for building complex rule trees and logical combinations.

useRules.ts

Fetch and manage individual rules assigned to entities.

Document Management

useDocuments.ts

Upload, delete, fetch, and verify compliance documents.

useDocumentManagement.ts

Advanced document workflows — status tracking, smart processing integration.

Wallet Management

wallet/useWallet.ts

Connect/disconnect wallets.

Fetch wallet balances.

Verify ownership.

Workflow and Realtime Status

workflow/useWorkflow.ts

Manage multi-step approval workflows for compliance and onboarding.

useRealtimeStatus.ts

Subscribe to real-time updates via websockets or polling (e.g., document verification statuses).

UI Utilities

useToast.ts / use-toast.ts

Show success, error, warning toast notifications.

useNotificationPermission.ts

Check and request browser notification permissions.

useFocusTrap.ts

Trap focus inside modal dialogs for accessibility.

useApprovers.ts / useApprovers.optimized.ts

Fetch and cache possible approvers for workflows or redemptions.

Miscellaneous

index.ts

Barrel export of all hooks for easier imports.

Architectural Highlights

Domain-First Organization: Each hook is scoped to a domain (auth, compliance, wallet, workflow).

Single Responsibility Principle: Hooks are small, focused, and composable.

Real-Time Focus: Many hooks integrate live status subscriptions.

Optimized Fetching: Cached or memoized where possible to avoid unnecessary re-renders.

Service Separation: Hooks call services, not direct API endpoints, ensuring testability.

Developer Notes

Always prefer useSupabaseClient instead of importing the raw Supabase client.

Toast hooks (useToast) should be used instead of direct alert or snackbar libraries.

Compliance hooks (useCompliance, usePolicies) are strongly typed — keep DTOs up-to-date.

Hooks using websocket subscriptions (useRealtimeStatus) should clean up connections on unmount.

Always wrap new hook files inside appropriate subfolders when domain-specific.

✅ This READMEnew.md committed to memory for /memory-bank/src/hooks/.

