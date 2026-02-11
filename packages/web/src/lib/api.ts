import type {
  ApiResponse,
  Client,
  CreateClient,
  CreateProject,
  CreateSkill,
  ForkSkill,
  ProjectSkill,
  ProjectWithClient,
  RateSkill,
  Skill,
  SkillDownloadResponse,
} from '@emergent/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8787';

export function createClient(data: CreateClient) {
  return fetcher<Client>('/api/clients', {
    body: JSON.stringify(data),
    method: 'POST',
  });
}

// ─── Skills ───────────────────────────────────────────────────────

export function createProject(data: CreateProject) {
  return fetcher<ProjectWithClient>('/api/projects', {
    body: JSON.stringify(data),
    method: 'POST',
  });
}

export function createSkill(data: CreateSkill) {
  return fetcher<Skill>('/api/skills', {
    body: JSON.stringify(data),
    method: 'POST',
  });
}

export function downloadSkill(id: string) {
  return fetcher<SkillDownloadResponse>(`/api/skills/${id}/download`);
}

export function fetchClients() {
  return fetcher<Client[]>('/api/clients');
}

export function fetchProject(id: string) {
  return fetcher<ProjectWithClient>(`/api/projects/${id}`);
}

export function fetchProjects(clientId?: string) {
  const qs = clientId ? `?clientId=${clientId}` : '';
  return fetcher<ProjectWithClient[]>(`/api/projects${qs}`);
}

// ─── Projects ─────────────────────────────────────────────────────

export function fetchProjectSkills(projectId: string) {
  return fetcher<ProjectSkill[]>(`/api/projects/${projectId}/skills`);
}

export function fetchSkill(id: string) {
  return fetcher<Skill>(`/api/skills/${id}`);
}

export function fetchSkills(params?: {
  category?: string;
  isGlobal?: boolean;
  projectId?: string;
  search?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set('search', params.search);
  if (params?.category) searchParams.set('category', params.category);
  if (params?.projectId) searchParams.set('projectId', params.projectId);
  if (params?.isGlobal !== undefined) searchParams.set('isGlobal', String(params.isGlobal));

  const qs = searchParams.toString();
  return fetcher<Skill[]>(`/api/skills${qs ? `?${qs}` : ''}`);
}

export function forkSkill(id: string, data: ForkSkill) {
  return fetcher<Skill>(`/api/skills/${id}/fork`, {
    body: JSON.stringify(data),
    method: 'POST',
  });
}

// ─── Clients ──────────────────────────────────────────────────────

export function rateSkill(id: string, data: RateSkill) {
  return fetcher<Skill>(`/api/skills/${id}/rate`, {
    body: JSON.stringify(data),
    method: 'POST',
  });
}

async function fetcher<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message ?? 'API request failed');
  }

  const json = (await res.json()) as ApiResponse<T>;
  return json.data;
}
