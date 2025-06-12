import React, { useState, useEffect } from 'react';
import { useOnboarding } from '@/components/compliance/operations/shared/context/OnboardingContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Globe,
  Clock,
} from 'lucide-react';

interface ComplianceCheck {
  id: string;
  type: string;
  status: 'passed' | 'failed' | 'pending';
  timestamp: string;
  details: string;
  severity: 'low' | 'medium' | 'high';
}

interface RegulatoryUpdate {
  id: string;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  deadline: string;
  region: string;
}

export const ComplianceMonitor: React.FC = () => {
  const [complianceChecks, setComplianceChecks] = useState<ComplianceCheck[]>([]);
  const [regulatoryUpdates, setRegulatoryUpdates] = useState<RegulatoryUpdate[]>([]);
  const [monitoringActive, setMonitoringActive] = useState(true);

  useEffect(() => {
    // Simulate real-time compliance checks
    const interval = setInterval(() => {
      if (monitoringActive) {
        const newCheck: ComplianceCheck = {
          id: Date.now().toString(),
          type: 'Transaction Monitoring',
          status: Math.random() > 0.8 ? 'failed' : 'passed',
          timestamp: new Date().toISOString(),
          details: 'Routine compliance check completed',
          severity: 'low',
        };
        setComplianceChecks(prev => [newCheck, ...prev].slice(0, 10));
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [monitoringActive]);

  useEffect(() => {
    // Mock regulatory updates
    setRegulatoryUpdates([
      {
        id: '1',
        title: 'Updated KYC Requirements',
        description: 'New requirements for high-value transactions',
        impact: 'high',
        deadline: '2024-01-01',
        region: 'Global',
      },
      {
        id: '2',
        title: 'Digital Asset Regulations',
        description: 'New framework for digital asset custody',
        impact: 'medium',
        deadline: '2023-12-15',
        region: 'EU',
      },
    ]);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'passed':
        return <Badge className="bg-green-100 text-green-800">Passed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'high':
        return <Badge variant="destructive">High Impact</Badge>;
      case 'medium':
        return <Badge className="bg-amber-100 text-amber-800">Medium Impact</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-800">Low Impact</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Real-time Compliance Monitor</CardTitle>
              <CardDescription>
                Continuous monitoring of compliance status and regulatory requirements
              </CardDescription>
            </div>
            <Badge
              variant={monitoringActive ? 'default' : 'secondary'}
              className="cursor-pointer"
              onClick={() => setMonitoringActive(!monitoringActive)}
            >
              {monitoringActive ? 'Monitoring Active' : 'Monitoring Paused'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Live Compliance Checks */}
          <div>
            <h3 className="font-medium mb-4">Recent Compliance Checks</h3>
            <div className="space-y-4">
              {complianceChecks.map((check) => (
                <div
                  key={check.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <Activity className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium">{check.type}</p>
                      <p className="text-sm text-gray-500">{check.details}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {getStatusBadge(check.status)}
                    <span className="text-sm text-gray-500">
                      {new Date(check.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Regulatory Updates */}
          <div>
            <h3 className="font-medium mb-4">Regulatory Updates</h3>
            <div className="space-y-4">
              {regulatoryUpdates.map((update) => (
                <Card key={update.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Globe className="h-5 w-5 text-gray-400" />
                          <h4 className="font-medium">{update.title}</h4>
                        </div>
                        <p className="text-sm text-gray-500">
                          {update.description}
                        </p>
                        <div className="flex items-center space-x-2 text-sm">
                          <span className="text-gray-500">{update.region}</span>
                          <span>•</span>
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-500">
                            Deadline: {new Date(update.deadline).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {getImpactBadge(update.impact)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Compliance Alerts */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Active Monitoring Status:</p>
                <ul className="list-disc list-inside text-sm">
                  <li>Transaction monitoring: Active</li>
                  <li>Regulatory updates: Subscribed</li>
                  <li>Sanctions screening: Enabled</li>
                  <li>Risk assessment: Automated</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComplianceMonitor;