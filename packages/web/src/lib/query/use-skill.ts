'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchSkill } from '@/lib/api';
import { queries } from '@/lib/query/keys';

export function useSkill(id: string | undefined) {
  return useQuery({
    ...queries.skills.detail(id ?? ''),
    enabled: Boolean(id),
    queryFn: () => fetchSkill(id!),
  });
}
