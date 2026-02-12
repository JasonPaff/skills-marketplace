import type { AppType } from '@emergent/api';
import type { CreateClient, CreateProject, CreateSkill, ForkSkill } from '@emergent/shared';

import { hc } from 'hono/client';

const client = hc<AppType>(process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8787');

export async function createClient(data: CreateClient) {
  const res = await client.api.clients.$post({ json: data });
  await throwIfNotOk(res);
  const json = await res.json();
  return json.data;
}

// ─── Clients ──────────────────────────────────────────────────────

export async function createProject(data: CreateProject) {
  const res = await client.api.projects.$post({ json: data });
  await throwIfNotOk(res);
  const json = await res.json();
  return json.data;
}

export async function createSkill(data: CreateSkill) {
  const res = await client.api.skills.$post({ json: data });
  await throwIfNotOk(res);
  const json = await res.json();
  return json.data;
}

// ─── Projects ─────────────────────────────────────────────────────

export async function downloadSkill(id: string) {
  const res = await client.api.skills[':id'].download.$get({ param: { id } });
  await throwIfNotOk(res);
  const json = await res.json();
  return json.data;
}

export async function fetchClients() {
  const res = await client.api.clients.$get();
  await throwIfNotOk(res);
  const json = await res.json();
  return json.data;
}

export async function fetchProject(id: string) {
  const res = await client.api.projects[':id'].$get({ param: { id } });
  await throwIfNotOk(res);
  const json = await res.json();
  return json.data;
}

export async function fetchProjects(clientId?: string) {
  const res = await client.api.projects.$get({
    query: { clientId },
  });
  await throwIfNotOk(res);
  const json = await res.json();
  return json.data;
}

// ─── Skills ───────────────────────────────────────────────────────

export async function fetchProjectSkills(projectId: string) {
  const res = await client.api.projects[':id'].skills.$get({ param: { id: projectId } });
  await throwIfNotOk(res);
  const json = await res.json();
  return json.data;
}

export async function fetchSkill(id: string) {
  const res = await client.api.skills[':id'].$get({ param: { id } });
  await throwIfNotOk(res);
  const json = await res.json();
  return json.data;
}

export async function fetchSkills(params?: { search?: string }) {
  const res = await client.api.skills.$get({
    query: {
      search: params?.search,
    },
  });
  await throwIfNotOk(res);
  const json = await res.json();
  return json.data;
}

export async function forkSkill(id: string, data: ForkSkill) {
  const res = await client.api.skills[':id'].fork.$post({ json: data, param: { id } });
  await throwIfNotOk(res);
  const json = await res.json();
  return json.data;
}

async function throwIfNotOk(res: Response) {
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((error as { message?: string }).message ?? 'API request failed');
  }
}
