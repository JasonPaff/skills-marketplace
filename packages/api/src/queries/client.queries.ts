import type { Database } from '../db/index.js';

import { clients } from '../db/schema.js';

export type ClientQueries = ReturnType<typeof createClientQueries>;

export function createClientQueries(db: Database) {
  return {
    async insertClient(data: { description?: null | string; name: string }) {
      const [client] = await db.insert(clients).values(data).returning();
      return client;
    },

    async selectAllClients() {
      return db.select().from(clients).orderBy(clients.name);
    },
  };
}
