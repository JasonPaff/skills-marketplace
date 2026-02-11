'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchClients } from '@/lib/api';

import { queryKeys } from './keys';

export function useClients() {
  return useQuery({
    ...queryKeys.clients,
    queryFn: () => fetchClients(),
  });
}
