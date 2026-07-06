import React from 'react';
import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { ChartCard } from '../../../components/common/ChartCard';
import type { MarketPerformance } from '../../../types';

function fmtY(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  return `$${(v / 1_000).toFixed(0)}K`;
}

interface MarketBreakdownProps {
  data: MarketPerformance[];
}

// Shorten long country names to fit the axis
function shortName(country: string): string {
  const map: Record<string, string> = {
    'United States': 'USA',
    'United Kingdom': 'UK',
  };
  return map[country] ?? country;
}

const MarketBreakdown: React.FC<MarketBreakdownProps> = ({ data }) => {
  const chartData = data.map(d => ({ ...d, country: shortName(d.country) }));

  return (
    <ChartCard title="Sales by Country" subtitle="Value Sales — CY 2024 vs PY 2023">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis dataKey="country" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={fmtY} tick={{ fontSize: 11 }} width={62} />
          <Tooltip formatter={(v) => [fmtY(Number(v)), '']} />
          <Legend />
          <Bar dataKey="currentYearSales" name="CY 2024" fill="#0078d4" radius={[4, 4, 0, 0]} />
          <Bar dataKey="previousYearSales" name="PY 2023" fill="#c7e0f4" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

export { MarketBreakdown };
