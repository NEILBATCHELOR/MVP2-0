/**
 * ActivityTypes.ts
 * Standardized definitions for activity monitoring system
 */

// Source Types - Where the action originated from
export enum ActivitySource {
  USER = 'user',           // UI-initiated by a user
  SYSTEM = 'system',       // Automated system process
  INTEGRATION = 'integration', // External system interactions
  DATABASE = 'database',   // Direct database changes (triggers, etc)
  SCHEDULED = 'scheduled'  // Scheduled jobs (cron, timers)
}

// Activity Categories - Functional areas
export enum ActivityCategory {
  // User Management
  USER_MANAGEMENT = 'user_management',      // Account creation, role changes
  AUTHENTICATION = 'authentication',        // Login, logout, password resets
  AUTHORIZATION = 'authorization',          // Permission changes
  
  // Project Management
  PROJECT_MANAGEMENT = 'project_management', // Project creation, updates
  PROJECT_STATUS = 'project_status',        // Status changes
  
  // Investment Activities
  INVESTMENT = 'investment',                // Subscriptions, redemptions
  ALLOCATION = 'allocation',                // Token allocations
  PAYMENT = 'payment',                      // Payment processing
  
  // Token Operations
  TOKEN_MANAGEMENT = 'token_management',    // Creation, deployment
  TOKEN_DISTRIBUTION = 'token_distribution', // Distribution
  TOKEN_TRANSFER = 'token_transfer',        // Transfers
  
  // Compliance
  COMPLIANCE = 'compliance',                // KYC, approvals
  DOCUMENTATION = 'documentation',          // Document management
  REPORTING = 'reporting',                  // Report generation
  
  // System Operations
  DATABASE_MAINTENANCE = 'database_maintenance', // DB operations
  SYSTEM_BACKUP = 'system_backup',           // Backup operations
  SYSTEM_UPDATE = 'system_update',           // System updates
  BATCH_PROCESSING = 'batch_processing',     // Batch operations
  DATA_SYNC = 'data_sync',                   // Data synchronization
  
  // Analytics
  ANALYTICS = 'analytics',                  // Analytics operations
  
  // Blockchain Operations
  BLOCKCHAIN = 'blockchain',                // Blockchain interactions
  SMART_CONTRACT = 'smart_contract',         // Smart contract interactions
  
  // New categories from the code block
  DATA_MANAGEMENT = 'data_management',
  CONFIGURATION = 'configuration',
  SYSTEM_MANAGEMENT = 'system_management',
  DATABASE_SCHEMA = 'database_schema',
  DATABASE_DATA = 'database_data',
  DATABASE_TRIGGER = 'database_trigger',
  WORKFLOW = 'workflow',
  BATCH_OPERATION = 'batch_operation',
  API = 'api',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  INTEGRATION = 'integration',
  UNCATEGORIZED = 'uncategorized'
}

// Activity Severities - Importance/urgency of the activity
export enum ActivitySeverity {
  DEBUG = 'debug',
  INFO = 'info',           // Informational, normal operation
  NOTICE = 'notice',
  WARNING = 'warning',     // Warning, potential issue
  ERROR = 'error',          // Error condition
  CRITICAL = 'critical',   // Critical, requires immediate attention
}

// Status Types - Outcome of the activity
export enum ActivityStatus {
  SUCCESS = 'success',     // Successfully completed
  FAILURE = 'failure',     // Failed to complete
  PENDING = 'pending',     // In progress
  CANCELED = 'canceled',   // Canceled by user or system
  PARTIAL = 'partial',      // Partially completed
  WARNING = 'warning',
  INFO = 'info'
}

// User actions - standard activity names for user-initiated actions
export enum UserActionType {
  // Authentication
  LOGIN = 'auth_login',
  LOGOUT = 'auth_logout',
  PASSWORD_RESET = 'auth_password_reset',
  MFA_SETUP = 'auth_mfa_setup',
  
  // User Management
  CREATE_USER = 'create_user',
  UPDATE_USER = 'update_user',
  DELETE_USER = 'delete_user',
  ASSIGN_ROLE = 'assign_role',
  REVOKE_ROLE = 'revoke_role',
  
  // Project Management
  CREATE_PROJECT = 'create_project',
  UPDATE_PROJECT = 'update_project',
  DELETE_PROJECT = 'delete_project',
  
  // Configuration actions
  UPDATE_SETTINGS = 'update_settings',
  
  // Integration actions
  CONNECT_INTEGRATION = 'connect_integration',
  DISCONNECT_INTEGRATION = 'disconnect_integration',
  
  // Workflow actions
  START_WORKFLOW = 'start_workflow',
  COMPLETE_WORKFLOW = 'complete_workflow',
  CANCEL_WORKFLOW = 'cancel_workflow',
  
  // Investment
  INVESTMENT_CREATE = 'investment_create',
  INVESTMENT_UPDATE = 'investment_update',
  INVESTMENT_CANCEL = 'investment_cancel',
  ALLOCATION_CREATE = 'allocation_create',
  ALLOCATION_UPDATE = 'allocation_update',
  ALLOCATION_DELETE = 'allocation_delete',
  
  // Tokens
  TOKEN_CREATE = 'token_create',
  TOKEN_UPDATE = 'token_update',
  TOKEN_DEPLOY = 'token_deploy',
  
  // Documents
  DOCUMENT_UPLOAD = 'document_upload',
  DOCUMENT_DOWNLOAD = 'document_download',
  DOCUMENT_DELETE = 'document_delete',
  
  // System
  SYSTEM_CONFIGURATION_CHANGE = 'system_configuration_change',
  REPORT_GENERATE = 'report_generate'
}

// System actions - standard activity names for system-initiated actions
export enum SystemActionType {
  // Automated Processes
  STARTUP = 'system_startup',
  SHUTDOWN = 'system_shutdown',
  MAINTENANCE = 'system_maintenance',
  
  // Data management
  BACKUP = 'data_backup',
  RESTORE = 'data_restore',
  CLEANUP = 'data_cleanup',
  
  // Scheduled Tasks
  SCHEDULED_TASK = 'scheduled_task',
  
  // Batch Operations
  BATCH_PROCESS = 'batch_process',
  
  // Integration sync
  INTEGRATION_SYNC = 'integration_sync',
  API_REQUEST = 'api_request',
  API_RESPONSE = 'api_response',
  
  // Error handling
  ERROR = 'system_error',
  WARNING = 'system_warning',
  
  // Security
  SECURITY_SCAN = 'security_scan',
  RATE_LIMIT = 'rate_limit',
  
  // Database
  DATABASE_MIGRATION = 'database_migration',
  DATABASE_VACUUM = 'database_vacuum',
  DATABASE_ANALYZE = 'database_analyze',
  
  // Blockchain
  BLOCKCHAIN_TRANSACTION_SUBMIT = 'blockchain_transaction_submit',
  BLOCKCHAIN_TRANSACTION_CONFIRM = 'blockchain_transaction_confirm',
  BLOCKCHAIN_CONTRACT_DEPLOY = 'blockchain_contract_deploy',
  BLOCKCHAIN_CONTRACT_INTERACT = 'blockchain_contract_interact',
  
  // Notifications
  NOTIFICATION_SEND = 'notification_send',
  EMAIL_SEND = 'email_send',
  
  // Data Processing
  DATA_IMPORT = 'data_import',
  DATA_EXPORT = 'data_export',
  DATA_TRANSFORM = 'data_transform',
  
  // Analytics
  ANALYTICS_GENERATE = 'analytics_generate',
  METRICS_CALCULATE = 'metrics_calculate',
  REPORT_GENERATE = 'report_generate'
}

// Activity interface for standardized logging structure
export interface ActivityLogData {
  id?: string;
  timestamp?: string;
  action: string;
  username?: string;
  details?: string | Record<string, any>;
  status?: string;
  entity_type?: string;
  entity_id?: string;
  project_id?: string;
  category?: ActivityCategory;
  severity?: ActivitySeverity;
  metadata?: Record<string, any>;
  parent_id?: string;
  correlation_id?: string;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
  duration?: number;
}

// Helper function to map action to category
export const getCategoryForAction = (action: string): ActivityCategory => {
  action = action.toLowerCase();
  
  if (action.startsWith('auth_')) {
    return ActivityCategory.AUTHENTICATION;
  }
  
  if (action.includes('role') || action.includes('permission')) {
    return ActivityCategory.AUTHORIZATION;
  }
  
  if (action.includes('user') && (action.includes('create') || action.includes('update') || action.includes('delete'))) {
    return ActivityCategory.USER_MANAGEMENT;
  }
  
  if (action.includes('database') || action.includes('schema') || action.includes('migration')) {
    return ActivityCategory.DATABASE_SCHEMA;
  }
  
  if (action.includes('integration')) {
    return ActivityCategory.INTEGRATION;
  }
  
  if (action.includes('workflow')) {
    return ActivityCategory.WORKFLOW;
  }
  
  if (action.includes('batch') || action.includes('bulk')) {
    return ActivityCategory.BATCH_OPERATION;
  }
  
  if (action.includes('api')) {
    return ActivityCategory.API;
  }
  
  if (action.includes('settings') || action.includes('config')) {
    return ActivityCategory.CONFIGURATION;
  }
  
  if (action.includes('security') || action.includes('scan')) {
    return ActivityCategory.SECURITY;
  }
  
  if (action.includes('create') || action.includes('update') || action.includes('delete') || 
      action.includes('archive') || action.includes('restore')) {
    return ActivityCategory.DATA_MANAGEMENT;
  }
  
  return ActivityCategory.UNCATEGORIZED;
};

// Helper to determine severity from action and status
export const getSeverityForAction = (
  action: string,
  status: ActivityStatus = ActivityStatus.SUCCESS
): ActivitySeverity => {
  action = action.toLowerCase();
  
  // Failed actions should have higher severity
  if (status === ActivityStatus.FAILURE) {
    if (action.includes('security') || 
        action.includes('auth') || 
        action.includes('delete') || 
        action.includes('admin')) {
      return ActivitySeverity.ERROR;
    }
    return ActivitySeverity.WARNING;
  }
  
  // Warning status
  if (status === ActivityStatus.WARNING) {
    return ActivitySeverity.WARNING;
  }
  
  // Pending status
  if (status === ActivityStatus.PENDING) {
    return ActivitySeverity.INFO;
  }
  
  // Successful security-related actions
  if (action.includes('security') || action.includes('scan')) {
    return ActivitySeverity.NOTICE;
  }
  
  // System actions
  if (action.startsWith('system_')) {
    if (action.includes('error')) {
      return ActivitySeverity.ERROR;
    }
    if (action.includes('warning')) {
      return ActivitySeverity.WARNING;
    }
    return ActivitySeverity.INFO;
  }
  
  // Critical data operations
  if ((action.includes('delete') || action.includes('truncate')) && 
      (action.includes('database') || action.includes('schema'))) {
    return ActivitySeverity.NOTICE;
  }
  
  // Default for successful operations
  return ActivitySeverity.INFO;
}; 