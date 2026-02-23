import type { AppType } from '@emergent/api';
import type { CreateAgent, CreateBatchUpload, CreateRule, CreateSkill } from '@emergent/shared';

import { hc } from 'hono/client';

const client = hc<AppType>(process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8787');

export async function createAgent(data: CreateAgent) {
  const res = await client.api.agents.$post({ json: data });
  await throwIfNotOk(res);
  const json = await res.json();
  return json.data;
}

export async function createBatchUpload(data: CreateBatchUpload) {
  const res = await client.api.upload.batch.$post({ json: data });
  await throwIfNotOk(res);
  const json = await res.json();
  return json.data;
}

export async function createRule(data: CreateRule) {
  const res = await client.api.rules.$post({ json: data });
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

export async function downloadAgent(id: string) {
  const res = await client.api.agents[':id'].download.$get({ param: { id } });
  await throwIfNotOk(res);
  const json = await res.json();
  return json.data;
}

export async function downloadBundle(id: string) {
  const res = await client.api.bundles[':id'].download.$get({ param: { id } });
  await throwIfNotOk(res);
  const json = await res.json();
  return json.data;
}

export async function downloadRule(id: string) {
  const res = await client.api.rules[':id'].download.$get({ param: { id } });
  await throwIfNotOk(res);
  const json = await res.json();
  return json.data;
}

export async function downloadSkill(id: string) {
  const res = await client.api.skills[':id'].download.$get({ param: { id } });
  await throwIfNotOk(res);
  const json = await res.json();
  return json.data;
}

export async function fetchAgent(id: string) {
  const res = await client.api.agents[':id'].$get({ param: { id } });
  await throwIfNotOk(res);
  const json = await res.json();
  return json.data;
}

export async function fetchAgents(params?: { search?: string }) {
  const res = await client.api.agents.$get({
    query: {
      search: params?.search,
    },
  });
  await throwIfNotOk(res);
  const json = await res.json();
  return json.data;
}

export async function fetchBundle(id: string) {
  const res = await client.api.bundles[':id'].$get({ param: { id } });
  await throwIfNotOk(res);
  const json = await res.json();
  return json.data;
}

export async function fetchBundles(params?: { search?: string }) {
  const res = await client.api.bundles.$get({
    query: {
      search: params?.search,
    },
  });
  await throwIfNotOk(res);
  const json = await res.json();
  return json.data;
}

export async function fetchRule(id: string) {
  const res = await client.api.rules[':id'].$get({ param: { id } });
  await throwIfNotOk(res);
  const json = await res.json();
  return json.data;
}

export async function fetchRules(params?: { search?: string }) {
  const res = await client.api.rules.$get({
    query: {
      search: params?.search,
    },
  });
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

async function throwIfNotOk(res: Response) {
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((error as { message?: string }).message ?? 'API request failed');
  }
}
