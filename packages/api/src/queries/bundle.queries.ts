import { and, eq, ilike, sql } from 'drizzle-orm';

import type { Database } from '../db/index.js';

import {
  agents,
  bundleAgents,
  bundleRules,
  bundles,
  bundleSkills,
  rules,
  skills,
} from '../db/schema.js';

export type BundleQueries = ReturnType<typeof createBundleQueries>;

export function createBundleQueries(db: Database) {
  return {
    async incrementDownloadCount(id: string) {
      await db
        .update(bundles)
        .set({ downloadCount: sql`${bundles.downloadCount} + 1` })
        .where(eq(bundles.id, id));
    },

    async insertBundle(values: {
      description: string;
      githubPath: string;
      name: string;
    }) {
      const [bundle] = await db.insert(bundles).values(values).returning();
      return bundle;
    },

    async linkAgentToBundle(bundleId: string, agentId: string) {
      await db.insert(bundleAgents).values({ agentId, bundleId });
    },

    async linkRuleToBundle(bundleId: string, ruleId: string) {
      await db.insert(bundleRules).values({ bundleId, ruleId });
    },

    async linkSkillToBundle(bundleId: string, skillId: string) {
      await db.insert(bundleSkills).values({ bundleId, skillId });
    },

    async selectBundleById(id: string) {
      const [bundle] = await db.select().from(bundles).where(eq(bundles.id, id));
      return bundle as typeof bundle | undefined;
    },

    async selectBundles(filters?: { search?: string }) {
      const conditions = [];

      if (filters?.search) {
        conditions.push(ilike(bundles.name, `%${filters.search}%`));
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      return db.select().from(bundles).where(where).orderBy(bundles.name);
    },

    async selectBundleWithItems(id: string) {
      const [bundle] = await db.select().from(bundles).where(eq(bundles.id, id));
      if (!bundle) return undefined;

      const linkedSkills = await db
        .select({ skill: skills })
        .from(bundleSkills)
        .innerJoin(skills, eq(bundleSkills.skillId, skills.id))
        .where(eq(bundleSkills.bundleId, id));

      const linkedAgents = await db
        .select({ agent: agents })
        .from(bundleAgents)
        .innerJoin(agents, eq(bundleAgents.agentId, agents.id))
        .where(eq(bundleAgents.bundleId, id));

      const linkedRules = await db
        .select({ rule: rules })
        .from(bundleRules)
        .innerJoin(rules, eq(bundleRules.ruleId, rules.id))
        .where(eq(bundleRules.bundleId, id));

      return {
        ...bundle,
        agents: linkedAgents.map((row) => row.agent),
        rules: linkedRules.map((row) => row.rule),
        skills: linkedSkills.map((row) => row.skill),
      };
    },
  };
}
