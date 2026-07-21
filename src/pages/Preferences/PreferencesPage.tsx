import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  makeStyles,
  tokens,
  Text,
  Checkbox,
  Button,
  Switch,
  Spinner,
  Badge,
} from "@fluentui/react-components";
import {
  Save20Regular,
  Delete20Regular,
  Star20Filled,
  Star20Regular,
  Open20Regular,
} from "@fluentui/react-icons";
import {
  AVAILABLE_FILTERS,
  AVAILABLE_KPIS,
} from "../../types/preference.types";
import type { SavedView } from "../../types/preference.types";
import { preferenceService } from "../../services/preference.service";
import { enterpriseService } from "../../services/enterprise.service";
import { useOpenDashboard } from "../../hooks/useOpenDashboard";
import { useAuthorization } from "../../hooks/useAuthorization";
import type { SourceCapability } from "../../types/enterprise.types";

/* ------------------------------------------------------------------ */
/*  Styles                                                            */
/* ------------------------------------------------------------------ */
const useStyles = makeStyles({
  page: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    maxWidth: "1200px",
  },
  headerRow: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  pageTitle: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  pageSubtitle: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground3,
  },

  /* -- Section card ------------------------------------------------- */
  section: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    boxShadow: tokens.shadow4,
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  sectionTitle: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  checkboxGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: "8px",
  },

  /* -- Save row ----------------------------------------------------- */
  saveRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    flexWrap: "wrap",
  },
  namePreview: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  namePreviewLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  namePreviewValue: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandForeground1,
  },
  saveActions: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },

  /* -- Saved views grid --------------------------------------------- */
  savedGroups: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  sourceGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  sourceGroupTitle: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
    paddingBottom: "4px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  savedGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "14px",
  },
  viewCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    boxShadow: tokens.shadow2,
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    transition: "box-shadow 0.15s ease",
    ":hover": { boxShadow: tokens.shadow8 },
  },
  viewCardHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "8px",
  },
  viewName: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    lineHeight: tokens.lineHeightBase300,
  },
  viewCardActions: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  },

  /* -- States ------------------------------------------------------- */
  centeredState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "32px",
    textAlign: "center",
  },
  stateText: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase300,
  },
  errorBanner: {
    backgroundColor: tokens.colorStatusDangerBackground1,
    border: `1px solid ${tokens.colorStatusDangerBorder1}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: "12px 16px",
  },
  errorText: {
    color: tokens.colorStatusDangerForeground1,
    fontSize: tokens.fontSizeBase300,
  },
  inlineHint: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
});

/* ------------------------------------------------------------------ */
/*  Helper — build the preview name (mirrors backend format)          */
/* ------------------------------------------------------------------ */
function buildPreviewName(filters: string[], kpis: string[]): string {
  const filterLabels = filters.length ? filters.join(", ") : "All";
  const kpiLabels = kpis.length ? kpis.join(", ") : "All";
  return `Filters(${filterLabels}) | KPIs(${kpiLabels})`;
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */
const PreferencesPage: React.FC = () => {
  const styles = useStyles();
  const openDashboard = useOpenDashboard();
  const authz = useAuthorization();

  // Selection state
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [selectedKpis, setSelectedKpis] = useState<string[]>([]);
  const [makeDefault, setMakeDefault] = useState(false);

  // Data source selection (POC 1: multiple data sources)
  const [sources, setSources] = useState<SourceCapability[]>([]);
  const [selectedSourceId, setSelectedSourceId] =
    useState<string>("databricks-default");
  const [sourceKpis, setSourceKpis] = useState<
    { name: string; value: string }[]
  >([]);
  const [sourceFilters, setSourceFilters] = useState<string[]>([]);
  const [sourceLoading, setSourceLoading] = useState(false);

  // Saved views state
  const [views, setViews] = useState<SavedView[]>([]);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const previewName = useMemo(
    () => buildPreviewName(selectedFilters, selectedKpis),
    [selectedFilters, selectedKpis],
  );

  /* ---- Load saved views on mount ---- */
  const loadViews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await preferenceService.listViews();
      setViews(result);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to load saved views.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /* ---- Toggle helpers ---- */
  const toggleFilter = useCallback((key: string, checked: boolean) => {
    setSelectedFilters((prev) =>
      checked ? [...prev, key] : prev.filter((k) => k !== key),
    );
  }, []);

  const toggleKpi = useCallback((key: string, checked: boolean) => {
    setSelectedKpis((prev) =>
      checked ? [...prev, key] : prev.filter((k) => k !== key),
    );
  }, []);

  /* ---- Save & Continue: create the view, then open the dashboard ---- */
  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      // Default source stores typed keys (channel/dollar_sales); other sources
      // store their own KPI/filter names directly.
      const isDefault = selectedSourceId === "databricks-default";
      const visibleFilters = isDefault
        ? AVAILABLE_FILTERS.filter((f) =>
            selectedFilters.includes(f.label),
          ).map((f) => f.key)
        : selectedFilters;
      const visibleKpis = isDefault
        ? AVAILABLE_KPIS.filter((k) => selectedKpis.includes(k.label)).map(
            (k) => k.key,
          )
        : selectedKpis;
      const created = await preferenceService.createView({
        visibleFilters,
        visibleKpis,
        sourceId: selectedSourceId,
        isDefault: makeDefault,
      });
      // Navigate straight to the dashboard with the new view's configuration.
      openDashboard({
        visibleFilters: created.visibleFilters,
        visibleKpis: created.visibleKpis,
        sourceId: created.sourceId,
        viewId: created.viewId,
        viewName: created.generatedViewName,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save view.");
      setSaving(false); // stay on the page so the user can retry
    }
  }, [
    selectedFilters,
    selectedKpis,
    selectedSourceId,
    makeDefault,
    openDashboard,
  ]);

  /* ---- Open Dashboard: restore a saved view's configuration ---- */
  const handleOpenDashboard = useCallback(
    (view: SavedView) => {
      openDashboard({
        visibleFilters: view.visibleFilters,
        visibleKpis: view.visibleKpis,
        sourceId: view.sourceId,
        viewId: view.viewId,
        viewName: view.generatedViewName,
      });
    },
    [openDashboard],
  );

  /* ---- Delete ---- */
  const handleDelete = useCallback(
    async (viewId: string) => {
      setBusyId(viewId);
      setError(null);
      try {
        await preferenceService.deleteView(viewId);
        await loadViews();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to delete view.");
      } finally {
        setBusyId(null);
      }
    },
    [loadViews],
  );

  /* ---- Set default ---- */
  const handleSetDefault = useCallback(
    async (viewId: string) => {
      setBusyId(viewId);
      setError(null);
      try {
        await preferenceService.setDefault(viewId);
        await loadViews();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to set default.");
      } finally {
        setBusyId(null);
      }
    },
    [loadViews],
  );

  const isDefaultSource = selectedSourceId === "databricks-default";

  const loadSourceSchema = useCallback(async (sourceId: string) => {
    if (sourceId === "databricks-default") {
      setSourceFilters([]);
      setSourceKpis([]);
      return;
    }
    setSourceLoading(true);
    setError(null);
    try {
      const [kpiRes, filterRes] = await Promise.all([
        enterpriseService.getSourceKpis(sourceId),
        enterpriseService.getSourceFilters(sourceId),
      ]);
      setSourceKpis(kpiRes.kpis);
      setSourceFilters(filterRes.filters);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to load source schema.",
      );
      setSourceKpis([]);
      setSourceFilters([]);
    } finally {
      setSourceLoading(false);
    }
  }, []);

  const loadSources = useCallback(async () => {
    try {
      const caps = await enterpriseService.getSourceCapabilities();
      setSources(caps.sources);
      // Only accessible sources are returned. If the current selection isn't
      // among them, switch to the first available one and load its schema.
      if (caps.sources.length > 0) {
        const available = caps.sources.some(
          (s) => s.sourceId === selectedSourceId,
        );
        if (!available) {
          const first = caps.sources[0].sourceId;
          setSelectedSourceId(first);
          loadSourceSchema(first);
        }
      }
    } catch {
      // Non-fatal: keep the default source only.
    }
  }, [selectedSourceId, loadSourceSchema]);

  useEffect(() => {
    // Load everything this page needs before rendering, so the user sees a
    // single loading state instead of a half-populated or error page.
    (async () => {
      await Promise.all([loadSources(), loadViews()]);
      setInitializing(false);
    })();
    // Run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSourceChange = useCallback(
    (sourceId: string) => {
      setSelectedSourceId(sourceId);
      setSelectedFilters([]);
      setSelectedKpis([]);
      loadSourceSchema(sourceId);
    },
    [loadSourceSchema],
  );

  const filterOptions: string[] = isDefaultSource
    ? AVAILABLE_FILTERS.map((f) => f.label)
    : sourceFilters;

  const kpiOptions: string[] = isDefaultSource
    ? AVAILABLE_KPIS.map((k) => k.label)
    : sourceKpis.map((k) => k.name);

  const canSave =
    (selectedFilters.length > 0 || selectedKpis.length > 0) &&
    authz.canWritePreferences;

  // Group saved views by the data source they were created from, so the UI
  // can show "views saved from workspace" vs "views saved from democatalog".
  const groupedViews = useMemo(() => {
    const groups = new Map<string, SavedView[]>();
    for (const view of views) {
      const key = view.sourceId || "databricks-default";
      const bucket = groups.get(key);
      if (bucket) bucket.push(view);
      else groups.set(key, [view]);
    }
    return Array.from(groups.entries());
  }, [views]);

  if (initializing) {
    return (
      <div className={styles.page}>
        <div className={styles.centeredState}>
          <Spinner size="large" label="Loading your preferences…" />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.headerRow}>
        <Text className={styles.pageTitle}>User Preferences</Text>
        <Text className={styles.pageSubtitle}>
          Choose which filters and KPI cards appear on your dashboard, then save
          the view.
        </Text>
      </div>

      {error && (
        <div className={styles.errorBanner}>
          <Text className={styles.errorText}>⚠ {error}</Text>
        </div>
      )}

      {/* Section 0 — Data Source */}
      <div className={styles.section}>
        <Text className={styles.sectionTitle}>Data Source</Text>
        <Text className={styles.inlineHint}>
          Switch the active data source. Filters and KPIs update to reflect the
          selected source.
        </Text>
        <select
          value={selectedSourceId}
          onChange={(e) => handleSourceChange(e.target.value)}
          aria-label="Data source"
        >
          {sources.length === 0 && (
            <option value="databricks-default">databricks-default</option>
          )}
          {sources.map((s) => (
            <option key={s.sourceId} value={s.sourceId}>
              {s.sourceId} ({s.sourceType})
            </option>
          ))}
        </select>
      </div>

      {/* Section 1 — Available Filters */}
      <div className={styles.section}>
        <Text className={styles.sectionTitle}>Available Filters</Text>
        {sourceLoading ? (
          <Spinner size="tiny" label="Loading filters…" />
        ) : (
          <div className={styles.checkboxGrid}>
            {filterOptions.map((label) => (
              <Checkbox
                key={label}
                label={label}
                checked={selectedFilters.includes(label)}
                onChange={(_, data) => toggleFilter(label, !!data.checked)}
              />
            ))}
            {filterOptions.length === 0 && (
              <Text className={styles.inlineHint}>
                No filters for this source.
              </Text>
            )}
          </div>
        )}
      </div>

      {/* Section 2 — Available KPIs */}
      <div className={styles.section}>
        <Text className={styles.sectionTitle}>Available KPIs</Text>
        {sourceLoading ? (
          <Spinner size="tiny" label="Loading KPIs…" />
        ) : (
          <div className={styles.checkboxGrid}>
            {kpiOptions.map((label) => (
              <Checkbox
                key={label}
                label={label}
                checked={selectedKpis.includes(label)}
                onChange={(_, data) => toggleKpi(label, !!data.checked)}
              />
            ))}
            {kpiOptions.length === 0 && (
              <Text className={styles.inlineHint}>
                No KPIs for this source.
              </Text>
            )}
          </div>
        )}
      </div>

      {/* Section 3 — Save View */}
      <div className={styles.section}>
        <Text className={styles.sectionTitle}>Save View</Text>
        {!isDefaultSource && (
          <Text className={styles.inlineHint}>
            This view will be saved under the “{selectedSourceId}” data source.
          </Text>
        )}
        <div className={styles.saveRow}>
          <div className={styles.namePreview}>
            <Text className={styles.namePreviewLabel}>Generated name</Text>
            <Text className={styles.namePreviewValue}>{previewName}</Text>
          </div>
          <div className={styles.saveActions}>
            <Switch
              label="Set as default"
              checked={makeDefault}
              onChange={(_, data) => setMakeDefault(!!data.checked)}
            />
            <Button
              appearance="primary"
              icon={saving ? <Spinner size="tiny" /> : <Save20Regular />}
              disabled={!canSave || saving}
              onClick={handleSave}
            >
              {saving ? "Saving…" : "Save & Continue"}
            </Button>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <Text className={styles.sectionTitle}>Saved Views</Text>

        {loading ? (
          <div className={styles.centeredState}>
            <Spinner size="medium" label="Loading saved views…" />
          </div>
        ) : views.length === 0 ? (
          <div className={styles.centeredState}>
            <Text className={styles.stateText}>
              No saved views yet. Select filters and KPIs above, then click Save
              View.
            </Text>
          </div>
        ) : (
          <div className={styles.savedGroups}>
            {groupedViews.map(([sourceId, sourceViews]) => (
              <div key={sourceId} className={styles.sourceGroup}>
                <Text className={styles.sourceGroupTitle}>
                  Saved from “{sourceId}” ({sourceViews.length})
                </Text>
                <div className={styles.savedGrid}>
                  {sourceViews.map((view) => (
                    <div key={view.viewId} className={styles.viewCard}>
                      <div className={styles.viewCardHeader}>
                        <Text className={styles.viewName}>
                          {view.generatedViewName}
                        </Text>
                        {view.isDefault && (
                          <Badge appearance="tint" color="brand" size="small">
                            Default
                          </Badge>
                        )}
                      </div>

                      <div className={styles.viewCardActions}>
                        <Button
                          size="small"
                          appearance="primary"
                          icon={<Open20Regular />}
                          onClick={() => handleOpenDashboard(view)}
                        >
                          Open Dashboard
                        </Button>
                        <Button
                          size="small"
                          appearance="subtle"
                          icon={
                            view.isDefault ? (
                              <Star20Filled />
                            ) : (
                              <Star20Regular />
                            )
                          }
                          disabled={
                            busyId === view.viewId ||
                            view.isDefault ||
                            !authz.canWritePreferences
                          }
                          onClick={() => handleSetDefault(view.viewId)}
                        >
                          Default
                        </Button>
                        <Button
                          size="small"
                          appearance="subtle"
                          icon={<Delete20Regular />}
                          disabled={
                            busyId === view.viewId || !authz.canWritePreferences
                          }
                          onClick={() => handleDelete(view.viewId)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PreferencesPage;
