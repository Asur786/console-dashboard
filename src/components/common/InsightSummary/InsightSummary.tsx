import React, { useState, useCallback } from 'react';
import {
  makeStyles,
  tokens,
  Button,
  Spinner,
  Text,
  mergeClasses,
} from '@fluentui/react-components';
import { BrainCircuit20Regular, ArrowSyncCircle20Regular } from '@fluentui/react-icons';
import type { ExecFilters } from '../../../types/executive.types';
import type { InsightResponse } from '../../../types/insight.types';
import { insightService } from '../../../services/insight.service';

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */
const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    overflow: 'hidden',
  },

  /* -- Header bar --------------------------------------------------- */
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
    gap: '12px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  headerIcon: {
    color: tokens.colorBrandForeground1,
    flexShrink: 0,
  },
  headerTitle: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorNeutralForeground1,
  },
  headerBadge: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    backgroundColor: tokens.colorNeutralBackground3,
    padding: '2px 8px',
    borderRadius: tokens.borderRadiusCircular,
  },

  /* -- Body --------------------------------------------------------- */
  body: {
    padding: '24px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
  },

  /* -- Empty state -------------------------------------------------- */
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '32px 16px',
    textAlign: 'center',
  },
  emptyStateText: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase300,
  },

  /* -- Loading state ------------------------------------------------ */
  loadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '32px 16px',
    textAlign: 'center',
  },
  loadingLabel: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase300,
  },

  /* -- Error state -------------------------------------------------- */
  errorState: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '14px 16px',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorStatusDangerBackground1,
    border: `1px solid ${tokens.colorStatusDangerBorder1}`,
  },
  errorText: {
    color: tokens.colorStatusDangerForeground1,
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300,
  },

  /* -- Insight sections --------------------------------------------- */
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    paddingTop: '20px',
    paddingBottom: '20px',
  },
  sectionDivider: {
    height: '1px',
    backgroundColor: tokens.colorNeutralStroke2,
  },
  sectionLabel: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorBrandForeground1,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  sectionText: {
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase400,
    color: tokens.colorNeutralForeground1,
    whiteSpace: 'pre-wrap',
  },
  emptySection: {
    color: tokens.colorNeutralForeground3,
    fontStyle: 'italic',
  },
});

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface InsightSummaryProps {
  /** Currently selected dashboard filters — passed from the page. */
  filters: ExecFilters;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const SECTIONS: { key: keyof Pick<InsightResponse, 'executiveSummary' | 'rootCause' | 'recommendation'>; label: string }[] = [
  { key: 'executiveSummary', label: 'Executive Summary' },
  { key: 'rootCause',        label: 'Root Cause Analysis' },
  { key: 'recommendation',   label: 'Business Recommendation' },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export const InsightSummary: React.FC<InsightSummaryProps> = ({ filters }) => {
  const styles = useStyles();

  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [insight,  setInsight]  = useState<InsightResponse | null>(null);

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await insightService.generateInsight(filters);
      setInsight(result);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while generating insights.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  /* ---- Render body content ---------------------------------------- */
  const renderBody = () => {
    if (loading) {
      return (
        <div className={styles.loadingState}>
          <Spinner size="medium" />
          <Text className={styles.loadingLabel}>Generating AI insights…</Text>
        </div>
      );
    }

    if (error) {
      return (
        <div className={styles.body}>
          <div className={styles.errorState}>
            <Text className={styles.errorText}>
              ⚠ {error}
            </Text>
          </div>
        </div>
      );
    }

    if (!insight) {
      return (
        <div className={styles.emptyState}>
          <BrainCircuit20Regular style={{ fontSize: 32, color: tokens.colorNeutralForeground4 }} />
          <Text className={styles.emptyStateText}>
            Generate AI insights to understand KPI performance.
          </Text>
        </div>
      );
    }

    return (
      <div className={styles.body}>
        {SECTIONS.map((section, index) => (
          <React.Fragment key={section.key}>
            {index > 0 && <div className={styles.sectionDivider} />}
            <div className={styles.section}>
              <Text className={styles.sectionLabel}>{section.label}</Text>
              <Text
                className={mergeClasses(
                  styles.sectionText,
                  !insight[section.key] && styles.emptySection,
                )}
              >
                {insight[section.key] || 'No content available for this section.'}
              </Text>
            </div>
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.root}>
      {/* ---- Header ---- */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <BrainCircuit20Regular className={styles.headerIcon} />
          <Text className={styles.headerTitle}>AI Insight Summary</Text>
          <Text className={styles.headerBadge}>Powered by Databricks Genie</Text>
        </div>

        <Button
          appearance="primary"
          icon={loading ? <Spinner size="tiny" /> : <ArrowSyncCircle20Regular />}
          disabled={loading}
          onClick={handleGenerate}
        >
          {loading ? 'Generating…' : 'Generate Insights'}
        </Button>
      </div>

      {/* ---- Body ---- */}
      {renderBody()}
    </div>
  );
};
