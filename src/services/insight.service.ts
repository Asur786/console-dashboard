import type { InsightRequest, InsightResponse, PromptId } from '../types/insight.types';
import type { ExecFilters } from '../types/executive.types';

/* ------------------------------------------------------------------ */
/*  InsightService — calls POST /api/insights                          */
/*                                                                     */
/*  Matches the same fetch pattern as kpi.service.ts:                 */
/*  - relative URL (works in both Vite dev proxy and Databricks Apps)  */
/*  - 20-second AbortSignal timeout                                    */
/*  - throws Error with descriptive message on failure                 */
/* ------------------------------------------------------------------ */

export const insightService = {
  async generateInsight(
    filters: ExecFilters,
    promptId: PromptId = 'PROMPT_FULL_INSIGHT',
  ): Promise<InsightResponse> {
    const body: InsightRequest = {
      promptId,
      // Only send filters that have a real value — omit ALL so backend
      // treats them as "no filter" and Prompt Builder skips them cleanly.
      ...(filters.country  !== 'ALL' && { country:  filters.country  }),
      ...(filters.channel  !== 'ALL' && { channel:  filters.channel  }),
      ...(filters.category !== 'ALL' && { category: filters.category }),
      ...(filters.retailer !== 'ALL' && { retailer: filters.retailer }),
    };

    const response = await fetch('/api/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(130_000), // Genie can take up to 120s; buffer extra 10s
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(
        `Insight request failed (${response.status}): ${text || response.statusText}`,
      );
    }

    return response.json() as Promise<InsightResponse>;
  },
};
