import type { Timeframe } from './schema.types';

export interface DashboardFilters {
  country: string;       // 'ALL' or country name
  category: string;      // 'ALL' or category name
  brand: string;         // 'ALL' or brand name
  timeframe: Timeframe;
  periodMonth: string;   // 'ALL' or 'YYYY-MM'
}

export interface KpiMetric {
  id: string;
  label: string;
  currentYear: number;
  previousYear: number;
  yoyChangePercent: number;
  unit: 'USD' | 'VOL' | 'UNITS';
}

export interface TrendDataPoint {
  period: string;        // 'Jan', 'Feb', …
  currentYear: number;
  previousYear: number;
}

export interface BrandPerformance {
  brand: string;
  category: string;
  currentYearSales: number;
  previousYearSales: number;
  yoyChangePercent: number;
}

export interface MarketPerformance {
  country: string;
  currentYearSales: number;
  previousYearSales: number;
  yoyChangePercent: number;
}

export interface FilterOptions {
  countries: string[];
  categories: string[];
  brands: Record<string, string[]>;  // 'ALL' | category → brand list
  periods: string[];
}

export interface DashboardData {
  kpis: KpiMetric[];
  trend: TrendDataPoint[];
  brandBreakdown: BrandPerformance[];
  marketBreakdown: MarketPerformance[];
}
