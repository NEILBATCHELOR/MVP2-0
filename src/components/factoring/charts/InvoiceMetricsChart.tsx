import React, { useMemo } from "react";
import { Invoice } from "../types";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";
import { formatDistance, format, parseISO, isValid, addDays, differenceInDays } from "date-fns";

interface InvoiceMetricsChartProps {
  invoices: Invoice[];
  title?: string;
  description?: string;
  metric?: "amount" | "age";
}

const InvoiceMetricsChart: React.FC<InvoiceMetricsChartProps> = ({
  invoices = [],
  title,
  description,
  metric = "amount",
}) => {
  // Define chart colors based on metric - using bright blue #2563eb
  const CHART_COLORS = {
    amount: {
      stroke: "#2563eb", // Bright blue
      fill: "rgba(37, 99, 235, 0.2)" // Bright blue with transparency
    },
    age: {
      stroke: "#2563eb", // Bright blue
      fill: "rgba(37, 99, 235, 0.2)" // Bright blue with transparency
    }
  };

  // Process invoice data for chart
  const chartData = useMemo(() => {
    if (!Array.isArray(invoices) || invoices.length === 0) {
      return [];
    }

    try {
      if (metric === "amount") {
        // Group invoices by date
        const grouped = invoices.reduce((acc, invoice) => {
          if (!invoice.invoiceDate) return acc;
          
          const date = invoice.invoiceDate;
          if (!acc[date]) {
            acc[date] = {
              date,
              totalAmount: 0,
              count: 0,
            };
          }
          acc[date].totalAmount += (invoice.netAmountDue || 0);
          acc[date].count += 1;
          return acc;
        }, {} as Record<string, { date: string; totalAmount: number; count: number }>);

        // Convert to array and sort by date
        return Object.values(grouped)
          .sort((a, b) => {
            try {
              return new Date(a.date).getTime() - new Date(b.date).getTime();
            } catch (err) {
              console.warn("Error sorting dates:", err);
              return 0;
            }
          })
          .map(item => ({
            date: format(new Date(item.date), "MMM d"),
            amount: item.totalAmount,
            count: item.count,
          }));
      } else {
        // Calculate age distribution of invoices
        const today = new Date();
        const ageGroups = {
          "0-30": { range: "0-30", count: 0, amount: 0 },
          "31-60": { range: "31-60", count: 0, amount: 0 },
          "61-90": { range: "61-90", count: 0, amount: 0 },
          "91-120": { range: "91-120", count: 0, amount: 0 },
          "120+": { range: "120+", count: 0, amount: 0 },
        };

        invoices.forEach(invoice => {
          try {
            if (!invoice.invoiceDate) return;
            
            const invoiceDate = parseISO(invoice.invoiceDate);
            if (!isValid(invoiceDate)) return;
            
            const age = differenceInDays(today, invoiceDate);
            let ageGroup = "";
            
            if (age <= 30) ageGroup = "0-30";
            else if (age <= 60) ageGroup = "31-60";
            else if (age <= 90) ageGroup = "61-90";
            else if (age <= 120) ageGroup = "91-120";
            else ageGroup = "120+";
            
            ageGroups[ageGroup].count += 1;
            ageGroups[ageGroup].amount += (invoice.netAmountDue || 0);
          } catch (err) {
            console.warn("Error processing invoice for age chart:", err);
          }
        });

        // Convert to array
        return Object.values(ageGroups);
      }
    } catch (error) {
      console.error("Error processing invoice data for chart:", error);
      return [];
    }
  }, [invoices, metric]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <div className="grid gap-1">
            <div className="flex flex-col">
              <span className="text-[0.70rem] uppercase text-muted-foreground">
                {metric === "amount" ? "Date" : "Age Range (days)"}
              </span>
              <span className="font-bold text-foreground">{label}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[0.70rem] uppercase text-muted-foreground">
                {metric === "amount" ? "Amount" : "Total Value"}
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
        <div className="flex h-[300px] items-center justify-center border rounded-lg border-dashed">
          <p className="text-muted-foreground">No invoice data available</p>
        </div>
      ) : (
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
              <defs>
                <linearGradient id={`colorGradient-${metric}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS[metric].stroke} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS[metric].stroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.2} />
              <XAxis 
                dataKey={metric === "amount" ? "date" : "range"} 
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tickFormatter={(value) => `$${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey={metric === "amount" ? "amount" : "amount"}
                stroke={CHART_COLORS[metric].stroke}
                fill={`url(#colorGradient-${metric})`}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </>
  );
};

export default InvoiceMetricsChart;