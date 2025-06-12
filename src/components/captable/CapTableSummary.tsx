import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { Progress } from "../ui/progress";
import { PieChart, DollarSign, Users, Percent } from "lucide-react";

interface CapTableSummaryProps {
  totalAllocation?: number;
  allocatedAmount?: number;
  remainingAmount?: number;
  investorCount?: number;
  averageAllocation?: number;
  allocationPercentage?: number;
  authorizedShares?: number;
  issuedShares?: number;
  remainingShares?: number;
  sharePrice?: number;
  projectType?: string;
  securityTypes?: { [key: string]: number };
}

const CapTableSummary = ({
  totalAllocation = 10000000,
  allocatedAmount = 7500000,
  remainingAmount = 2500000,
  investorCount = 25,
  averageAllocation = 300000,
  allocationPercentage = 75,
  authorizedShares = 10000000,
  issuedShares = 7500000,
  remainingShares = 2500000,
  sharePrice = 1.0,
  projectType = "hybrid",
  securityTypes = { equity: 40, convertible_note: 30, safe: 20, token: 10 },
}: CapTableSummaryProps) => {
  return (
    <div className="w-full bg-background p-4">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold">
                Cap Table Summary
              </CardTitle>
              <CardDescription>
                Overview of token allocations and distributions
              </CardDescription>
            </div>
            <PieChart className="h-6 w-6 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Allocation Progress</span>
              <span className="text-sm font-medium">
                {allocationPercentage}%
              </span>
            </div>
            <Progress value={allocationPercentage} className="h-2" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {projectType === "equity" || projectType === "hybrid" ? (
              <div className="flex items-center p-4 bg-muted/20 rounded-lg">
                <DollarSign className="h-8 w-8 text-primary mr-3" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Authorized Shares
                  </p>
                  <p className="text-2xl font-bold">
                    {authorizedShares.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Issued: {issuedShares.toLocaleString()} (
                    {Math.round((issuedShares / authorizedShares) * 100)}%)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Remaining: {remainingShares.toLocaleString()}
                  </p>
                </div>
              </div>
            ) : null}
            <div className="flex items-center p-4 bg-muted/20 rounded-lg">
              <DollarSign className="h-8 w-8 text-primary mr-3" />
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Allocation
                </p>
                <p className="text-2xl font-bold">
                  ${(totalAllocation / 1000000).toFixed(2)}M
                </p>
                {projectType === "equity" || projectType === "hybrid" ? (
                  <p className="text-xs text-muted-foreground">
                    Share Price: ${sharePrice.toFixed(4)}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex items-center p-4 bg-muted/20 rounded-lg">
              <Percent className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm text-muted-foreground">
                  Allocated Amount
                </p>
                <p className="text-2xl font-bold">
                  ${(allocatedAmount / 1000000).toFixed(2)}M
                </p>
                <p className="text-xs text-muted-foreground">
                  Remaining: ${(remainingAmount / 1000000).toFixed(2)}M
                </p>
              </div>
            </div>

            <div className="flex items-center p-4 bg-muted/20 rounded-lg">
              <Users className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm text-muted-foreground">Investors</p>
                <p className="text-2xl font-bold">{investorCount}</p>
                <p className="text-xs text-muted-foreground">
                  Avg: ${(averageAllocation / 1000).toFixed(0)}K per investor
                </p>
                <div className="flex gap-1 mt-1">
                  {Object.entries(securityTypes).map(([type, percentage]) => (
                    <div
                      key={type}
                      className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100"
                      title={`${type.replace("_", " ")}: ${percentage}%`}
                    >
                      {type.charAt(0).toUpperCase()}: {percentage}%
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CapTableSummary;
