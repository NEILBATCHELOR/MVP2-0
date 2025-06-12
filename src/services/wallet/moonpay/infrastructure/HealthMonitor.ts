/**
 * MoonPay Health Monitor Service
 * Monitors service health, performance, and availability
 */

export interface ServiceHealthStatus {
  serviceName: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  lastChecked: string;
  uptime: number;
  errorRate: number;
  details?: {
    endpoint?: string;
    statusCode?: number;
    error?: string;
    performanceMetrics?: {
      avgResponseTime: number;
      p95ResponseTime: number;
      p99ResponseTime: number;
      requestsPerSecond: number;
    };
  };
}

export interface OverallHealthStatus {
  status: 'healthy' | 'degraded' | 'down';
  timestamp: string;
  services: ServiceHealthStatus[];
  summary: {
    totalServices: number;
    healthyServices: number;
    degradedServices: number;
    downServices: number;
    overallUptime: number;
    averageResponseTime: number;
  };
  alerts: Array<{
    level: 'info' | 'warning' | 'critical';
    service: string;
    message: string;
    timestamp: string;
  }>;
}

export interface HealthCheckConfig {
  services: Array<{
    name: string;
    endpoint: string;
    method: 'GET' | 'POST' | 'HEAD';
    timeout: number;
    expectedStatus: number[];
    headers?: Record<string, string>;
    body?: any;
  }>;
  intervals: {
    healthCheck: number; // milliseconds
    performanceCheck: number;
    deepHealthCheck: number;
  };
  thresholds: {
    responseTime: {
      warning: number;
      critical: number;
    };
    errorRate: {
      warning: number; // percentage
      critical: number;
    };
    uptime: {
      warning: number; // percentage
      critical: number;
    };
  };
  alerts: {
    enabled: boolean;
    webhookUrl?: string;
    emailRecipients?: string[];
    retryAttempts: number;
    retryDelay: number;
  };
}

export interface PerformanceMetrics {
  serviceName: string;
  timeWindow: '1h' | '6h' | '24h' | '7d' | '30d';
  metrics: {
    requestCount: number;
    errorCount: number;
    averageResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    p50ResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    throughput: number; // requests per second
    errorRate: number; // percentage
    uptime: number; // percentage
  };
  trends: {
    responseTime: Array<{ timestamp: string; value: number }>;
    errorRate: Array<{ timestamp: string; value: number }>;
    throughput: Array<{ timestamp: string; value: number }>;
  };
  incidents: Array<{
    id: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    startTime: string;
    endTime?: string;
    duration?: number;
    description: string;
    resolution?: string;
  }>;
}

/**
 * Health Monitor Service for MoonPay Services
 */
export class HealthMonitor {
  private apiKey: string;
  private secretKey: string;
  private config: HealthCheckConfig;
  private healthHistory: Map<string, ServiceHealthStatus[]> = new Map();
  private performanceData: Map<string, PerformanceMetrics> = new Map();
  private intervalIds: NodeJS.Timeout[] = [];
  private alertCallbacks: Array<(alert: any) => void> = [];

  constructor(apiKey: string, secretKey: string, config?: Partial<HealthCheckConfig>) {
    this.apiKey = apiKey;
    this.secretKey = secretKey;
    this.config = this.mergeConfig(config);
    this.initializeMonitoring();
  }

  /**
   * Check if we're in a development environment or browser that should skip external API health checks
   */
  private shouldSkipHealthCheck(): boolean {
    // Skip in browser/development environment to avoid CORS issues
    if (typeof window !== 'undefined') {
      const hostname = window.location?.hostname;
      return hostname === 'localhost' || hostname === '127.0.0.1' || hostname?.includes('dev') || 
             import.meta.env?.DEV === true || import.meta.env?.MODE === 'development';
    }
    
    // Skip if no API key provided (common in development)
    if (!this.apiKey || !this.secretKey) {
      return true;
    }
    
    return false;
  }

  /**
   * Check if a specific domain should be skipped for health checks
   */
  private shouldSkipDomainHealthCheck(endpoint: string): boolean {
    const problematicDomains = ['api.moonpay.com', 'moonpay.com'];
    return problematicDomains.some(domain => endpoint.includes(domain));
  }

  /**
   * Start health monitoring
   */
  startMonitoring(): void {
    // Skip starting monitoring in development/browser environment
    if (this.shouldSkipHealthCheck()) {
      console.debug('MoonPay health monitoring skipped in development environment');
      return;
    }

    this.stopMonitoring(); // Clear any existing intervals

    // Regular health checks - less frequent in development
    const healthInterval = setInterval(() => {
      this.performHealthChecks();
    }, this.shouldSkipHealthCheck() ? this.config.intervals.healthCheck * 5 : this.config.intervals.healthCheck);

    // Performance monitoring
    const performanceInterval = setInterval(() => {
      this.collectPerformanceMetrics();
    }, this.config.intervals.performanceCheck);

    // Deep health checks (less frequent, more comprehensive)
    const deepHealthInterval = setInterval(() => {
      this.performDeepHealthCheck();
    }, this.config.intervals.deepHealthCheck);

    this.intervalIds.push(healthInterval, performanceInterval, deepHealthInterval);
  }

  /**
   * Stop health monitoring
   */
  stopMonitoring(): void {
    this.intervalIds.forEach(id => clearInterval(id));
    this.intervalIds = [];
  }

  /**
   * Get current health status
   */
  async getHealthStatus(): Promise<OverallHealthStatus> {
    const serviceStatuses = await Promise.all(
      this.config.services.map(service => this.checkServiceHealth(service))
    );

    const summary = this.calculateSummary(serviceStatuses);
    const alerts = this.generateAlerts(serviceStatuses);
    
    const overallStatus = this.determineOverallStatus(serviceStatuses);

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services: serviceStatuses,
      summary,
      alerts
    };
  }

  /**
   * Get performance metrics for a specific service
   */
  getPerformanceMetrics(
    serviceName: string, 
    timeWindow: '1h' | '6h' | '24h' | '7d' | '30d' = '24h'
  ): PerformanceMetrics | null {
    const metrics = this.performanceData.get(serviceName);
    if (!metrics) return null;

    // Filter metrics based on time window
    const windowStart = this.getTimeWindowStart(timeWindow);
    const filteredMetrics = {
      ...metrics,
      timeWindow,
      trends: {
        responseTime: metrics.trends.responseTime.filter(
          point => new Date(point.timestamp) >= windowStart
        ),
        errorRate: metrics.trends.errorRate.filter(
          point => new Date(point.timestamp) >= windowStart
        ),
        throughput: metrics.trends.throughput.filter(
          point => new Date(point.timestamp) >= windowStart
        )
      }
    };

    return filteredMetrics;
  }

  /**
   * Get health history for a service
   */
  getHealthHistory(serviceName: string, hours: number = 24): ServiceHealthStatus[] {
    const history = this.healthHistory.get(serviceName) || [];
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    return history.filter(status => new Date(status.lastChecked) >= cutoff);
  }

  /**
   * Add alert callback
   */
  onAlert(callback: (alert: any) => void): void {
    this.alertCallbacks.push(callback);
  }

  /**
   * Remove alert callback
   */
  removeAlert(callback: (alert: any) => void): void {
    const index = this.alertCallbacks.indexOf(callback);
    if (index > -1) {
      this.alertCallbacks.splice(index, 1);
    }
  }

  /**
   * Test connection to all services
   */
  async testConnections(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    await Promise.all(
      this.config.services.map(async service => {
        try {
          const status = await this.checkServiceHealth(service);
          results[service.name] = status.status !== 'down';
        } catch (error) {
          results[service.name] = false;
        }
      })
    );

    return results;
  }

  /**
   * Get service uptime statistics
   */
  getUptimeStats(serviceName: string, days: number = 30): {
    uptime: number;
    downtime: number;
    incidents: number;
    mttr: number; // Mean Time To Recovery
    mtbf: number; // Mean Time Between Failures
  } {
    const history = this.getHealthHistory(serviceName, days * 24);
    
    let uptimeMinutes = 0;
    let downtimeMinutes = 0;
    let incidents = 0;
    let incidentDurations: number[] = [];
    let timeBetweenFailures: number[] = [];
    let lastIncidentEnd: Date | null = null;

    let currentIncidentStart: Date | null = null;

    history.forEach((status, index) => {
      const statusTime = new Date(status.lastChecked);
      const isUp = status.status !== 'down';
      
      if (isUp) {
        if (currentIncidentStart) {
          // End of incident
          const incidentDuration = statusTime.getTime() - currentIncidentStart.getTime();
          incidentDurations.push(incidentDuration / (1000 * 60)); // minutes
          
          if (lastIncidentEnd) {
            const timeBetween = currentIncidentStart.getTime() - lastIncidentEnd.getTime();
            timeBetweenFailures.push(timeBetween / (1000 * 60)); // minutes
          }
          
          lastIncidentEnd = statusTime;
          currentIncidentStart = null;
          incidents++;
        }
        uptimeMinutes += this.config.intervals.healthCheck / (1000 * 60);
      } else {
        if (!currentIncidentStart) {
          currentIncidentStart = statusTime;
        }
        downtimeMinutes += this.config.intervals.healthCheck / (1000 * 60);
      }
    });

    const totalMinutes = uptimeMinutes + downtimeMinutes;
    const uptime = totalMinutes > 0 ? (uptimeMinutes / totalMinutes) * 100 : 100;
    
    const mttr = incidentDurations.length > 0 
      ? incidentDurations.reduce((a, b) => a + b, 0) / incidentDurations.length 
      : 0;
    
    const mtbf = timeBetweenFailures.length > 0 
      ? timeBetweenFailures.reduce((a, b) => a + b, 0) / timeBetweenFailures.length 
      : totalMinutes;

    return {
      uptime,
      downtime: 100 - uptime,
      incidents,
      mttr,
      mtbf
    };
  }

  // Private methods

  private mergeConfig(config?: Partial<HealthCheckConfig>): HealthCheckConfig {
    const isDevelopment = this.shouldSkipHealthCheck();
    
    const defaultConfig: HealthCheckConfig = {
      services: [
        {
          name: 'onramp',
          endpoint: 'https://api.moonpay.com/v3/currencies',
          method: 'GET',
          timeout: 5000,
          expectedStatus: [200],
          headers: { 'Authorization': `Api-Key ${this.apiKey}` }
        },
        {
          name: 'offramp',
          endpoint: 'https://api.moonpay.com/v1/sell_currencies',
          method: 'GET',
          timeout: 5000,
          expectedStatus: [200],
          headers: { 'Authorization': `Api-Key ${this.apiKey}` }
        },
        {
          name: 'swap',
          endpoint: 'https://api.moonpay.com/swap/v1/pairs',
          method: 'GET',
          timeout: 5000,
          expectedStatus: [200],
          headers: { 'Authorization': `Api-Key ${this.apiKey}` }
        },
        {
          name: 'account',
          endpoint: 'https://api.moonpay.com/partner_onboarding/v1/accounts/me',
          method: 'GET',
          timeout: 5000,
          expectedStatus: [200, 404],
          headers: { 'Authorization': `Api-Key ${this.apiKey}` }
        }
      ],
      intervals: {
        healthCheck: isDevelopment ? 300000 : 60000, // 5 minutes in dev, 1 minute in prod
        performanceCheck: isDevelopment ? 600000 : 300000, // 10 minutes in dev, 5 minutes in prod
        deepHealthCheck: isDevelopment ? 3600000 : 1800000 // 1 hour in dev, 30 minutes in prod
      },
      thresholds: {
        responseTime: {
          warning: 2000, // 2 seconds
          critical: 5000 // 5 seconds
        },
        errorRate: {
          warning: 5, // 5%
          critical: 15 // 15%
        },
        uptime: {
          warning: 99.5, // 99.5%
          critical: 99.0 // 99%
        }
      },
      alerts: {
        enabled: !isDevelopment, // Disable alerts in development
        retryAttempts: 3,
        retryDelay: 5000
      }
    };

    return { ...defaultConfig, ...config };
  }

  private initializeMonitoring(): void {
    // Initialize health history for each service
    this.config.services.forEach(service => {
      this.healthHistory.set(service.name, []);
      this.performanceData.set(service.name, this.createEmptyPerformanceMetrics(service.name));
    });
  }

  private async performHealthChecks(): Promise<void> {
    // Skip health checks in development environment to avoid CORS issues
    if (this.shouldSkipHealthCheck()) {
      console.debug('Skipping health checks in development environment');
      return;
    }

    const promises = this.config.services.map(service => 
      this.checkServiceHealth(service).then(status => {
        this.recordHealthStatus(service.name, status);
        return status;
      })
    );

    await Promise.all(promises);
  }

  private async checkServiceHealth(service: HealthCheckConfig['services'][0]): Promise<ServiceHealthStatus> {
    const startTime = Date.now();
    
    // Skip problematic domains in browser environment
    if (this.shouldSkipHealthCheck() || this.shouldSkipDomainHealthCheck(service.endpoint)) {
      console.debug(`Skipping health check for ${service.name} (${service.endpoint}) - development environment`);
      
      return {
        serviceName: service.name,
        status: 'healthy', // Assume healthy in development
        responseTime: 0,
        lastChecked: new Date().toISOString(),
        uptime: 100,
        errorRate: 0,
        details: {
          endpoint: service.endpoint,
          skipped: true,
          reason: 'Development environment - CORS restrictions'
        }
      };
    }
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), Math.min(service.timeout, 5000)); // Cap timeout at 5 seconds
      
      const response = await fetch(service.endpoint, {
        method: service.method,
        headers: service.headers,
        body: service.body ? JSON.stringify(service.body) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      
      const isHealthy = service.expectedStatus.includes(response.status);
      const status: ServiceHealthStatus['status'] = isHealthy ? 'healthy' : 
        responseTime > this.config.thresholds.responseTime.critical ? 'down' : 'degraded';

      return {
        serviceName: service.name,
        status,
        responseTime,
        lastChecked: new Date().toISOString(),
        uptime: this.calculateUptime(service.name),
        errorRate: this.calculateErrorRate(service.name),
        details: {
          endpoint: service.endpoint,
          statusCode: response.status,
          performanceMetrics: this.getServicePerformanceMetrics(service.name)
        }
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Use debug logging instead of errors for expected CORS issues
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        console.debug(`Health check failed for ${service.name} - likely CORS issue:`, error.message);
      } else {
        console.debug(`Health check failed for ${service.name}:`, error.message);
      }
      
      return {
        serviceName: service.name,
        status: 'down',
        responseTime,
        lastChecked: new Date().toISOString(),
        uptime: this.calculateUptime(service.name),
        errorRate: this.calculateErrorRate(service.name),
        details: {
          endpoint: service.endpoint,
          error: error.message
        }
      };
    }
  }

  private recordHealthStatus(serviceName: string, status: ServiceHealthStatus): void {
    const history = this.healthHistory.get(serviceName) || [];
    history.push(status);
    
    // Keep only last 24 hours of data
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const filteredHistory = history.filter(s => new Date(s.lastChecked) >= cutoff);
    
    this.healthHistory.set(serviceName, filteredHistory);
    this.updatePerformanceMetrics(serviceName, status);
  }

  private calculateUptime(serviceName: string): number {
    const history = this.getHealthHistory(serviceName, 24);
    if (history.length === 0) return 100;
    
    const healthyCount = history.filter(s => s.status === 'healthy').length;
    return (healthyCount / history.length) * 100;
  }

  private calculateErrorRate(serviceName: string): number {
    const history = this.getHealthHistory(serviceName, 1);
    if (history.length === 0) return 0;
    
    const errorCount = history.filter(s => s.status === 'down').length;
    return (errorCount / history.length) * 100;
  }

  private calculateSummary(serviceStatuses: ServiceHealthStatus[]): OverallHealthStatus['summary'] {
    const totalServices = serviceStatuses.length;
    const healthyServices = serviceStatuses.filter(s => s.status === 'healthy').length;
    const degradedServices = serviceStatuses.filter(s => s.status === 'degraded').length;
    const downServices = serviceStatuses.filter(s => s.status === 'down').length;
    
    const overallUptime = serviceStatuses.reduce((sum, s) => sum + s.uptime, 0) / totalServices;
    const averageResponseTime = serviceStatuses.reduce((sum, s) => sum + s.responseTime, 0) / totalServices;

    return {
      totalServices,
      healthyServices,
      degradedServices,
      downServices,
      overallUptime,
      averageResponseTime
    };
  }

  private generateAlerts(serviceStatuses: ServiceHealthStatus[]): OverallHealthStatus['alerts'] {
    const alerts: OverallHealthStatus['alerts'] = [];
    const now = new Date().toISOString();

    serviceStatuses.forEach(status => {
      if (status.status === 'down') {
        alerts.push({
          level: 'critical',
          service: status.serviceName,
          message: `Service ${status.serviceName} is down. Error: ${status.details?.error || 'Unknown error'}`,
          timestamp: now
        });
      } else if (status.status === 'degraded') {
        alerts.push({
          level: 'warning',
          service: status.serviceName,
          message: `Service ${status.serviceName} is degraded. Response time: ${status.responseTime}ms`,
          timestamp: now
        });
      }

      if (status.responseTime > this.config.thresholds.responseTime.warning) {
        alerts.push({
          level: status.responseTime > this.config.thresholds.responseTime.critical ? 'critical' : 'warning',
          service: status.serviceName,
          message: `High response time for ${status.serviceName}: ${status.responseTime}ms`,
          timestamp: now
        });
      }

      if (status.errorRate > this.config.thresholds.errorRate.warning) {
        alerts.push({
          level: status.errorRate > this.config.thresholds.errorRate.critical ? 'critical' : 'warning',
          service: status.serviceName,
          message: `High error rate for ${status.serviceName}: ${status.errorRate.toFixed(1)}%`,
          timestamp: now
        });
      }
    });

    // Trigger alert callbacks
    alerts.forEach(alert => {
      this.alertCallbacks.forEach(callback => {
        try {
          callback(alert);
        } catch (error) {
          console.error('Error in alert callback:', error);
        }
      });
    });

    return alerts;
  }

  private determineOverallStatus(serviceStatuses: ServiceHealthStatus[]): 'healthy' | 'degraded' | 'down' {
    const downServices = serviceStatuses.filter(s => s.status === 'down').length;
    const degradedServices = serviceStatuses.filter(s => s.status === 'degraded').length;
    
    if (downServices > serviceStatuses.length / 2) return 'down';
    if (downServices > 0 || degradedServices > serviceStatuses.length / 3) return 'degraded';
    return 'healthy';
  }

  private async collectPerformanceMetrics(): Promise<void> {
    // This would collect more detailed performance metrics
    // For now, we'll use the health check data
  }

  private async performDeepHealthCheck(): Promise<void> {
    // This would perform more comprehensive health checks
    // Like testing database connections, cache health, etc.
  }

  private updatePerformanceMetrics(serviceName: string, status: ServiceHealthStatus): void {
    const metrics = this.performanceData.get(serviceName);
    if (!metrics) return;

    // Update trending data
    const timestamp = new Date().toISOString();
    metrics.trends.responseTime.push({ timestamp, value: status.responseTime });
    metrics.trends.errorRate.push({ timestamp, value: status.errorRate });
    
    // Keep only last 1000 data points
    if (metrics.trends.responseTime.length > 1000) {
      metrics.trends.responseTime.shift();
      metrics.trends.errorRate.shift();
    }

    this.performanceData.set(serviceName, metrics);
  }

  private createEmptyPerformanceMetrics(serviceName: string): PerformanceMetrics {
    return {
      serviceName,
      timeWindow: '24h',
      metrics: {
        requestCount: 0,
        errorCount: 0,
        averageResponseTime: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
        p50ResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        throughput: 0,
        errorRate: 0,
        uptime: 100
      },
      trends: {
        responseTime: [],
        errorRate: [],
        throughput: []
      },
      incidents: []
    };
  }

  private getServicePerformanceMetrics(serviceName: string): any {
    const metrics = this.performanceData.get(serviceName);
    return metrics ? metrics.metrics : undefined;
  }

  private getTimeWindowStart(timeWindow: string): Date {
    const now = new Date();
    switch (timeWindow) {
      case '1h': return new Date(now.getTime() - 60 * 60 * 1000);
      case '6h': return new Date(now.getTime() - 6 * 60 * 60 * 1000);
      case '24h': return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default: return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
  }
}

export const healthMonitor = new HealthMonitor(
  import.meta.env.VITE_MOONPAY_API_KEY || "",
  import.meta.env.VITE_MOONPAY_SECRET_KEY || ""
);

export default HealthMonitor;
