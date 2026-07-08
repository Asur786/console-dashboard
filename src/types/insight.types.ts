/**
 * Types for the AI Insight Summary feature.
 *
 * The backend POST /api/insights returns an InsightResponse.
 * Fields are already camelCase — no mapping needed.
 */

/** Prompt IDs registered in the backend Prompt Store. */
export type PromptId =
  | 'PROMPT_EXECUTIVE_SUMMARY'
  | 'PROMPT_ROOT_CAUSE'
  | 'PROMPT_RECOMMENDATION'
  | 'PROMPT_FULL_INSIGHT';

/** A KPI value snapshot from the dashboard, injected into the prompt. */
export interface KpiValueSnapshot {
  label: string;
  value: string;
  sublabel: string;
}

/** Request body sent to POST /api/insights. */
export interface InsightRequest {
  promptId: PromptId;
  country?: string;
  channel?: string;
  category?: string;
  retailer?: string;
  kpiValues?: KpiValueSnapshot[];
}

/** Response from POST /api/insights. */
export interface InsightResponse {
  executiveSummary: string;
  rootCause: string;
  recommendation: string;
  rawResponse: string;
  promptId: string;
  title: string;
  activeFilters: Record<string, string>;
}
