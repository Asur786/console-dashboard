import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  makeStyles,
  tokens,
  Text,
  Checkbox,
  Button,
  Switch,
  Spinner,
  Badge,
  Input,
} from '@fluentui/react-components';
import {
  Save20Regular,
  Delete20Regular,
  Star20Filled,
  Star20Regular,
  Open20Regular,
} from '@fluentui/react-icons';
import {
  AVAILABLE_FILTERS,
  AVAILABLE_KPIS,
} from '../../types/preference.types';
import type {
  FilterKey,
  KpiKey,
  SavedView,
} from '../../types/preference.types';
import { preferenceService } from '../../services/preference.service';
import { enterpriseService } from '../../services/enterprise.service';
import { useOpenDashboard } from '../../hooks/useOpenDashboard';
import { useAuthorization } from '../../hooks/useAuthorization';
import type { ShareRecord, ShareRole } from '../../types/enterprise.types';

/* ------------------------------------------------------------------ */
/*  Styles                                                            */
/* ------------------------------------------------------------------ */
const useStyles = makeStyles({
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    maxWidth: '1200px',
  },
  headerRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
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
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  sectionTitle: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  checkboxGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '8px',
  },

  /* -- Save row ----------------------------------------------------- */
  saveRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    flexWrap: 'wrap',
  },
  namePreview: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  namePreviewLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  namePreviewValue: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandForeground1,
  },
  saveActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },

  /* -- Saved views grid --------------------------------------------- */
  savedGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '14px',
  },
  viewCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    boxShadow: tokens.shadow2,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    transition: 'box-shadow 0.15s ease',
    ':hover': { boxShadow: tokens.shadow8 },
  },
  viewCardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '8px',
  },
  viewName: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    lineHeight: tokens.lineHeightBase300,
  },
  viewCardActions: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },

  /* -- States ------------------------------------------------------- */
  centeredState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '32px',
    textAlign: 'center',
  },
  stateText: { color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase300 },
  errorBanner: {
    backgroundColor: tokens.colorStatusDangerBackground1,
    border: `1px solid ${tokens.colorStatusDangerBorder1}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: '12px 16px',
  },
  errorText: { color: tokens.colorStatusDangerForeground1, fontSize: tokens.fontSizeBase300 },
  shareControls: {
    display: 'grid',
    gridTemplateColumns: '2fr 2fr 1fr auto auto',
    gap: '8px',
    alignItems: 'center',
  },
  shareList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  shareItem: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
    padding: '8px 10px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inlineHint: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
});

/* ------------------------------------------------------------------ */
/*  Helper — build the preview name (mirrors backend format)          */
/* ------------------------------------------------------------------ */
function buildPreviewName(filters: FilterKey[], kpis: KpiKey[]): string {
  const filterLabels = filters.length
    ? AVAILABLE_FILTERS.filter(f => filters.includes(f.key)).map(f => f.label).join(', ')
    : 'All';
  const kpiLabels = kpis.length
    ? AVAILABLE_KPIS.filter(k => kpis.includes(k.key)).map(k => k.label).join(', ')
    : 'All';
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
  const [selectedFilters, setSelectedFilters] = useState<FilterKey[]>([]);
  const [selectedKpis, setSelectedKpis]       = useState<KpiKey[]>([]);
  const [makeDefault, setMakeDefault]         = useState(false);

  // Saved views state
  const [views, setViews]         = useState<SavedView[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [busyId, setBusyId]       = useState<string | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [shareResourceId, setShareResourceId] = useState('saved-view-demo');
  const [shareTargetUser, setShareTargetUser] = useState('');
  const [shareRole, setShareRole] = useState<ShareRole>('viewer');
  const [shares, setShares] = useState<ShareRecord[]>([]);
  const [sharesBusy, setSharesBusy] = useState(false);

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
      setError(err instanceof Error ? err.message : 'Failed to load saved views.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadViews();
  }, [loadViews]);

  /* ---- Toggle helpers ---- */
  const toggleFilter = useCallback((key: FilterKey, checked: boolean) => {
    setSelectedFilters(prev =>
      checked ? [...prev, key] : prev.filter(k => k !== key),
    );
  }, []);

  const toggleKpi = useCallback((key: KpiKey, checked: boolean) => {
    setSelectedKpis(prev =>
      checked ? [...prev, key] : prev.filter(k => k !== key),
    );
  }, []);

  /* ---- Save & Continue: create the view, then open the dashboard ---- */
  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const created = await preferenceService.createView({
        visibleFilters: selectedFilters,
        visibleKpis: selectedKpis,
        isDefault: makeDefault,
      });
      // Navigate straight to the dashboard with the new view's configuration.
      openDashboard({
        visibleFilters: created.visibleFilters,
        visibleKpis: created.visibleKpis,
        viewId: created.viewId,
        viewName: created.generatedViewName,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save view.');
      setSaving(false); // stay on the page so the user can retry
    }
  }, [selectedFilters, selectedKpis, makeDefault, openDashboard]);

  /* ---- Open Dashboard: restore a saved view's configuration ---- */
  const handleOpenDashboard = useCallback((view: SavedView) => {
    openDashboard({
      visibleFilters: view.visibleFilters,
      visibleKpis: view.visibleKpis,
      viewId: view.viewId,
      viewName: view.generatedViewName,
    });
  }, [openDashboard]);

  /* ---- Delete ---- */
  const handleDelete = useCallback(async (viewId: string) => {
    setBusyId(viewId);
    setError(null);
    try {
      await preferenceService.deleteView(viewId);
      await loadViews();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete view.');
    } finally {
      setBusyId(null);
    }
  }, [loadViews]);

  /* ---- Set default ---- */
  const handleSetDefault = useCallback(async (viewId: string) => {
    setBusyId(viewId);
    setError(null);
    try {
      await preferenceService.setDefault(viewId);
      await loadViews();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to set default.');
    } finally {
      setBusyId(null);
    }
  }, [loadViews]);

  const canSave = (selectedFilters.length > 0 || selectedKpis.length > 0) && authz.canWritePreferences;

  const loadShares = useCallback(async () => {
    if (!shareResourceId.trim()) return;
    setSharesBusy(true);
    setError(null);
    try {
      const result = await enterpriseService.listShares(shareResourceId.trim());
      setShares(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load sharing records.');
    } finally {
      setSharesBusy(false);
    }
  }, [shareResourceId]);

  const handleCreateShare = useCallback(async () => {
    if (!shareResourceId.trim() || !shareTargetUser.trim()) return;
    setSharesBusy(true);
    setError(null);
    try {
      await enterpriseService.createShare({
        resourceId: shareResourceId.trim(),
        resourceType: 'saved_view',
        sharedWithUserId: shareTargetUser.trim(),
        shareRole,
      });
      setShareTargetUser('');
      await loadShares();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create share.');
      setSharesBusy(false);
    }
  }, [loadShares, shareResourceId, shareRole, shareTargetUser]);

  const handleRevokeShare = useCallback(async (sharedWithUserId: string) => {
    if (!shareResourceId.trim()) return;
    setSharesBusy(true);
    setError(null);
    try {
      await enterpriseService.revokeShare(shareResourceId.trim(), sharedWithUserId);
      await loadShares();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to revoke share.');
      setSharesBusy(false);
    }
  }, [loadShares, shareResourceId]);

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.headerRow}>
        <Text className={styles.pageTitle}>User Preferences</Text>
        <Text className={styles.pageSubtitle}>
          Choose which filters and KPI cards appear on your dashboard, then save the view.
        </Text>
      </div>

      {error && (
        <div className={styles.errorBanner}>
          <Text className={styles.errorText}>⚠ {error}</Text>
        </div>
      )}

      {/* Section 1 — Available Filters */}
      <div className={styles.section}>
        <Text className={styles.sectionTitle}>Available Filters</Text>
        <div className={styles.checkboxGrid}>
          {AVAILABLE_FILTERS.map(({ key, label }) => (
            <Checkbox
              key={key}
              label={label}
              checked={selectedFilters.includes(key)}
              onChange={(_, data) => toggleFilter(key, !!data.checked)}
            />
          ))}
        </div>
      </div>

      {/* Section 2 — Available KPIs */}
      <div className={styles.section}>
        <Text className={styles.sectionTitle}>Available KPIs</Text>
        <div className={styles.checkboxGrid}>
          {AVAILABLE_KPIS.map(({ key, label }) => (
            <Checkbox
              key={key}
              label={label}
              checked={selectedKpis.includes(key)}
              onChange={(_, data) => toggleKpi(key, !!data.checked)}
            />
          ))}
        </div>
      </div>

      {/* Section 3 — Save View */}
      <div className={styles.section}>
        <Text className={styles.sectionTitle}>Save View</Text>
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
              {saving ? 'Saving…' : 'Save & Continue'}
            </Button>
          </div>
        </div>
      </div>

      {/* Section 4 — Saved Views */}
      <div className={styles.section}>
        <Text className={styles.sectionTitle}>Sharing Controls (Feasibility)</Text>
        <Text className={styles.inlineHint}>
          Minimal share/revoke controls to validate owner/editor/viewer workflows.
        </Text>

        <div className={styles.shareControls}>
          <Input
            value={shareResourceId}
            onChange={(_, data) => setShareResourceId(data.value)}
            placeholder="Resource ID"
          />
          <Input
            value={shareTargetUser}
            onChange={(_, data) => setShareTargetUser(data.value)}
            placeholder="User email to share with"
          />
          <select
            value={shareRole}
            onChange={(event) => setShareRole(event.target.value as ShareRole)}
            aria-label="Share role"
          >
            <option value="viewer">viewer</option>
            <option value="editor">editor</option>
            <option value="owner">owner</option>
          </select>
          <Button appearance="secondary" onClick={loadShares} disabled={sharesBusy || !authz.canShare}>
            Refresh Shares
          </Button>
          <Button
            appearance="primary"
            onClick={handleCreateShare}
            disabled={sharesBusy || !shareTargetUser.trim() || !authz.canShare}
          >
            Share
          </Button>
        </div>

        <div className={styles.shareList}>
          {shares.map((item) => (
            <div key={`${item.resourceId}:${item.sharedWithUserId}`} className={styles.shareItem}>
              <Text>
                {item.sharedWithUserId} ({item.shareRole})
              </Text>
              <Button
                size="small"
                appearance="subtle"
                icon={<Delete20Regular />}
                onClick={() => handleRevokeShare(item.sharedWithUserId)}
                disabled={sharesBusy || !authz.canShare}
              >
                Revoke
              </Button>
            </div>
          ))}
          {!sharesBusy && shares.length === 0 && (
            <Text className={styles.inlineHint}>No shares for the current resource.</Text>
          )}
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
              No saved views yet. Select filters and KPIs above, then click Save View.
            </Text>
          </div>
        ) : (
          <div className={styles.savedGrid}>
            {views.map(view => (
              <div key={view.viewId} className={styles.viewCard}>
                <div className={styles.viewCardHeader}>
                  <Text className={styles.viewName}>{view.generatedViewName}</Text>
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
                    icon={view.isDefault ? <Star20Filled /> : <Star20Regular />}
                    disabled={busyId === view.viewId || view.isDefault || !authz.canWritePreferences}
                    onClick={() => handleSetDefault(view.viewId)}
                  >
                    Default
                  </Button>
                  <Button
                    size="small"
                    appearance="subtle"
                    icon={<Delete20Regular />}
                    disabled={busyId === view.viewId || !authz.canWritePreferences}
                    onClick={() => handleDelete(view.viewId)}
                  >
                    Delete
                  </Button>
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
