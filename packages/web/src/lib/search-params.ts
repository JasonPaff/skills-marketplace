'use client';

import { parseAsString, useQueryStates } from 'nuqs';

const skillsSearchParamsParsers = {
  search: parseAsString.withDefault(''),
};

export function useSkillsSearchParams() {
  return useQueryStates(skillsSearchParamsParsers);
}
