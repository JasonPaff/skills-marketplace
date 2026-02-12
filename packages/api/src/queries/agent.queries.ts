import type { Database } from '../db/index.js';

import { agents } from '../db/schema.js';

export type AgentQueries = ReturnType<typeof createAgentQueries>;

export function createAgentQueries(db: Database) {
  return {
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
  };
}
