import type { CreateClient } from '@emergent/shared';

import type { ClientQueries } from '../queries/index.js';

export type ClientService = ReturnType<typeof createClientService>;

export function createClientService(queries: ClientQueries) {
  return {
    async createClient(data: CreateClient) {
      const { description, name } = data;
      return queries.insertClient({ description, name });
    },

    async getClients() {
      return queries.selectAllClients();
    },
  };
}
