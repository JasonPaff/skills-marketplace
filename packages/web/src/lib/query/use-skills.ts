'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchSkills } from '@/lib/api';

import { queryKeys } from './keys';

export function useSkills(filters?: { category?: string; search?: string; }) {
  return useQuery({
    ...queryKeys.skills._ctx.list(filters),
    queryFn: () =>
      fetchSkills({
        category: filters?.category || undefined,
        search: filters?.search || undefined,
      }),
  });
}
