import React, { useMemo } from "react";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, TooltipProps } from "recharts";
import type { Pool } from "../types";

interface PoolValueChartProps {
  pools: Pool[];
}

// Use explicit blue colors based on #2563eb (bright blue)
const POOL_COLORS = [
  "#2563eb", // Primary bright blue
  "#3b82f6", // Slightly lighter blue
  "#60a5fa", // Medium light blue
  "#93c5fd", // Lighter blue
  "#bfdbfe", // Very light blue 
  "#dbeafe", // Almost white blue
];

const PoolValueChart: React.FC<PoolValueChartProps> = ({ pools = [] }) => {
  const chartData = useMemo(() => {
    if (!Array.isArray(pools)) return [];
    try {
      return [...pools]
        .sort((a, b) => ((b.totalValue || 0) - (a.totalValue || 0)))
        .slice(0, 8) // Limit to top 8 pools for better visualization
        .map(pool => ({
          name: pool.poolName || "Unnamed Pool",
          value: pool.totalValue || 0,
          count: pool.invoiceCount || 0,
        }));
    } catch {
      return [];
    }
  }, [pools]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <div className="grid gap-1">
            <div className="flex flex-col">
              <span className="text-[0.70rem] uppercase text-muted-foreground">
                Pool
              </span>
              <span className="font-bold text-foreground">{label}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[0.70rem] uppercase text-muted-foreground">
                Value
              </span>
              <span className="font-bold text-foreground">
                ${payload[0].value?.toLocaleString()}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[0.70rem] uppercase text-muted-foreground">
                Invoices
              </span>
              <span className="font-bold text-foreground">
                {payload[0].payload.count}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      {!chartData || chartData.length === 0 ? (
        <div className="flex h-full items-center justify-center border rounded-lg border-dashed bg-white">
          <p className="text-muted-foreground">No pool data available</p>
        </div>
      ) : (
        <div className="h-full w-full bg-white rounded-lg">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.2} />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={60}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={(value) => `$${(value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value)}`}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0, 0, 0, 0.1)" }} />
              <Bar
                dataKey="value"
                radius={[4, 4, 0, 0]}
                barSize={24}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={POOL_COLORS[index % POOL_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </>
  );
};

export default PoolValueChart;
