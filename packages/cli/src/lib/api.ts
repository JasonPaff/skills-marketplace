import type {
  ProjectSkill,
  ProjectWithClient,
  Skill,
  SkillDownloadResponse,
} from '@emergent/shared';

const API_URL = process.env.EMERGENT_API_URL ?? 'https://skills.emergentsoftware.io';

export function fetchProjects() {
  return fetcher<ProjectWithClient[]>('/api/projects');
}

export function fetchProjectSkills(projectId: string) {
  return fetcher<ProjectSkill[]>(`/api/projects/${projectId}/skills`);
}

export function fetchSkill(id: string) {
  return fetcher<Skill>(`/api/skills/${id}`);
}

export function fetchSkillByName(name: string) {
  return fetcher<Skill[]>(`/api/skills?search=${encodeURIComponent(name)}`);
}

export function fetchSkillDownload(id: string) {
  return fetcher<SkillDownloadResponse>(`/api/skills/${id}/download`);
}

export function fetchSkills(params?: { project?: string; search?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set('search', params.search);

  const qs = searchParams.toString();
  return fetcher<Skill[]>(`/api/skills${qs ? `?${qs}` : ''}`);
}

async function fetcher<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message ?? `API request failed: ${res.status}`);
  }

  const json = (await res.json()) as { data: T };
  return json.data;
}
