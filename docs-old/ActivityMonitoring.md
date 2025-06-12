# Activity Monitoring System Documentation

This guide provides comprehensive details on how to use the Activity Monitoring components and interpret the metrics they provide. The Activity Monitoring System gives you full visibility into both user and system activities throughout the application.

## Table of Contents

1. [Components Overview](#components-overview)
2. [ActivityMonitor](#activitymonitor)
3. [SystemProcessDashboard](#systemprocessdashboard)
4. [ActivityMetrics](#activitymetrics)
5. [ProcessActivityMonitor](#processactivitymonitor)
6. [EntityActivityLog](#entityactivitylog)
7. [Interpreting Metrics](#interpreting-metrics)
8. [Best Practices](#best-practices)

## Components Overview

The Activity Monitoring System consists of several complementary components:

- **ActivityMonitor**: The primary interface for viewing and filtering activity logs
- **SystemProcessDashboard**: Monitors system processes and batch operations
- **ActivityMetrics**: Provides visualizations and analytics for activity data
- **ProcessActivityMonitor**: Focused on scheduled jobs and process executions
- **EntityActivityLog**: Shows activities related to a specific entity

Each component serves a different purpose but works together to provide a comprehensive view of system activity.

## ActivityMonitor

The ActivityMonitor component is the main interface for viewing and searching activity logs.

### Usage

```tsx
import { ActivityMonitor } from "@/components/activity/ActivityMonitor";

// Basic usage
<ActivityMonitor />

// Filter to a specific project
<ActivityMonitor projectId="project-123" />

// Limit the number of logs shown
<ActivityMonitor limit={50} />

// Hide system and metrics tabs
<ActivityMonitor hideSystemAndMetricsTabs={true} />
```

### Features

- **Filtering**: Filter logs by:
  - Action type (e.g., create, update, delete)
  - Entity type (e.g., user, project, investment)
  - Table name (database table affected)
  - Status (success, failure, pending)
  - Source (user, system, integration)
  - Entity ID (specific entity affected)
  - System process ID (related process)
  - Batch operation ID (related batch)
  - Severity (info, warning, error, critical)
  - Date range

- **Searching**: Full-text search across logs

- **Tab Navigation**: View logs by category:
  - All: All activity logs
  - Auth: Authentication-related activities
  - Data: Data manipulation activities
  - Admin: Administrative activities
  - System: System-generated activities

- **Exporting**: Export logs to CSV for further analysis

### Tips

- Use advanced filters to narrow down logs for specific investigations
- Entity/table filtering is useful for tracking changes to specific data
- System process and batch IDs help correlate activities with automated processes

## SystemProcessDashboard

The SystemProcessDashboard component provides real-time monitoring and insights for system processes and batch operations.

### Usage

```tsx
import { SystemProcessDashboard } from "@/components/activity/SystemProcessDashboard";

// Basic usage
<SystemProcessDashboard />

// With automatic refresh (every 30 seconds)
<SystemProcessDashboard refreshInterval={30000} />

// With process selection handling
<SystemProcessDashboard onSelectProcess={(process) => {
  console.log("Selected process:", process);
}} />
```

### Features

- **Process Monitoring**: Track running, completed, and failed processes
- **Performance Metrics**: View success rates, durations, and error rates
- **Anomaly Detection**: Identify unusual behavior in system processes
- **Enhanced Error Tracking**: Analyze errors by type and frequency
- **Timeline Views**: Visualize sequence of process executions
- **Batch Operations**: Monitor and track multi-step batch operations

### Anomaly Detection

The anomaly detection system in the SystemProcessDashboard identifies:

1. **Duration Anomalies**: Processes taking significantly longer than usual
2. **Error Rate Spikes**: Unusual increases in error rates
3. **Long-Running Processes**: Potentially stuck or deadlocked processes

The anomaly score (0-100) provides a quick assessment of system health, with higher scores indicating more severe issues.

## ActivityMetrics

The ActivityMetrics component visualizes activity patterns and trends across the system.

### Usage

```tsx
import { ActivityMetrics } from "@/components/activity/ActivityMetrics";

// Basic usage
<ActivityMetrics />

// For a specific project
<ActivityMetrics projectId="project-123" />

// With a specific time period
<ActivityMetrics period="day" /> // day, week, month
```

### Features

- **Activity Trends**: Track activity volume over time
- **User vs. System**: Compare user-initiated vs. system-generated activities
- **Activity Distribution**: View distribution of activities by type and entity
- **Success/Failure Analysis**: Detailed breakdown of activity outcomes
- **Activity Sequences**: Timeline view of related activities on entities
- **Time Period Selection**: View metrics for different time ranges (day, week, month)

### Data Visualizations

- **Charts**: Bar, line, and pie charts showing various metrics
- **Timelines**: Sequence views of related activities
- **Distribution Reports**: Breakdown of activity types, sources, and outcomes
- **Success Rate Trends**: How success rates change over time

## ProcessActivityMonitor

The ProcessActivityMonitor component focuses on scheduled jobs and process executions.

### Usage

```tsx
import { ProcessActivityMonitor } from "@/components/activity/ProcessActivityMonitor";

// Basic usage
<ProcessActivityMonitor />

// Monitor specific process types
<ProcessActivityMonitor processType="data_sync" />

// With custom refresh interval
<ProcessActivityMonitor refreshInterval={60000} />
```

### Features

- **Scheduled Jobs**: View and monitor all scheduled processes
- **Execution History**: See chronological history of process executions
- **Process Analytics**: Visualize process types, durations, and outcomes
- **Execution Frequency**: Track how often processes run
- **Success Rates**: Monitor success rates by process type

### Tabs

- **Scheduled**: Currently scheduled jobs with next run times
- **History**: Chronological history of process executions
- **Analytics**: Charts and visualizations of process metrics
- **Execution**: Performance and status analysis

## EntityActivityLog

The EntityActivityLog component shows activities related to a specific entity.

### Usage

```tsx
import { EntityActivityLog } from "@/components/activity/EntityActivityLog";

// For a specific entity
<EntityActivityLog 
  entityType="project"
  entityId="project-123"
/>

// With a limit on number of logs
<EntityActivityLog 
  entityType="investor"
  entityId="investor-456"
  limit={10}
/>
```

### Features

- **Entity-Specific Logs**: See only activities affecting a specific entity
- **Chronological Timeline**: View activities in order
- **Filtering**: Filter by action type and source
- **User Attribution**: See which users performed which actions

## Interpreting Metrics

### Success/Failure Rates

- **Success Rate**: Percentage of activities that completed successfully
  - >90%: Healthy system
  - 75-90%: Minor issues may be present
  - <75%: Significant issues requiring investigation

- **Error Rate Trends**: Look for:
  - Sudden spikes in error rates (indication of new issues)
  - Consistent high error rates (systemic problems)
  - Gradual increases over time (degrading system)

### Anomaly Scores

- **0-20**: Healthy system operation, no significant anomalies
- **21-50**: Minor anomalies detected, should be monitored
- **51-80**: Significant anomalies requiring investigation
- **81-100**: Critical anomalies requiring immediate attention

### Activity Volume

Changes in activity volume can indicate:
- **Sudden increases**: New features or increased usage
- **Sudden decreases**: Potential system issues or access problems
- **Cyclical patterns**: Normal usage patterns (e.g., business hours)

### Duration Metrics

Process duration patterns to watch for:
- **Consistent increases**: System becoming less efficient
- **High variability**: Inconsistent performance
- **Sudden increases**: New bottlenecks or resource issues

## Best Practices

1. **Regular Monitoring**: Check dashboards regularly for early issue detection

2. **Investigate Anomalies**: Follow up on detected anomalies promptly:
   - Review error logs associated with anomalies
   - Check server resources during anomalous periods
   - Look for patterns across multiple anomalies

3. **Use Filtering Effectively**:
   - Start broad then narrow your focus
   - Combine multiple filters for precise analysis
   - Save common filter combinations for repeated use

4. **Correlate Across Components**:
   - Use SystemProcessDashboard to identify issues
   - Use ActivityMonitor to investigate the details
   - Use ActivityMetrics to understand patterns and trends

5. **Setup Alerts** (if supported by your implementation):
   - Critical error rate thresholds
   - Anomaly score exceeding thresholds
   - Process failure notifications

6. **Regular Exports**:
   - Export activity logs regularly for compliance
   - Archive historical data for trend analysis
   - Document major incidents with exported data

7. **Performance Optimization**:
   - Use metrics to identify slow processes
   - Track improvements after optimization
   - Monitor resource usage along with process duration 