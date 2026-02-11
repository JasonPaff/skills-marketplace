'use client';

import type { CreateSkill, Skill } from '@emergent/shared';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createSkill } from '@/lib/api';

import { queryKeys } from './keys';

export function useCreateSkill(options?: {
  onError?: (error: Error) => void;
  onSuccess?: (skill: Skill) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSkill) => createSkill(data),
    onError: options?.onError,
    onSuccess: (skill) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.skills.queryKey });
      options?.onSuccess?.(skill);
    },
  });
}
