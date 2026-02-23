'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchRule, fetchRules } from '@/lib/api';
import { queries } from '@/lib/query/keys';

export function useRule(id: string | undefined) {
  return useQuery({
    ...queries.rules.detail(id ?? ''),
    enabled: Boolean(id),
    queryFn: () => fetchRule(id!),
  });
}

export function useRules(params?: { search?: string }) {
  return useQuery({
    ...queries.rules.list(params),
    queryFn: () => fetchRules(params),
  });
}
