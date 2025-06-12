import React, { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

// Simple date formatter utility
const formatDate = (date: Date, includeTime: boolean = false): string => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {})
  };
  return date.toLocaleDateString(undefined, options);
};

interface TVLDataPoint {
  timestamp: string;
  value: number;
}

interface TVLChartProps {
  tvlData: TVLDataPoint[];
  title?: string;
  description?: string;
}

const TVLChart: React.FC<TVLChartProps> = ({ 
  tvlData, 
  title = "Total Value Locked", 
  description = "Historical TVL over time" 
}) => {
  const chartData = useMemo(() => {
    return tvlData.map(dataPoint => ({
      date: formatDate(new Date(dataPoint.timestamp)),
      value: dataPoint.value,
      timestamp: dataPoint.timestamp
    }));
  }, [tvlData]);

  // Custom tooltip to show formatted values
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const date = new Date(payload[0].payload.timestamp);
      return (
        <div className="bg-card border rounded-[var(--radius)] p-2 shadow-sm"> // palette and radius
          <p className="font-medium">{formatDate(date, true)}</p>
          <p className="text-sm">{`TVL: $${payload[0].value.toLocaleString()}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {tvlData.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center">
            <p className="text-muted-foreground">No TVL data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={chartData}
              margin={{
                top: 10,
                right: 30,
                left: 0,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="date"
                tickMargin={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tickFormatter={(value) => `$${value.toLocaleString()}`}
                tickMargin={10}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="var(--chart-1)"
                fill="color-mix(in oklab, var(--chart-1) 20%, transparent)"
                fillOpacity={1} // palette
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default TVLChart;