import React from 'react';
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { ChartCard } from '../../../components/common/ChartCard';
import type { TrendDataPoint } from '../../../types';

function fmtY(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
}

interface SalesTrendChartProps {
  data: TrendDataPoint[];
  timeframe: string;
}

const SalesTrendChart: React.FC<SalesTrendChartProps> = ({ data, timeframe }) => (
  <ChartCard title="Value Sales Trend" subtitle={`CY 2024 vs PY 2023 — ${timeframe}`}>
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis dataKey="period" tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={fmtY} tick={{ fontSize: 11 }} width={62} />
        <Tooltip formatter={(v: number) => [fmtY(v), '']} />
        <Legend />
        <Line
          type="monotone"
          dataKey="currentYear"
          name="CY 2024"
          stroke="#0078d4"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="previousYear"
          name="PY 2023"
          stroke="#a0a0a0"
          strokeWidth={1.5}
          strokeDasharray="5 4"
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  </ChartCard>
);

export { SalesTrendChart };
