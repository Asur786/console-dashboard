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

/**
 * Lightweight markdown-to-React converter.
 * Handles: **bold**, *italic*, line breaks, and bullet lists.
 * No external dependency — keeps the bundle lean for the POC.
 */
function renderMarkdown(text: string): React.ReactNode {
  if (!text) return null;

  // Split into lines for bullet/paragraph handling
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim();

    // Skip empty lines but preserve spacing
    if (!trimmed) {
      elements.push(<br key={`br-${lineIdx}`} />);
      return;
    }

    // Bullet point
    const isBullet = /^[-•]\s/.test(trimmed);
    const content = isBullet ? trimmed.replace(/^[-•]\s/, '') : trimmed;

    // Convert **bold** and *italic* inline
    const inlineElements = renderInline(content, lineIdx);

    if (isBullet) {
      elements.push(
        <div key={`line-${lineIdx}`} style={{ display: 'flex', gap: 6, marginBottom: 2 }}>
          <span style={{ flexShrink: 0 }}>•</span>
          <span>{inlineElements}</span>
        </div>
      );
    } else {
      elements.push(
        <span key={`line-${lineIdx}`}>
          {inlineElements}
          {lineIdx < lines.length - 1 && <br />}
        </span>
      );
    }
  });

  return <>{elements}</>;
}

/** Convert **bold** and *italic* markers to <strong> and <em> elements. */
function renderInline(text: string, keyPrefix: number): React.ReactNode {
  // Regex: **bold** or *italic* (non-greedy, handles nested)
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let partIdx = 0;

  while (remaining.length > 0) {
    // Find first **bold** match
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    // Find first *italic* match (but not **)
    const italicMatch = remaining.match(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/);

    // Determine which comes first
    const boldIdx = boldMatch ? remaining.indexOf(boldMatch[0]) : -1;
    const italicIdx = italicMatch ? remaining.indexOf(italicMatch[0]) : -1;

    if (boldIdx === -1 && italicIdx === -1) {
      // No more formatting — push remaining text
      parts.push(<React.Fragment key={`${keyPrefix}-${partIdx}`}>{remaining}</React.Fragment>);
      break;
    }

    // Process whichever comes first
    if (boldIdx !== -1 && (italicIdx === -1 || boldIdx <= italicIdx)) {
      // Text before bold
      if (boldIdx > 0) {
        parts.push(<React.Fragment key={`${keyPrefix}-${partIdx++}`}>{remaining.substring(0, boldIdx)}</React.Fragment>);
      }
      parts.push(<strong key={`${keyPrefix}-${partIdx++}`}>{boldMatch![1]}</strong>);
      remaining = remaining.substring(boldIdx + boldMatch![0].length);
    } else {
      // Text before italic
      if (italicIdx > 0) {
        parts.push(<React.Fragment key={`${keyPrefix}-${partIdx++}`}>{remaining.substring(0, italicIdx)}</React.Fragment>);
      }
      parts.push(<em key={`${keyPrefix}-${partIdx++}`}>{italicMatch![1]}</em>);
      remaining = remaining.substring(italicIdx + italicMatch![0].length);
    }
  }

  return <>{parts}</>;
}

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
              <div
                className={mergeClasses(
                  styles.sectionText,
                  !insight[section.key] && styles.emptySection,
                )}
              >
                {insight[section.key]
                  ? renderMarkdown(insight[section.key])
                  : 'No content available for this section.'}
              </div>
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
