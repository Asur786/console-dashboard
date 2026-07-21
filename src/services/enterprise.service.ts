import type {
  AuthzCheckResponse,
  CapabilityStatusResponse,
  EvidenceCreateRequest,
  EvidenceRecord,
  ScorecardTemplateResponse,
  ShareCreateRequest,
  ShareRecord,
  SourceCapabilitiesResponse,
  WorkspaceAccessRequest,
  WorkspaceAccessResponse,
} from '../types/enterprise.types';

const BASE = '/api/enterprise';
const TIMEOUT_MS = 30_000;

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Request failed (${response.status}): ${text || response.statusText}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const enterpriseService = {
  getSourceCapabilities(): Promise<SourceCapabilitiesResponse> {
    return request<SourceCapabilitiesResponse>(`${BASE}/sources/capabilities`);
  },

  getSourceKpis(sourceId: string): Promise<{ sourceId: string; kpis: { name: string; value: string }[] }> {
    return request(`${BASE}/sources/${sourceId}/kpis`);
  },

  getSourceFilters(sourceId: string): Promise<{ sourceId: string; filters: string[] }> {
    return request(`${BASE}/sources/${sourceId}/filters`);
  },

  validateWorkspaceAccess(payload: WorkspaceAccessRequest): Promise<WorkspaceAccessResponse> {
    return request<WorkspaceAccessResponse>(`${BASE}/workspaces/validate-access`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  createShare(payload: ShareCreateRequest): Promise<ShareRecord> {
    return request<ShareRecord>(`${BASE}/shares`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  listShares(resourceId: string): Promise<ShareRecord[]> {
    return request<ShareRecord[]>(`${BASE}/shares/${resourceId}`);
  },

  revokeShare(resourceId: string, sharedWithUserId: string): Promise<void> {
    return request<void>(`${BASE}/shares/${resourceId}/${sharedWithUserId}`, {
      method: 'DELETE',
    });
  },

  checkAuthz(action: string, resourceType: string, resourceId: string): Promise<AuthzCheckResponse> {
    const query = new URLSearchParams({
      action,
      resourceType,
      resourceId,
    });
    return request<AuthzCheckResponse>(`${BASE}/authz/check?${query.toString()}`);
  },

  ingestEvidence(payload: EvidenceCreateRequest): Promise<EvidenceRecord> {
    return request<EvidenceRecord>(`${BASE}/evidence`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getScorecardTemplate(): Promise<ScorecardTemplateResponse> {
    return request<ScorecardTemplateResponse>(`${BASE}/scorecard-template`);
  },

  getCapabilityStatus(): Promise<CapabilityStatusResponse> {
    return request<CapabilityStatusResponse>(`${BASE}/capability-status`);
  },
};
