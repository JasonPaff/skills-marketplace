import { createQueryKeys } from '@lukemorales/query-key-factory';

export const queryKeys = createQueryKeys('app', {
  clients: {
    queryKey: null,
  },
  projects: {
    contextQueries: {
      detail: (id: string) => ({
        queryKey: [id],
      }),
      list: (clientId?: string) => ({
        queryKey: [clientId],
      }),
    },
    queryKey: null,
  },
  skills: {
    contextQueries: {
      detail: (id: string) => ({
        queryKey: [id],
      }),
      list: (filters?: { category?: string; search?: string }) => ({
        queryKey: [filters],
      }),
    },
    queryKey: null,
  },
});
