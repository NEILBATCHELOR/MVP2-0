/**
 * MoonPay Analytics Service
 * Comprehensive analytics, reporting, and business intelligence for MoonPay integration
 */

export interface AnalyticsMetrics {
  period: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
  startDate: string;
  endDate: string;
  transactions: {
    total: number;
    buy: number;
    sell: number;
    swap: number;
    volume: number;
    averageSize: number;
    conversionRate: number;
    successRate: number;
  };
  customers: {
    total: number;
    new: number;
    returning: number;
    churnRate: number;
    lifetimeValue: number;
    acquisitionCost: number;
  };
  revenue: {
    total: number;
    fees: number;
    revenueShare: number;
    growth: number;
    margin: number;
  };
  geography: Array<{
    country: string;
    users: number;
    volume: number;
    revenue: number;
  }>;
  currencies: Array<{
    currency: string;
    volume: number;
    transactions: number;
    popularity: number;
  }>;
  paymentMethods: Array<{
    method: string;
    usage: number;
    successRate: number;
    averageAmount: number;
  }>;
}

export interface ConversionFunnel {
  step: string;
  users: number;
  conversionRate: number;
  dropoffRate: number;
  averageTime: number;
  abandonmentReasons: Array<{
    reason: string;
    percentage: number;
  }>;
}

export interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  criteria: {
    demographic: Record<string, any>;
    behavioral: Record<string, any>;
    transactional: Record<string, any>;
  };
  size: number;
  value: {
    averageTransactionSize: number;
    frequency: number;
    lifetimeValue: number;
    churnRate: number;
  };
  characteristics: string[];
  recommendations: string[];
}

export interface PerformanceBenchmark {
  metric: string;
  currentValue: number;
  industryAverage: number;
  topPerformers: number;
  rank: number;
  percentile: number;
  trend: 'improving' | 'declining' | 'stable';
  recommendations: string[];
}

export interface RiskAnalysis {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  factors: Array<{
    factor: string;
    impact: 'low' | 'medium' | 'high';
    likelihood: number;
    description: string;
    mitigation: string[];
  }>;
  trends: {
    fraudRate: number;
    chargebackRate: number;
    complianceViolations: number;
    riskScoreChange: number;
  };
  recommendations: Array<{
    priority: 'low' | 'medium' | 'high' | 'critical';
    action: string;
    expectedImpact: string;
    timeframe: string;
  }>;
}

export interface CustomReport {
  id: string;
  name: string;
  description: string;
  type: 'executive' | 'operational' | 'compliance' | 'technical' | 'custom';
  schedule: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  filters: {
    dateRange: { start: string; end: string };
    countries: string[];
    currencies: string[];
    customerSegments: string[];
    transactionTypes: string[];
  };
  sections: Array<{
    type: 'metrics' | 'chart' | 'table' | 'text' | 'insights';
    title: string;
    config: Record<string, any>;
  }>;
  format: 'pdf' | 'excel' | 'json' | 'dashboard';
  isActive: boolean;
  createdAt: string;
  lastGenerated?: string;
}

export interface PredictiveInsight {
  type: 'volume_forecast' | 'customer_churn' | 'revenue_projection' | 'risk_prediction' | 'market_trend';
  confidence: number;
  timeframe: string;
  prediction: {
    value: number;
    range: { min: number; max: number };
    factors: Array<{
      factor: string;
      influence: number;
      description: string;
    }>;
  };
  methodology: string;
  dataPoints: number;
  lastUpdated: string;
  recommendations: string[];
}

/**
 * Analytics Service for MoonPay
 */
export class AnalyticsService {
  private apiBaseUrl: string;
  private apiKey: string;
  private secretKey: string;

  constructor(apiKey: string, secretKey: string, testMode: boolean = true) {
    this.apiKey = apiKey;
    this.secretKey = secretKey;
    this.apiBaseUrl = testMode 
      ? "https://api.moonpay.com" 
      : "https://api.moonpay.com";
  }

  /**
   * Get comprehensive analytics metrics
   */
  async getAnalyticsMetrics(
    period: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year' = 'month',
    startDate?: string,
    endDate?: string,
    segments?: string[]
  ): Promise<AnalyticsMetrics> {
    try {
      const params = new URLSearchParams({
        period,
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(segments && { segments: segments.join(',') })
      });

      const response = await fetch(`${this.apiBaseUrl}/v4/analytics/metrics?${params}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Analytics metrics API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting analytics metrics:', error);
      throw new Error(`Failed to get analytics metrics: ${error.message}`);
    }
  }

  /**
   * Get conversion funnel analysis
   */
  async getConversionFunnel(
    startDate?: string,
    endDate?: string,
    segmentBy?: 'country' | 'currency' | 'payment_method'
  ): Promise<ConversionFunnel[]> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (segmentBy) params.append('segmentBy', segmentBy);

      const response = await fetch(`${this.apiBaseUrl}/v4/analytics/funnel?${params}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Conversion funnel API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting conversion funnel:', error);
      throw new Error(`Failed to get conversion funnel: ${error.message}`);
    }
  }

  /**
   * Get customer segmentation analysis
   */
  async getCustomerSegments(
    includeValue: boolean = true,
    includeRecommendations: boolean = true
  ): Promise<CustomerSegment[]> {
    try {
      const params = new URLSearchParams({
        includeValue: includeValue.toString(),
        includeRecommendations: includeRecommendations.toString()
      });

      const response = await fetch(`${this.apiBaseUrl}/v4/analytics/segments?${params}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Customer segments API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting customer segments:', error);
      throw new Error(`Failed to get customer segments: ${error.message}`);
    }
  }

  /**
   * Create custom customer segment
   */
  async createCustomerSegment(segmentData: Omit<CustomerSegment, 'id' | 'size' | 'value'>): Promise<CustomerSegment> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v4/analytics/segments`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(segmentData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Create segment API error: ${errorData.message || response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating customer segment:', error);
      throw new Error(`Failed to create customer segment: ${error.message}`);
    }
  }

  /**
   * Get performance benchmarks
   */
  async getPerformanceBenchmarks(
    metrics?: string[],
    industry?: string,
    region?: string
  ): Promise<PerformanceBenchmark[]> {
    try {
      const params = new URLSearchParams();
      if (metrics) params.append('metrics', metrics.join(','));
      if (industry) params.append('industry', industry);
      if (region) params.append('region', region);

      const response = await fetch(`${this.apiBaseUrl}/v4/analytics/benchmarks?${params}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Benchmarks API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting performance benchmarks:', error);
      throw new Error(`Failed to get performance benchmarks: ${error.message}`);
    }
  }

  /**
   * Get risk analysis
   */
  async getRiskAnalysis(
    timeframe: 'current' | '30d' | '90d' | '1y' = 'current',
    includeRecommendations: boolean = true
  ): Promise<RiskAnalysis> {
    try {
      const params = new URLSearchParams({
        timeframe,
        includeRecommendations: includeRecommendations.toString()
      });

      const response = await fetch(`${this.apiBaseUrl}/v4/analytics/risk?${params}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Risk analysis API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting risk analysis:', error);
      throw new Error(`Failed to get risk analysis: ${error.message}`);
    }
  }

  /**
   * Generate custom report
   */
  async generateReport(reportConfig: Omit<CustomReport, 'id' | 'createdAt' | 'lastGenerated'>): Promise<{
    reportId: string;
    downloadUrl?: string;
    status: 'generating' | 'completed' | 'failed';
    estimatedCompletion?: string;
  }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v4/analytics/reports/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportConfig)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Generate report API error: ${errorData.message || response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating report:', error);
      throw new Error(`Failed to generate report: ${error.message}`);
    }
  }

  /**
   * Get scheduled reports
   */
  async getScheduledReports(): Promise<CustomReport[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v4/analytics/reports`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Scheduled reports API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting scheduled reports:', error);
      throw new Error(`Failed to get scheduled reports: ${error.message}`);
    }
  }

  /**
   * Get predictive insights
   */
  async getPredictiveInsights(
    types?: Array<'volume_forecast' | 'customer_churn' | 'revenue_projection' | 'risk_prediction' | 'market_trend'>,
    timeframe?: string
  ): Promise<PredictiveInsight[]> {
    try {
      const params = new URLSearchParams();
      if (types) params.append('types', types.join(','));
      if (timeframe) params.append('timeframe', timeframe);

      const response = await fetch(`${this.apiBaseUrl}/v4/analytics/insights?${params}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Predictive insights API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting predictive insights:', error);
      throw new Error(`Failed to get predictive insights: ${error.message}`);
    }
  }

  /**
   * Get real-time dashboard data
   */
  async getDashboardData(widgets: string[] = []): Promise<{
    timestamp: string;
    widgets: Record<string, any>;
    alerts: Array<{
      type: 'warning' | 'error' | 'info';
      message: string;
      data?: any;
    }>;
  }> {
    try {
      const params = new URLSearchParams();
      if (widgets.length > 0) {
        params.append('widgets', widgets.join(','));
      }

      const response = await fetch(`${this.apiBaseUrl}/v4/analytics/dashboard?${params}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Dashboard data API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      throw new Error(`Failed to get dashboard data: ${error.message}`);
    }
  }

  /**
   * Export analytics data
   */
  async exportData(
    type: 'transactions' | 'customers' | 'metrics' | 'all',
    format: 'csv' | 'json' | 'excel',
    dateRange: { start: string; end: string },
    filters?: Record<string, any>
  ): Promise<{ downloadUrl: string; expiresAt: string }> {
    try {
      const body = {
        type,
        format,
        dateRange,
        filters
      };

      const response = await fetch(`${this.apiBaseUrl}/v4/analytics/export`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Export data API error: ${errorData.message || response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error exporting data:', error);
      throw new Error(`Failed to export data: ${error.message}`);
    }
  }

  /**
   * Set up analytics alerts
   */
  async createAlert(alertConfig: {
    name: string;
    metric: string;
    condition: 'above' | 'below' | 'equals' | 'percentage_change';
    threshold: number;
    timeframe: string;
    recipients: string[];
    isActive: boolean;
  }): Promise<{ alertId: string }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v4/analytics/alerts`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(alertConfig)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Create alert API error: ${errorData.message || response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating alert:', error);
      throw new Error(`Failed to create alert: ${error.message}`);
    }
  }

  /**
   * Get cohort analysis
   */
  async getCohortAnalysis(
    period: 'weekly' | 'monthly',
    metric: 'retention' | 'revenue' | 'transactions',
    startDate?: string,
    endDate?: string
  ): Promise<{
    cohorts: Array<{
      cohortDate: string;
      cohortSize: number;
      periods: Array<{
        period: number;
        value: number;
        percentage: number;
      }>;
    }>;
    averages: {
      day1: number;
      day7: number;
      day30: number;
      day90: number;
    };
  }> {
    try {
      const params = new URLSearchParams({
        period,
        metric,
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      });

      const response = await fetch(`${this.apiBaseUrl}/v4/analytics/cohorts?${params}`, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Cohort analysis API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting cohort analysis:', error);
      throw new Error(`Failed to get cohort analysis: ${error.message}`);
    }
  }
}

export const analyticsService = new AnalyticsService(
  import.meta.env.VITE_MOONPAY_API_KEY || "",
  import.meta.env.VITE_MOONPAY_SECRET_KEY || ""
);
