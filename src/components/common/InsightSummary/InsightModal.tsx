/**
 * InsightModal
 *
 * Full-screen centered modal that shows the complete insight text.
 * Uses Fluent UI v9 Dialog for built-in accessibility, Escape key handling,
 * backdrop click dismissal, and entrance/exit animation.
 */

import React from 'react';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  Button,
  makeStyles,
  tokens,
  Text,
} from '@fluentui/react-components';
import { Dismiss24Regular } from '@fluentui/react-icons';

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */
const useStyles = makeStyles({
  surface: {
    width: 'min(70vw, 860px)',
    maxWidth: '96vw',
    maxHeight: '85vh',
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden',
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    maxHeight: 'calc(85vh - 80px)',
  },
  title: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorBrandForeground1,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  content: {
    overflowY: 'auto',
    paddingRight: '4px',
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase500,
    color: tokens.colorNeutralForeground1,
  },
});

/* ------------------------------------------------------------------ */
/*  Helpers — same markdown renderer as InsightCard                   */
/* ------------------------------------------------------------------ */
function autoHighlight(text: string): string {
  const segments = text.split(/(\*\*.*?\*\*)/g);
  return segments.map((seg, i) => {
    if (i % 2 === 1) return seg;
    return seg
      .replace(/\b(Dollar Sales|Volume Sales|Dollar Share|Volume Share|YoY Growth|Distribution)\b/g, '**$1**')
      .replace(/(\$[\d,]+(?:\.\d+)?[KMBkmb]?\b)/g, '**$1**')
      .replace(/([+-]?\d+(?:\.\d+)?%)/g, '**$1**')
      .replace(/\b(strong growth|strong momentum|strong performance|price premium|premium pricing|premium position(?:ing)?|commanding|urgently|significantly below|significantly above|expanding|contracting|declining)\b/gi, '**$1**');
  }).join('');
}

function renderMarkdown(text: string): React.ReactNode {
  if (!text) return null;
  const lines = autoHighlight(text).split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, li) => {
    const trimmed = line.trim();
    if (!trimmed) { elements.push(<br key={`br-${li}`} />); return; }
    const isBullet = /^[-•]\s/.test(trimmed);
    const content = isBullet ? trimmed.replace(/^[-•]\s/, '') : trimmed;
    const inline = renderInline(content, li);
    if (isBullet) {
      elements.push(
        <div key={`l-${li}`} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
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
interface InsightModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  content: string;
}

export const InsightModal: React.FC<InsightModalProps> = ({
  open,
  onClose,
  title,
  content,
}) => {
  const styles = useStyles();

  return (
    <Dialog
      open={open}
      onOpenChange={(_, data) => { if (!data.open) onClose(); }}
    >
      <DialogSurface className={styles.surface}>
        <DialogBody className={styles.body}>
          <DialogTitle
            action={
              <Button
                appearance="subtle"
                aria-label="Close"
                icon={<Dismiss24Regular />}
                onClick={onClose}
              />
            }
          >
            <Text className={styles.title}>{title}</Text>
          </DialogTitle>

          <DialogContent className={styles.content}>
            {renderMarkdown(content)}
          </DialogContent>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
