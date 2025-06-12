import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Download, Calendar, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface PolicyAnalyticsProps {
  policies?: any[];
  timeRange?: string;
  onTimeRangeChange?: (range: string) => void;
}

const PolicyAnalytics = ({
  policies = [],
  timeRange = "30days",
  onTimeRangeChange = () => {},
}: PolicyAnalyticsProps) => {
  // Mock data for charts and statistics
  const policyStats = {
    totalPolicies: policies.length,
    activePolicies: policies.filter((p) => p.status === "active").length,
    draftPolicies: policies.filter((p) => p.status === "draft").length,
    pendingApproval: policies.filter((p) => p.status === "pending").length,
  };

  const ruleStats = {
    totalRules: policies.reduce(
      (acc, policy) => acc + (policy.rules?.length || 0),
      0,
    ),
    ruleTriggered: 87,
    ruleBlocked: 23,
    ruleApproved: 64,
  };

  const approvalStats = {
    pendingApprovals: 12,
    averageApprovalTime: "4.2 hours",
    approvalRate: "92%",
    rejectionRate: "8%",
  };

  return (
    <div className="w-full bg-white p-6 rounded-lg shadow-sm">
      <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:justify-between md:items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          Policy Analytics Dashboard
        </h2>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={onTimeRangeChange}>
            <SelectTrigger className="w-[160px]">
              <div className="flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Time Range" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="year">Last year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="flex items-center gap-1">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          <Button variant="outline" className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rules">Rule Triggers</TabsTrigger>
          <TabsTrigger value="approvals">Approval Workflows</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Total Policies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {policyStats.totalPolicies}
                </div>
                <div className="flex items-center mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: "100%" }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Active Policies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {policyStats.activePolicies}
                </div>
                <div className="flex items-center mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-green-500 h-2.5 rounded-full"
                      style={{
                        width: `${(policyStats.activePolicies / policyStats.totalPolicies) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Draft Policies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {policyStats.draftPolicies}
                </div>
                <div className="flex items-center mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-400 h-2.5 rounded-full"
                      style={{
                        width: `${(policyStats.draftPolicies / policyStats.totalPolicies) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Pending Approval
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {policyStats.pendingApproval}
                </div>
                <div className="flex items-center mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-yellow-500 h-2.5 rounded-full"
                      style={{
                        width: `${(policyStats.pendingApproval / policyStats.totalPolicies) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Policy Distribution by Type</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <div className="flex flex-col h-full justify-center items-center">
                  <div className="w-64 h-64 rounded-full border-8 border-gray-100 relative">
                    <div
                      className="absolute top-0 left-0 w-full h-full rounded-full border-8 border-t-blue-500 border-r-purple-500 border-b-indigo-500 border-l-green-500"
                      style={{ clipPath: "circle(50% at center)" }}
                    ></div>
                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-3xl font-bold">
                          {policyStats.totalPolicies}
                        </div>
                        <div className="text-sm text-gray-500">
                          Total Policies
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4 w-full">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                      <span className="text-sm">Transfer Limit (40%)</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                      <span className="text-sm">KYC Verification (25%)</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-indigo-500 rounded-full mr-2"></div>
                      <span className="text-sm">Restricted Assets (20%)</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm">Other (15%)</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Policy Activity Over Time</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <div className="h-full flex flex-col justify-between">
                  <div className="flex-1 flex items-end space-x-2">
                    {[35, 45, 30, 65, 85, 55, 75, 50, 65, 95, 80, 70].map(
                      (height, i) => (
                        <div
                          key={i}
                          className="flex-1 flex flex-col items-center"
                        >
                          <div
                            className="w-full bg-blue-100 rounded-t-sm relative group"
                            style={{ height: `${height}%` }}
                          >
                            <div className="absolute inset-x-0 bottom-0 bg-blue-500 h-1/3 rounded-t-sm"></div>
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                              {height} events
                            </div>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                  <div className="grid grid-cols-12 text-xs text-gray-500 mt-2">
                    <div className="text-center">Jan</div>
                    <div className="text-center">Feb</div>
                    <div className="text-center">Mar</div>
                    <div className="text-center">Apr</div>
                    <div className="text-center">May</div>
                    <div className="text-center">Jun</div>
                    <div className="text-center">Jul</div>
                    <div className="text-center">Aug</div>
                    <div className="text-center">Sep</div>
                    <div className="text-center">Oct</div>
                    <div className="text-center">Nov</div>
                    <div className="text-center">Dec</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Total Rules
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{ruleStats.totalRules}</div>
                <p className="text-sm text-gray-500 mt-1">
                  Across all policies
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Rules Triggered
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {ruleStats.ruleTriggered}
                </div>
                <p className="text-sm text-gray-500 mt-1">Last 30 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Transactions Blocked
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {ruleStats.ruleBlocked}
                </div>
                <div className="flex items-center mt-1">
                  <Badge className="bg-red-100 text-red-800 border-red-200">
                    {Math.round(
                      (ruleStats.ruleBlocked / ruleStats.ruleTriggered) * 100,
                    )}
                    %
                  </Badge>
                  <span className="text-sm text-gray-500 ml-2">Block rate</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Transactions Approved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {ruleStats.ruleApproved}
                </div>
                <div className="flex items-center mt-1">
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    {Math.round(
                      (ruleStats.ruleApproved / ruleStats.ruleTriggered) * 100,
                    )}
                    %
                  </Badge>
                  <span className="text-sm text-gray-500 ml-2">
                    Approval rate
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Most Triggered Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        High Value Transfer
                      </span>
                      <span className="text-sm">42 triggers</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: "80%" }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        KYC Verification
                      </span>
                      <span className="text-sm">28 triggers</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: "60%" }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        Velocity Limit
                      </span>
                      <span className="text-sm">15 triggers</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: "40%" }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        Whitelist Transfer
                      </span>
                      <span className="text-sm">8 triggers</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: "25%" }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        Lock-Up Period
                      </span>
                      <span className="text-sm">4 triggers</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: "15%" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rule Trigger Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center">
                  <div className="relative w-48 h-48">
                    {/* Donut chart segments */}
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="#3b82f6"
                        strokeWidth="20"
                        strokeDasharray="75.4 175.4"
                        strokeDashoffset="-87.7"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="#8b5cf6"
                        strokeWidth="20"
                        strokeDasharray="50.3 175.4"
                        strokeDashoffset="-12.3"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="#10b981"
                        strokeWidth="20"
                        strokeDasharray="25.1 175.4"
                        strokeDashoffset="38"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="#f59e0b"
                        strokeWidth="20"
                        strokeDasharray="15.1 175.4"
                        strokeDashoffset="63.1"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="#ef4444"
                        strokeWidth="20"
                        strokeDasharray="10.1 175.4"
                        strokeDashoffset="78.2"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-3xl font-bold">87</div>
                        <div className="text-xs text-gray-500">
                          Total Triggers
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    <span className="text-xs">Transfer Limit (43%)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                    <span className="text-xs">KYC Verification (29%)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-xs">Velocity Limit (14%)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                    <span className="text-xs">Whitelist (9%)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    <span className="text-xs">Other (5%)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="approvals" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Pending Approvals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {approvalStats.pendingApprovals}
                </div>
                <Badge className="mt-2 bg-yellow-100 text-yellow-800 border-yellow-200">
                  Requires attention
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Avg. Approval Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {approvalStats.averageApprovalTime}
                </div>
                <p className="text-sm text-gray-500 mt-1">Last 30 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Approval Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {approvalStats.approvalRate}
                </div>
                <div className="flex items-center mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-green-500 h-2.5 rounded-full"
                      style={{ width: approvalStats.approvalRate }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Rejection Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {approvalStats.rejectionRate}
                </div>
                <div className="flex items-center mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-red-500 h-2.5 rounded-full"
                      style={{ width: approvalStats.rejectionRate }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Approval Workflow Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">
                        Compliance Officer
                      </span>
                      <span className="text-sm">3.1 hours avg.</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-green-500 h-2.5 rounded-full"
                        style={{ width: "70%" }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Risk Manager</span>
                      <span className="text-sm">5.4 hours avg.</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-yellow-500 h-2.5 rounded-full"
                        style={{ width: "50%" }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Legal Advisor</span>
                      <span className="text-sm">8.7 hours avg.</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-orange-500 h-2.5 rounded-full"
                        style={{ width: "30%" }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Executive</span>
                      <span className="text-sm">12.3 hours avg.</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-red-500 h-2.5 rounded-full"
                        style={{ width: "20%" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Approval Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 pb-3 border-b border-gray-100">
                    <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-green-500"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm">
                          High Value Transfer
                        </div>
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          Approved
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Alex Johnson • 2 hours ago
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 pb-3 border-b border-gray-100">
                    <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-red-500"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm">
                          Restricted Asset Transfer
                        </div>
                        <Badge className="bg-red-100 text-red-800 border-red-200">
                          Rejected
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Morgan Smith • 4 hours ago
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 pb-3 border-b border-gray-100">
                    <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-green-500"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm">
                          KYC Verification
                        </div>
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          Approved
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Jamie Lee • 6 hours ago
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 pb-3 border-b border-gray-100">
                    <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-yellow-500"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm">
                          Velocity Limit
                        </div>
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                          Pending
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Taylor Wong • 8 hours ago
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center h-48">
                  <div className="relative w-36 h-36">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle
                        className="text-gray-200"
                        strokeWidth="10"
                        stroke="currentColor"
                        fill="transparent"
                        r="40"
                        cx="50"
                        cy="50"
                      />
                      <circle
                        className="text-green-500"
                        strokeWidth="10"
                        strokeDasharray="251.2"
                        strokeDashoffset="25.12"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="40"
                        cx="50"
                        cy="50"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl font-bold">90%</div>
                        <div className="text-sm text-gray-500">Compliance</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      Excellent
                    </Badge>
                    <p className="text-sm text-gray-500 mt-2">
                      Last updated: Today
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Compliance Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                      <span className="text-sm">Critical</span>
                    </div>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                      <span className="text-sm">High</span>
                    </div>
                    <span className="font-medium">2</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                      <span className="text-sm">Medium</span>
                    </div>
                    <span className="font-medium">5</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      <span className="text-sm">Low</span>
                    </div>
                    <span className="font-medium">8</span>
                  </div>
                  <div className="pt-2 mt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Total Issues</span>
                      <span className="font-medium">15</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Regulatory Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">KYC/AML</span>
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        100%
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full w-full"></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">GDPR</span>
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        95%
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: "95%" }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">SEC Regulations</span>
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                        85%
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full"
                        style={{ width: "85%" }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">FATF Travel Rule</span>
                      <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                        80%
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full"
                        style={{ width: "80%" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Compliance Audit Trail</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 pb-3 border-b border-gray-100">
                  <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-green-500"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">KYC Policy Updated</div>
                      <span className="text-sm text-gray-500">
                        Today, 10:23 AM
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Updated KYC verification requirements to comply with new
                      regulations.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 pb-3 border-b border-gray-100">
                  <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">
                        Quarterly Compliance Review
                      </div>
                      <span className="text-sm text-gray-500">
                        Yesterday, 2:45 PM
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Completed quarterly compliance review with 90% overall
                      score.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 pb-3 border-b border-gray-100">
                  <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-yellow-500"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">
                        Transfer Limit Policy Adjustment
                      </div>
                      <span className="text-sm text-gray-500">
                        Jul 20, 2023
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Adjusted transfer limits to align with updated regulatory
                      thresholds.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-purple-500"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">
                        External Audit Completed
                      </div>
                      <span className="text-sm text-gray-500">
                        Jul 15, 2023
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Successfully passed external compliance audit with minor
                      recommendations.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PolicyAnalytics;
