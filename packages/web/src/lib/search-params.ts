'use client';

import { parseAsString, useQueryStates } from 'nuqs';

const skillsSearchParamsParsers = {
  category: parseAsString.withDefault(''),
  search: parseAsString.withDefault(''),
};

export function useSkillsSearchParams() {
  return useQueryStates(skillsSearchParamsParsers);
}
