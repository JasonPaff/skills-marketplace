import { and, eq, ilike, sql } from 'drizzle-orm';

import type { Database } from '../db/index.js';

import { agents } from '../db/schema.js';

export type AgentQueries = ReturnType<typeof createAgentQueries>;

export function createAgentQueries(db: Database) {
  return {
    async incrementDownloadCount(id: string) {
      await db
        .update(agents)
        .set({ downloadCount: sql`${agents.downloadCount} + 1` })
        .where(eq(agents.id, id));
    },

    async insertAgent(values: {
      color?: string;
      description: string;
      githubPath: string;
      model?: string;
      name: string;
      tools?: string[];
    }) {
      const [agent] = await db.insert(agents).values(values).returning();
      return agent;
    },

    async selectAgentById(id: string) {
      const [agent] = await db.select().from(agents).where(eq(agents.id, id));
      return agent as typeof agent | undefined;
    },

    async selectAgents(filters?: { search?: string }) {
      const conditions = [];

      if (filters?.search) {
        conditions.push(ilike(agents.name, `%${filters.search}%`));
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      return db.select().from(agents).where(where).orderBy(agents.name);
    },
  };
}
