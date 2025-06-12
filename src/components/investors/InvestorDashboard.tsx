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
  User,
} from "lucide-react";
import DashboardHeader from "../dashboard/DashboardHeader";

interface TaskItem {
  id: string;
  title: string;
  description: string;
  status: "completed" | "in_progress" | "pending" | "attention";
  dueDate?: string;
}

const InvestorDashboard = () => {
  const overallProgress = 75;

  const tasks: TaskItem[] = [
    {
      id: "1",
      title: "Complete KYC Verification",
      description: "Your KYC documents are being reviewed",
      status: "in_progress",
    },
    {
      id: "2",
      title: "Set Up Wallet Connection",
      description: "Connect your wallet to receive investments",
      status: "pending",
    },
    {
      id: "3",
      title: "Review Investment Opportunities",
      description: "Browse available investment opportunities",
      status: "pending",
    },
    {
      id: "4",
      title: "Complete Tax Forms",
      description: "Submit required tax documentation",
      status: "attention",
      dueDate: "2023-07-20",
    },
  ];

  const complianceStatus = [
    { name: "KYC/AML", status: "in_progress" },
    { name: "Accreditation", status: "completed" },
    { name: "Tax Documentation", status: "attention" },
    { name: "Wallet Verification", status: "pending" },
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
      <DashboardHeader userName="John Investor" companyName="Guardian SPV" />

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Onboarding Progress</CardTitle>
              <CardDescription>
                Track your investor onboarding and compliance progress
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
                    <div className="mx-auto w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <h3 className="font-medium">Verification</h3>
                    <p className="text-xs text-green-600 font-medium">
                      Completed
                    </p>
                  </div>

                  <div className="p-4 bg-white border rounded-lg text-center">
                    <div className="mx-auto w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="font-medium">KYC/AML</h3>
                    <p className="text-xs text-blue-600 font-medium">
                      In Progress
                    </p>
                  </div>

                  <div className="p-4 bg-white border rounded-lg text-center">
                    <div className="mx-auto w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                      <Clock className="h-5 w-5 text-gray-600" />
                    </div>
                    <h3 className="font-medium">Wallet Setup</h3>
                    <p className="text-xs text-gray-600 font-medium">Pending</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Approval Status</CardTitle>
              <CardDescription>
                Current status of your investor application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                <div className="space-y-6">
                  <div className="relative pl-10">
                    <div className="absolute left-0 p-1 rounded-full bg-green-100 border-2 border-white z-10">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <p className="font-medium">Submitted</p>
                    <p className="text-xs text-gray-500">
                      July 10, 2023 at 10:30 AM
                    </p>
                  </div>

                  <div className="relative pl-10">
                    <div className="absolute left-0 p-1 rounded-full bg-blue-100 border-2 border-white z-10">
                      <Clock className="h-4 w-4 text-blue-600" />
                    </div>
                    <p className="font-medium">Under Review</p>
                    <p className="text-xs text-gray-500">
                      Compliance agent is reviewing your submission
                    </p>
                  </div>

                  <div className="relative pl-10">
                    <div className="absolute left-0 p-1 rounded-full bg-gray-100 border-2 border-white z-10">
                      <Clock className="h-4 w-4 text-gray-400" />
                    </div>
                    <p className="font-medium text-gray-500">
                      Guardian Policy Enforcement
                    </p>
                    <p className="text-xs text-gray-500">
                      Pending automated validation
                    </p>
                  </div>

                  <div className="relative pl-10">
                    <div className="absolute left-0 p-1 rounded-full bg-gray-100 border-2 border-white z-10">
                      <Clock className="h-4 w-4 text-gray-400" />
                    </div>
                    <p className="font-medium text-gray-500">Final Approval</p>
                    <p className="text-xs text-gray-500">
                      Pending final approval
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Upcoming Tasks</CardTitle>
              <CardDescription>
                Tasks that require your attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start p-3 border rounded-lg"
                  >
                    <div className="mr-3 mt-0.5">
                      {getStatusIcon(task.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{task.title}</h3>
                        {getStatusBadge(task.status)}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {task.description}
                      </p>
                      {task.dueDate && (
                        <p className="text-xs text-red-600 mt-1">
                          Due by: {task.dueDate}
                        </p>
                      )}
                    </div>
                    <Button variant="ghost" size="sm">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Compliance Status</CardTitle>
              <CardDescription>
                Status of your compliance requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {complianceStatus.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 border-b last:border-0"
                  >
                    <span className="text-sm">{item.name}</span>
                    {getStatusBadge(item.status as TaskItem["status"])}
                  </div>
                ))}
              </div>

              <Button className="w-full mt-4">View Compliance Details</Button>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="investments">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger
              value="investments"
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Available Investments
            </TabsTrigger>
            <TabsTrigger value="wallet" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Wallet Setup
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="investments">
            <Card>
              <CardHeader>
                <CardTitle>Available Investment Opportunities</CardTitle>
                <CardDescription>
                  Browse and invest in available opportunities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <h3 className="text-lg font-medium mb-1">
                    No Investments Available Yet
                  </h3>
                  <p className="text-sm">
                    Investment opportunities will appear here once your account
                    is fully approved
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wallet">
            <Card>
              <CardHeader>
                <CardTitle>Wallet Configuration</CardTitle>
                <CardDescription>
                  Connect your wallet to receive investments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Wallet className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <h3 className="text-lg font-medium mb-1">
                    Wallet Setup Required
                  </h3>
                  <p className="text-sm mb-4">
                    Connect your wallet to participate in investments
                  </p>
                  <Button>Connect Wallet</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>
                  Manage your investor profile and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        Full Name
                      </h3>
                      <p>John Investor</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        Email
                      </h3>
                      <p>john.investor@example.com</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        Investor Type
                      </h3>
                      <p>Individual</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        Accreditation Status
                      </h3>
                      <Badge className="bg-green-100 text-green-800">
                        Accredited
                      </Badge>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full mt-4">
                    Edit Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default InvestorDashboard;
