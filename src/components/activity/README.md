# Activity Monitoring System

The Activity Monitoring System provides comprehensive tracking, logging, and visualization of both user and system activities throughout the application. It combines real-time monitoring, detailed historical records, and powerful analytics to give administrators full visibility into application operations.

## Table of Contents

1. [Overview](#overview)
2. [Components](#components)
3. [Database Tables](#database-tables)
4. [Activity Type Standardization](#activity-type-standardization)
5. [Anomaly Detection](#anomaly-detection)
6. [Enhanced Error Tracking](#enhanced-error-tracking)
7. [Usage Guide](#usage-guide)
8. [Dependencies](#dependencies)

## Overview

The Activity Monitoring System tracks and displays both user-initiated and system-generated actions across the application. It provides detailed logs of user interactions, system processes, batch operations, and integrations, allowing administrators to monitor application health, audit user actions, and diagnose issues.

## Components

### ActivityMonitor.tsx
The primary interface for viewing and filtering activity logs. Supports:
- Filtering by activity type, entity, status, source, and date range
- Detailed view of individual activity logs
- Export functionality for audit purposes
- Enhanced entity and table filtering capabilities
- Advanced system activity filtering options

### ActivityLogProvider.tsx
A React context provider that standardizes activity logging throughout the application:
- Consistent logging format for all activities
- Support for user, system, integration, database, and scheduled activities
- Automatic metadata enrichment

### SystemProcessDashboard.tsx
Monitors system processes and batch operations:
- Real-time status tracking
- Process details and performance metrics
- Associated activity logs
- Success rate visualization
- Anomaly detection capabilities
- Enhanced error tracking and analytics
- Long-running process detection

### ProcessActivityMonitor.tsx
Dedicated component for monitoring scheduled jobs and processes:
- Comprehensive views of scheduled jobs
- Process execution history
- Performance metrics and analytics
- Execution frequency visualization

### ActivityMetrics.tsx
Provides visualizations and analytics for activity data:
- User vs. system activity comparison
- Time-series activity analysis
- Action type distribution charts
- Success/failure rate analytics
- Comprehensive timeline views
- Activity sequence visualization

### EntityActivityLog.tsx
Shows activities related to a specific entity:
- Chronological activity timeline
- Filters for user vs. system activities
- Action type filtering

## Database Tables

### audit_logs
Main table for storing all activity records with standardized fields:
- Basic activity information: action, timestamp, user
- Entity references: entity_type, entity_id
- Categorization: category, severity, source
- Relational links: system_process_id, batch_operation_id

### system_processes
Tracks execution of system processes:
- Process metadata and configuration
- Execution metrics (start/end time, duration)
- Status tracking
- Error reporting and debugging information

### bulk_operations
Tracks batch operations:
- Operation configuration and progress
- Target counts and processed items
- Success/failure statistics
- Detailed error reporting

## Activity Type Standardization

Activities are categorized and standardized across the system:

### Source Types
- **User**: User-initiated actions
- **System**: System-generated activities
- **Integration**: External system integrations
- **Scheduled**: Automated scheduled tasks

### Action Types
- **Create**: Creation operations
- **Read**: Data access operations
- **Update**: Modification operations
- **Delete**: Deletion operations
- **Process**: Data processing operations
- **Import/Export**: Data transfer operations
- **Auth**: Authentication and authorization operations

### Status Types
- **Success**: Successfully completed
- **Failure**: Failed to complete
- **Pending**: In progress
- **Canceled**: Canceled by user or system
- **Partial**: Partially completed

## Anomaly Detection

The system includes advanced anomaly detection capabilities to identify unusual patterns and potential issues:

### Detection Methods
1. **Duration Anomalies**: Identifies processes that take significantly longer than average
2. **Error Rate Spikes**: Detects unusual increases in error rates
3. **Long-Running Processes**: Flags potentially stuck or deadlocked processes

### Anomaly Severity Levels
- **Low**: Minor deviation from normal patterns
- **Medium**: Significant deviation requiring attention
- **High**: Critical deviation that should be investigated immediately

### Anomaly Score
- Calculated based on number and severity of detected anomalies
- Score range: 0-100, with higher scores indicating more serious issues
- Provides at-a-glance system health assessment

## Enhanced Error Tracking

The system provides detailed error tracking and analysis capabilities:

### Error Metrics
- **Error Rate by Hour**: Visualizes error rate trends over time
- **Errors by Type**: Categorizes errors by type for focused troubleshooting
- **Errors by Process**: Identifies the most error-prone processes

### Error Impact Analysis
- System health assessment based on error patterns
- Key findings highlighting the most significant issues
- Recommendations for addressing identified problems

## Usage Guide

### Monitoring System Health

The ActivityMonitor and SystemProcessDashboard components provide real-time visibility into system health:

1. **Dashboard Overview**: Use the quick metrics cards for an at-a-glance view of system status
2. **Process Monitoring**: Track running processes and view detailed execution history
3. **Anomaly Detection**: Review the Anomaly Detection tab for potential issues
4. **Error Analysis**: Use the Error Tracking tab to identify and investigate errors

### Investigating Issues

When an issue is detected, follow these steps to investigate:

1. **Check Anomaly Detection**: Review detected anomalies for patterns or specific problem areas
2. **Examine Error Details**: Use the enhanced error tracking to understand error types and frequency
3. **View Process Logs**: Expand process details to see execution logs and error information
4. **Review Activity Timeline**: Use the timeline views to understand the sequence of events

### Interpreting Metrics

The various metrics and visualizations provide different insights:

1. **Success Rate**: Overall health of system processes (higher is better)
2. **Error Rate Trends**: Patterns in error occurrence over time
3. **Duration Metrics**: Process performance and efficiency
4. **Anomaly Score**: Overall system anomaly level (lower is better)

### Customizing Views

The monitoring components offer various customization options:

1. **Filtering**: Use the enhanced filtering options to focus on specific activities
2. **Time Range**: Adjust the time period to view different historical ranges
3. **View Selection**: Switch between different visualization modes
4. **Export**: Export data for external analysis or reporting

## Dependencies

The Activity Monitoring System relies on the following dependencies:

- **date-fns**: Date formatting and manipulation
- **recharts**: Chart visualizations
- **shadcn/ui**: UI components
- **Supabase**: Database and authentication
- **Lucide React**: Icon components

For proper functioning, ensure all dependencies are correctly installed and configured.

## Best Practices

1. **Regular Monitoring**: Check the activity monitoring dashboards regularly
2. **Investigate Anomalies**: Promptly investigate detected anomalies
3. **Review Error Patterns**: Look for recurring errors and address root causes
4. **Optimize Long-Running Processes**: Review and optimize processes with long execution times
5. **Export Regular Reports**: Export activity data for compliance and auditing