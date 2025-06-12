import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps
} from 'recharts';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface DataPoint {
  name: string;
  issuer?: number;
  investor?: number;
  [key: string]: any;
}

interface ComplianceBarChartProps {
  title: string;
  description?: string;
  data: DataPoint[];
  dataKeys: string[];
  colors?: string[];
  footer?: React.ReactNode;
}

// Default colors that match the shadcn blue theme
const defaultColors = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'];

export const ComplianceBarChart: React.FC<ComplianceBarChartProps> = ({
  title,
  description,
  data,
  dataKeys,
  colors = defaultColors,
  footer
}) => {
  return (
    <Card className="border-blue-100">
      <CardHeader>
        <CardTitle className="text-blue-900">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tickMargin={10}
                fontSize={12}
                stroke="#888888"
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tickMargin={10}
                fontSize={12}
                stroke="#888888"
              />
              <Tooltip
                cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
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
              <Legend 
                verticalAlign="bottom" 
                wrapperStyle={{ fontSize: '12px', marginTop: '10px' }} 
                iconSize={10}
                formatter={(value) => <span style={{ color: '#3b82f6' }}>{value}</span>}
              />
              {dataKeys.map((key, index) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={colors[index % colors.length]}
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                  animationDuration={1500}
                />
              ))}
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  );
};

export default ComplianceBarChart;