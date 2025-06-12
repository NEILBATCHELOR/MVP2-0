# MoonPay Additional Database Tables

## Overview

This document describes the three additional MoonPay database tables created to support enhanced webhook management, compliance monitoring, and policy audit logging.

## Tables Created

### 1. `moonpay_webhook_config`

**Purpose**: Configuration and management of MoonPay webhooks including delivery settings, retry policies, and monitoring.

**Key Features**:
- Webhook endpoint configuration with environment support (sandbox/production)
- Event subscription management with array support
- Comprehensive retry policy configuration with exponential backoff
- Delivery statistics tracking (attempts, successes, failures)
- SSL verification and timeout settings
- Status monitoring (active, inactive, suspended, failed)

**Usage by Services**:
- **WebhookHandler Service**: Stores webhook configurations, manages delivery attempts, tracks success rates

### 2. `moonpay_compliance_alerts`

**Purpose**: Compliance monitoring alerts including AML screening, sanctions checking, and policy violations.

**Key Features**:
- Multiple alert types: AML screening, sanctions check, PEP screening, transaction monitoring, KYC verification
- Severity levels: low, medium, high, critical
- Risk scoring (0-100) and risk level classification
- Workflow management: open, in_review, resolved, dismissed, escalated
- Assignment and escalation tracking
- Related alerts correlation
- Screening results storage

**Usage by Services**:
- **ComplianceService**: Creates alerts for AML/sanctions violations, tracks compliance issues
- **CustomerService**: Monitors KYC verification issues
- **PolicyService**: Records policy violations and compliance breaches

### 3. `moonpay_policy_logs`

**Purpose**: Audit trail of policy execution, violations, and compliance actions with retention management.

**Key Features**:
- Policy execution tracking (created, updated, triggered, passed, failed)
- Rule condition and result storage
- Before/after state tracking for audit purposes
- Compliance impact assessment
- 7-year default retention period for regulatory compliance
- Correlation ID for tracking related policy actions
- IP address and user agent tracking for security

**Usage by Services**:
- **PolicyService**: Logs all policy rule executions, violations, and approvals
- **ComplianceService**: Records compliance rule triggers and outcomes
- **AccountService**: Tracks account-level policy decisions

## Database Design Features

### Performance Optimization
- **Comprehensive Indexing**: All frequently queried columns have dedicated indexes
- **GIN Indexes**: For JSONB columns (metadata, details, rules) to support complex queries
- **Composite Indexes**: For common query patterns (entity_type + entity_id)

### Data Integrity
- **Check Constraints**: Enforce valid enum values, score ranges, and business rules
- **NOT NULL Constraints**: Ensure required fields are always populated
- **Unique Constraints**: Prevent duplicate webhook configurations and alert IDs

### Compliance & Security
- **Row Level Security (RLS)**: Enabled on all tables for data access control
- **Retention Management**: Configurable retention periods for compliance requirements
- **Audit Trail**: Complete tracking of who, what, when for all policy actions

### Maintenance & Cleanup
- **Automatic Cleanup Functions**:
  - `cleanup_old_moonpay_policy_logs()`: Removes logs past retention period
  - `archive_old_moonpay_compliance_alerts()`: Archives resolved alerts after 1 year
  - `get_moonpay_webhook_stats()`: Provides webhook performance statistics

## Integration with MoonPay Services

### WebhookHandler Service
```typescript
// Webhook configuration management
await webhookService.createWebhook({
  url: 'https://your-domain.com/webhooks/moonpay',
  events: ['transaction.completed', 'customer.kyc_completed'],
  environment: 'production'
});

// Delivery tracking and retry logic
await webhookService.trackDeliveryAttempt(webhookId, success, errorMessage);
```

### ComplianceService
```typescript
// Create compliance alert
await complianceService.createAlert({
  alertType: 'aml_screening',
  severity: 'high',
  customerId: 'customer_123',
  riskScore: 85,
  title: 'High Risk Customer Detected'
});

// Update alert status
await complianceService.updateAlertStatus(alertId, 'resolved', 'Manual review completed');
```

### PolicyService
```typescript
// Log policy execution
await policyService.logPolicyExecution({
  policyId: 'kyc_policy_001',
  actionType: 'rule_triggered',
  entityType: 'customer',
  entityId: 'customer_123',
  executionStatus: 'success'
});

// Track policy violations
await policyService.logViolation({
  policyId: 'transaction_limit_policy',
  violationDetails: { attemptedAmount: 50000, limit: 10000 }
});
```

## Migration and Deployment

### Prerequisites
- Existing MoonPay schema (moonpay.sql, moonpay-main-transactions.sql)
- PostgreSQL with UUID extension enabled
- Row Level Security (RLS) support

### Installation
1. Apply the SQL script to your Supabase database:
```sql
-- Run the script
\i scripts/sql/moonpay-additional-tables.sql
```

2. Verify table creation:
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('moonpay_webhook_config', 'moonpay_compliance_alerts', 'moonpay_policy_logs');
```

3. Set up RLS policies as needed for your application security model.

## Maintenance

### Regular Cleanup
```sql
-- Clean up old policy logs (run monthly)
SELECT cleanup_old_moonpay_policy_logs();

-- Archive old compliance alerts (run quarterly)  
SELECT archive_old_moonpay_compliance_alerts();

-- Get webhook statistics
SELECT * FROM get_moonpay_webhook_stats();
```

### Monitoring Queries
```sql
-- Monitor compliance alerts by severity
SELECT severity, COUNT(*) FROM moonpay_compliance_alerts 
WHERE status = 'open' GROUP BY severity;

-- Check webhook health
SELECT status, COUNT(*) FROM moonpay_webhook_config GROUP BY status;

-- Policy execution trends
SELECT policy_type, execution_status, COUNT(*) 
FROM moonpay_policy_logs 
WHERE executed_at > NOW() - INTERVAL '24 hours'
GROUP BY policy_type, execution_status;
```

## Next Steps

1. **Configure RLS Policies**: Set up appropriate row-level security policies based on your application's user roles
2. **Set up Monitoring**: Create dashboards for webhook delivery rates, compliance alert trends, and policy execution statistics
3. **Configure Cleanup Jobs**: Schedule regular cleanup of old logs and archived alerts
4. **Test Integration**: Verify MoonPay services can properly read/write to these tables
5. **Update TypeScript Types**: Generate new TypeScript types from the updated database schema

## Related Documentation

- [MoonPay Enhanced Integration](../docs/moonpay-enhanced-integration.md)
- [MoonPay Integration Completion Summary](../docs/moonpay-integration-completion-summary.md)
- [MoonPay Services Implementation](../docs/moonpay-services-implementation-summary.md)

## Support

For questions about these database tables or the MoonPay integration:
1. Review the comprehensive MoonPay integration documentation
2. Check the existing MoonPay service implementations
3. Verify table schemas match service expectations
