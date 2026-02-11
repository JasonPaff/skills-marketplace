'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchProjects } from '@/lib/api';

import { queryKeys } from './keys';

export function useProjects(clientId?: string) {
  return useQuery({
    ...queryKeys.projects._ctx.list(clientId),
    queryFn: () => fetchProjects(clientId),
  });
}
