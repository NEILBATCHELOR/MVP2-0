/**
 * Activity Analytics Utilities
 * 
 * This file provides functions for analyzing activity logs and generating
 * insights about system and user behavior patterns.
 */

import { supabase } from "@/infrastructure/database/client";
import {
  ActivitySource,
  ActivityCategory,
  ActivityStatus,
  ActivitySeverity
} from "@/types/domain/activity/ActivityTypes";
import { PostgrestError } from "@supabase/supabase-js";

// Types for analytics results
export interface ActivityCountByDate {
  date: string;
  count: number;
  source?: ActivitySource;
}

export interface ActivityDistribution {
  category: string | ActivityCategory;
  count: number;
  percentage: number;
}

export interface UserActivitySummary {
  userId: string;
  userEmail: string;
  totalActivities: number;
  lastActivity: string;
  activeDays: number;
  successRate: number;
  failureRate: number;
  avgActivitiesPerDay: number;
}

export interface SystemHealthMetrics {
  totalProcesses: number;
  successRate: number;
  averageDuration: number;
  errorRate: number;
  activeProcesses: number;
  completedProcesses: number;
  failedProcesses: number;
}

export interface AnomalyReport {
  timestamp: string;
  metric: string;
  expected: number;
  actual: number;
  deviation: number;
  severity: ActivitySeverity;
  details: string;
}

// Type for success rate data
export interface SuccessRateData {
  category: ActivityCategory;
  success_rate: number;
  total_count: number;
}

// Type for top user actions
export interface TopUserAction {
  action: string;
  count: number;
}

// Type for user vs system split
export interface UserSystemSplit {
  user: number;
  system: number;
}

// Type for time of day distribution
export interface TimeOfDayDistribution {
  hour: number;
  count: number;
}

/**
 * Get activity counts by date range, optionally filtered by source
 */
export const getActivityCountsByDate = async (
  startDateOrDays: string | number,
  endDate?: string,
  source?: ActivitySource,
  interval: 'day' | 'week' | 'month' = 'day'
): Promise<ActivityCountByDate[]> => {
  try {
    // If first parameter is a number, treat it as 'days' for backward compatibility
    if (typeof startDateOrDays === 'number') {
      const days = startDateOrDays;
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(new Date().setDate(new Date().getDate() - days)).toISOString().split('T')[0];
      
      // Use a raw SQL query with type assertion to bypass function name check
      const { data, error } = await supabase.rpc(
        'get_activity_counts_by_date' as any, 
        {
          p_start_date: startDate,
          p_end_date: endDate,
          p_source: source || null,
          p_interval: interval
        }
      );

      if (error) {
        console.error("Error fetching activity counts by date:", error);
        return [];
      }

      // Type assertion to handle the returned data
      return (data as any[])?.map((item: any) => ({
        date: item.date,
        count: item.count,
        source: item.source
      })) || [];
    } 
    // Original implementation for date range
    else {
      const startDate = startDateOrDays;
      
      if (!endDate) {
        throw new Error("End date must be provided when start date is a string");
      }

      // Use a raw SQL query with type assertion
      const { data, error } = await supabase.rpc(
        'get_activity_counts_by_date' as any, 
        {
          p_start_date: startDate,
          p_end_date: endDate,
          p_source: source || null,
          p_interval: interval
        }
      );

      if (error) {
        console.error("Error fetching activity counts by date:", error);
        return [];
      }

      // If no data or invalid response, return empty array
      if (!data || !Array.isArray(data)) {
        return [];
      }

      return (data as any[]).map((item: any) => ({
        date: item.date,
        count: item.count,
        source: item.source
      }));
    }
  } catch (error) {
    console.error("Failed to get activity counts by date:", error);
    return [];
  }
};

/**
 * Get distribution of activities by category
 */
export const getActivityDistributionByCategory = async (
  startDateOrDays: string | number,
  endDate?: string,
  source?: ActivitySource
): Promise<ActivityDistribution[]> => {
  try {
    // If first parameter is a number, treat it as 'days' for backward compatibility
    if (typeof startDateOrDays === 'number') {
      const days = startDateOrDays;
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(new Date().setDate(new Date().getDate() - days)).toISOString().split('T')[0];

      // Use a raw SQL query with type assertion
      const { data, error } = await supabase.rpc(
        'get_activity_distribution_by_category' as any, 
        {
          p_start_date: startDate,
          p_end_date: endDate,
          p_source: source || null
        }
      );

      if (error) {
        console.error("Error fetching activity distribution by category:", error);
        return [];
      }

      // Calculate total for percentages with type assertion
      const total = (data as any[])?.reduce((sum: number, item: any) => sum + item.count, 0) || 0;

      return (data as any[])?.map((item: any) => ({
        category: item.category || 'uncategorized',
        count: item.count,
        percentage: total > 0 ? Number(((item.count / total) * 100).toFixed(1)) : 0
      })) || [];
    }
    // Original implementation for date range
    else {
      const startDate = startDateOrDays;
      
      if (!endDate) {
        throw new Error("End date must be provided when start date is a string");
      }

      // Use a raw SQL query with type assertion
      const { data, error } = await supabase.rpc(
        'get_activity_distribution_by_category' as any, 
        {
          p_start_date: startDate,
          p_end_date: endDate,
          p_source: source || null
        }
      );

      if (error) {
        console.error("Error fetching activity distribution by category:", error);
        return [];
      }

      // If no data or invalid response, return empty array
      if (!data || !Array.isArray(data)) {
        return [];
      }

      // Calculate total for percentages
      const total = (data as any[]).reduce((sum: number, item: any) => sum + item.count, 0);

      return (data as any[]).map((item: any) => ({
        category: item.category || 'uncategorized',
        count: item.count,
        percentage: total > 0 ? Number(((item.count / total) * 100).toFixed(1)) : 0
      }));
    }
  } catch (error) {
    console.error("Failed to get activity distribution by category:", error);
    return [];
  }
};

/**
 * Get success/failure rates overall or by category
 */
export const getActivitySuccessRates = async (
  startDateOrDays: string | number,
  endDateOrSource?: string | ActivitySource,
  categoryOrSource?: ActivityCategory | ActivitySource
): Promise<SuccessRateData[] | { success: number; failure: number; pending: number; total: number }> => {
  try {
    // If first parameter is a number, treat it as 'days' for backward compatibility
    if (typeof startDateOrDays === 'number') {
      const days = startDateOrDays;
      const source = endDateOrSource as ActivitySource | undefined;
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(new Date().setDate(new Date().getDate() - days)).toISOString().split('T')[0];

      // Use a raw SQL query for the newer implementation with type assertion
      const { data, error } = await supabase.rpc(
        'get_activity_success_rates_v2' as any, 
        {
          p_start_date: startDate,
          p_end_date: endDate,
          p_source: source || null
        }
      );

      if (error) {
        console.error("Error fetching activity success rates:", error);
        return [];
      }

      return (data as any[])?.map((item: any) => ({
        category: item.category,
        success_rate: item.success_rate,
        total_count: item.total_count
      })) || [];
    } 
    // Original implementation for date range
    else {
      const startDate = startDateOrDays;
      const endDate = endDateOrSource as string;
      const category = categoryOrSource as ActivityCategory | undefined;
      
      if (!endDate || typeof endDate !== 'string') {
        throw new Error("End date must be provided and must be a string");
      }

      // Use a raw SQL query with type assertion
      const { data, error } = await supabase.rpc(
        'get_activity_success_rates' as any, 
        {
          p_start_date: startDate,
          p_end_date: endDate,
          p_category: category || null
        }
      );

      if (error) {
        console.error("Error fetching activity success rates:", error);
        return { success: 0, failure: 0, pending: 0, total: 0 };
      }

      // Initialize counts
      let success = 0;
      let failure = 0;
      let pending = 0;
      let total = 0;

      // Process the returned data
      if (data && Array.isArray(data)) {
        data.forEach((item: any) => {
          const count = Number(item.count || 0);
          total += count;
          
          if (item.status === ActivityStatus.SUCCESS) {
            success = count;
          } else if (item.status === ActivityStatus.FAILURE) {
            failure = count;
          } else if (item.status === ActivityStatus.PENDING) {
            pending = count;
          }
        });
      }

      return { success, failure, pending, total };
    }
  } catch (error) {
    console.error("Failed to get activity success rates:", error);
    return { success: 0, failure: 0, pending: 0, total: 0 };
  }
};

/**
 * Get user activity summaries
 */
export const getUserActivitySummaries = async (
  startDateOrLimit: string | number,
  endDateOrDays?: string | number,
  limit?: number
): Promise<UserActivitySummary[]> => {
  try {
    // If first parameter is a number and second is a number or undefined, use newer implementation
    if (typeof startDateOrLimit === 'number' && (typeof endDateOrDays === 'number' || endDateOrDays === undefined)) {
      const userLimit = startDateOrLimit;
      const days = endDateOrDays as number || 30;
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(new Date().setDate(new Date().getDate() - days)).toISOString().split('T')[0];

      // Call the get_user_activity_summaries function with type assertion
      const { data, error } = await supabase.rpc(
        'get_user_activity_summaries_v2' as any, 
        {
          p_start_date: startDate,
          p_end_date: endDate,
          p_limit: userLimit
        }
      );

      if (error) {
        console.error("Error fetching user activity summaries:", error);
        return [];
      }

      return (data as any[])?.map((item: any) => ({
        userId: item.user_id,
        userEmail: item.user_email || 'unknown',
        totalActivities: item.total_activities,
        lastActivity: item.last_activity,
        activeDays: item.active_days || 0,
        successRate: item.success_rate || 0,
        failureRate: item.failure_rate || 0,
        avgActivitiesPerDay: item.avg_activities_per_day || 0
      })) || [];
    }
    // Original implementation
    else {
      const startDate = startDateOrLimit as string;
      const endDate = endDateOrDays as string;
      
      if (!endDate || typeof endDate !== 'string') {
        throw new Error("End date must be provided and must be a string");
      }

      // Call the get_user_activity_summaries function with type assertion
      const { data, error } = await supabase.rpc(
        'get_user_activity_summaries' as any, 
        {
          p_start_date: startDate,
          p_end_date: endDate,
          p_limit: limit || 10
        }
      );

      if (error) {
        console.error("Error fetching user activity summaries:", error);
        return [];
      }

      // Handle the case where data is not an array
      if (!data || !Array.isArray(data)) {
        return [];
      }

      return (data as any[]).map((item: any) => ({
        userId: item.user_id,
        userEmail: item.user_email || 'unknown',
        totalActivities: item.total_activities,
        lastActivity: item.last_activity,
        activeDays: item.active_days || 0,
        successRate: item.success_rate || 0,
        failureRate: item.failure_rate || 0,
        avgActivitiesPerDay: item.avg_activities_per_day || 0
      }));
    }
  } catch (error) {
    console.error("Failed to get user activity summaries:", error);
    return [];
  }
};

/**
 * Get top user actions
 */
export const getTopUserActions = async (
  limitOrDays: number,
  days?: number
): Promise<TopUserAction[]> => {
  try {
    // If second parameter is provided, first parameter is limit
    // Otherwise, first parameter is days and default limit is 10
    const limit = days !== undefined ? limitOrDays : 10;
    const daysValue = days !== undefined ? days : limitOrDays;
    
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(new Date().setDate(new Date().getDate() - daysValue)).toISOString().split('T')[0];

    // Use a raw SQL query with type assertion
    const { data, error } = await supabase.rpc(
      'get_top_user_actions' as any, 
      {
        p_start_date: startDate,
        p_end_date: endDate,
        p_limit: limit
      }
    );

    if (error) {
      console.error("Error fetching top user actions:", error);
      return [];
    }

    return (data as any[])?.map((item: any) => ({
      action: item.action || 'unknown',
      count: item.count
    })) || [];
  } catch (error) {
    console.error("Failed to get top user actions:", error);
    return [];
  }
};

/**
 * Get user vs system activity split
 */
export const getUserSystemActivitySplit = async (
  days: number = 30
): Promise<UserSystemSplit> => {
  try {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(new Date().setDate(new Date().getDate() - days)).toISOString().split('T')[0];

    // Use a raw SQL query with type assertion
    const { data, error } = await supabase.rpc(
      'get_user_system_activity_split' as any, 
      {
        p_start_date: startDate,
        p_end_date: endDate
      }
    );

    if (error) {
      console.error("Error fetching user/system activity split:", error);
      return { user: 0, system: 0 };
    }

    let userCount = 0;
    let systemCount = 0;

    if (data && Array.isArray(data)) {
      data.forEach((item: any) => {
        if (item.source === ActivitySource.USER) {
          userCount = item.count || 0;
        } else if (item.source === ActivitySource.SYSTEM) {
          systemCount = item.count || 0;
        }
      });
    }

    return { user: userCount, system: systemCount };
  } catch (error) {
    console.error("Failed to get user/system activity split:", error);
    return { user: 0, system: 0 };
  }
};

/**
 * Get activity distribution by time of day
 */
export const getActivityByTimeOfDay = async (
  days: number = 30,
  source?: ActivitySource
): Promise<TimeOfDayDistribution[]> => {
  try {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(new Date().setDate(new Date().getDate() - days)).toISOString().split('T')[0];

    // Use a raw SQL query with type assertion
    const { data, error } = await supabase.rpc(
      'get_activity_by_time_of_day' as any, 
      {
        p_start_date: startDate,
        p_end_date: endDate,
        p_source: source || null
      }
    );

    if (error) {
      console.error("Error fetching activity by time of day:", error);
      return [];
    }

    // Create an array for all 24 hours, initialized with count 0
    const hourlyDistribution: TimeOfDayDistribution[] = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: 0
    }));

    // Populate the counts from the data
    if (data && Array.isArray(data)) {
      data.forEach((item: any) => {
        const hour = Number(item.hour);
        if (hour >= 0 && hour < 24) {
          hourlyDistribution[hour].count = item.count || 0;
        }
      });
    }

    return hourlyDistribution;
  } catch (error) {
    console.error("Failed to get activity by time of day:", error);
    return [];
  }
};

/**
 * Get system health metrics
 */
export const getSystemHealthMetrics = async (
  startDate: string,
  endDate: string
): Promise<SystemHealthMetrics> => {
  try {
    // Get system process metrics
    const { data, error } = await supabase
      .from('system_processes')
      .select(`
        id,
        status,
        start_time,
        end_time
      `)
      .gte('start_time', startDate)
      .lte('start_time', endDate);

    if (error) {
      console.error("Error fetching system process metrics:", error);
      return {
        totalProcesses: 0,
        successRate: 0,
        averageDuration: 0,
        errorRate: 0,
        activeProcesses: 0,
        completedProcesses: 0,
        failedProcesses: 0
      };
    }

    // Process the results
    const processes = data || [];
    const totalProcesses = processes.length;
    
    let completedProcesses = 0;
    let failedProcesses = 0;
    let activeProcesses = 0;
    let totalDuration = 0;
    let processesWithDuration = 0;

    processes.forEach(process => {
      if (process.status === 'completed') {
        completedProcesses++;
        if (process.end_time && process.start_time) {
          const duration = new Date(process.end_time).getTime() - new Date(process.start_time).getTime();
          totalDuration += duration;
          processesWithDuration++;
        }
      } else if (process.status === 'failed') {
        failedProcesses++;
      } else if (process.status === 'running') {
        activeProcesses++;
      }
    });

    const successRate = totalProcesses > 0 ? (completedProcesses / totalProcesses) * 100 : 0;
    const errorRate = totalProcesses > 0 ? (failedProcesses / totalProcesses) * 100 : 0;
    const averageDuration = processesWithDuration > 0 ? totalDuration / processesWithDuration : 0;

    return {
      totalProcesses,
      successRate,
      averageDuration,
      errorRate,
      activeProcesses,
      completedProcesses,
      failedProcesses
    };
  } catch (error) {
    console.error("Error in getSystemHealthMetrics:", error);
    return {
      totalProcesses: 0,
      successRate: 0,
      averageDuration: 0,
      errorRate: 0,
      activeProcesses: 0,
      completedProcesses: 0,
      failedProcesses: 0
    };
  }
};

/**
 * Detect anomalies in activity patterns
 */
export const detectActivityAnomalies = async (
  startDate: string,
  endDate: string,
  baselineStartDate: string,
  baselineEndDate: string
): Promise<AnomalyReport[]> => {
  try {
    // Get current period activity counts
    const currentCounts = await getActivityCountsByDate(startDate, endDate);
    
    // Get baseline period activity counts for comparison
    const baselineCounts = await getActivityCountsByDate(baselineStartDate, baselineEndDate);
    
    // Calculate baseline metrics
    const baselineDayCount = new Set(baselineCounts.map(item => item.date)).size;
    const baselineTotal = baselineCounts.reduce((sum, item) => sum + item.count, 0);
    const baselineDailyAvg = baselineTotal / baselineDayCount;
    const baselineStdDev = calculateStandardDeviation(
      baselineCounts.map(item => item.count)
    );
    
    // Detect anomalies
    const anomalies: AnomalyReport[] = [];
    const currentDays = new Set(currentCounts.map(item => item.date));
    
    currentDays.forEach(date => {
      const dayActivities = currentCounts.filter(item => item.date === date);
      const dayTotal = dayActivities.reduce((sum, item) => sum + item.count, 0);
      
      // Calculate deviation from baseline
      const deviation = (dayTotal - baselineDailyAvg) / baselineDailyAvg;
      const zScore = baselineStdDev > 0 ? (dayTotal - baselineDailyAvg) / baselineStdDev : 0;
      
      // Determine if this is an anomaly
      if (Math.abs(zScore) > 2) { // Using z-score > 2 as anomaly threshold
        let severity = ActivitySeverity.INFO;
        
        if (Math.abs(zScore) > 4) {
          severity = ActivitySeverity.CRITICAL;
        } else if (Math.abs(zScore) > 3) {
          severity = ActivitySeverity.WARNING;
        } else {
          severity = ActivitySeverity.NOTICE;
        }
        
        anomalies.push({
          timestamp: date,
          metric: 'Activity Count',
          expected: Math.round(baselineDailyAvg),
          actual: dayTotal,
          deviation: deviation * 100, // as percentage
          severity,
          details: `Activity count is ${deviation > 0 ? 'above' : 'below'} the baseline by ${Math.abs(Math.round(deviation * 100))}% (z-score: ${zScore.toFixed(2)})`
        });
      }
    });
    
    return anomalies;
  } catch (error) {
    console.error("Error in detectActivityAnomalies:", error);
    return [];
  }
};

/**
 * Helper function to calculate standard deviation
 */
const calculateStandardDeviation = (values: number[]): number => {
  const n = values.length;
  if (n === 0) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / n;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
  
  return Math.sqrt(variance);
};

/**
 * Get average response times for system processes
 */
export const getAverageResponseTimes = async (
  startDate: string,
  endDate: string
): Promise<{ processType: string; avgDuration: number }[]> => {
  try {
    const { data, error } = await supabase
      .from('system_processes')
      .select(`
        process_name,
        start_time,
        end_time
      `)
      .gte('start_time', startDate)
      .lte('start_time', endDate)
      .eq('status', 'completed');
    
    if (error) {
      console.error("Error fetching average response times:", error);
      return [];
    }
    
    // Group by process name and calculate average duration
    const processGroups: Record<string, number[]> = {};
    
    (data || []).forEach(process => {
      if (process.end_time && process.start_time) {
        const duration = new Date(process.end_time).getTime() - new Date(process.start_time).getTime();
        
        if (!processGroups[process.process_name]) {
          processGroups[process.process_name] = [];
        }
        
        processGroups[process.process_name].push(duration);
      }
    });
    
    // Calculate averages
    return Object.entries(processGroups).map(([processType, durations]) => ({
      processType,
      avgDuration: durations.reduce((sum, duration) => sum + duration, 0) / durations.length
    })).sort((a, b) => b.avgDuration - a.avgDuration);
  } catch (error) {
    console.error("Error in getAverageResponseTimes:", error);
    return [];
  }
}; 