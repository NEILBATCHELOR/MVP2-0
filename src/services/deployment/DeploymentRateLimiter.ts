/**
 * DeploymentRateLimiter
 * 
 * A service to handle rate limiting for token deployments
 * Prevents abuse of the deployment service and ensures fair usage
 */
import { supabase } from '@/infrastructure/supabaseClient';

// Rate limit configuration
export interface RateLimitConfig {
  maxDeploymentsPerHour: number;
  maxDeploymentsPerDay: number;
  maxConcurrentDeployments: number;
  userSpecificLimits?: Map<string, {
    maxDeploymentsPerHour: number;
    maxDeploymentsPerDay: number;
    maxConcurrentDeployments: number;
  }>;
}

// Default rate limit configuration
const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  maxDeploymentsPerHour: 5,
  maxDeploymentsPerDay: 20,
  maxConcurrentDeployments: 3
};

// Result of rate limit check
export interface RateLimitCheckResult {
  allowed: boolean;
  reason?: string;
  retryAfter?: number; // seconds until retry is allowed
  currentUsage?: {
    hourly: number;
    daily: number;
    concurrent: number;
  };
}

/**
 * DeploymentRateLimiter class to manage token deployment rate limits
 */
export class DeploymentRateLimiter {
  private static instance: DeploymentRateLimiter;
  private config: RateLimitConfig;
  private concurrentDeployments: Map<string, number> = new Map();
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor(config: RateLimitConfig = DEFAULT_RATE_LIMIT_CONFIG) {
    this.config = config;
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): DeploymentRateLimiter {
    if (!DeploymentRateLimiter.instance) {
      DeploymentRateLimiter.instance = new DeploymentRateLimiter();
    }
    return DeploymentRateLimiter.instance;
  }
  
  /**
   * Update rate limit configuration
   * @param config New rate limit configuration
   */
  public updateConfig(config: Partial<RateLimitConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Check if a deployment is allowed for a specific user and project
   * @param userId User ID
   * @param projectId Project ID
   * @returns Result of rate limit check
   */
  public async checkDeploymentAllowed(userId: string, projectId: string): Promise<RateLimitCheckResult> {
    try {
      // Get user-specific limits if they exist
      const userLimits = this.config.userSpecificLimits?.get(userId);
      
      // Determine which limits to use (user-specific or default)
      const maxDeploymentsPerHour = userLimits?.maxDeploymentsPerHour || this.config.maxDeploymentsPerHour;
      const maxDeploymentsPerDay = userLimits?.maxDeploymentsPerDay || this.config.maxDeploymentsPerDay;
      const maxConcurrentDeployments = userLimits?.maxConcurrentDeployments || this.config.maxConcurrentDeployments;
      
      // Check concurrent deployments
      const userConcurrentKey = `${userId}:${projectId}`;
      const concurrent = this.concurrentDeployments.get(userConcurrentKey) || 0;
      
      if (concurrent >= maxConcurrentDeployments) {
        return {
          allowed: false,
          reason: `Maximum concurrent deployments (${maxConcurrentDeployments}) reached`,
          currentUsage: {
            hourly: await this.getHourlyDeploymentCount(userId, projectId),
            daily: await this.getDailyDeploymentCount(userId, projectId),
            concurrent
          }
        };
      }
      
      // Check hourly deployments
      const hourlyCount = await this.getHourlyDeploymentCount(userId, projectId);
      
      if (hourlyCount >= maxDeploymentsPerHour) {
        // Calculate seconds until next deployment is allowed
        const oldestHourlyDeployment = await this.getOldestHourlyDeployment(userId, projectId);
        const now = new Date();
        const resetTime = new Date(oldestHourlyDeployment);
        resetTime.setHours(resetTime.getHours() + 1);
        const retryAfter = Math.max(0, Math.ceil((resetTime.getTime() - now.getTime()) / 1000));
        
        return {
          allowed: false,
          reason: `Hourly deployment limit (${maxDeploymentsPerHour}) reached`,
          retryAfter,
          currentUsage: {
            hourly: hourlyCount,
            daily: await this.getDailyDeploymentCount(userId, projectId),
            concurrent
          }
        };
      }
      
      // Check daily deployments
      const dailyCount = await this.getDailyDeploymentCount(userId, projectId);
      
      if (dailyCount >= maxDeploymentsPerDay) {
        // Calculate seconds until next deployment is allowed
        const oldestDailyDeployment = await this.getOldestDailyDeployment(userId, projectId);
        const now = new Date();
        const resetDate = new Date(oldestDailyDeployment);
        resetDate.setDate(resetDate.getDate() + 1);
        const retryAfter = Math.max(0, Math.ceil((resetDate.getTime() - now.getTime()) / 1000));
        
        return {
          allowed: false,
          reason: `Daily deployment limit (${maxDeploymentsPerDay}) reached`,
          retryAfter,
          currentUsage: {
            hourly: hourlyCount,
            daily: dailyCount,
            concurrent
          }
        };
      }
      
      // All checks passed, deployment is allowed
      return {
        allowed: true,
        currentUsage: {
          hourly: hourlyCount,
          daily: dailyCount,
          concurrent
        }
      };
    } catch (error) {
      console.error('Error checking deployment rate limit:', error);
      
      // In case of an error, we'll allow the operation to proceed (fail open)
      return { allowed: true };
    }
  }
  
  /**
   * Record the start of a deployment for rate limiting purposes
   * @param userId User ID
   * @param projectId Project ID
   * @param tokenId Token ID
   */
  public async recordDeploymentStart(userId: string, projectId: string, tokenId: string): Promise<void> {
    try {
      // Increment concurrent deployments counter
      const userConcurrentKey = `${userId}:${projectId}`;
      const concurrent = this.concurrentDeployments.get(userConcurrentKey) || 0;
      this.concurrentDeployments.set(userConcurrentKey, concurrent + 1);
      
      // Record deployment in database for tracking
      await supabase.from('deployment_rate_limits').insert({
        user_id: userId,
        project_id: projectId,
        token_id: tokenId,
        started_at: new Date().toISOString(),
        status: 'started'
      });
    } catch (error) {
      console.error('Error recording deployment start:', error);
    }
  }
  
  /**
   * Record the completion of a deployment (success or failure)
   * @param userId User ID
   * @param projectId Project ID
   * @param tokenId Token ID
   * @param status Completion status
   */
  public async recordDeploymentCompletion(
    userId: string, 
    projectId: string, 
    tokenId: string, 
    status: 'completed' | 'failed'
  ): Promise<void> {
    try {
      // Decrement concurrent deployments counter
      const userConcurrentKey = `${userId}:${projectId}`;
      const concurrent = this.concurrentDeployments.get(userConcurrentKey) || 0;
      this.concurrentDeployments.set(userConcurrentKey, Math.max(0, concurrent - 1));
      
      // Update deployment record in database
      await supabase
        .from('deployment_rate_limits')
        .update({
          status,
          completed_at: new Date().toISOString()
        })
        .eq('token_id', tokenId);
    } catch (error) {
      console.error('Error recording deployment completion:', error);
    }
  }
  
  /**
   * Get the count of deployments in the last hour for a user and project
   * @param userId User ID
   * @param projectId Project ID
   * @returns Count of deployments in the last hour
   */
  private async getHourlyDeploymentCount(userId: string, projectId: string): Promise<number> {
    const hourAgo = new Date();
    hourAgo.setHours(hourAgo.getHours() - 1);
    
    const { count, error } = await supabase
      .from('deployment_rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('project_id', projectId)
      .gte('started_at', hourAgo.toISOString());
    
    if (error) {
      console.error('Error getting hourly deployment count:', error);
      return 0;
    }
    
    return count || 0;
  }
  
  /**
   * Get the count of deployments in the last day for a user and project
   * @param userId User ID
   * @param projectId Project ID
   * @returns Count of deployments in the last day
   */
  private async getDailyDeploymentCount(userId: string, projectId: string): Promise<number> {
    const dayAgo = new Date();
    dayAgo.setDate(dayAgo.getDate() - 1);
    
    const { count, error } = await supabase
      .from('deployment_rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('project_id', projectId)
      .gte('started_at', dayAgo.toISOString());
    
    if (error) {
      console.error('Error getting daily deployment count:', error);
      return 0;
    }
    
    return count || 0;
  }
  
  /**
   * Get the timestamp of the oldest deployment in the last hour
   * @param userId User ID
   * @param projectId Project ID
   * @returns Timestamp of the oldest deployment in the last hour
   */
  private async getOldestHourlyDeployment(userId: string, projectId: string): Promise<string> {
    const hourAgo = new Date();
    hourAgo.setHours(hourAgo.getHours() - 1);
    
    const { data, error } = await supabase
      .from('deployment_rate_limits')
      .select('started_at')
      .eq('user_id', userId)
      .eq('project_id', projectId)
      .gte('started_at', hourAgo.toISOString())
      .order('started_at', { ascending: true })
      .limit(1);
    
    if (error || !data || data.length === 0) {
      return new Date().toISOString();
    }
    
    return data[0].started_at;
  }
  
  /**
   * Get the timestamp of the oldest deployment in the last day
   * @param userId User ID
   * @param projectId Project ID
   * @returns Timestamp of the oldest deployment in the last day
   */
  private async getOldestDailyDeployment(userId: string, projectId: string): Promise<string> {
    const dayAgo = new Date();
    dayAgo.setDate(dayAgo.getDate() - 1);
    
    const { data, error } = await supabase
      .from('deployment_rate_limits')
      .select('started_at')
      .eq('user_id', userId)
      .eq('project_id', projectId)
      .gte('started_at', dayAgo.toISOString())
      .order('started_at', { ascending: true })
      .limit(1);
    
    if (error || !data || data.length === 0) {
      return new Date().toISOString();
    }
    
    return data[0].started_at;
  }
}

// Export singleton instance
export const deploymentRateLimiter = DeploymentRateLimiter.getInstance();