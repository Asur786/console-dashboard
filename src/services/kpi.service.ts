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
  for (const [key, value] of Object.entries(filters)) {
    if (value && value !== 'ALL') params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

/* ------------------------------------------------------------------ */
/*  KPIService — calls FastAPI backend at GET /api/kpis                */
/* ------------------------------------------------------------------ */
export const kpiService = {
  async getPerformanceSummary(filters: KpiFilters): Promise<PerformanceSummary> {
    const url = `/api/kpis${buildQueryString(filters)}`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(60_000), // 60s — allows SQL Warehouse cold-start (typically 30-50s)
    });

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
