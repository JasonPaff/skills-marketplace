'use client';

import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';

const skillsSearchParamsParsers = {
  downloads: parseAsInteger,
  search: parseAsString.withDefault(''),
};

export function useSkillsSearchParams() {
  return useQueryStates(skillsSearchParamsParsers);
}
