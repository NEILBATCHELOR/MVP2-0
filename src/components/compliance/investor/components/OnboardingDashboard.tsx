import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '../context/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  FileText,
  Wallet,
  Shield,
} from 'lucide-react';

export const OnboardingDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useOnboarding();
  const { complianceStatus, walletStatus } = state;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-gray-400" />;
      case 'action_required':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'action_required':
        return (
          <Badge className="bg-amber-100 text-amber-800">Action Required</Badge>
        );
      default:
        return null;
    }
  };

  const upcomingTasks = [
    {
      id: 'kyc',
      title: 'Complete Documentation',
      description: 'Submit required documentation',
      status: complianceStatus.kycStatus,
      path: '/compliance/investor-onboarding/kyc',
    },
    {
      id: 'wallet',
      title: 'Complete Documentation',
      description: 'Submit required documentation',
      status: walletStatus.status,
      path: '/compliance/investor-onboarding/wallet-setup',
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Onboarding Progress</h2>
        <p className="text-gray-500 mt-2">
          Track your investor onboarding and compliance progress
        </p>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Completion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{complianceStatus.overallProgress}%</span>
            </div>
            <Progress value={complianceStatus.overallProgress} />
          </div>

          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="text-center">
              <div className="flex justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <h4 className="font-medium mt-2">Registration</h4>
              <p className="text-sm text-gray-500">Completed</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <h4 className="font-medium mt-2">Verification</h4>
              <p className="text-sm text-gray-500">Completed</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center">
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
              <h4 className="font-medium mt-2">KYC/AML</h4>
              <p className="text-sm text-gray-500">In Progress</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center">
                <Clock className="h-8 w-8 text-gray-400" />
              </div>
              <h4 className="font-medium mt-2">Wallet Setup</h4>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Tasks</CardTitle>
          <CardDescription>Tasks that require your attention</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {upcomingTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => navigate(task.path)}
            >
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-gray-100 rounded-full">
                  {task.id === 'kyc' ? (
                    <FileText className="h-5 w-5 text-gray-600" />
                  ) : task.id === 'wallet' ? (
                    <Wallet className="h-5 w-5 text-gray-600" />
                  ) : (
                    <Shield className="h-5 w-5 text-gray-600" />
                  )}
                </div>
                <div>
                  <h4 className="font-medium">{task.title}</h4>
                  <p className="text-sm text-gray-500">{task.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {getStatusBadge(task.status)}
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Compliance Status */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Status</CardTitle>
          <CardDescription>
            Status of your compliance requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">KYC/AML</h4>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(complianceStatus.kycStatus)}
                  <span className="text-sm">
                    {complianceStatus.kycStatus === 'in_progress'
                      ? 'Under Review'
                      : 'Not Started'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Accreditation</h4>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(complianceStatus.accreditationStatus)}
                  <span className="text-sm">Completed</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Tax Documentation</h4>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(complianceStatus.taxDocumentationStatus)}
                  <span className="text-sm">Action Required</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Wallet Verification</h4>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(walletStatus.status)}
                  <span className="text-sm">Pending</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={() => navigate('/compliance/investor-onboarding')}>
          Back to Home
        </Button>
        <Button
          onClick={() => navigate('/compliance/investor-onboarding/investments')}
          disabled={complianceStatus.overallProgress < 100}
        >
          View Investment Opportunities
        </Button>
      </div>
    </div>
  );
};

export default OnboardingDashboard;