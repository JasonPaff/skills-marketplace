'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchBundle, fetchBundles } from '@/lib/api';
import { queries } from '@/lib/query/keys';

export function useBundle(id: string | undefined) {
  return useQuery({
    ...queries.bundles.detail(id ?? ''),
    enabled: Boolean(id),
    queryFn: () => fetchBundle(id!),
  });
}

export function useBundles(params?: { search?: string }) {
  return useQuery({
    ...queries.bundles.list(params),
    queryFn: () => fetchBundles(params),
  });
}
