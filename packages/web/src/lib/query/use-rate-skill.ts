'use client';

import type { RateSkill } from '@emergent/shared';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { rateSkill } from '@/lib/api';

import { queryKeys } from './keys';

export function useRateSkill(
  skillId: string,
  options?: {
    onError?: (error: Error) => void;
    onSuccess?: () => void;
  },
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RateSkill) => rateSkill(skillId, data),
    onError: options?.onError,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.skills._ctx.detail(skillId).queryKey,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.skills.queryKey });
      options?.onSuccess?.();
    },
  });
}
