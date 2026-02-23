import type { AppType } from '@emergent/api';
import type { CreateBatchUpload, CreateSkill } from '@emergent/shared';

import { hc } from 'hono/client';

const client = hc<AppType>(process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8787');

export async function createBatchUpload(data: CreateBatchUpload) {
  const res = await client.api.upload.batch.$post({ json: data });
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

export async function downloadSkill(id: string) {
  const res = await client.api.skills[':id'].download.$get({ param: { id } });
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
