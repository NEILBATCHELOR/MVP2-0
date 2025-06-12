# /src/components/activity — READMEnew.md

This folder contains UI components for monitoring, filtering, and analyzing system and user activity within the application. These components support operational dashboards, audit trails, batch operations, and process monitoring for compliance, debugging, and analytics.

## Files

### ActivityFilter.tsx
- **Purpose:** Filter/search UI for activity logs by action, entity, status, date, source, category, severity, etc.
- **Usage:** Used in dashboards and log viewers to refine activity queries.

### ActivityLogDetails.tsx
- **Purpose:** Detailed view of a specific activity log entry, showing metadata, context, and related actions.

### ActivityLogProvider.tsx
- **Purpose:** Context/provider for managing activity log state and queries across components.

### ActivityMetrics.tsx
- **Purpose:** Displays key metrics/analytics (counts, trends, severities) for activity logs and system events.

### ActivityMonitor.tsx / ActivityMonitorPage.tsx
- **Purpose:** Main UI and page for monitoring live or historical activity, including log tables, filters, and metrics.

### BatchOperationDetails.tsx / BulkOperationDashboard.tsx
- **Purpose:** Components for viewing and managing batch/bulk operations, including status, progress, and outcomes.

### DatabaseChangeLog.tsx
- **Purpose:** Displays database-level change logs for auditing schema/data changes.

### EntityActivityLog.tsx
- **Purpose:** Shows activity history for a specific entity (user, asset, etc.).

### ProcessActivityMonitor.tsx / ProcessCard.tsx
- **Purpose:** Monitor and display process-level activity, status, and analytics (e.g., background jobs, workflows).

### RecentUserActivity.tsx
- **Purpose:** Widget/table for showing recent activity by users, for dashboards or user profiles.

### SystemProcessDashboard.tsx
- **Purpose:** Dashboard for monitoring system processes, errors, analytics, and anomalies.

## Usage
- Import these components in admin dashboards, compliance tools, or analytics pages that require activity monitoring or audit trails.
- Compose filter, metrics, and log/detail components for custom dashboards.

## Developer Notes
- Keep activity and process monitoring logic modular and in sync with backend event sources.
- Extend as new activity types, analytics, or compliance requirements are introduced.

---

### Download Link
- [Download /src/components/activity/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/src/components/activity/READMEnew.md)

---

### Memory-Bank Mirror
- [Download /memory-bank/components/activity/READMEnew.md](sandbox:/Users/neilbatchelor/Cursor/1/memory-bank/components/activity/READMEnew.md)
