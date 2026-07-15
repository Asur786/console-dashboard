export type ShareRole = 'viewer' | 'editor' | 'owner';
export type CapabilityStatus =
  | 'not_started'
  | 'in_progress'
  | 'supported'
  | 'partial'
  | 'not_supported';

export interface SourceCapability {
  sourceId: string;
  sourceType: string;
  isDefault: boolean;
  isActive: boolean;
  capabilities: string[];
}

export interface SourceCapabilitiesResponse {
  sources: SourceCapability[];
}

export interface WorkspaceAccessRequest {
  workspaceId: string;
  catalog: string;
  schema: string;
}

export interface WorkspaceAccessResponse {
  allowed: boolean;
  reason: string;
  policyId: string | null;
}

export interface ShareCreateRequest {
  resourceId: string;
  resourceType: string;
  sharedWithUserId: string;
  shareRole: ShareRole;
}

export interface ShareRecord {
  resourceId: string;
  resourceType: string;
  ownerUserId: string;
  sharedWithUserId: string;
  shareRole: ShareRole;
  createdAt: string;
}

export interface AuthzCheckResponse {
  allowed: boolean;
  role: string;
  matchedScope: string | null;
  reason: string;
}

export interface EvidenceCreateRequest {
  requirementId: string;
  artifactType: 'test_report' | 'log_extract' | 'screenshot' | 'runbook' | 'scorecard';
  artifactPath: string;
  summary: string;
}

export interface EvidenceRecord {
  evidenceId: string;
  requirementId: string;
  artifactType: 'test_report' | 'log_extract' | 'screenshot' | 'runbook' | 'scorecard';
  artifactPath: string;
  summary: string;
  createdBy: string;
  createdAt: string;
}

export interface ScorecardCriterion {
  name: string;
  weight: number;
}

export interface ScorecardTemplateResponse {
  criteria: ScorecardCriterion[];
  options: string[];
}

export interface CapabilityItem {
  capability: string;
  status: CapabilityStatus;
  note: string;
}

export interface CapabilityStatusResponse {
  generatedAt: string;
  items: CapabilityItem[];
}
