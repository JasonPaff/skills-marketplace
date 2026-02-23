'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchSkills } from '@/lib/api';
import { queries } from '@/lib/query/keys';

export function useSkills(params?: { search?: string }) {
  return useQuery({
    ...queries.skills.list(params),
    queryFn: () => fetchSkills(params),
  });
}
