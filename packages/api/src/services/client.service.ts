import type { z } from 'zod';

import type { Database } from '../db/index.js';

import { clients } from '../db/schema.js';
import { insertClientSchema } from '../db/validation.js';

export type ClientService = ReturnType<typeof createClientService>;

type CreateClientData = z.infer<typeof insertClientSchema>;

export function createClientService(db: Database) {
  return {
    async createClient(data: CreateClientData) {
      const { description, name } = data;
      const [client] = await db.insert(clients).values({ description, name }).returning();
      return client;
    },

    async getClients() {
      return db.select().from(clients).orderBy(clients.name);
    },
  };
}
