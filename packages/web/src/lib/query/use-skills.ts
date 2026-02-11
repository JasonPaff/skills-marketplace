'use client';

import type { SkillCategory } from '@emergent/shared';

import { SKILL_CATEGORIES } from '@emergent/shared';
import { useQuery } from '@tanstack/react-query';

import { fetchSkills } from '@/lib/api';

import { queryKeys } from './keys';

const validCategories = new Set<string>(SKILL_CATEGORIES);

export function useSkills(filters?: { category?: string; search?: string }) {
  const category =
    filters?.category && isSkillCategory(filters.category) ? filters.category : undefined;

  return useQuery({
    ...queryKeys.skills._ctx.list(filters),
    queryFn: () =>
      fetchSkills({
        category,
        search: filters?.search || undefined,
      }),
  });
}

function isSkillCategory(value: string): value is SkillCategory {
  return validCategories.has(value);
}
