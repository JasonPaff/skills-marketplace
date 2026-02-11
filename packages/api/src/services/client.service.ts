import type { z } from 'zod';

import type { ClientQueries } from '../queries/index.js';

import { insertClientSchema } from '../db/validation.js';

export type ClientService = ReturnType<typeof createClientService>;

type CreateClientData = z.infer<typeof insertClientSchema>;

export function createClientService(queries: ClientQueries) {
  return {
    async createClient(data: CreateClientData) {
      const { description, name } = data;
      return queries.insertClient({ description, name });
    },

    async getClients() {
      return queries.selectAllClients();
    },
  };
}
