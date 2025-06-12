import React from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface DataPoint {
  name: string;
  value: number;
  color?: string;
}

interface CompliancePieChartProps {
  title: string;
  description?: string;
  data: DataPoint[];
  colors?: string[];
  footer?: React.ReactNode;
  innerRadius?: number;
  outerRadius?: number;
  showLegend?: boolean;
}

// Default colors that match the shadcn blue theme
const defaultColors = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'];

export const CompliancePieChart: React.FC<CompliancePieChartProps> = ({
  title,
  description,
  data,
  colors = defaultColors,
  footer,
  innerRadius = 0,
  outerRadius = 100,
  showLegend = true
}) => {
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
    if (percent < 0.05) return null; // Don't show labels for small slices
    
    const RADIAN = Math.PI / 180;
    const radius = 25 + innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        style={{ fontSize: '12px', fontWeight: 'bold' }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card className="border-blue-100">
      <CardHeader>
        <CardTitle className="text-blue-900">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                paddingAngle={2}
                dataKey="value"
                animationDuration={1500}
                stroke="#f8fafc"
                strokeWidth={2}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color || colors[index % colors.length]} 
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [value, name]}
                contentStyle={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #bfdbfe',
                  borderRadius: '6px',
                  boxShadow: '0 2px 8px rgba(59, 130, 246, 0.1)',
                  padding: '8px 12px',
                  fontSize: '12px',
                  color: '#333'
                }}
              />
              {showLegend && (
                <Legend 
                  layout="horizontal" 
                  verticalAlign="bottom" 
                  align="center"
                  wrapperStyle={{ fontSize: '12px', marginTop: '10px' }}
                  iconSize={10}
                  formatter={(value) => <span style={{ color: '#3b82f6' }}>{value}</span>}
                />
              )}
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  );
};

export default CompliancePieChart;