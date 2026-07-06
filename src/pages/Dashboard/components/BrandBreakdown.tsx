import React from 'react';
import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts';
import { ChartCard } from '../../../components/common/ChartCard';
import type { BrandPerformance } from '../../../types';

const BAR_COLORS = ['#0078d4', '#0062ad', '#004d87', '#003a66', '#002747',
                    '#1a8bde', '#339fea', '#4db3f5', '#66c4f7', '#80d4f8'];

function fmtX(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  return `$${(v / 1_000).toFixed(0)}K`;
}

interface BrandBreakdownProps {
  data: BrandPerformance[];
}

const BrandBreakdown: React.FC<BrandBreakdownProps> = ({ data }) => {
  const top = data.slice(0, 10);

  return (
    <ChartCard title="Top Brands" subtitle="Value Sales — Current Year">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={top}
          layout="vertical"
          margin={{ top: 4, right: 56, left: 8, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e0e0e0" />
          <XAxis type="number" tickFormatter={fmtX} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="brand" tick={{ fontSize: 12 }} width={88} />
          <Tooltip
            formatter={(v) => [
              fmtX(Number(v)),
              '',
            ]}
          />
          <Bar dataKey="currentYearSales" name="CY Sales" radius={[0, 4, 4, 0]}>
            {top.map((_, i) => (
              <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

export { BrandBreakdown };
