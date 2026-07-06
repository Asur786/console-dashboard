import type { KpiFilters, KpiResult, PerformanceSummary } from '../types/kpi.types';

/* ------------------------------------------------------------------ */
/*  Backend API response types (snake_case from FastAPI/Pydantic)       */
/* ------------------------------------------------------------------ */
interface ApiKpiResult {
  id: string;
  label: string;
  value: string;
  numeric_value: number;
  previous_year_value: number;
  yoy_change_percent: number;
  sublabel: string;
  value_color: 'default' | 'green' | 'red';
}

interface ApiKpisResponse {
  kpis: ApiKpiResult[];
  last_updated: string;
}

/* ------------------------------------------------------------------ */
/*  snake_case → camelCase mapper                                      */
/* ------------------------------------------------------------------ */
function mapKpi(raw: ApiKpiResult): KpiResult {
  return {
    id: raw.id,
    label: raw.label,
    value: raw.value,
    numericValue: raw.numeric_value,
    previousYearValue: raw.previous_year_value,
    yoyChangePercent: raw.yoy_change_percent,
    sublabel: raw.sublabel,
    valueColor: raw.value_color,
  };
}

/* ------------------------------------------------------------------ */
/*  Query-string builder                                               */
/* ------------------------------------------------------------------ */
function buildQueryString(filters: KpiFilters): string {
  const params = new URLSearchParams();
  if (filters.channel  !== 'ALL') params.set('channel',  filters.channel);
  if (filters.category !== 'ALL') params.set('category', filters.category);
  if (filters.retailer !== 'ALL') params.set('retailer', filters.retailer);
  if (filters.country  !== 'ALL') params.set('country',  filters.country);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

/* ------------------------------------------------------------------ */
/*  KPIService — calls FastAPI backend at GET /api/kpis                */
/* ------------------------------------------------------------------ */
export const kpiService = {
  async getPerformanceSummary(filters: KpiFilters): Promise<PerformanceSummary> {
    const url = `/api/kpis${buildQueryString(filters)}`;
    const response = await fetch(url);

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(
        `KPI request failed (${response.status}): ${text || response.statusText}`
      );
    }

    const data: ApiKpisResponse = await response.json();
    return {
      kpis: data.kpis.map(mapKpi),
      lastUpdated: data.last_updated,
    };
  },
};

/* ------------------------------------------------------------------ */
/*  Backend API response types (snake_case from FastAPI/Pydantic)       */
/* ------------------------------------------------------------------ */
interface ApiKpiResult {
  id: string;
  label: string;
  value: string;
  numeric_value: number;
  previous_year_value: number;
  yoy_change_percent: number;
  sublabel: string;
  value_color: 'default' | 'green' | 'red';
}

interface ApiKpisResponse {
  kpis: ApiKpiResult[];
  last_updated: string;
}

/* ------------------------------------------------------------------ */
/*  snake_case → camelCase mapper                                      */
/* ------------------------------------------------------------------ */
function mapKpi(raw: ApiKpiResult): KpiResult {
  return {
    id: raw.id,
    label: raw.label,
    value: raw.value,
    numericValue: raw.numeric_value,
    previousYearValue: raw.previous_year_value,
    yoyChangePercent: raw.yoy_change_percent,
    sublabel: raw.sublabel,
    valueColor: raw.value_color,
  };
}

/* ------------------------------------------------------------------ */
/*  Query-string builder                                               */
/* ------------------------------------------------------------------ */
function buildQueryString(filters: KpiFilters): string {
  const params = new URLSearchParams();
  if (filters.channel !== 'ALL') params.set('channel', filters.channel);
  if (filters.category !== 'ALL') params.set('category', filters.category);
  if (filters.retailer !== 'ALL') params.set('retailer', filters.retailer);
  if (filters.country !== 'ALL') params.set('country', filters.country);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

/* ------------------------------------------------------------------ */
/*  KPIService                                                         */
/* ------------------------------------------------------------------ */
/**
 * Calls the FastAPI backend at GET /api/kpis.
 *
 * The Vite dev proxy forwards /api/* → http://localhost:8000.
 * In production (Databricks Apps) the backend is co-located,
 * so /api/kpis resolves directly.
 */
export const kpiService = {
  async getPerformanceSummary(filters: KpiFilters): Promise<PerformanceSummary> {
    const url = `/api/kpis${buildQueryString(filters)}`;

    const response = await fetch(url);

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(
        `KPI request failed (${response.status}): ${text || response.statusText}`
      );
    }

    const data: ApiKpisResponse = await response.json();

    return {
      kpis: data.kpis.map(mapKpi),
      lastUpdated: data.last_updated,
    };
  },
};
