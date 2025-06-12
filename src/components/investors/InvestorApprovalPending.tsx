import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Shield,
  User,
  Search,
  Filter,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DashboardHeader from "../dashboard/DashboardHeader";

interface InvestorItem {
  id: string;
  name: string;
  email: string;
  accreditationStatus: string;
  kycStatus: string;
  investmentExperience: string;
  dateSubmitted: string;
}

const InvestorApprovalPending = () => {
  const [investors, setInvestors] = React.useState<InvestorItem[]>([
    {
      id: "1",
      name: "John Smith",
      email: "john.smith@example.com",
      accreditationStatus: "Accredited",
      kycStatus: "Completed",
      investmentExperience: "High",
      dateSubmitted: "2023-07-10",
    },
    {
      id: "2",
      name: "Sarah Johnson",
      email: "sarah.johnson@example.com",
      accreditationStatus: "Pending",
      kycStatus: "In Progress",
      investmentExperience: "Medium",
      dateSubmitted: "2023-07-12",
    },
    {
      id: "3",
      name: "Michael Brown",
      email: "michael.brown@example.com",
      accreditationStatus: "Non-Accredited",
      kycStatus: "Completed",
      investmentExperience: "Low",
      dateSubmitted: "2023-07-15",
    },
    {
      id: "4",
      name: "Emily Davis",
      email: "emily.davis@example.com",
      accreditationStatus: "Accredited",
      kycStatus: "Rejected",
      investmentExperience: "Medium",
      dateSubmitted: "2023-07-08",
    },
  ]);

  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");

  const filteredInvestors = investors.filter((investor) => {
    // Apply search filter
    const matchesSearch =
      searchQuery === "" ||
      investor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      investor.email.toLowerCase().includes(searchQuery.toLowerCase());

    // Apply status filter
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "approved" && investor.kycStatus === "Completed") ||
      (statusFilter === "pending" && investor.kycStatus === "In Progress") ||
      (statusFilter === "rejected" && investor.kycStatus === "Rejected");

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "In Progress":
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case "Rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case "Pending":
        return <Badge variant="outline">Pending</Badge>;
      case "Accredited":
        return (
          <Badge className="bg-green-100 text-green-800">Accredited</Badge>
        );
      case "Non-Accredited":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            Non-Accredited
          </Badge>
        );
      case "High":
        return <Badge className="bg-blue-100 text-blue-800">High</Badge>;
      case "Medium":
        return <Badge className="bg-blue-50 text-blue-800">Medium</Badge>;
      case "Low":
        return <Badge className="bg-gray-100 text-gray-800">Low</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleApproveInvestor = (id: string) => {
    // In a real app, this would call an API to approve the investor
    setInvestors(
      investors.map((investor) =>
        investor.id === id ? { ...investor, kycStatus: "Completed" } : investor,
      ),
    );
  };

  const handleReviewInvestor = (id: string) => {
    // In a real app, this would open a detailed review screen
    console.log(`Review investor ${id}`);
  };

  const handleRejectInvestor = (id: string) => {
    // In a real app, this would call an API to reject the investor
    setInvestors(
      investors.map((investor) =>
        investor.id === id ? { ...investor, kycStatus: "Rejected" } : investor,
      ),
    );
  };

  const renderRiskLevel = (level: string) => {
    if (level === "high") {
      return <Badge className="bg-red-50 text-red-800">High</Badge>;
    } else if (level === "medium") {
      return <Badge className="bg-blue-50 text-blue-800">High</Badge>;
    } else {
      return <Badge className="bg-green-50 text-green-800">Low</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader userName="Admin User" companyName="Guardian SPV" />

      <main className="container mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Investor Approval Dashboard</CardTitle>
                <CardDescription>
                  Review and approve investor applications
                </CardDescription>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search investors..."
                    className="pl-9 w-full sm:w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">
                      Investor
                    </th>
                    <th className="text-left py-3 px-4 font-medium">
                      Accreditation
                    </th>
                    <th className="text-left py-3 px-4 font-medium">
                      KYC/AML Status
                    </th>
                    <th className="text-left py-3 px-4 font-medium">
                      Experience
                    </th>
                    <th className="text-left py-3 px-4 font-medium">
                      Date Submitted
                    </th>
                    <th className="text-right py-3 px-4 font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvestors.length > 0 ? (
                    filteredInvestors.map((investor) => (
                      <tr
                        key={investor.id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{investor.name}</p>
                            <p className="text-sm text-gray-500">
                              {investor.email}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(investor.accreditationStatus)}
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(investor.kycStatus)}
                        </td>
                        <td className="py-3 px-4">
                          {renderRiskLevel(investor.investmentExperience)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm">
                            {investor.dateSubmitted}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleApproveInvestor(investor.id)}
                              disabled={investor.kycStatus === "Completed"}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReviewInvestor(investor.id)}
                            >
                              Review
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRejectInvestor(investor.id)}
                              disabled={investor.kycStatus === "Rejected"}
                            >
                              Reject
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-8 text-center text-gray-500"
                      >
                        <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-lg font-medium">
                          No investors found
                        </p>
                        <p className="text-sm">
                          Try adjusting your search or filters
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-between items-center">
              <p className="text-sm text-gray-500">
                Showing {filteredInvestors.length} of {investors.length}{" "}
                investors
              </p>

              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Approve Selected
                </Button>
                <Button variant="outline" size="sm">
                  Export List
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Approval Timeline Tracker</CardTitle>
            <CardDescription>
              Track the approval process for investor applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="border rounded-lg p-4 text-center">
                <div className="mx-auto w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="font-medium">Submitted</h3>
                <p className="text-sm text-gray-500 mt-1">4 Investors</p>
              </div>

              <div className="border rounded-lg p-4 text-center">
                <div className="mx-auto w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-medium">Under Review</h3>
                <p className="text-sm text-gray-500 mt-1">1 Investor</p>
              </div>

              <div className="border rounded-lg p-4 text-center">
                <div className="mx-auto w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center mb-2">
                  <Shield className="h-5 w-5 text-yellow-600" />
                </div>
                <h3 className="font-medium">Guardian Validation</h3>
                <p className="text-sm text-gray-500 mt-1">0 Investors</p>
              </div>

              <div className="border rounded-lg p-4 text-center">
                <div className="mx-auto w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="font-medium">Fully Approved</h3>
                <p className="text-sm text-gray-500 mt-1">2 Investors</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default InvestorApprovalPending;
