import {
  Report,
  User,
  UserRole,
  ReportStatus,
  PlatformStats,
  StatusHistoryEntry,
  ProgressNote,
  CommunityFeedback,
  Organization,
  IssueCategory,
} from '../types';

export async function fetchCurrentUser(): Promise<User> {
  const res = await fetch('/api/auth/current');
  const data = await res.json();
  return data.user;
}

export async function switchUserRole(role: UserRole): Promise<User> {
  const res = await fetch('/api/auth/switch-role', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  });
  const data = await res.json();
  return data.user;
}

export interface ReportsFilterParams {
  category?: string;
  status?: string;
  division?: string;
  urgency?: string;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface ReportsResponse {
  data: Report[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function fetchReports(params: ReportsFilterParams = {}): Promise<ReportsResponse> {
  const searchParams = new URLSearchParams();
  if (params.category) searchParams.set('category', params.category);
  if (params.status) searchParams.set('status', params.status);
  if (params.division) searchParams.set('division', params.division);
  if (params.urgency) searchParams.set('urgency', params.urgency);
  if (params.search) searchParams.set('search', params.search);
  if (params.sort) searchParams.set('sort', params.sort);
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));

  const res = await fetch(`/api/reports?${searchParams.toString()}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch reports');
  return {
    data: json.data,
    pagination: json.pagination,
  };
}

export interface ReportDetailResponse {
  data: Report;
  history: StatusHistoryEntry[];
  notes: ProgressNote[];
  feedbacks: CommunityFeedback[];
}

export async function fetchReportById(id: string): Promise<ReportDetailResponse> {
  const res = await fetch(`/api/reports/${id}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Report not found');
  return json;
}

export async function createReport(payload: Partial<Report>): Promise<Report> {
  const res = await fetch('/api/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to create report');
  return json.data;
}

export async function updateReportStatus(
  reportId: string,
  targetStatus: ReportStatus,
  comment?: string,
  resolutionPhotoUrl?: string
): Promise<{ report: Report; historyEntry: StatusHistoryEntry }> {
  const res = await fetch(`/api/reports/${reportId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetStatus, comment, resolutionPhotoUrl }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to update report status');
  return { report: json.data, historyEntry: json.historyEntry };
}

export async function submitCommunityFeedback(
  reportId: string,
  type: 'still_exists' | 'seems_resolved' | 'suspicious',
  comment?: string
): Promise<{ feedback: CommunityFeedback; confirmationsCount: number; resolvedVotesCount: number; status: ReportStatus }> {
  const res = await fetch(`/api/reports/${reportId}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, comment }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to record feedback');
  return json;
}

export async function addProgressNote(
  reportId: string,
  note: string,
  isPublic: boolean = true,
  photoUrl?: string
): Promise<ProgressNote> {
  const res = await fetch(`/api/reports/${reportId}/progress-notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note, isPublic, photoUrl }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to add progress note');
  return json.data;
}

export async function assignReport(
  reportId: string,
  organizationId: string,
  assigneeName?: string,
  targetResolutionDate?: string
): Promise<Report> {
  const res = await fetch(`/api/reports/${reportId}/assign`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ organizationId, assigneeName, targetResolutionDate }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to assign report');
  return json.data;
}

export async function fetchAnalytics(): Promise<PlatformStats> {
  const res = await fetch('/api/analytics');
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch analytics');
  return json.data;
}

export async function fetchModerationCases(): Promise<{
  pendingReview: Report[];
  flagged: Report[];
  conflicting: Report[];
  recentAuditLogs: any[];
}> {
  const res = await fetch('/api/moderation/cases');
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch moderation queue');
  return json;
}

export async function fetchOrganizations(): Promise<Organization[]> {
  const res = await fetch('/api/organizations');
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch organizations');
  return json.data;
}

// Gemini AI Server calls
export async function aiCategorize(title: string, description: string): Promise<{
  category: IssueCategory;
  subcategory: string;
  keywords: string[];
  summary: string;
}> {
  const res = await fetch('/api/gemini/categorize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description }),
  });
  const json = await res.json();
  return json.data;
}

export async function aiImproveDescription(rawDescription: string, title?: string): Promise<string> {
  const res = await fetch('/api/gemini/improve-description', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rawDescription, title }),
  });
  const json = await res.json();
  return json.improvedText || rawDescription;
}

export async function aiCheckDuplicates(params: {
  title: string;
  description: string;
  category: string;
  lat: number;
  lng: number;
}): Promise<{ hasDuplicates: boolean; candidates: { report: Report; score: number; reasons: string[] }[] }> {
  const res = await fetch('/api/gemini/check-duplicates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const json = await res.json();
  return json;
}
