import React, { useState } from 'react';
import { useOnboarding } from '@/components/onboarding/OnboardingContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, TrendingUp, AlertTriangle } from 'lucide-react';

interface RiskMetric {
  category: string;
  score: number;
  factors: string[];
  recommendations: string[];
}

export const RiskAssessment: React.FC = () => {
  const { state } = useOnboarding();
  const [riskMetrics, setRiskMetrics] = useState<RiskMetric[]>([
    {
      category: 'Investment Experience',
      score: 65,
      factors: [
        'Less than 2 years experience',
        'Limited exposure to digital assets',
        'Previous mutual fund investments',
      ],
      recommendations: [
        'Consider educational resources',
        'Start with lower-risk investments',
        'Consult with financial advisor',
      ],
    },
    {
      category: 'Market Understanding',
      score: 80,
      factors: [
        'Strong financial literacy',
        'Regular market monitoring',
        'Understanding of asset classes',
      ],
      recommendations: [
        'Explore diversification options',
        'Consider advanced trading strategies',
      ],
    },
    {
      category: 'Risk Tolerance',
      score: 45,
      factors: [
        'Conservative investment approach',
        'Emphasis on capital preservation',
        'Regular income requirement',
      ],
      recommendations: [
        'Focus on stable yield products',
        'Implement stop-loss strategies',
        'Consider dollar-cost averaging',
      ],
    },
  ]);

  const calculateOverallRisk = () => {
    const avgScore = riskMetrics.reduce((acc, curr) => acc + curr.score, 0) / riskMetrics.length;
    if (avgScore >= 80) return 'High Risk';
    if (avgScore >= 50) return 'Moderate Risk';
    return 'Low Risk';
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-green-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Advanced Risk Assessment</CardTitle>
        <CardDescription>
          AI-powered analysis of your investment profile and risk factors
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Risk Score */}
        <div className="text-center p-6 bg-gray-50 rounded-lg">
          <h3 className="text-2xl font-bold mb-2">Risk Classification</h3>
          <div className={`text-xl font-semibold ${getRiskColor(
            riskMetrics.reduce((acc, curr) => acc + curr.score, 0) / riskMetrics.length
          )}`}>
            {calculateOverallRisk()}
          </div>
        </div>

        {/* Risk Metrics */}
        <div className="grid gap-6">
          {riskMetrics.map((metric, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">{metric.category}</h4>
                <span className={`font-semibold ${getRiskColor(metric.score)}`}>
                  {metric.score}%
                </span>
              </div>
              <Progress value={metric.score} className="h-2" />
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <h5 className="text-sm font-medium mb-2">Key Factors</h5>
                  <ul className="text-sm space-y-1">
                    {metric.factors.map((factor, idx) => (
                      <li key={idx} className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-gray-400" />
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="text-sm font-medium mb-2">Recommendations</h5>
                  <ul className="text-sm space-y-1">
                    {metric.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-blue-400" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Risk Alerts */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Risk Management Recommendations:</p>
              <ul className="list-disc list-inside text-sm">
                <li>Consider diversifying across multiple asset classes</li>
                <li>Set up automatic rebalancing triggers</li>
                <li>Implement position limits based on risk score</li>
                <li>Regular portfolio stress testing</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default RiskAssessment;