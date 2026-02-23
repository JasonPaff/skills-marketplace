import { createQueryKeyStore } from '@lukemorales/query-key-factory';

export const queries = createQueryKeyStore({
  agents: {
    detail: (id: string) => ({
      queryKey: [id],
    }),
    list: (params?: { search?: string }) => ({
      queryKey: [{ search: params?.search }],
    }),
  },
  bundles: {
    detail: (id: string) => ({
      queryKey: [id],
    }),
    list: (params?: { search?: string }) => ({
      queryKey: [{ search: params?.search }],
    }),
  },
  rules: {
    detail: (id: string) => ({
      queryKey: [id],
    }),
    list: (params?: { search?: string }) => ({
      queryKey: [{ search: params?.search }],
    }),
  },
  skills: {
    detail: (id: string) => ({
      queryKey: [id],
    }),
    list: (params?: { search?: string }) => ({
      queryKey: [{ search: params?.search }],
    }),
  },
});
