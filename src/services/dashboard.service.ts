import { MARKETS, PRODUCTS, getMockFacts, ALL_PERIODS, TIMEFRAME_PERIODS } from '../data/mock';
import type {
  DashboardFilters,
  DashboardData,
  KpiMetric,
  TrendDataPoint,
  BrandPerformance,
  MarketPerformance,
  FilterOptions,
} from '../types/dashboard.types';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function yoyPct(cy: number, py: number): number {
  return py === 0 ? 0 : ((cy - py) / py) * 100;
}

// ---------------------------------------------------------------------------
// Filter options — derived from dimension data
// ---------------------------------------------------------------------------
function buildFilterOptions(): FilterOptions {
  const countries = [...new Set(MARKETS.map(m => m.Country))].sort();
  const categories = [...new Set(PRODUCTS.map(p => p.Category))].sort();

  const brands: Record<string, string[]> = {};
  brands['ALL'] = [...new Set(PRODUCTS.map(p => p.Brand))].sort();
  for (const cat of categories) {
    brands[cat] = [...new Set(
      PRODUCTS.filter(p => p.Category === cat).map(p => p.Brand)
    )].sort();
  }

  return { countries, categories, brands, periods: ALL_PERIODS };
}

const CACHED_FILTER_OPTIONS = buildFilterOptions();

// ---------------------------------------------------------------------------
// Main aggregation
// ---------------------------------------------------------------------------
export const dashboardService = {
  getFilterOptions(): FilterOptions {
    return CACHED_FILTER_OPTIONS;
  },

  getDashboardData(filters: DashboardFilters): DashboardData {
    const facts = getMockFacts(filters.timeframe);
    const activePeriods = new Set(
      filters.periodMonth === 'ALL'
        ? TIMEFRAME_PERIODS[filters.timeframe] ?? ALL_PERIODS
        : [filters.periodMonth]
    );

    // Resolve dimension id sets from filters
    const marketIds = new Set(
      (filters.country === 'ALL'
        ? MARKETS
        : MARKETS.filter(m => m.Country === filters.country)
      ).map(m => m.MarketId)
    );

    let filteredProducts = PRODUCTS;
    if (filters.category !== 'ALL') {
      filteredProducts = filteredProducts.filter(p => p.Category === filters.category);
    }
    if (filters.brand !== 'ALL') {
      filteredProducts = filteredProducts.filter(p => p.Brand === filters.brand);
    }
    const productIds = new Set(filteredProducts.map(p => p.ProductId));

    // Apply all filters
    const active = facts.filter(f =>
      marketIds.has(f.MarketID) &&
      productIds.has(f.ProductID) &&
      activePeriods.has(f.PeriodMonth)
    );

    // -----------------------------------------------------------------------
    // KPIs — grand totals
    // -----------------------------------------------------------------------
    let cyVal = 0, pyVal = 0;
    let cyVol = 0, pyVol = 0;
    let cyUnit = 0, pyUnit = 0;
    let cyDollar = 0, pyDollar = 0;

    for (const f of active) {
      cyVal    += f.CurrentYearValueSales;
      pyVal    += f.PreviousYearValueSales;
      cyVol    += f.CurrentYearVolumeSales;
      pyVol    += f.PreviousYearVolumeSales;
      cyUnit   += f.CurrentYearUnitSales;
      pyUnit   += f.PreviousYearUnitSales;
      cyDollar += f.CurrentYearDollarSales;
      pyDollar += f.PreviousYearDollarSales;
    }

    const kpis: KpiMetric[] = [
      { id: 'value-sales',  label: 'Value Sales',   currentYear: cyVal,    previousYear: pyVal,    yoyChangePercent: yoyPct(cyVal,    pyVal),    unit: 'USD'   },
      { id: 'volume-sales', label: 'Volume Sales',  currentYear: cyVol,    previousYear: pyVol,    yoyChangePercent: yoyPct(cyVol,    pyVol),    unit: 'VOL'   },
      { id: 'unit-sales',   label: 'Unit Sales',    currentYear: cyUnit,   previousYear: pyUnit,   yoyChangePercent: yoyPct(cyUnit,   pyUnit),   unit: 'UNITS' },
      { id: 'dollar-sales', label: 'Dollar Sales',  currentYear: cyDollar, previousYear: pyDollar, yoyChangePercent: yoyPct(cyDollar, pyDollar), unit: 'USD'   },
    ];

    // -----------------------------------------------------------------------
    // Trend — group by month across all 12 periods (ignore period filter)
    // -----------------------------------------------------------------------
    const trendFacts = facts.filter(f =>
      marketIds.has(f.MarketID) && productIds.has(f.ProductID)
    );

    const trend: TrendDataPoint[] = ALL_PERIODS.map((period, idx) => {
      let cy = 0, py = 0;
      for (const f of trendFacts) {
        if (f.PeriodMonth === period) { cy += f.CurrentYearValueSales; py += f.PreviousYearValueSales; }
      }
      return { period: MONTH_LABELS[idx], currentYear: cy, previousYear: py };
    });

    // -----------------------------------------------------------------------
    // Brand breakdown
    // -----------------------------------------------------------------------
    const brandMap = new Map<string, { category: string; cy: number; py: number }>();
    for (const f of active) {
      const prod = PRODUCTS.find(p => p.ProductId === f.ProductID);
      if (!prod) continue;
      const row = brandMap.get(prod.Brand) ?? { category: prod.Category, cy: 0, py: 0 };
      row.cy += f.CurrentYearValueSales;
      row.py += f.PreviousYearValueSales;
      brandMap.set(prod.Brand, row);
    }
    const brandBreakdown: BrandPerformance[] = [...brandMap.entries()]
      .map(([brand, d]) => ({
        brand,
        category: d.category,
        currentYearSales: d.cy,
        previousYearSales: d.py,
        yoyChangePercent: yoyPct(d.cy, d.py),
      }))
      .sort((a, b) => b.currentYearSales - a.currentYearSales);

    // -----------------------------------------------------------------------
    // Market breakdown — group by country
    // -----------------------------------------------------------------------
    const countryMap = new Map<string, { cy: number; py: number }>();
    for (const f of active) {
      const mkt = MARKETS.find(m => m.MarketId === f.MarketID);
      if (!mkt) continue;
      const row = countryMap.get(mkt.Country) ?? { cy: 0, py: 0 };
      row.cy += f.CurrentYearValueSales;
      row.py += f.PreviousYearValueSales;
      countryMap.set(mkt.Country, row);
    }
    const marketBreakdown: MarketPerformance[] = [...countryMap.entries()]
      .map(([country, d]) => ({
        country,
        currentYearSales: d.cy,
        previousYearSales: d.py,
        yoyChangePercent: yoyPct(d.cy, d.py),
      }))
      .sort((a, b) => b.currentYearSales - a.currentYearSales);

    return { kpis, trend, brandBreakdown, marketBreakdown };
  },
};
