import React, { createContext, useContext, ReactNode } from "react";
import { 
  ActivitySource,
  ActivityCategory, 
  ActivityStatus,
  ActivitySeverity,
  UserActionType,
  SystemActionType,
  ActivityLogData 
} from "@/types/domain/activity/ActivityTypes";
import { 
  logUserActivity as logUserActivityUtil, 
  logSystemActivity as logSystemActivityUtil, 
  logIntegrationActivity as logIntegrationActivityUtil,
  logDatabaseActivity as logDatabaseActivityUtil,
  logScheduledActivity as logScheduledActivityUtil,
  logActivity as logActivityUtil,
  createChildActivity as createChildActivityUtil,
  getRelatedActivities as getRelatedActivitiesUtil,
  getProcessActivities as getProcessActivitiesUtil,
  getBatchOperationActivities as getBatchOperationActivitiesUtil,
  updateActivityStatus as updateActivityStatusUtil
} from "@/utils/shared/logging/activityLogger";

// Type for user activity with standard options
export interface UserActivityOptions {
  action: UserActionType | string;
  entityType?: string;
  entityId?: string;
  details?: string | Record<string, any>;
  status?: ActivityStatus;
  projectId?: string;
  metadata?: Record<string, any>;
  category?: ActivityCategory;
  severity?: ActivitySeverity;
  correlationId?: string;
  parentId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

// Type for system activity with standard options
export interface SystemActivityOptions {
  action: SystemActionType | string;
  entityType?: string;
  entityId?: string;
  details?: string | Record<string, any>;
  status?: ActivityStatus;
  projectId?: string;
  metadata?: Record<string, any>;
  category?: ActivityCategory;
  severity?: ActivitySeverity;
  systemProcessId?: string;
  batchOperationId?: string;
  parentId?: string;
  correlationId?: string;
  initiatedBy?: string;
  duration?: number;
}

// Interface for the context
interface ActivityLogContextType {
  logUserActivity: (options: UserActivityOptions) => Promise<boolean>;
  logSystemActivity: (options: SystemActivityOptions) => Promise<string | null>;
  logIntegrationActivity: (
    action: string, 
    integrationName: string, 
    options: Omit<UserActivityOptions, 'action'> & { externalReference?: string }
  ) => Promise<boolean>;
  logDatabaseActivity: (
    action: string,
    options: Omit<UserActivityOptions, 'action'> & { oldData?: Record<string, any>, newData?: Record<string, any> }
  ) => Promise<boolean>;
  logScheduledActivity: (
    action: string,
    scheduleName: string,
    options: Omit<UserActivityOptions, 'action'> & { duration?: number, systemProcessId?: string }
  ) => Promise<boolean>;
  logGenericActivity: (data: ActivityLogData) => Promise<boolean>;
  createChildActivity: (
    parentId: string,
    action: string,
    options: {
      entityType?: string;
      entityId?: string;
      details?: string | Record<string, any>;
      status?: ActivityStatus;
      source?: ActivitySource;
      category?: ActivityCategory;
      severity?: ActivitySeverity;
      metadata?: Record<string, any>;
    }
  ) => Promise<string | null>;
  updateActivityStatus: (
    activityId: string,
    status: ActivityStatus,
    metadata?: Record<string, any>,
    duration?: number
  ) => Promise<boolean>;
  getRelatedActivities: (activityId: string) => Promise<any[]>;
  getProcessActivities: (processId: string) => Promise<any[]>;
  getBatchOperationActivities: (batchId: string) => Promise<any[]>;
}

// Create the context with default values
const ActivityLogContext = createContext<ActivityLogContextType>({
  logUserActivity: async () => false,
  logSystemActivity: async () => null,
  logIntegrationActivity: async () => false,
  logDatabaseActivity: async () => false,
  logScheduledActivity: async () => false,
  logGenericActivity: async () => false,
  createChildActivity: async () => null,
  updateActivityStatus: async () => false,
  getRelatedActivities: async () => [],
  getProcessActivities: async () => [],
  getBatchOperationActivities: async () => []
});

// Hook for using the context
export const useActivityLog = () => useContext(ActivityLogContext);

// Provider props
interface ActivityLogProviderProps {
  children: ReactNode;
}

/**
 * ActivityLogProvider component
 * Provides context for logging activities throughout the application
 */
const ActivityLogProvider = ({ children }: ActivityLogProviderProps) => {
  // Implementation for user activity logging
  const handleLogUserActivity = async (options: UserActivityOptions): Promise<boolean> => {
    return await logUserActivityUtil(options.action, {
      entityType: options.entityType,
      entityId: options.entityId,
      details: options.details,
      status: options.status,
      projectId: options.projectId,
      metadata: options.metadata,
      category: options.category,
      severity: options.severity,
      correlationId: options.correlationId,
      parentId: options.parentId,
      sessionId: options.sessionId,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent
    });
  };

  // Implementation for system activity logging
  const handleLogSystemActivity = async (options: SystemActivityOptions): Promise<string | null> => {
    return await logSystemActivityUtil(options.action, {
      entityType: options.entityType,
      entityId: options.entityId,
      details: options.details,
      status: options.status,
      projectId: options.projectId,
      metadata: options.metadata,
      category: options.category,
      severity: options.severity,
      systemProcessId: options.systemProcessId,
      batchOperationId: options.batchOperationId,
      parentId: options.parentId,
      correlationId: options.correlationId,
      initiatedBy: options.initiatedBy,
      duration: options.duration
    });
  };

  // Implementation for integration activity logging
  const handleLogIntegrationActivity = async (
    action: string,
    integrationName: string,
    options: Omit<UserActivityOptions, 'action'> & { externalReference?: string }
  ): Promise<boolean> => {
    return await logIntegrationActivityUtil(action, {
      integrationName,
      ...options
    });
  };

  // Implementation for database activity logging
  const handleLogDatabaseActivity = async (
    action: string,
    options: Omit<UserActivityOptions, 'action'> & { oldData?: Record<string, any>, newData?: Record<string, any> }
  ): Promise<boolean> => {
    return await logDatabaseActivityUtil(action, options);
  };

  // Implementation for scheduled activity logging
  const handleLogScheduledActivity = async (
    action: string,
    scheduleName: string,
    options: Omit<UserActivityOptions, 'action'> & { duration?: number, systemProcessId?: string }
  ): Promise<boolean> => {
    return await logScheduledActivityUtil(action, {
      scheduleName,
      ...options
    });
  };

  // Implementation for generic activity logging
  const handleLogGenericActivity = async (data: ActivityLogData): Promise<boolean> => {
    return await logActivityUtil(data);
  };

  // Implementation for creating a child activity
  const handleCreateChildActivity = async (
    parentId: string,
    action: string,
    options: {
      entityType?: string;
      entityId?: string;
      details?: string | Record<string, any>;
      status?: ActivityStatus;
      source?: ActivitySource;
      category?: ActivityCategory;
      severity?: ActivitySeverity;
      metadata?: Record<string, any>;
    }
  ): Promise<string | null> => {
    return await createChildActivityUtil(parentId, action, options);
  };

  // Implementation for updating activity status
  const handleUpdateActivityStatus = async (
    activityId: string,
    status: ActivityStatus,
    metadata?: Record<string, any>,
    duration?: number
  ): Promise<boolean> => {
    return await updateActivityStatusUtil(activityId, status, metadata, duration);
  };

  // Implementation for getting related activities
  const handleGetRelatedActivities = async (activityId: string): Promise<any[]> => {
    return await getRelatedActivitiesUtil(activityId);
  };

  // Implementation for getting process activities
  const handleGetProcessActivities = async (processId: string): Promise<any[]> => {
    return await getProcessActivitiesUtil(processId);
  };

  // Implementation for getting batch operation activities
  const handleGetBatchOperationActivities = async (batchId: string): Promise<any[]> => {
    return await getBatchOperationActivitiesUtil(batchId);
  };

  return (
    <ActivityLogContext.Provider
      value={{
        logUserActivity: handleLogUserActivity,
        logSystemActivity: handleLogSystemActivity,
        logIntegrationActivity: handleLogIntegrationActivity,
        logDatabaseActivity: handleLogDatabaseActivity,
        logScheduledActivity: handleLogScheduledActivity,
        logGenericActivity: handleLogGenericActivity,
        createChildActivity: handleCreateChildActivity,
        updateActivityStatus: handleUpdateActivityStatus,
        getRelatedActivities: handleGetRelatedActivities,
        getProcessActivities: handleGetProcessActivities,
        getBatchOperationActivities: handleGetBatchOperationActivities
      }}
    >
      {children}
    </ActivityLogContext.Provider>
  );
};

export default ActivityLogProvider;
