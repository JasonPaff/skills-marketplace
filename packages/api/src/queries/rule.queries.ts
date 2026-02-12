import type { Database } from '../db/index.js';

import { rules } from '../db/schema.js';

export type RuleQueries = ReturnType<typeof createRuleQueries>;

export function createRuleQueries(db: Database) {
  return {
    async insertRule(values: {
      description: string;
      githubPath: string;
      name: string;
      paths?: string[];
    }) {
      const [rule] = await db.insert(rules).values(values).returning();
      return rule;
    },
  };
}
