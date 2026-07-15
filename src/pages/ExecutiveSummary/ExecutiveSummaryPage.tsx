import React, { useState, useCallback, useEffect } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { makeStyles, tokens } from "@fluentui/react-components";
import {
  DashboardHeader,
  FilterBar,
  FilterDropdown,
  KPIGrid,
  KPICard,
  ErrorBanner,
  InsightSummary,
} from "../../components";
import { useFilters } from "../../hooks/useFilters";
import { kpiService } from "../../services/kpi.service";
import { insightService } from "../../services/insight.service";
import { ROUTES } from "../../constants/routes";
import type { ExecFilters } from "../../types/executive.types";
import type { DashboardFilterOptions } from "../../types/filter.types";
import type { KpiResult } from "../../types/kpi.types";
import type { InsightResponse } from "../../types/insight.types";
import type {
  DashboardViewConfig,
  FilterKey,
  KpiKey,
} from "../../types/preference.types";

/* ------------------------------------------------------------------ */
/*  Styles — page-level layout only                                   */
/* ------------------------------------------------------------------ */
const useStyles = makeStyles({
  page: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    maxWidth: "1400px",
  },
  divider: {
    height: "1px",
    backgroundColor: tokens.colorNeutralStroke2,
  },
  viewCaption: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
});

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */
const DEFAULT_FILTERS: ExecFilters = {
  channel: "ALL",
  category: "ALL",
  retailer: "ALL",
  country: "ALL",
};

function activeCount(f: ExecFilters): number {
  return Object.values(f).filter((v) => v !== "ALL").length;
}

function formatTimestamp(): string {
  const now = new Date();
  const date = now.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const time = now
    .toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .toUpperCase();
  return `${date}, ${time}`;
}

/* ------------------------------------------------------------------ */
/*  Filter config — maps ExecFilters keys to DashboardFilterOptions   */
/* ------------------------------------------------------------------ */
const FILTER_DEFS: {
  key: keyof ExecFilters;
  label: string;
  optionsKey: keyof DashboardFilterOptions;
}[] = [
  { key: "channel", label: "Channel", optionsKey: "channels" },
  { key: "category", label: "Category", optionsKey: "categories" },
  { key: "retailer", label: "Retailer", optionsKey: "retailers" },
  { key: "country", label: "Country", optionsKey: "countries" },
];

/* ------------------------------------------------------------------ */
/*  Saved View integration helpers                                    */
/* ------------------------------------------------------------------ */

/**
 * Normalise a KPI display label to its preference key form.
 * "Dollar Sales" → "dollar_sales", "YoY Growth" → "yoy_growth".
 * Lets us match KpiResult.label against SavedView.visibleKpis (KpiKey[]).
 */
function kpiLabelToKey(label: string): string {
  return label.toLowerCase().replace(/\s+/g, "_");
}

/* ------------------------------------------------------------------ */
/*  Page component — composition only                                 */
/* ------------------------------------------------------------------ */
const ExecutiveSummaryPage: React.FC = () => {
  const styles = useStyles();

  // The selected view configuration is passed via router navigation state by
  // the User Preference page ("Save & Continue" / "Open Dashboard"). It tells
  // the dashboard which filters and KPI cards to render.
  const location = useLocation();
  const viewConfig = (location.state as DashboardViewConfig | null) ?? null;

  // Filter options loaded from FilterService (schema-driven)
  const { filterOptions, filterOptionsLoading } = useFilters();

  const [filters, setFilters] = useState<ExecFilters>(DEFAULT_FILTERS);
  const [kpis, setKpis] = useState<KpiResult[]>([]);
  const [kpiLoading, setKpiLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(formatTimestamp());
  const [error, setError] = useState<string | null>(null);

  // Insight state — managed here, passed to InsightSummary as props
  const [insight, setInsight] = useState<InsightResponse | null>(null);
  const [insightLoading, setInsightLoading] = useState(true);
  const [insightError, setInsightError] = useState<string | null>(null);

  // ── Visibility from the selected saved view ───────────────────────
  // Render ONLY the filters/KPIs contained in the selected view.
  const visibleFilters: FilterKey[] | null = viewConfig?.visibleFilters ?? null;
  const visibleKpis: KpiKey[] | null = viewConfig?.visibleKpis ?? null;

  /**
   * Fetch KPIs then immediately auto-generate AI insights with those values.
   * Sequential: insights depend on KPI values so they run after KPIs succeed.
   * Phase 1 (KPIs) sets its own loading/error; Phase 2 (insights) is independent.
   */
  const fetchAll = useCallback(async (f: ExecFilters) => {
    // ── Phase 1: KPIs ──────────────────────────────────────────────
    setKpiLoading(true);
    setError(null);

    let fetchedKpis: KpiResult[] = [];

    try {
      const result = await kpiService.getPerformanceSummary(f);
      fetchedKpis = result.kpis;
      setKpis(result.kpis);
      setLastUpdated(formatTimestamp());
    } catch (err: unknown) {
      const isTimeout =
        err instanceof DOMException && err.name === "TimeoutError";
      if (isTimeout) {
        try {
          const result = await kpiService.getPerformanceSummary(f);
          fetchedKpis = result.kpis;
          setKpis(result.kpis);
          setLastUpdated(formatTimestamp());
        } catch (retryErr: unknown) {
          const msg =
            retryErr instanceof Error
              ? retryErr.message
              : "Failed to load KPIs.";
          setError(msg);
        }
      } else {
        const msg = err instanceof Error ? err.message : "Failed to load KPIs.";
        setError(msg);
      }
    } finally {
      setKpiLoading(false); // KPI cards rendered — move on to insights
    }

    // ── Phase 2: AI Insights (auto, using fresh KPI values) ────────
    setInsightLoading(true);
    setInsightError(null);

    if (fetchedKpis.length === 0) {
      // No KPIs to work with — skip insight call
      setInsightLoading(false);
      return;
    }

    try {
      const result = await insightService.generateInsight(f, fetchedKpis);
      setInsight(result);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to generate insights.";
      setInsightError(msg);
    } finally {
      setInsightLoading(false);
    }
  }, []);

  // Auto-load KPIs + insights on mount
  useEffect(() => {
    if (!viewConfig) return; // no view selected — will redirect
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAll(DEFAULT_FILTERS);
  }, [fetchAll, viewConfig]);

  const handleFilterChange = useCallback(
    (key: keyof ExecFilters, value: string) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleApply = useCallback(() => {
    fetchAll(filters);
  }, [filters, fetchAll]);

  const handleReset = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    fetchAll(DEFAULT_FILTERS);
  }, [fetchAll]);

  const handleDismissError = useCallback(() => setError(null), []);
  const handleRetry = useCallback(() => fetchAll(filters), [filters, fetchAll]);

  // ── Derived visibility (based on the selected saved view) ─────────
  // Render only the keys listed in the view. (null only occurs when there is
  // no view config, in which case we redirect below before rendering.)
  const shownFilterDefs = visibleFilters
    ? FILTER_DEFS.filter((def) => visibleFilters.includes(def.key as FilterKey))
    : FILTER_DEFS;

  const shownKpis = visibleKpis
    ? kpis.filter((kpi) =>
        visibleKpis.includes(kpiLabelToKey(kpi.label) as KpiKey),
      )
    : kpis;

  // The dashboard is only reachable via "Save & Continue" or "Open Dashboard".
  // On direct access / refresh there is no view config — send the user back to
  // the landing page to choose a view.
  if (!viewConfig) {
    return <Navigate to={ROUTES.PREFERENCES} replace />;
  }

  return (
    <div className={styles.page}>
      {/* Page header */}
      <DashboardHeader title="Executive Summary" timestamp={lastUpdated} />

      {viewConfig.viewName && (
        <span className={styles.viewCaption}>
          Viewing saved view: {viewConfig.viewName}
        </span>
      )}

      {/* Filter bar — options sourced from FilterService */}
      <FilterBar
        activeCount={activeCount(filters)}
        loading={kpiLoading}
        onApply={handleApply}
        onReset={handleReset}
      >
        {shownFilterDefs.map(({ key, label, optionsKey }) => (
          <FilterDropdown
            key={key}
            label={label}
            value={filters[key]}
            options={filterOptionsLoading ? [] : filterOptions[optionsKey]}
            onChange={(v) => handleFilterChange(key, v)}
          />
        ))}
      </FilterBar>

      {/* Error banner — shown on API failure, dismissible with retry */}
      {error && (
        <ErrorBanner
          title="Failed to load KPIs"
          message={error}
          onDismiss={handleDismissError}
          onRetry={handleRetry}
        />
      )}

      <div className={styles.divider} />

      {/* KPI cards — filtered by the selected saved view (all when none) */}
      <KPIGrid
        title="Performance Highlights"
        loading={kpiLoading}
        skeletonCount={5}
      >
        {shownKpis.map((kpi) => (
          <KPICard
            key={kpi.id}
            label={kpi.label}
            value={kpi.value}
            sublabel={kpi.sublabel}
            valueColor={kpi.valueColor}
          />
        ))}
      </KPIGrid>

      {/* AI Insight Summary — auto-loaded; pure presentational */}
      <InsightSummary
        loading={insightLoading}
        insight={insight}
        error={insightError}
      />
    </div>
  );
};

export default ExecutiveSummaryPage;
