import React, { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { FactoringToken } from "../types";

interface TokenDistributionChartProps {
  tokens: FactoringToken[];
}

const TokenDistributionChart: React.FC<TokenDistributionChartProps> = ({ tokens }) => {
  // Updated to use oklch chart palette
const COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--primary)',
  'var(--secondary)',
  'var(--accent)',
  'var(--muted)',
  'var(--destructive)'
];

  const chartData = useMemo(() => {
    const totalValue = tokens.reduce((sum, token) => sum + (token.tokenValue || 0), 0);
    
    return tokens
      .filter(token => token.tokenValue && token.tokenValue > 0)
      .map(token => ({
        name: token.tokenName || token.id?.slice(0, 8) || "Unknown Token",
        value: token.tokenValue || 0,
        percentage: totalValue ? ((token.tokenValue || 0) / totalValue * 100).toFixed(1) : "0"
      }));
  }, [tokens]);

  // Custom tooltip to show formatted values
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-md p-2 shadow-sm">
          <p className="font-medium">{`${payload[0].name}`}</p>
          <p className="text-sm">{`Value: $${payload[0].value.toLocaleString()}`}</p>
          <p className="text-sm">{`Percentage: ${payload[0].payload.percentage}%`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Token Distribution</CardTitle>
        <CardDescription>
          Value distribution across tokens
        </CardDescription>
      </CardHeader>
      <CardContent>
        {tokens.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center">
            <p className="text-muted-foreground">No token data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percentage }) => `${name}: ${percentage}%`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} /> // uses oklch palette
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend layout="vertical" align="right" verticalAlign="middle" />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default TokenDistributionChart;