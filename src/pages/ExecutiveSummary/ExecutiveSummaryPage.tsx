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
import { preferenceService } from "../../services/preference.service";
import { enterpriseService } from "../../services/enterprise.service";
import { ROUTES } from "../../constants/routes";
import type { ExecFilters } from "../../types/executive.types";
import type { SavedView } from "../../types/preference.types";
import type { KpiResult } from "../../types/kpi.types";
import type { InsightResponse } from "../../types/insight.types";
import type { DashboardViewConfig } from "../../types/preference.types";

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
  viewChips: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    alignItems: "center",
  },
  viewChip: {
    border: `1.5px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    borderRadius: "16px",
    padding: "6px 14px",
    fontSize: "12.5px",
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "all 0.15s",
    ":hover": {
      borderTopColor: tokens.colorBrandStroke1,
      borderRightColor: tokens.colorBrandStroke1,
      borderBottomColor: tokens.colorBrandStroke1,
      borderLeftColor: tokens.colorBrandStroke1,
    },
  },
  viewChipActive: {
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    borderTopColor: tokens.colorBrandBackground,
    borderRightColor: tokens.colorBrandBackground,
    borderBottomColor: tokens.colorBrandBackground,
    borderLeftColor: tokens.colorBrandBackground,
  },
  viewChipStatic: {
    color: tokens.colorNeutralForeground3,
    borderRadius: "16px",
    padding: "6px 14px",
    fontSize: "12.5px",
    fontWeight: 700,
    whiteSpace: "nowrap",
    userSelect: "none",
  },
});

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */
// Empty = every dimension at "ALL" (no filter). Filters are keyed by the
// config-driven dimension keys loaded at runtime.
const DEFAULT_FILTERS: ExecFilters = {};

function activeCount(f: ExecFilters): number {
  return Object.values(f).filter((v) => v && v !== "ALL").length;
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
/*  Saved View integration helpers                                    */
/* ------------------------------------------------------------------ */

/**
 * Normalise a KPI display label to its preference key form.
 * "Dollar Sales" → "dollar_sales", "YoY Growth" → "yoy_growth".
 * Lets us match KpiResult.label against SavedView.visibleKpis.
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

  // Filter dimensions loaded from FilterService (config-driven schema)
  const { dimensions, filterOptionsLoading } = useFilters();

  const [filters, setFilters] = useState<ExecFilters>(DEFAULT_FILTERS);
  const [kpis, setKpis] = useState<KpiResult[]>([]);
  const [kpiLoading, setKpiLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(formatTimestamp());
  const [error, setError] = useState<string | null>(null);

  // Insight state — managed here, passed to InsightSummary as props
  const [insight, setInsight] = useState<InsightResponse | null>(null);
  const [insightLoading, setInsightLoading] = useState(true);
  const [insightError, setInsightError] = useState<string | null>(null);

  // All of the user's saved views (for the in-page view switcher / demo).
  const [allViews, setAllViews] = useState<SavedView[]>([]);
  // The view currently applied on the page. Starts from the nav config;
  // a viewId of "__ALL__" means "show everything" (All Views).
  const [activeConfig, setActiveConfig] = useState<DashboardViewConfig | null>(
    viewConfig,
  );

  useEffect(() => {
    preferenceService
      .listViews()
      .then(setAllViews)
      .catch(() => setAllViews([]));
  }, []);

  // ── Visibility from the selected saved view ───────────────────────
  // Render ONLY the filters/KPIs contained in the selected view.
  // "__ALL__" shows everything (no filtering).
  const showingAll = activeConfig?.viewId === "__ALL__";
  const visibleFilters: string[] | null = showingAll
    ? null
    : (activeConfig?.visibleFilters ?? null);
  const visibleKpis: string[] | null = showingAll
    ? null
    : (activeConfig?.visibleKpis ?? null);

  // The data source the active view was created from. Non-default sources
  // (e.g. democatalog) render their own live KPIs instead of the workspace
  // fact-table KPIs.
  const activeSourceId = activeConfig?.sourceId ?? "databricks-default";
  const isDefaultSource = activeSourceId === "databricks-default";

  /**
   * Fetch KPIs then immediately auto-generate AI insights with those values.
   * Sequential: insights depend on KPI values so they run after KPIs succeed.
   * Phase 1 (KPIs) sets its own loading/error; Phase 2 (insights) is independent.
   *
   * For non-default sources, KPIs come live from that source's adapter and the
   * workspace-specific AI insights step is skipped.
   */
  const fetchAll = useCallback(async (f: ExecFilters, sourceId: string) => {
    setKpiLoading(true);
    setError(null);

    // ── Non-default source: live KPIs from the source adapter ──────
    if (sourceId !== "databricks-default") {
      try {
        const res = await enterpriseService.getSourceKpis(sourceId);
        setKpis(
          res.kpis.map((k) => ({
            id: k.name,
            label: k.name,
            value: k.value,
            numericValue: Number.parseFloat(k.value) || 0,
            previousYearValue: 0,
            yoyChangePercent: 0,
            sublabel: sourceId,
            valueColor: "default" as const,
          })),
        );
        setLastUpdated(formatTimestamp());
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load KPIs.");
      } finally {
        setKpiLoading(false);
      }
      // Workspace AI insights don't apply to other sources.
      setInsight(null);
      setInsightLoading(false);
      setInsightError(null);
      return;
    }

    // ── Default source: workspace KPIs + AI insights ───────────────
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

  // Auto-load KPIs + insights on mount and whenever the active source changes.
  useEffect(() => {
    if (!viewConfig) return; // no view selected — will redirect
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAll(DEFAULT_FILTERS, activeSourceId);
  }, [fetchAll, viewConfig, activeSourceId]);

  const handleFilterChange = useCallback(
    (key: string, value: string) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleApply = useCallback(() => {
    fetchAll(filters, activeSourceId);
  }, [filters, fetchAll, activeSourceId]);

  const handleReset = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    fetchAll(DEFAULT_FILTERS, activeSourceId);
  }, [fetchAll, activeSourceId]);

  const handleDismissError = useCallback(() => setError(null), []);
  const handleRetry = useCallback(
    () => fetchAll(filters, activeSourceId),
    [filters, fetchAll, activeSourceId],
  );

  // ── Derived visibility (based on the selected saved view) ─────────
  // Render only the dimensions listed in the view. (null only occurs when
  // there is no view config, in which case we redirect below before rendering.)
  const shownDimensions = visibleFilters
    ? dimensions.filter((dim) => visibleFilters.includes(dim.key))
    : dimensions;

  const shownKpis = visibleKpis
    ? kpis.filter((kpi) =>
        isDefaultSource
          ? visibleKpis.includes(kpiLabelToKey(kpi.label))
          : visibleKpis.includes(kpi.label),
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

      {/* Saved-view switcher — shows all of the user's saved views */}
      {allViews.length > 0 && (
        <div className={styles.viewChips}>
          <span className={styles.viewChipStatic}>
            All Views ({allViews.length})
          </span>
          {allViews.map((v) => (
            <button
              type="button"
              key={v.viewId}
              className={`${styles.viewChip} ${
                activeConfig?.viewId === v.viewId ? styles.viewChipActive : ""
              }`}
              title={v.generatedViewName}
              onClick={() =>
                setActiveConfig({
                  visibleFilters: v.visibleFilters,
                  visibleKpis: v.visibleKpis,
                  sourceId: v.sourceId,
                  viewId: v.viewId,
                  viewName: v.generatedViewName,
                })
              }
            >
              {v.sourceId} · {v.visibleKpis.length} KPIs ·{" "}
              {v.visibleFilters.length} Filters
            </button>
          ))}
        </div>
      )}

      {activeConfig?.viewName && (
        <span className={styles.viewCaption}>
          Viewing saved view: {activeConfig.viewName} · source: {activeSourceId}
        </span>
      )}

      {/* Filter bar — only the default (workspace) source is filter-driven */}
      {isDefaultSource && (
        <FilterBar
          activeCount={activeCount(filters)}
          loading={kpiLoading}
          onApply={handleApply}
          onReset={handleReset}
        >
          {shownDimensions.map((dim) => (
            <FilterDropdown
              key={dim.key}
              label={dim.label}
              value={filters[dim.key] ?? "ALL"}
              options={dim.options}
              loading={filterOptionsLoading}
              onChange={(v) => handleFilterChange(dim.key, v)}
            />
          ))}
        </FilterBar>
      )}

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

      {/* AI Insight Summary — only for the workspace (default) source */}
      {isDefaultSource && (
        <InsightSummary
          loading={insightLoading}
          insight={insight}
          error={insightError}
        />
      )}
    </div>
  );
};

export default ExecutiveSummaryPage;
