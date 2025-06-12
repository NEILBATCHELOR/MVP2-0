import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  FileText,
  Shield,
  Wallet,
} from "lucide-react";
import DashboardHeader from "../dashboard/DashboardHeader";

interface TaskItem {
  id: string;
  title: string;
  description: string;
  status: "completed" | "in_progress" | "pending" | "attention";
  dueDate?: string;
}

const OnboardingDashboard = () => {
  const overallProgress = 65;

  const tasks: TaskItem[] = [
    {
      id: "1",
      title: "Complete KYC Verification",
      description: "Submit your KYC information for verification",
      status: "completed",
    },
    {
      id: "2",
      title: "Upload Missing Documents",
      description: "Financial statements and regulatory documentation required",
      status: "attention",
      dueDate: "2023-07-15",
    },
    {
      id: "3",
      title: "Configure Multi-Signature Wallet",
      description: "Add additional signatories to your wallet",
      status: "in_progress",
    },
    {
      id: "4",
      title: "Complete Risk Disclosure Statement",
      description: "Provide a comprehensive risk disclosure for your SPV",
      status: "pending",
    },
  ];

  const complianceStatus = [
    { name: "KYC/AML", status: "completed" },
    { name: "Document Verification", status: "in_progress" },
    { name: "Regulatory Approval", status: "pending" },
    { name: "Legal Review", status: "attention" },
  ];

  const getStatusIcon = (status: TaskItem["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "in_progress":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "pending":
        return <Clock className="h-5 w-5 text-gray-400" />;
      case "attention":
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
    }
  };

  const getStatusBadge = (status: TaskItem["status"]) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      case "attention":
        return (
          <Badge className="bg-amber-100 text-amber-800">Action Required</Badge>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Onboarding Progress</CardTitle>
              <CardDescription>
                Track your SPV setup and compliance progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">
                      Overall Completion
                    </span>
                    <span className="text-sm font-medium">
                      {overallProgress}%
                    </span>
                  </div>
                  <Progress value={overallProgress} className="h-2" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-white border rounded-lg text-center">
                    <div className="mx-auto w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <h3 className="font-medium">Registration</h3>
                    <p className="text-xs text-green-600 font-medium">
                      Completed
                    </p>
                  </div>

                  <div className="p-4 bg-white border rounded-lg text-center">
                    <div className="mx-auto w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="font-medium">Documentation</h3>
                    <p className="text-xs text-blue-600 font-medium">
                      In Progress
                    </p>
                  </div>

                  <div className="p-4 bg-white border rounded-lg text-center">
                    <div className="mx-auto w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mb-2">
                      <Shield className="h-5 w-5 text-amber-600" />
                    </div>
                    <h3 className="font-medium">Compliance</h3>
                    <p className="text-xs text-amber-600 font-medium">
                      Pending
                    </p>
                  </div>

                  <div className="p-4 bg-white border rounded-lg text-center">
                    <div className="mx-auto w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                      <Wallet className="h-5 w-5 text-gray-600" />
                    </div>
                    <h3 className="font-medium">Wallet Setup</h3>
                    <p className="text-xs text-gray-600 font-medium">
                      Not Started
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Action Items</CardTitle>
              <CardDescription>Tasks requiring your attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="mt-0.5">{getStatusIcon(task.status)}</div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h4 className="font-medium">{task.title}</h4>
                        {getStatusBadge(task.status)}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {task.description}
                      </p>
                      {task.dueDate && (
                        <p className="text-xs text-amber-600 mt-2">
                          Due by: {task.dueDate}
                        </p>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" className="mt-1">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default OnboardingDashboard;
