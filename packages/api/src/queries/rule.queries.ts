import { and, eq, ilike, sql } from 'drizzle-orm';

import type { Database } from '../db/index.js';

import { rules } from '../db/schema.js';

export type RuleQueries = ReturnType<typeof createRuleQueries>;

export function createRuleQueries(db: Database) {
  return {
    async incrementDownloadCount(id: string) {
      await db
        .update(rules)
        .set({ downloadCount: sql`${rules.downloadCount} + 1` })
        .where(eq(rules.id, id));
    },

    async insertRule(values: {
      description: string;
      githubPath: string;
      name: string;
      paths?: string[];
    }) {
      const [rule] = await db.insert(rules).values(values).returning();
      return rule;
    },

    async selectRuleById(id: string) {
      const [rule] = await db.select().from(rules).where(eq(rules.id, id));
      return rule as typeof rule | undefined;
    },

    async selectRules(filters?: { search?: string }) {
      const conditions = [];

      if (filters?.search) {
        conditions.push(ilike(rules.name, `%${filters.search}%`));
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      return db.select().from(rules).where(where).orderBy(rules.name);
    },
  };
}
