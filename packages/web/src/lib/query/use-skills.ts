'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { fetchSkills } from '@/lib/api';

import { queryKeys } from './keys';

export function useSkills(filters?: { search?: string }) {
  return useQuery({
    ...queryKeys.skills._ctx.list(filters),
    placeholderData: keepPreviousData,
    queryFn: () =>
      fetchSkills({
        search: filters?.search || undefined,
      }),
  });
}
