'use client';

import type { CreateSkill } from '@emergent/shared';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createSkill } from '@/lib/api';
import { queries } from '@/lib/query/keys';

export function useCreateSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSkill) => createSkill(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queries.skills.list._def,
      });
    },
  });
}
