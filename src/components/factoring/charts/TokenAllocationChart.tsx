import React, { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FactoringToken, TokenAllocation } from "../types";
import {
  PieChart,
  Pie,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  TooltipProps,
  Label,
} from "recharts";

interface TokenAllocationChartProps {
  token: FactoringToken;
  allocations: TokenAllocation[];
  title?: string;
  description?: string;
}

const TokenAllocationChart: React.FC<TokenAllocationChartProps> = ({
  token,
  allocations = [],
  title,
  description,
}) => {
  // Use shades of the bright blue #2563eb
  const COLORS = [
    '#2563eb', // Primary bright blue
    '#3b82f6', // Slightly lighter blue
    '#60a5fa', // Medium light blue
    '#93c5fd', // Lighter blue
    '#bfdbfe', // Very light blue 
    '#dbeafe', // Almost white blue
  ];

  // First, get all distributed allocations for this token
  const distributedAllocations = useMemo(() => {
    if (!allocations) return [];
    
    // Special handling for factoring tokens to ensure we capture ALL factoring allocations
    if (token?.tokenType === 'factoring') {
      // Log to debug
      console.log("Processing FACTORING token allocations:", token);
      console.log("All allocations:", allocations);
      
      // Get all distributed factoring allocations
      const factoringAllocations = allocations.filter(
        allocation => allocation.distributionStatus === 'completed' && allocation.tokenType === 'factoring'
      );
      
      console.log("Factoring allocations (should be 2):", factoringAllocations);
      return factoringAllocations;
    }
    
    // For regular tokens, filter by token ID
    return allocations.filter(
      allocation => allocation.tokenId === token?.id && allocation.distributionStatus === 'completed'
    );
  }, [allocations, token]);

  const totalDistributed = useMemo(() => {
    return distributedAllocations.reduce(
      (sum, allocation) => sum + parseFloat(String(allocation.tokenAmount || '0')), 
      0
    );
  }, [distributedAllocations]);

  const totalAllocated = useMemo(() => {
    if (!token) return 0;
    
    // For factoring tokens, sum ALL factoring type tokens
    if (token.tokenType === 'factoring') {
      console.log("Calculating total for factoring tokens");
      const factoringTotal = allocations?.reduce(
        (sum, allocation) => 
          allocation.tokenType === 'factoring' 
            ? sum + parseFloat(String(allocation.tokenAmount || '0'))
            : sum,
        0
      ) || 0;
      console.log(`Total factoring allocations: ${factoringTotal}`);
      return factoringTotal;
    }
    
    // For other tokens, use totalTokens
    return parseFloat(String(token.totalTokens || '0'));
  }, [allocations, token]);

  console.log(`Token chart - Token: ${token?.tokenName}, Total Allocated: ${totalAllocated}, Total Distributed: ${totalDistributed}`);
  console.log(`Distributed allocations count: ${distributedAllocations.length}`);
  
  // Add string to color helper function if it doesn't exist
  const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xFF;
      color += ('00' + value.toString(16)).substr(-2);
    }
    return color;
  };
  
  // Data formatted for the pie chart
  const pieData = useMemo(() => {
    return distributedAllocations.map((allocation) => {
      // Calculate the percentage of total tokens
      const percentage = (parseFloat(String(allocation.tokenAmount || '0')) / totalAllocated) * 100;
      
      // Generate a consistent color for each investor
      const color = stringToColor(allocation.investorName || 'Unknown');
      
      return {
        id: allocation.id,
        value: parseFloat(String(allocation.tokenAmount || '0')),
        entity_name: allocation.investorName || 'Unknown',
        color,
        percentage,
        label: `${allocation.investorName || 'Unknown'} (${percentage.toFixed(1)}%)`,
      };
    });
  }, [distributedAllocations, totalAllocated]);

  // Group allocations by investor (only distributed ones)
  const investorAllocations = distributedAllocations.reduce((acc, allocation) => {
    if (!allocation.investorId) return acc;
    
    const existingIndex = acc.findIndex(item => item.investorId === allocation.investorId);
    
    if (existingIndex >= 0) {
      acc[existingIndex].value += (allocation.tokenAmount || 0);
    } else {
      acc.push({
        name: allocation.investorName || "Unknown Investor",
        investorId: allocation.investorId,
        value: allocation.tokenAmount || 0,
      });
    }
    
    return acc;
  }, [] as Array<{ name: string; investorId: string; value: number }>);

  // Log data to help diagnose issues with specific focus on factoring tokens
  console.log("Token data:", token);
  console.log("Token type:", token.tokenType);
  console.log("All allocations:", allocations);
  console.log("Distributed allocations:", distributedAllocations);
  console.log("Distributed factoring allocations:", 
    allocations.filter(a => a.distributionStatus === 'completed' && a.tokenType === 'factoring')
  );

  // Calculate unallocated tokens only if we have token information
  const totalPendingAllocations = allocations.filter(a => a.distributionStatus !== 'completed')
    .reduce((sum, a) => sum + (a.tokenAmount || 0), 0);
  
  // Calculate full total (distributed + pending + unallocated)
  const totalTokenSupply = token?.totalTokens || 0;
  const totalPending = totalPendingAllocations;
  const totalUnallocated = Math.max(0, totalTokenSupply - totalDistributed - totalPending);
  
  // Only show unallocated for tokens that are not distributed
  const isFullyDistributed = token?.status?.toLowerCase() === 'distributed';
  
  // Add pending allocation as a single entry if there are any
  if (totalPending > 0) {
    investorAllocations.push({
      name: "Pending Distribution",
      investorId: "pending",
      value: totalPending,
    });
  }
  
  // Add unallocated as a single entry if there are any
  if (totalUnallocated > 0 && !isFullyDistributed) {
    investorAllocations.push({
      name: "Unallocated",
      investorId: "unallocated",
      value: totalUnallocated,
    });
  }

  // Helper function to format large numbers (display in M for millions, K for thousands)
  const formatLargeNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    } else {
      return num.toLocaleString();
    }
  };
  
  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      // Use appropriate percentage calculation based on segment type
      let percentageLabel = "%";
      let percentage = 0;
      
      if (data.investorId === "pending") {
        // Pending as percentage of total supply
        percentage = ((data.value / totalTokenSupply) * 100);
        percentageLabel = "% of total";
      } else if (data.investorId === "unallocated") {
        // Unallocated as percentage of total supply
        percentage = ((data.value / totalTokenSupply) * 100);
        percentageLabel = "% of total";
      } else {
        // Regular allocation as percentage of distributed
        percentage = ((data.value / totalDistributed) * 100);
        percentageLabel = "% of distributed";
      }
      
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <div className="grid gap-1">
            <div className="flex flex-col">
              <span className="text-[0.70rem] uppercase text-muted-foreground">
                {data.investorId === "pending" ? "Status" : 
                 data.investorId === "unallocated" ? "Status" : "Investor"}
              </span>
              <span className="font-bold text-foreground">{data.name}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[0.70rem] uppercase text-muted-foreground">
                Tokens
              </span>
              <span className="font-bold text-foreground">
                {data.value.toLocaleString()} ({percentage.toFixed(1)}{percentageLabel})
              </span>
            </div>
            {data.investorId !== "unallocated" && data.investorId !== "pending" && token?.tokenValue && (
              <div className="flex flex-col">
                <span className="text-[0.70rem] uppercase text-muted-foreground">
                  Value
                </span>
                <span className="font-bold text-foreground">
                  ${(data.value * (token.tokenValue || 0)).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom legend renderer
  const renderLegend = (props: any) => {
    const { payload } = props;
    
    return (
      <ul className="flex flex-wrap justify-center gap-4 text-xs mt-4">
        {payload.map((entry: any, index: number) => (
          <li key={`item-${index}`} className="flex items-center">
            <div 
              className="w-3 h-3 rounded-full mr-1.5" 
              style={{ backgroundColor: entry.color }}
            />
            <span>{entry.value}</span>
          </li>
        ))}
      </ul>
    );
  };

  // Default title and description if not provided
  const chartTitle = title || `${token?.tokenName || 'Token'} Allocations`;
  const chartDescription = description || `Distribution of ${token?.tokenSymbol || 'Token'} tokens to investors`;

  // If token is null or undefined, show placeholder
  if (!token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Token Allocations</CardTitle>
          <CardDescription>Distribution of tokens to investors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center">
            <p className="text-muted-foreground">No token data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {!token || investorAllocations.length === 0 ? (
        <div className="flex h-[300px] items-center justify-center border rounded-lg border-dashed">
          <p className="text-muted-foreground">
            {!token ? "No token data available" : "No allocation data available for this token"}
          </p>
        </div>
      ) : (
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={investorAllocations}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                cornerRadius={4}
              >
                {investorAllocations.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={
                      entry.investorId === "unallocated" ? '#94a3b8' :
                      entry.investorId === "pending" ? '#f59e0b' :
                      COLORS[index % COLORS.length]
                    }
                  />
                ))}
                <Label
                  content={(props: any) => {
                    const viewBox = props.viewBox || {};
                    const cx = viewBox.cx || 0;
                    const cy = viewBox.cy || 0;
                    return (
                      <g>
                        <text x={cx} y={cy-10} textAnchor="middle" fill="var(--foreground)" className="text-xs">
                          Distributed
                        </text>
                        <text x={cx} y={cy+10} textAnchor="middle" fill="var(--foreground)" className="text-base font-bold">
                          {formatLargeNumber(totalDistributed)}
                        </text>
                        <text x={cx} y={cy+25} textAnchor="middle" fill="var(--foreground)" className="text-[10px] text-muted-foreground">
                          of {formatLargeNumber(totalTokenSupply)}
                        </text>
                      </g>
                    );
                  }}
                />
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={renderLegend} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
      
      {token && investorAllocations.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
          <div className="flex justify-between p-2 rounded bg-blue-50 dark:bg-blue-950">
            <span className="font-medium text-blue-700 dark:text-blue-300">Distributed:</span>
            <span className="text-blue-700 dark:text-blue-300">{formatLargeNumber(totalDistributed)} ({totalDistributed.toLocaleString()})</span>
          </div>
          
          {totalPending > 0 && (
            <div className="flex justify-between p-2 rounded bg-amber-50 dark:bg-amber-950">
              <span className="font-medium text-amber-700 dark:text-amber-300">Pending Distribution:</span>
              <span className="text-amber-700 dark:text-amber-300">{formatLargeNumber(totalPending)} ({totalPending.toLocaleString()})</span>
            </div>
          )}
          
          {totalUnallocated > 0 && (
            <div className="flex justify-between p-2 rounded bg-slate-100 dark:bg-slate-800">
              <span className="font-medium text-slate-700 dark:text-slate-300">Unallocated:</span>
              <span className="text-slate-700 dark:text-slate-300">{formatLargeNumber(totalUnallocated)} ({totalUnallocated.toLocaleString()})</span>
            </div>
          )}
          
          <div className="flex justify-between p-2 rounded bg-green-50 dark:bg-green-950">
            <span className="font-medium text-green-700 dark:text-green-300">Token Value:</span>
            <span className="text-green-700 dark:text-green-300">${(token?.tokenValue || 0).toFixed(2)}</span>
          </div>
        </div>
      )}
    </>
  );
};

export default TokenAllocationChart;