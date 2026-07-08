/**
 * InsightCard
 *
 * Displays a single AI insight section (Executive Summary / Root Cause /
 * Business Recommendation) inside a card.
 *
 * - Content is clamped to 6 lines with an ellipsis.
 * - When content overflows, a "Read more" cue is shown.
 * - Clicking the card opens an InsightModal with the full text.
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { makeStyles, tokens, Text, mergeClasses } from '@fluentui/react-components';
import { ChevronRight16Regular } from '@fluentui/react-icons';
import { InsightModal } from './InsightModal';

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */
const useStyles = makeStyles({
  card: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    boxShadow: tokens.shadow4,
    padding: '20px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    height: '100%',
    boxSizing: 'border-box',
    transition: 'box-shadow 0.18s ease, transform 0.18s ease',
    ':hover': {
      boxShadow: tokens.shadow8,
      transform: 'translateY(-2px)',
    },
  },
  label: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorBrandForeground1,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    flexShrink: 0,
  },
  contentWrap: {
    flexGrow: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  readMore: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    color: tokens.colorBrandForeground1,
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    flexShrink: 0,
    marginTop: '4px',
  },
  readMoreHidden: {
    visibility: 'hidden',
  },
});

/** Preprocess Genie text: convert inline numbered lists like
 *  "intro: (1) item one; (2) item two" into separate bullet lines.
 */
function preprocessText(text: string): string {
  if (!/\(\d+\)/.test(text)) return text;

  return text
    .replace(/:\s*\(1\)\s+/g, ':\n\u2022 ')    // "intro: (1) x" → "intro:\n• x"
    .replace(/^\(1\)\s+/gm,   '\u2022 ')          // "(1) at line start → "• x"
    .replace(/;\s*\(\d+\)\s+/g, '\n\u2022 ');     // "; (N) x" → "\n• x"
}

/** Convert **bold**, *italic*, line breaks, and - bullets to React nodes. */
function renderMarkdown(text: string): React.ReactNode {
  if (!text) return null;
  const lines = preprocessText(text).split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, li) => {
    const trimmed = line.trim();
    if (!trimmed) { elements.push(<br key={`br-${li}`} />); return; }
    const isBullet = /^[-•]\s/.test(trimmed);
    const content = isBullet ? trimmed.replace(/^[-•]\s/, '') : trimmed;
    const inline = renderInline(content, li);
    if (isBullet) {
      elements.push(
        <div key={`l-${li}`} style={{ display: 'flex', gap: 6, marginBottom: 2 }}>
          <span style={{ flexShrink: 0 }}>•</span><span>{inline}</span>
        </div>
      );
    } else {
      elements.push(<span key={`l-${li}`}>{inline}{li < lines.length - 1 && <br />}</span>);
    }
  });
  return <>{elements}</>;
}

function renderInline(text: string, keyPrefix: number): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let idx = 0;

  while (remaining.length > 0) {
    const boldMatch  = remaining.match(/\*\*(.+?)\*\*/);
    const italicMatch = remaining.match(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/);
    const bi = boldMatch   ? remaining.indexOf(boldMatch[0])   : -1;
    const ii = italicMatch ? remaining.indexOf(italicMatch[0]) : -1;

    if (bi === -1 && ii === -1) {
      parts.push(<React.Fragment key={`${keyPrefix}-${idx}`}>{remaining}</React.Fragment>);
      break;
    }
    if (bi !== -1 && (ii === -1 || bi <= ii)) {
      if (bi > 0) parts.push(<React.Fragment key={`${keyPrefix}-${idx++}`}>{remaining.substring(0, bi)}</React.Fragment>);
      parts.push(<strong key={`${keyPrefix}-${idx++}`}>{boldMatch![1]}</strong>);
      remaining = remaining.substring(bi + boldMatch![0].length);
    } else {
      if (ii > 0) parts.push(<React.Fragment key={`${keyPrefix}-${idx++}`}>{remaining.substring(0, ii)}</React.Fragment>);
      parts.push(<em key={`${keyPrefix}-${idx++}`}>{italicMatch![1]}</em>);
      remaining = remaining.substring(ii + italicMatch![0].length);
    }
  }
  return <>{parts}</>;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
interface InsightCardProps {
  title: string;
  content: string;
}

export const InsightCard: React.FC<InsightCardProps> = ({ title, content }) => {
  const styles = useStyles();
  const contentRef  = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Detect whether the clamped content actually overflows
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    // Small delay to let the browser finish layout
    const id = setTimeout(() => {
      setOverflows(el.scrollHeight > el.clientHeight + 4);
    }, 50);
    return () => clearTimeout(id);
  }, [content]);

  const handleClick = useCallback(() => setModalOpen(true), []);
  const handleClose = useCallback(() => setModalOpen(false), []);

  return (
    <>
      <div className={styles.card} onClick={handleClick} role="button" tabIndex={0}
           onKeyDown={e => e.key === 'Enter' && handleClick()}>
        <Text className={styles.label}>{title}</Text>

        <div className={styles.contentWrap}>
          {/* 6-line clamp applied via inline style (vendor prefix safe) */}
          <div
            ref={contentRef}
            style={{
              fontSize: tokens.fontSizeBase300,
              lineHeight: tokens.lineHeightBase400,
              color: tokens.colorNeutralForeground1,
              display: '-webkit-box',
              WebkitLineClamp: 6,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            } as React.CSSProperties}
          >
            {renderMarkdown(content)}
          </div>
        </div>

        <div className={mergeClasses(styles.readMore, !overflows && styles.readMoreHidden)}>
          <span>Read more</span>
          <ChevronRight16Regular />
        </div>
      </div>

      <InsightModal
        open={modalOpen}
        onClose={handleClose}
        title={title}
        content={content}
      />
    </>
  );
};
