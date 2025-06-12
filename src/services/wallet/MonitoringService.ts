import { supabase } from '@/infrastructure/database/client';
import { v4 as uuidv4 } from 'uuid';

/**
 * Production monitoring and alerting service for the wallet infrastructure
 * Provides real-time monitoring, performance tracking, and incident management
 */

export interface MonitoringMetrics {
  timestamp: string;
  service: string;
  metric: string;
  value: number;
  unit: string;
  tags: Record<string, string>;
}

export interface Alert {
  id: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  service: string;
  title: string;
  description: string;
  timestamp: string;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
  assignee?: string;
  metadata: Record<string, any>;
}

export interface HealthCheck {
  service: string;
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  lastCheck: string;
  responseTime: number;
  details: any;
}

export interface PerformanceMetrics {
  service: string;
  avgResponseTime: number;
  p95ResponseTime: number;
  errorRate: number;
  throughput: number;
  period: string;
}

/**
 * Comprehensive monitoring service for production wallet operations
 */
export class MonitoringService {
  private alerts: Map<string, Alert> = new Map();
  private metrics: MonitoringMetrics[] = [];
  private healthChecks: Map<string, HealthCheck> = new Map();

  constructor() {
    this.startHealthCheckScheduler();
    this.startMetricsCollection();
  }

  /**
   * Record a metric for monitoring
   */
  async recordMetric(
    service: string,
    metric: string,
    value: number,
    unit: string = 'count',
    tags: Record<string, string> = {}
  ): Promise<void> {
    try {
      const metricData: MonitoringMetrics = {
        timestamp: new Date().toISOString(),
        service,
        metric,
        value,
        unit,
        tags
      };

      this.metrics.push(metricData);

      // Store in database for persistence
      await supabase
        .from('monitoring_metrics')
        .insert({
          id: uuidv4(),
          service,
          metric_name: metric,
          value,
          unit,
          tags,
          recorded_at: metricData.timestamp
        });

      // Check for alert conditions
      await this.checkAlertConditions(metricData);
    } catch (error) {
      console.error('Failed to record metric:', error);
    }
  }

  /**
   * Create an alert
   */
  async createAlert(
    severity: Alert['severity'],
    service: string,
    title: string,
    description: string,
    metadata: Record<string, any> = {}
  ): Promise<string> {
    try {
      const alert: Alert = {
        id: uuidv4(),
        severity,
        service,
        title,
        description,
        timestamp: new Date().toISOString(),
        status: 'OPEN',
        metadata
      };

      this.alerts.set(alert.id, alert);

      // Store in database
      await supabase
        .from('alerts')
        .insert({
          id: alert.id,
          severity,
          service,
          title,
          description,
          status: alert.status,
          metadata,
          created_at: alert.timestamp
        });

      // Send notifications for high-severity alerts
      if (severity === 'HIGH' || severity === 'CRITICAL') {
        await this.sendAlertNotification(alert);
      }

      return alert.id;
    } catch (error) {
      console.error('Failed to create alert:', error);
      throw error;
    }
  }

  /**
   * Monitor transaction processing performance
   */
  async monitorTransactionPerformance(
    transactionType: string,
    blockchain: string,
    startTime: number,
    success: boolean,
    errorType?: string
  ): Promise<void> {
    const responseTime = Date.now() - startTime;
    const tags = { 
      transactionType, 
      blockchain, 
      success: success.toString(),
      ...(errorType && { errorType })
    };

    await Promise.all([
      this.recordMetric('transactions', 'response_time', responseTime, 'ms', tags),
      this.recordMetric('transactions', 'count', 1, 'count', tags),
      !success && this.recordMetric('transactions', 'error_count', 1, 'count', tags)
    ].filter(Boolean));

    // Alert on high error rates
    if (!success) {
      await this.checkErrorRateThreshold('transactions', blockchain);
    }

    // Alert on slow response times
    if (responseTime > 30000) { // 30 seconds
      await this.createAlert(
        'HIGH',
        'transactions',
        'Slow Transaction Processing',
        `Transaction took ${responseTime}ms to process on ${blockchain}`,
        { transactionType, blockchain, responseTime }
      );
    }
  }

  /**
   * Monitor API integration health
   */
  async monitorAPIHealth(
    service: 'moonpay' | 'ripple' | '0x' | '1inch' | 'coingecko',
    endpoint: string,
    responseTime: number,
    statusCode: number,
    success: boolean
  ): Promise<void> {
    const tags = { 
      service, 
      endpoint, 
      statusCode: statusCode.toString(),
      success: success.toString()
    };

    await Promise.all([
      this.recordMetric('api_integrations', 'response_time', responseTime, 'ms', tags),
      this.recordMetric('api_integrations', 'requests', 1, 'count', tags),
      !success && this.recordMetric('api_integrations', 'errors', 1, 'count', tags)
    ].filter(Boolean));

    // Update health check status
    await this.updateHealthCheck(service, success ? 'HEALTHY' : 'UNHEALTHY', responseTime, {
      endpoint,
      statusCode,
      lastError: !success ? `HTTP ${statusCode}` : undefined
    });

    // Alert on API failures
    if (!success && (statusCode >= 500 || statusCode === 429)) {
      await this.createAlert(
        statusCode >= 500 ? 'HIGH' : 'MEDIUM',
        'api_integrations',
        `${service.toUpperCase()} API Error`,
        `${service} API returned ${statusCode} for ${endpoint}`,
        { service, endpoint, statusCode, responseTime }
      );
    }
  }

  /**
   * Monitor wallet security events
   */
  async monitorSecurityEvent(
    eventType: 'failed_login' | 'suspicious_transaction' | 'blocked_address' | 'compliance_failure',
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    userId?: string,
    details: any = {}
  ): Promise<void> {
    const tags = { 
      eventType, 
      severity,
      ...(userId && { userId })
    };

    await this.recordMetric('security', 'events', 1, 'count', tags);

    // Create alert for high-severity security events
    if (severity === 'HIGH' || severity === 'CRITICAL') {
      await this.createAlert(
        severity,
        'security',
        `Security Event: ${eventType}`,
        `Security event detected${userId ? ` for user ${userId}` : ''}`,
        { eventType, userId, ...details }
      );
    }
  }

  /**
   * Get current system health status
   */
  async getSystemHealth(): Promise<{
    overall: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
    services: HealthCheck[];
    openAlerts: number;
    criticalAlerts: number;
  }> {
    try {
      const services = Array.from(this.healthChecks.values());
      const openAlerts = Array.from(this.alerts.values()).filter(a => a.status === 'OPEN');
      const criticalAlerts = openAlerts.filter(a => a.severity === 'CRITICAL');

      const unhealthyServices = services.filter(s => s.status === 'UNHEALTHY').length;
      const degradedServices = services.filter(s => s.status === 'DEGRADED').length;

      let overall: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
      if (unhealthyServices > 0 || criticalAlerts.length > 0) {
        overall = 'UNHEALTHY';
      } else if (degradedServices > 0 || openAlerts.length > 5) {
        overall = 'DEGRADED';
      } else {
        overall = 'HEALTHY';
      }

      return {
        overall,
        services,
        openAlerts: openAlerts.length,
        criticalAlerts: criticalAlerts.length
      };
    } catch (error) {
      console.error('Failed to get system health:', error);
      return {
        overall: 'UNHEALTHY',
        services: [],
        openAlerts: 0,
        criticalAlerts: 0
      };
    }
  }

  /**
   * Get performance metrics for a service
   */
  async getPerformanceMetrics(
    service: string,
    period: string = '1h'
  ): Promise<PerformanceMetrics> {
    try {
      const endTime = new Date();
      const startTime = new Date();
      
      switch (period) {
        case '1h':
          startTime.setHours(startTime.getHours() - 1);
          break;
        case '24h':
          startTime.setDate(startTime.getDate() - 1);
          break;
        case '7d':
          startTime.setDate(startTime.getDate() - 7);
          break;
      }

      const { data: metrics } = await supabase
        .from('monitoring_metrics')
        .select('*')
        .eq('service', service)
        .gte('recorded_at', startTime.toISOString())
        .lte('recorded_at', endTime.toISOString());

      if (!metrics || metrics.length === 0) {
        return {
          service,
          avgResponseTime: 0,
          p95ResponseTime: 0,
          errorRate: 0,
          throughput: 0,
          period
        };
      }

      const responseTimes = metrics
        .filter(m => m.metric_name === 'response_time')
        .map(m => m.value);

      const totalRequests = metrics
        .filter(m => m.metric_name === 'count' || m.metric_name === 'requests')
        .reduce((sum, m) => sum + m.value, 0);

      const totalErrors = metrics
        .filter(m => m.metric_name === 'error_count' || m.metric_name === 'errors')
        .reduce((sum, m) => sum + m.value, 0);

      const avgResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
        : 0;

      const p95ResponseTime = responseTimes.length > 0
        ? responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)]
        : 0;

      const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
      const periodHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      const throughput = totalRequests / periodHours;

      return {
        service,
        avgResponseTime,
        p95ResponseTime,
        errorRate,
        throughput,
        period
      };
    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      return {
        service,
        avgResponseTime: 0,
        p95ResponseTime: 0,
        errorRate: 0,
        throughput: 0,
        period
      };
    }
  }

  /**
   * Generate monitoring dashboard data
   */
  async getDashboardData(): Promise<{
    systemHealth: any;
    keyMetrics: any;
    recentAlerts: Alert[];
    performanceCharts: any;
  }> {
    try {
      const [systemHealth, recentAlerts] = await Promise.all([
        this.getSystemHealth(),
        this.getRecentAlerts(10)
      ]);

      const keyMetrics = await this.getKeyMetrics();
      const performanceCharts = await this.getPerformanceCharts();

      return {
        systemHealth,
        keyMetrics,
        recentAlerts,
        performanceCharts
      };
    } catch (error) {
      console.error('Failed to get dashboard data:', error);
      throw error;
    }
  }

  // Private helper methods

  private async startHealthCheckScheduler(): Promise<void> {
    // Run health checks every 60 seconds
    setInterval(async () => {
      await this.performHealthChecks();
    }, 60000);

    // Initial health check
    await this.performHealthChecks();
  }

  private async startMetricsCollection(): Promise<void> {
    // Collect system metrics every 30 seconds
    setInterval(async () => {
      await this.collectSystemMetrics();
    }, 30000);
  }

  private async performHealthChecks(): Promise<void> {
    const services = [
      'moonpay', 'ripple', '0x', '1inch', 'coingecko', 
      'ethereum_rpc', 'polygon_rpc', 'database'
    ];

    await Promise.all(services.map(service => this.performServiceHealthCheck(service)));
  }

  private async performServiceHealthCheck(service: string): Promise<void> {
    const startTime = Date.now();
    let status: HealthCheck['status'] = 'HEALTHY';
    let details: any = {};

    try {
      switch (service) {
        case 'database':
          await supabase.from('users').select('id').limit(1);
          break;
        default:
          // For external APIs, perform a lightweight health check
          // This would be implemented based on each service's health endpoint
          break;
      }
    } catch (error) {
      status = 'UNHEALTHY';
      details = { error: error.message };
    }

    const responseTime = Date.now() - startTime;

    await this.updateHealthCheck(service, status, responseTime, details);
  }

  private async updateHealthCheck(
    service: string,
    status: HealthCheck['status'],
    responseTime: number,
    details: any = {}
  ): Promise<void> {
    const healthCheck: HealthCheck = {
      service,
      status,
      lastCheck: new Date().toISOString(),
      responseTime,
      details
    };

    this.healthChecks.set(service, healthCheck);

    // Store in database
    await supabase
      .from('health_checks')
      .upsert({
        service,
        status,
        response_time: responseTime,
        details,
        last_check: healthCheck.lastCheck
      }, { onConflict: 'service' });
  }

  private async collectSystemMetrics(): Promise<void> {
    try {
      // Collect memory usage, CPU, etc. (in a real implementation)
      const memoryUsage = process.memoryUsage();
      
      await Promise.all([
        this.recordMetric('system', 'memory_heap_used', memoryUsage.heapUsed, 'bytes'),
        this.recordMetric('system', 'memory_heap_total', memoryUsage.heapTotal, 'bytes'),
        this.recordMetric('system', 'memory_external', memoryUsage.external, 'bytes')
      ]);
    } catch (error) {
      console.error('Failed to collect system metrics:', error);
    }
  }

  private async checkAlertConditions(metric: MonitoringMetrics): Promise<void> {
    // Define alert thresholds
    const thresholds = {
      'transactions.response_time': { warning: 10000, critical: 30000 }, // ms
      'api_integrations.response_time': { warning: 5000, critical: 15000 }, // ms
      'system.memory_heap_used': { warning: 500 * 1024 * 1024, critical: 1024 * 1024 * 1024 } // bytes
    };

    const key = `${metric.service}.${metric.metric}`;
    const threshold = thresholds[key];

    if (threshold) {
      if (metric.value >= threshold.critical) {
        await this.createAlert(
          'CRITICAL',
          metric.service,
          `High ${metric.metric}`,
          `${metric.metric} is ${metric.value}${metric.unit}, exceeding critical threshold`,
          { metric: metric.metric, value: metric.value, threshold: threshold.critical }
        );
      } else if (metric.value >= threshold.warning) {
        await this.createAlert(
          'MEDIUM',
          metric.service,
          `Elevated ${metric.metric}`,
          `${metric.metric} is ${metric.value}${metric.unit}, exceeding warning threshold`,
          { metric: metric.metric, value: metric.value, threshold: threshold.warning }
        );
      }
    }
  }

  private async checkErrorRateThreshold(service: string, blockchain: string): Promise<void> {
    // Check error rate over the last 5 minutes
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

    const { data: metrics } = await supabase
      .from('monitoring_metrics')
      .select('*')
      .eq('service', service)
      .gte('recorded_at', fiveMinutesAgo.toISOString())
      .eq('tags->>blockchain', blockchain);

    if (!metrics) return;

    const totalRequests = metrics.filter(m => m.metric_name === 'count').length;
    const totalErrors = metrics.filter(m => m.metric_name === 'error_count').length;

    if (totalRequests > 10 && (totalErrors / totalRequests) > 0.2) { // 20% error rate
      await this.createAlert(
        'HIGH',
        service,
        'High Error Rate',
        `Error rate for ${blockchain} transactions is ${((totalErrors / totalRequests) * 100).toFixed(1)}%`,
        { blockchain, errorRate: (totalErrors / totalRequests) * 100 }
      );
    }
  }

  private async sendAlertNotification(alert: Alert): Promise<void> {
    try {
      // In production, integrate with notification services
      // Slack, PagerDuty, email, SMS, etc.
      
      console.error(`🚨 ${alert.severity} ALERT: ${alert.title}`);
      console.error(`Service: ${alert.service}`);
      console.error(`Description: ${alert.description}`);
      console.error(`Metadata:`, alert.metadata);

      // Example: Send to Slack webhook
      // await this.sendSlackNotification(alert);
      
      // Example: Send email notification
      // await this.sendEmailNotification(alert);
      
      // Example: Create PagerDuty incident
      // await this.createPagerDutyIncident(alert);
    } catch (error) {
      console.error('Failed to send alert notification:', error);
    }
  }

  private async getRecentAlerts(limit: number): Promise<Alert[]> {
    const { data } = await supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    return (data || []).map(alert => ({
      id: alert.id,
      severity: alert.severity as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
      service: alert.service,
      title: alert.title,
      description: alert.description,
      timestamp: alert.created_at,
      status: alert.status as 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED',
      assignee: alert.assignee,
      metadata: (alert.metadata as Record<string, any>) || {}
    }));
  }

  private async getKeyMetrics(): Promise<any> {
    const last24h = new Date();
    last24h.setDate(last24h.getDate() - 1);

    const { data: metrics } = await supabase
      .from('monitoring_metrics')
      .select('*')
      .gte('recorded_at', last24h.toISOString());

    // Calculate key metrics from the raw data
    const transactionCount = metrics?.filter(m => 
      m.service === 'transactions' && m.metric_name === 'count'
    ).reduce((sum, m) => sum + m.value, 0) || 0;

    const averageResponseTime = metrics?.filter(m => 
      m.metric_name === 'response_time'
    ).reduce((sum, m, _, arr) => sum + m.value / arr.length, 0) || 0;

    return {
      transactionCount,
      averageResponseTime: Math.round(averageResponseTime),
      uptime: this.calculateUptime(),
      activeAlerts: Array.from(this.alerts.values()).filter(a => a.status === 'OPEN').length
    };
  }

  private async getPerformanceCharts(): Promise<any> {
    // Generate chart data for the last 24 hours
    // This would return data formatted for charting libraries
    return {
      responseTimeChart: await this.getResponseTimeChart(),
      throughputChart: await this.getThroughputChart(),
      errorRateChart: await this.getErrorRateChart()
    };
  }

  private async getResponseTimeChart(): Promise<any> {
    // Implementation for response time chart data
    return { labels: [], datasets: [] };
  }

  private async getThroughputChart(): Promise<any> {
    // Implementation for throughput chart data
    return { labels: [], datasets: [] };
  }

  private async getErrorRateChart(): Promise<any> {
    // Implementation for error rate chart data
    return { labels: [], datasets: [] };
  }

  private calculateUptime(): number {
    // Calculate system uptime percentage
    // This would be based on health check data
    return 99.95; // Example
  }
}

export const monitoringService = new MonitoringService();
