'use client';

import type { CreateBatchUpload } from '@emergent/shared';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createBatchUpload } from '@/lib/api';
import { queries } from '@/lib/query/keys';

export function useBatchUpload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBatchUpload) => createBatchUpload(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queries.skills.list._def,
      });
      queryClient.invalidateQueries({
        queryKey: queries.agents.list._def,
      });
      queryClient.invalidateQueries({
        queryKey: queries.rules.list._def,
      });
      queryClient.invalidateQueries({
        queryKey: queries.bundles.list._def,
      });
    },
  });
}
