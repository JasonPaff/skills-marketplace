'use client';

import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';

const skillsSearchParamsParsers = {
  downloads: parseAsInteger,
  rating: parseAsInteger,
  search: parseAsString.withDefault(''),
};

export function useSkillsSearchParams() {
  return useQueryStates(skillsSearchParamsParsers);
}
