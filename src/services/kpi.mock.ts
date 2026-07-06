import type { KpiFilters, KpiResult } from '../types/kpi.types';

/**
 * Mock KPI data keyed by filter signature.
 *
 * In production this is replaced by a Databricks SQL query that aggregates
 * fact tables (lfqfact, r12mfact, etc.) joined with marketdimension and
 * productdimension on the filter predicates.
 */

/* ------------------------------------------------------------------ */
/*  Simple deterministic hash — vary output by filter values           */
/* ------------------------------------------------------------------ */
function hashFilters(f: KpiFilters): number {
  const str = `${f.channel}|${f.category}|${f.retailer}|${f.country}`;
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/* ------------------------------------------------------------------ */
/*  Formatters                                                         */
/* ------------------------------------------------------------------ */
function fmtDollar(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function fmtPct(n: number): string {
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(1)}%`;
}

function fmtVolume(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)}M`;
  return `${(n / 1e3).toFixed(0)}K`;
}

function color(pct: number): KpiResult['valueColor'] {
  if (pct > 0) return 'green';
  if (pct < 0) return 'red';
  return 'default';
}

/* ------------------------------------------------------------------ */
/*  Base values — represent "ALL filters" aggregation                  */
/* ------------------------------------------------------------------ */
const BASE = {
  dollarSalesCY: 4_830_000_000,
  dollarSalesPY: 4_680_000_000,
  dollarShareCY: 51.2,
  dollarSharePY: 50.9,
  volumeShareCY: 4_710_000_000,
  volumeSharePY: 4_600_000_000,
  distributionCY: 88.3,
  distributionPY: 86.1,
};

/* ------------------------------------------------------------------ */
/*  Build KPIs from base values + filter-specific variation            */
/* ------------------------------------------------------------------ */
export function buildMockKpis(filters: KpiFilters): KpiResult[] {
  const h   = hashFilters(filters);
  const all = Object.values(filters).every(v => v === 'ALL');

  // Apply a deterministic scale when filters narrow the data set
  const scale    = all ? 1 : 0.15 + ((h % 70) / 100);          // 0.15 – 0.85
  const drift    = ((h % 40) - 20) / 100;                       // -0.20 – +0.20

  const dsCY     = Math.round(BASE.dollarSalesCY * scale);
  const dsPY     = Math.round(BASE.dollarSalesPY * scale);
  const dsYoy    = ((dsCY - dsPY) / dsPY) * 100;

  const dshCY    = +(BASE.dollarShareCY + drift * 10).toFixed(1);
  const dshPY    = +(BASE.dollarSharePY + drift * 8).toFixed(1);
  const dshYoy   = dshCY - dshPY; // share pts change

  const vsCY     = Math.round(BASE.volumeShareCY * scale);
  const vsPY     = Math.round(BASE.volumeSharePY * scale);
  const vsYoy    = ((vsCY - vsPY) / vsPY) * 100;

  const distCY   = +(BASE.distributionCY + drift * 5).toFixed(1);
  const distPY   = +(BASE.distributionPY + drift * 4).toFixed(1);
  const distYoy  = distCY - distPY;

  const yoyCY    = +dsYoy.toFixed(1);

  return [
    {
      id: 'dollar-sales',
      label: 'Dollar Sales',
      value: fmtDollar(dsCY),
      numericValue: dsCY,
      previousYearValue: dsPY,
      yoyChangePercent: +dsYoy.toFixed(1),
      sublabel: 'GTM',
      valueColor: color(dsYoy),
    },
    {
      id: 'dollar-share',
      label: 'Dollar Share',
      value: `${dshCY}%`,
      numericValue: dshCY,
      previousYearValue: dshPY,
      yoyChangePercent: +dshYoy.toFixed(1),
      sublabel: 'GTM',
      valueColor: color(dshYoy),
    },
    {
      id: 'volume-share',
      label: 'Volume Share',
      value: fmtVolume(vsCY),
      numericValue: vsCY,
      previousYearValue: vsPY,
      yoyChangePercent: +vsYoy.toFixed(1),
      sublabel: 'GTM',
      valueColor: 'default',
    },
    {
      id: 'distribution',
      label: 'Distribution',
      value: `${distCY}%`,
      numericValue: distCY,
      previousYearValue: distPY,
      yoyChangePercent: +distYoy.toFixed(1),
      sublabel: 'GTM',
      valueColor: 'default',
    },
    {
      id: 'yoy-growth',
      label: 'YoY Growth',
      value: fmtPct(yoyCY),
      numericValue: yoyCY,
      previousYearValue: 0,
      yoyChangePercent: yoyCY,
      sublabel: 'GTM',
      valueColor: color(yoyCY),
    },
  ];
}
