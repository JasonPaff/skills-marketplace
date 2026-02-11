'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchSkill } from '@/lib/api';

import { queryKeys } from './keys';

export function useSkill(id: string) {
  return useQuery({
    ...queryKeys.skills._ctx.detail(id),
    queryFn: () => fetchSkill(id),
  });
}
