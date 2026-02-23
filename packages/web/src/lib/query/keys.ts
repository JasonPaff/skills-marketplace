import { createQueryKeys } from '@lukemorales/query-key-factory';

export const queryKeys = createQueryKeys('app', {
  skills: {
    contextQueries: {
      detail: (id: string) => ({
        queryKey: [id],
      }),
      list: (filters?: { search?: string }) => ({
        queryKey: [filters],
      }),
    },
    queryKey: null,
  },
});
