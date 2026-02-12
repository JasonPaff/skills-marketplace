'use client';

import type { CreateBatchUpload } from '@emergent/shared';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createBatchUpload } from '@/lib/api';

import { queryKeys } from './keys';

export function useBatchUpload(options?: {
  onError?: (error: Error) => void;
  onSuccess?: (data: Awaited<ReturnType<typeof createBatchUpload>>) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBatchUpload) => createBatchUpload(data),
    onError: options?.onError,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.skills.queryKey });
      options?.onSuccess?.(data);
    },
  });
}
