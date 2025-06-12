import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/infrastructure/database/client";
import { AlertCircle, CheckCircle, Clock, Shield, User } from "lucide-react";

interface CompliancePanelProps {
  projectId: string;
}

const CompliancePanel = ({ projectId }: CompliancePanelProps) => {
  const [activeTab, setActiveTab] = useState("audit-trail");
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [highRiskInvestors, setHighRiskInvestors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (projectId) {
      fetchAuditLogs();
      fetchHighRiskInvestors();
    }
  }, [projectId]);

  const fetchAuditLogs = async () => {
    try {
      setIsLoading(true);

      // In a real implementation, this would fetch from the database
      // For now, we'll use mock data
      const mockLogs = [
        {
          id: "log-1",
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          action: "investor_added",
          user: "admin@example.com",
          details: "Added investor John Doe",
          entity_id: "inv-123",
        },
        {
          id: "log-2",
          timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
          action: "subscription_confirmed",
          user: "admin@example.com",
          details: "Confirmed subscription for Jane Smith",
          entity_id: "sub-456",
        },
        {
          id: "log-3",
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          action: "allocation_confirmed",
          user: "admin@example.com",
          details: "Confirmed token allocation for 3 investors",
          entity_id: "alloc-789",
        },
        {
          id: "log-4",
          timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          action: "tokens_minted",
          user: "admin@example.com",
          details: "Minted 10,000 ERC-20 tokens",
          entity_id: "mint-101",
        },
        {
          id: "log-5",
          timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
          action: "tokens_distributed",
          user: "admin@example.com",
          details: "Distributed tokens to 2 investors",
          entity_id: "dist-202",
        },
      ];

      setAuditLogs(mockLogs);
    } catch (err) {
      console.error("Error fetching audit logs:", err);
      toast({
        title: "Error",
        description: "Failed to load audit logs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHighRiskInvestors = async () => {
    try {
      // In a real implementation, this would fetch from the database
      // For now, we'll use mock data
      const mockHighRiskInvestors = [
        {
          id: "inv-hr-1",
          name: "Alex Johnson",
          email: "alex@example.com",
          risk_level: "high",
          risk_reason: "Incomplete KYC documentation",
          status: "pending_approval",
          subscription_id: "sub-hr-1",
          amount: 25000,
        },
        {
          id: "inv-hr-2",
          name: "Global Ventures LLC",
          email: "contact@globalventures.example",
          risk_level: "high",
          risk_reason: "Entity from high-risk jurisdiction",
          status: "pending_approval",
          subscription_id: "sub-hr-2",
          amount: 100000,
        },
      ];

      setHighRiskInvestors(mockHighRiskInvestors);
    } catch (err) {
      console.error("Error fetching high-risk investors:", err);
    }
  };

  const handleApproveInvestor = async (investorId: string) => {
    try {
      // In a real implementation, this would update the database
      // For now, we'll just update the local state
      setHighRiskInvestors((prev) =>
        prev.map((investor) =>
          investor.id === investorId
            ? { ...investor, status: "approved" }
            : investor,
        ),
      );

      // Add to audit log
      const newLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: "high_risk_investor_approved",
        user: "admin@example.com",
        details: `Approved high-risk investor ${investorId}`,
        entity_id: investorId,
      };

      setAuditLogs((prev) => [newLog, ...prev]);

      toast({
        title: "Success",
        description: "Investor approved successfully",
      });
    } catch (err) {
      console.error("Error approving investor:", err);
      toast({
        title: "Error",
        description: "Failed to approve investor. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRejectInvestor = async (investorId: string) => {
    try {
      // In a real implementation, this would update the database
      // For now, we'll just update the local state
      setHighRiskInvestors((prev) =>
        prev.map((investor) =>
          investor.id === investorId
            ? { ...investor, status: "rejected" }
            : investor,
        ),
      );

      // Add to audit log
      const newLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: "high_risk_investor_rejected",
        user: "admin@example.com",
        details: `Rejected high-risk investor ${investorId}`,
        entity_id: investorId,
      };

      setAuditLogs((prev) => [newLog, ...prev]);

      toast({
        title: "Success",
        description: "Investor rejected successfully",
      });
    } catch (err) {
      console.error("Error rejecting investor:", err);
      toast({
        title: "Error",
        description: "Failed to reject investor. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Get action icon
  const getActionIcon = (action: string) => {
    switch (action) {
      case "investor_added":
        return <User className="h-4 w-4 text-blue-500" />;
      case "subscription_confirmed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "allocation_confirmed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "tokens_minted":
        return <Shield className="h-4 w-4 text-purple-500" />;
      case "tokens_distributed":
        return <Shield className="h-4 w-4 text-purple-500" />;
      case "high_risk_investor_approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "high_risk_investor_rejected":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span>Compliance & Audit</span>
        </CardTitle>
        <CardDescription>
          Monitor compliance checks and audit trail for this project
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="audit-trail">Audit Trail</TabsTrigger>
            <TabsTrigger value="compliance-checks">
              Compliance Checks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="audit-trail" className="space-y-4">
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        <div className="flex justify-center items-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                          <span className="ml-2">Loading...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : auditLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        No audit logs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-xs">
                          {formatDate(log.timestamp)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getActionIcon(log.action)}
                            <span className="capitalize">
                              {log.action.replace(/_/g, " ")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{log.user}</TableCell>
                        <TableCell>{log.details}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="compliance-checks" className="space-y-4">
            <div className="rounded-md border p-4 bg-yellow-50 mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-800">
                    High-Risk Investors
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    The following investors have been flagged as high-risk and
                    require manual approval before token distribution. Only
                    authorized compliance officers can approve these investors.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Investor</TableHead>
                    <TableHead>Risk Reason</TableHead>
                    <TableHead>Subscription Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {highRiskInvestors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No high-risk investors found
                      </TableCell>
                    </TableRow>
                  ) : (
                    highRiskInvestors.map((investor) => (
                      <TableRow key={investor.id}>
                        <TableCell>
                          <div className="font-medium">{investor.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {investor.email}
                          </div>
                        </TableCell>
                        <TableCell>{investor.risk_reason}</TableCell>
                        <TableCell>
                          ${investor.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {investor.status === "pending_approval" ? (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              Pending Approval
                            </Badge>
                          ) : investor.status === "approved" ? (
                            <Badge className="bg-green-100 text-green-800">
                              Approved
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">
                              Rejected
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {investor.status === "pending_approval" && (
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() =>
                                  handleApproveInvestor(investor.id)
                                }
                              >
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() =>
                                  handleRejectInvestor(investor.id)
                                }
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CompliancePanel;
