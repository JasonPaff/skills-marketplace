import type { AppType } from '@emergent/api';

import { hc } from 'hono/client';

const client = hc<AppType>(
  process.env.EMERGENT_API_URL ?? 'https://skills-marketplace-api.vercel.app',
);

export async function fetchSkill(id: string) {
  const res = await client.api.skills[':id'].$get({ param: { id } });
  await throwIfNotOk(res);
  const json = await res.json();
  return json.data;
}

export async function fetchSkillByName(name: string) {
  const res = await client.api.skills.$get({
    query: { search: name },
  });
  await throwIfNotOk(res);
  const json = await res.json();
  return json.data;
}

export async function fetchSkillDownload(id: string) {
  const res = await client.api.skills[':id'].download.$get({ param: { id } });
  await throwIfNotOk(res);
  const json = await res.json();
  return json.data;
}

export async function fetchSkills(params?: { project?: string; search?: string }) {
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
    const error = (await res.json().catch(() => ({ message: res.statusText }))) as {
      message?: string;
    };
    throw new Error(error.message ?? `API request failed: ${res.status}`);
  }
}
