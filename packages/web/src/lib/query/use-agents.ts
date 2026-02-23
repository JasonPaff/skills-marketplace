'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchAgent, fetchAgents } from '@/lib/api';
import { queries } from '@/lib/query/keys';

export function useAgent(id: string | undefined) {
  return useQuery({
    ...queries.agents.detail(id ?? ''),
    enabled: Boolean(id),
    queryFn: () => fetchAgent(id!),
  });
}

export function useAgents(params?: { search?: string }) {
  return useQuery({
    ...queries.agents.list(params),
    queryFn: () => fetchAgents(params),
  });
}
